1. Set up environment:
   copy .env.example .env
   # Edit .env with your OpenAI API key

2. Install dependencies:
   pip install -r requirements.txt

3. Start Backend:
   uvicorn app.main:app --reload --port 8000

4. Start Frontend:
   cd frontend
   npm run dev
