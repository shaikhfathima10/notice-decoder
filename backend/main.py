from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from ocr import read_image
from agent import graph, draft_reply

app = FastAPI(title="Notice Decoder")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), language: str = Form("English")):
    try:
        text, conf = read_image(await file.read())
        if len(text) < 20:
            raise HTTPException(422, "Could not read the notice. Retake the photo in better light.")
        steps = [f"OCR finished (confidence {conf}%)"]
        out = graph.invoke({"text": text, "language": language, "steps": steps})
        return {"ocr_confidence": conf, "low_confidence": conf < 60, "doc_type": out["doc_type"],
                "fields": out["fields"], "explanation": out["explanation"],
                "checklist": out["checklist"], "steps": out["steps"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"{type(e).__name__}: {e}")

class DraftReq(BaseModel):
    fields: dict
    doc_type: str
    language: str = "English"

@app.post("/draft")
def draft(req: DraftReq):
    return {"letter": draft_reply(req.fields, req.doc_type, req.language)}

@app.get("/reminder")
def reminder(date: str, title: str = "Notice deadline"):
    d = date.replace("-", "")
    ics = ("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//NoticeDecoder//EN\r\nBEGIN:VEVENT\r\n"
           f"UID:{d}-notice@decoder\r\nDTSTAMP:{d}T000000Z\r\nDTSTART;VALUE=DATE:{d}\r\n"
           f"SUMMARY:{title}\r\nBEGIN:VALARM\r\nTRIGGER:-P2D\r\nACTION:DISPLAY\r\n"
           "DESCRIPTION:Notice deadline in 2 days\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n")
    return Response(ics, media_type="text/calendar",
                    headers={"Content-Disposition": "attachment; filename=deadline.ics"})
