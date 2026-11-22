# Notice Decoder

**IDEA//FORGE Hackathon, Track 1: Civic Pulse, Digital Governance & Public Information**

Many people can't understand government notices and bills, so they miss deadlines or pay penalties. Notice Decoder reads a photo of a notice, explains it in simple English, Telugu or Hindi, and tells the user what to do and by when.

## What it does
- Reads a notice photo with OCR and shows a warning when the photo is hard to read
- An AI agent (LangGraph) classifies the document, extracts key details, loads the relevant rules, explains the notice, and builds a next-steps checklist
- Explanation in English, Telugu or Hindi, with read-aloud
- Optional reply letter draft, created only when the user asks
- Calendar reminder for the deadline
- "How the agent worked" panel showing every step

## Tech stack
FastAPI, LangGraph, Tesseract OCR, Groq-hosted LLM, Next.js

## Run locally
**Backend**
1. Install Tesseract OCR
2. `cd backend`, create and activate a virtual environment
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and add your `GROQ_API_KEY`
5. `uvicorn main:app --reload --host 127.0.0.1 --port 8000`

**Frontend**
1. `cd frontend-app`
2. `npm install`
3. `npm run dev`, then open http://localhost:3000

## Limitations
- OCR currently reads English notices; the explanation can be Telugu or Hindi
- Rules cover a few document types (income tax, traffic challan, electricity bill)
- Guidance only, not legal advice

## Next steps
Telugu and Hindi OCR, more document types, voice input, and a retrieval layer over official documents.
