@echo off
echo Starting Notice Decoder Backend...
cd /d "%~dp0backend"
call .venv\Scripts\activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000

