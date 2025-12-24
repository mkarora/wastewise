from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from datetime import date
import json
from pathlib import Path
import ollama

app = FastAPI()

class Entry(BaseModel):
    date: date
    description: str

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)
ENTRIES_FILE = DATA_DIR / "entries.json"
PROMPTS_FILE= "prompts/generate_insights_prompt.json"

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
    try:
        if ENTRIES_FILE.exists():
            with open(ENTRIES_FILE, 'r') as f:
                entries = json.load(f)
                filtered_entries = list(filter(__entry_in_month, entries))
                if len(filtered_entries) == 0:
                    return {"message": "No entries found in current month"}
                with open(PROMPTS_FILE, 'r') as pf:
                    prompts = json.load(pf)
                    response = ollama.chat(model='gemma3', messages= [
                        {"role": "system", "content": prompts["system"]},
                        {"role": "user", "content": prompts["user_intro"]},
                        {"role": "user", "content": json.dumps(filtered_entries, indent=2)},
                        {"role": "user", "content": prompts["user_follow_up"]},
                    ])
                    return {"message": "Got ollama response", "response": response.message.content}
        else:
            return {"message": "No entries found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving entries: {str(e)}")

def __entry_in_month(entry):
    entry_date = date.fromisoformat(entry["date"])
    return entry_date.month == date.today().month and entry_date.year == date.today().year