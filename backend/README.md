# WasteWise Backend

Simple FastAPI backend for the WasteWise application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
Make sure you're in the `backend` directory, then run:
```bash
pip install -r requirements.txt
```

## Running the Server

Make sure you're in the `backend` directory, then run:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Running Tests

Make sure you're in the `backend` directory, then run:
```bash
pytest test_main.py -v
```

Or to run with coverage:
```bash
pytest test_main.py -v --cov=main
```

## Endpoints

- `GET /` - Hello World
- `POST /entries` - Saves an entry. Takes in a string and persists it to an entries.json file in the data folder along with the date.
- `GET /insights` - Passes last month's entries to Ollama and returns insights about the month's food waste.
