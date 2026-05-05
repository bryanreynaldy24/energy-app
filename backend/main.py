from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
import os, tempfile, re
from datetime import datetime
from analysis import run_analysis
from pptx_generator import generate_pptx

app = FastAPI(title="Indonesia Energy Narrative Monitor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")

def fetch_sheet(tab: str) -> pd.DataFrame:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={tab}"
    try:
        df = pd.read_csv(url)
        return df
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet '{tab}': {str(e)}")

@app.get("/api/health")
def health():
    return {"status": "ok", "sheet_id_set": bool(SHEET_ID)}

@app.get("/api/dashboard")
def dashboard():
    sm = fetch_sheet("social_media")
    cm = fetch_sheet("conventional_media")
    result = run_analysis(sm, cm)
    return result

@app.get("/api/download-pptx")
def download_pptx():
    sm = fetch_sheet("social_media")
    cm = fetch_sheet("conventional_media")
    result = run_analysis(sm, cm)
    tmp = tempfile.NamedTemporaryFile(suffix=".pptx", delete=False)
    generate_pptx(result, tmp.name)
    return FileResponse(
        tmp.name,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="Indonesia_Energy_Narrative_Monitor.pptx"
    )
