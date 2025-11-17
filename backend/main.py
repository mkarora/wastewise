from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/entries")
async def save_entry():
    return {"message": "Save entry endpoint"}

@app.get("/insights")
async def get_insights():
    return {"message": "Get insights endpoint"}

