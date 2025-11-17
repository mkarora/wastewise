from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from datetime import date
import json
from pathlib import Path

app = FastAPI()

class Entry(BaseModel):
    date: date
    description: str

# Ensure data directory exists
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
ENTRIES_FILE = DATA_DIR / "entries.json"

@app.get("/")
async def root():
    return {"message": "WasteWise Backend is running"}

@app.post("/entries")
async def save_entry(input_text: str = Body(...)):
    if not input_text or not input_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="Input text cannot be empty or whitespace only"
        )
    
    entry = Entry(date=date.today(), description=input_text.strip())
    try:
        if ENTRIES_FILE.exists():
            with open(ENTRIES_FILE, 'r') as f:
                entries = json.load(f)
        else:
            entries = []
        
        entries.append(entry.model_dump())
        with open(ENTRIES_FILE, 'w') as f:
            json.dump(entries, f, indent=2, default=str)
        
        return {"message": "Entry saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving entry: {str(e)}")

@app.get("/insights")
async def get_insights():
    return {"message": "Get insights endpoint"}

