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
- `POST /entries` - Save entry endpoint 
- `GET /insights` - Get insights endpoint
