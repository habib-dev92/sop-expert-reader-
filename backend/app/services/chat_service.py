import logging
import json
import hashlib
from functools import lru_cache
from typing import AsyncGenerator, List, Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.config import settings
from app.services.vector_store import vector_store_service

logger = logging.getLogger(__name__)

MAX_TOKENS_INPUT = 128000
MAX_TOKENS_OUTPUT = 4096

GREETING_PATTERNS = [
    "hello", "hi", "hey", "greetings", "good morning", "good afternoon",
    "good evening", "howdy", "what's up", "sup", "yo", "good day",
    "nice to meet you", "how are you", "how do you do",
]

GREETING_RESPONSE = """Hello! I'm your SOP Expert Assistant. :)

I'm here to help you with questions about your uploaded Standard Operating Procedures. You can ask me things like:

• "Summarize the key procedures from this SOP"
• "What are the main steps in this process?"
• "What safety precautions are mentioned?"
• "List the responsibilities of each role"

Just upload your SOP documents and start asking — I'll answer only from your documents with zero hallucination. How can I help you today?"""

NO_DOCS_RESPONSE = """I looked through your uploaded documents, but I couldn't find information related to your question.

Here are a few things you can try:

• **Upload more SOPs** — If the topic isn't covered yet, add relevant documents.
• **Rephrase your question** — Try using different keywords or phrasing.
• **Check your documents** — Make sure the information exists in your uploaded files.

If you need help getting started, try asking about what's already in your knowledge base!"""

NO_DOCS_FOUND_RESPONSE = """I couldn't find any documents in your knowledge base yet.

To get started:
1. Go to the **Upload** page
2. Upload your SOP files (PDF, DOCX, TXT, or Markdown)
3. Come back here and ask me anything about them!

I'll be right here when you're ready. :)"""


class ResponseCache:
    def __init__(self, maxsize: int = 50):
        self.cache = {}
        self.maxsize = maxsize
        self.order = []

    def _make_key(self, message: str, model: str) -> str:
        return hashlib.md5(f"{message}:{model}".encode()).hexdigest()

    def get(self, message: str, model: str) -> Optional[Dict[str, Any]]:
        key = self._make_key(message, model)
        return self.cache.get(key)

    def set(self, message: str, model: str, response: Dict[str, Any]):
        key = self._make_key(message, model)
        if key in self.cache:
            self.order.remove(key)
        elif len(self.order) >= self.maxsize:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = response
        self.order.append(key)


response_cache = ResponseCache()

SYSTEM_PROMPT = """You are a warm, professional SOP (Standard Operating Procedure) Knowledge Assistant.

YOUR PERSONALITY:
- Be warm, helpful, and reassuring in your tone
- Use a conversational but professional style
- Be encouraging and patient
- NEVER be robotic or dismissive

CONTEXT (from uploaded SOPs):
{context}

CRITICAL RULES:
1. Answer ONLY using the context above -- never use your own training data.
2. NEVER invent, guess, or hallucinate information.
3. If the context does NOT contain a meaningful answer to the question, politely say the information isn't available in the uploaded SOPs, and suggest trying different keywords or uploading relevant documents.
4. Do NOT copy paragraphs verbatim -- rewrite in your own professional words.
5. Structure your response based on the question type:
   - Processes: step-by-step format
   - Comparisons: tables
   - Explanations: clear paragraphs
   - Lists: bullet points
6. Always cite references (file names, page numbers) when providing information from the context.
7. If the user is just greeting you or making casual conversation, respond warmly and guide them to ask about their SOPs -- do NOT try to find answers in the context for greetings."""


