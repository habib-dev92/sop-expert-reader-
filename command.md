1. Set OpenAI API key:

   Copy backend/.env.example to backend/.env
   Edit backend/.env and add your OPENAI_API_KEY

2. Start Backend:

   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000

3. Start Frontend (separate terminal):

   cd frontend
   npm install
   npm run dev

Open http://localhost:3000
