# Notice Decoder (IDEA//FORGE, Track 1)

Photo of a government notice -> plain-language explanation (English/Telugu/Hindi), key details, next steps, reply draft, calendar reminder.

## Run the backend
1. Install Tesseract with eng, tel, hin language packs.
2. `cd backend && python -m venv .venv && .venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and add your Groq key.
5. `uvicorn main:app --reload`

## Run the frontend
1. `npx create-next-app@latest frontend-app --ts --no-tailwind --app`
2. Replace `frontend-app/app/page.tsx` with `frontend/app/page.tsx`
3. `npm run dev` -> http://localhost:3000

## To do
- Fill `backend/data/rules/*.md` from official sources (verify every fact)
- Add sample notices to test OCR