class ChatService:
    def __init__(self):
        self.llm_models = {}

    def _get_llm(self, model_name: str = None):
        model = model_name or settings.OPENAI_LLM_MODEL

        if model not in self.llm_models:
            self.llm_models[model] = ChatOpenAI(
                model=model,
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE,
                temperature=settings.TEMPERATURE,
                max_tokens=MAX_TOKENS_OUTPUT,
                streaming=True,
                default_headers={
                    "HTTP-Referer": settings.OPENAI_REFERER,
                    "X-Title": settings.OPENAI_APP_TITLE,
                },
            )
        return self.llm_models[model]

    def _format_context(self, docs: List) -> str:
        context_parts = []
        for i, doc in enumerate(docs, start=1):
            if isinstance(doc, tuple):
                document, score = doc
            else:
                document = doc
                score = 0.0

            metadata = document.metadata
            source = metadata.get("filename", "Unknown")

            context_parts.append(
                f"[Source {i}] File: {source}\n"
                f"Content: {document.page_content}\n"
            )
        return "\n\n".join(context_parts)

    def _extract_references(self, docs: List) -> List[Dict[str, Any]]:
        references = []
        seen = set()
        for doc, score in docs:
            metadata = doc.metadata
            source = metadata.get("filename", "Unknown")
            page = metadata.get("page_number")

            ref_key = f"{source}:{page}"
            if ref_key not in seen:
                seen.add(ref_key)
                references.append({
                    "file_name": source,
                    "page_number": page,
                    "section": metadata.get("section"),
                    "confidence_score": round(float(score), 4) if isinstance(score, float) else 0.0,
                    "text_snippet": doc.page_content[:200] + "...",
                })
        return references

    def _format_response(self, answer: str) -> str:
        answer = answer.strip()
        unwanted_phrases = [
            "Based on the provided context,",
            "Based on the context,",
            "According to the provided context,",
            "According to the context,",
            "From the context,",
            "As per the context,",
        ]
        for phrase in unwanted_phrases:
            if answer.startswith(phrase):
                answer = answer[len(phrase):].strip()
                if answer.startswith(","):
                    answer = answer[1:].strip()
                break
        return answer

    def _is_greeting(self, message: str) -> bool:
        msg = message.strip().lower().rstrip("?!.,")
        return any(msg == p or msg.startswith(p + " ") or msg.startswith(p + ",") for p in GREETING_PATTERNS)

    async def chat(
        self,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        model: str = "gpt-4o-mini",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        try:
            if self._is_greeting(message):
                return {
                    "answer": GREETING_RESPONSE,
                    "references": [],
                }

            cached = response_cache.get(message, model)
            if cached and not conversation_history:
                logger.info(f"Cache hit for: {message[:50]}")
                return cached

            filter_dict = {"user_id": user_id} if user_id else None
            docs_with_scores = vector_store_service.similarity_search(message, k=settings.RETRIEVER_K, filter=filter_dict)

            if not docs_with_scores:
                return {
                    "answer": NO_DOCS_RESPONSE,
                    "references": [],
                }

            context = self._format_context(docs_with_scores)
            references = self._extract_references(docs_with_scores)

            llm = self._get_llm(model)

            messages = [
                SystemMessage(content=SYSTEM_PROMPT.format(context=context)),
            ]

            if conversation_history:
                for msg in conversation_history[-6:]:
                    if msg["role"] == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages.append(AIMessage(content=msg["content"]))

            messages.append(HumanMessage(content=message))

            prompt = ChatPromptTemplate.from_messages(messages)
            chain = prompt | llm

            response = chain.invoke({})

            if hasattr(response, "content"):
                answer = response.content
            else:
                answer = str(response)

            answer = self._format_response(answer)

            result = {"answer": answer, "references": references}
            if not conversation_history:
                response_cache.set(message, model, result)
            return result
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return {
                "answer": "I'm sorry, I encountered an error while processing your request. Please try again or check that the backend is properly configured.",
                "references": [],
            }

    async def chat_stream(
        self,
        message: str,
        conversation_history: Optional[List[Dict]] = None,
        model: str = "gpt-4o-mini",
        user_id: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        try:
            if self._is_greeting(message):
                yield json.dumps({
                    "type": "answer",
                    "content": GREETING_RESPONSE,
                    "references": [],
                }) + "\n"
                return

            yield json.dumps({"type": "status", "content": "searching"}) + "\n"
            filter_dict = {"user_id": user_id} if user_id else None
            docs_with_scores = vector_store_service.similarity_search(message, k=settings.RETRIEVER_K, filter=filter_dict)

            if not docs_with_scores:
                yield json.dumps({
                    "type": "answer",
                    "content": NO_DOCS_RESPONSE,
                    "references": [],
                }) + "\n"
                return

            context = self._format_context(docs_with_scores)
            references = self._extract_references(docs_with_scores)

            yield json.dumps({"type": "status", "content": "thinking"}) + "\n"

            llm = self._get_llm(model)

            messages = [
                SystemMessage(content=SYSTEM_PROMPT.format(context=context)),
            ]

            if conversation_history:
                for msg in conversation_history[-6:]:
                    if msg["role"] == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages.append(AIMessage(content=msg["content"]))

            messages.append(HumanMessage(content=message))

            prompt = ChatPromptTemplate.from_messages(messages)
            chain = prompt | llm

            full_response = ""
            async for chunk in chain.astream({}):
                content = chunk if isinstance(chunk, str) else (chunk.content if hasattr(chunk, "content") else str(chunk))
                if content:
                    full_response += content
                    yield json.dumps({
                        "type": "token",
                        "content": content,
                    }) + "\n"

            full_response = self._format_response(full_response)

            yield json.dumps({
                "type": "done",
                "content": full_response,
                "references": references,
            }) + "\n"
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield json.dumps({
                "type": "error",
                "content": f"Error: {str(e)}",
            }) + "\n"

    async def summarize(self, document_id: str, model: str = "gpt-4o-mini", user_id: Optional[str] = None) -> str:
        try:
            filter_dict = {"document_id": document_id}
            if user_id:
                filter_dict["user_id"] = user_id
            docs_with_scores = vector_store_service.similarity_search(
                "summarize the entire document", k=20,
                filter=filter_dict
            )

            if not docs_with_scores:
                return "No document found to summarize."

            context = self._format_context(docs_with_scores)
            llm = self._get_llm(model)

            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=f"""You are an expert document summarizer. 
Summarize the following SOP document comprehensively. 
Cover: purpose, scope, key procedures, responsibilities, and important notes.
Be professional and concise.

CONTEXT:
{context}"""),
                HumanMessage(content="Please provide a comprehensive summary of this SOP document."),
            ])

            chain = prompt | llm
            response = chain.invoke({})
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            logger.error(f"Summarize error: {e}")
            return f"Error generating summary: {str(e)}"

    async def generate_quiz(self, document_id: str, question_count: int = 5, model: str = "gpt-4o-mini", user_id: Optional[str] = None) -> str:
        try:
            filter_dict = {"document_id": document_id}
            if user_id:
                filter_dict["user_id"] = user_id
            docs_with_scores = vector_store_service.similarity_search(
                "quiz questions about procedures", k=20,
                filter=filter_dict
            )

            if not docs_with_scores:
                return "No document found to generate quiz from."

            context = self._format_context(docs_with_scores)
            llm = self._get_llm(model)

            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=f"""You are a quiz generator. 
Generate {question_count} multiple-choice questions based on the SOP document.
Each question must have 4 options (A, B, C, D) and indicate the correct answer.
Format each question as:

### Question 1
Question text here?

A) Option A
B) Option B
C) Option C
D) Option D

**Correct Answer:** A

CONTEXT:
{context}"""),
                HumanMessage(content=f"Generate {question_count} quiz questions from this SOP."),
            ])

            chain = prompt | llm
            response = chain.invoke({})
            return response.content if hasattr(response, "content") else str(response)
        except Exception as e:
            logger.error(f"Quiz generation error: {e}")
            return f"Error generating quiz: {str(e)}"

    async def generate_flowchart_data(self, document_id: str, model: str = "gpt-4o-mini", user_id: Optional[str] = None) -> str:
        try:
            filter_dict = {"document_id": document_id}
            if user_id:
                filter_dict["user_id"] = user_id
            docs_with_scores = vector_store_service.similarity_search(
                "process or procedure steps", k=20,
                filter=filter_dict
            )

            if not docs_with_scores:
                return "No document found to generate flowchart from."

            context = self._format_context(docs_with_scores)
            llm = self._get_llm(model)

            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=f"""You are a process flowchart generator.
Analyze the SOP document and identify the key process steps.
Return the steps as a JSON array of objects with 'step', 'description', and 'decision' fields.
Example:
[
  {{"step": 1, "description": "Step description", "decision": false}},
  {{"step": 2, "description": "Check condition", "decision": true}}
]

CONTEXT:
{context}"""),
                HumanMessage(content="Generate flowchart data from this SOP document."),
            ])

            chain = prompt | llm
            response = chain.invoke({})
            result = response.content if hasattr(response, "content") else str(response)
            try:
                json.loads(result)
                return result
            except json.JSONDecodeError:
                return json.dumps([{"step": 1, "description": result, "decision": False}])
        except Exception as e:
            logger.error(f"Flowchart generation error: {e}")
            return json.dumps([])


chat_service = ChatService()
