import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json
import tempfile
import shutil
from unittest.mock import patch
from datetime import date
import main

# Create a test client
client = TestClient(main.app)


@pytest.fixture
def temp_data_dir(monkeypatch):
    """Create a temporary data directory for testing"""
    temp_dir = tempfile.mkdtemp()
    data_dir = Path(temp_dir) / "data"
    data_dir.mkdir()
    entries_file = data_dir / "entries.json"
    
    # Monkeypatch the paths in the main module
    monkeypatch.setattr(main, "DATA_DIR", data_dir)
    monkeypatch.setattr(main, "ENTRIES_FILE", entries_file)
    
    yield data_dir
    
    # Cleanup
    shutil.rmtree(temp_dir)


def test_save_entry_valid_input(temp_data_dir):
    """Test saving a valid entry"""
    response = client.post("/entries", json="Valid entry text")
    
    assert response.status_code == 200
    assert response.json() == {"message": "Entry saved successfully"}
    
    # Verify file was created and contains the entry
    entries_file = temp_data_dir / "entries.json"
    assert entries_file.exists()
    
    with open(entries_file, 'r') as f:
        entries = json.load(f)
    
    assert len(entries) == 1
    assert entries[0]["description"] == "Valid entry text"
    assert "date" in entries[0]


def test_save_entry_multiple_entries(temp_data_dir):
    """Test saving multiple entries"""
    # Save first entry
    response1 = client.post("/entries", json="First entry")
    assert response1.status_code == 200
    
    # Save second entry
    response2 = client.post("/entries", json="Second entry")
    assert response2.status_code == 200
    
    # Verify both entries are saved
    entries_file = temp_data_dir / "entries.json"
    with open(entries_file, 'r') as f:
        entries = json.load(f)
    
    assert len(entries) == 2
    assert entries[0]["description"] == "First entry"
    assert entries[1]["description"] == "Second entry"


def test_save_entry_empty_string():
    """Test that empty string is rejected"""
    response = client.post("/entries", json="")
    
    assert response.status_code == 400
    assert "cannot be empty or whitespace only" in response.json()["detail"]


def test_save_entry_whitespace_only():
    """Test that whitespace-only string is rejected"""
    response = client.post("/entries", json="   ")
    
    assert response.status_code == 400
    assert "cannot be empty or whitespace only" in response.json()["detail"]


def test_save_entry_null_body():
    """Test that null/missing body is rejected"""
    response = client.post("/entries", json=None)
    
    assert response.status_code == 422  # FastAPI validation error


def test_save_entry_strips_whitespace(temp_data_dir):
    """Test that leading/trailing whitespace is stripped"""
    response = client.post("/entries", json="  text with spaces  ")
    
    assert response.status_code == 200
    
    # Verify whitespace was stripped
    entries_file = temp_data_dir / "entries.json"
    with open(entries_file, 'r') as f:
        entries = json.load(f)
    
    assert entries[0]["description"] == "text with spaces"


def test_save_entry_creates_file_if_not_exists(temp_data_dir):
    """Test that file is created if it doesn't exist"""
    entries_file = temp_data_dir / "entries.json"
    assert not entries_file.exists()
    
    response = client.post("/entries", json="New entry")
    
    assert response.status_code == 200
    assert entries_file.exists()


def test_save_entry_appends_to_existing_file(temp_data_dir):
    """Test that new entries are appended to existing file"""
    entries_file = temp_data_dir / "entries.json"
    
    # Create initial file with one entry
    initial_entries = [{"date": "2024-01-01", "description": "Existing entry"}]
    with open(entries_file, 'w') as f:
        json.dump(initial_entries, f)
    
    # Add new entry
    response = client.post("/entries", json="New entry")
    assert response.status_code == 200
    
    # Verify both entries exist
    with open(entries_file, 'r') as f:
        entries = json.load(f)
    
    assert len(entries) == 2
    assert entries[0]["description"] == "Existing entry"
    assert entries[1]["description"] == "New entry"


# Tests for get_insights endpoint

def test_get_insights_no_file(temp_data_dir):
    """Test get_insights when entries file doesn't exist"""
    entries_file = temp_data_dir / "entries.json"
    assert not entries_file.exists()
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    assert response.json() == {"message": "No entries found"}


def test_get_insights_empty_file(temp_data_dir):
    """Test get_insights when entries file exists but is empty"""
    entries_file = temp_data_dir / "entries.json"
    with open(entries_file, 'w') as f:
        json.dump([], f)
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "No entries found in current month"
    assert "entries" not in data  # Should not include entries key when none found


@patch('main.date')
def test_get_insights_filters_current_month(mock_date, temp_data_dir):
    """Test that get_insights filters entries to current month only"""
    # Mock current date to November 2024
    from datetime import date as real_date
    mock_date.today.return_value = real_date(2024, 11, 15)
    mock_date.fromisoformat = real_date.fromisoformat  # Keep real fromisoformat
    
    entries_file = temp_data_dir / "entries.json"
    entries = [
        {"date": "2024-11-10", "description": "November entry 1"},
        {"date": "2024-11-20", "description": "November entry 2"},
        {"date": "2024-10-15", "description": "October entry"},
        {"date": "2024-12-01", "description": "December entry"},
    ]
    with open(entries_file, 'w') as f:
        json.dump(entries, f)
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Entries retrieved successfully"
    assert len(data["entries"]) == 2
    assert all(entry["date"].startswith("2024-11") for entry in data["entries"])
    assert data["entries"][0]["description"] == "November entry 1"
    assert data["entries"][1]["description"] == "November entry 2"


@patch('main.date')
def test_get_insights_filters_current_year(mock_date, temp_data_dir):
    """Test that get_insights filters entries to current year as well"""
    # Mock current date to January 2025
    from datetime import date as real_date
    mock_date.today.return_value = real_date(2025, 1, 15)
    mock_date.fromisoformat = real_date.fromisoformat
    
    entries_file = temp_data_dir / "entries.json"
    entries = [
        {"date": "2025-01-10", "description": "January 2025 entry"},
        {"date": "2024-01-10", "description": "January 2024 entry"},  # Same month, different year
    ]
    with open(entries_file, 'w') as f:
        json.dump(entries, f)
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["entries"]) == 1
    assert data["entries"][0]["date"] == "2025-01-10"
    assert data["entries"][0]["description"] == "January 2025 entry"


@patch('main.date')
def test_get_insights_all_entries_current_month(mock_date, temp_data_dir):
    """Test get_insights when all entries are in current month"""
    # Mock current date to March 2024
    from datetime import date as real_date
    mock_date.today.return_value = real_date(2024, 3, 15)
    mock_date.fromisoformat = real_date.fromisoformat
    
    entries_file = temp_data_dir / "entries.json"
    entries = [
        {"date": "2024-03-01", "description": "March entry 1"},
        {"date": "2024-03-15", "description": "March entry 2"},
        {"date": "2024-03-31", "description": "March entry 3"},
    ]
    with open(entries_file, 'w') as f:
        json.dump(entries, f)
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["entries"]) == 3
    assert all(entry["date"].startswith("2024-03") for entry in data["entries"])


@patch('main.date')
def test_get_insights_no_entries_current_month(mock_date, temp_data_dir):
    """Test get_insights when no entries are in current month - returns 'No entries found in current month'"""
    # Mock current date to June 2024
    from datetime import date as real_date
    mock_date.today.return_value = real_date(2024, 6, 15)
    mock_date.fromisoformat = real_date.fromisoformat
    
    entries_file = temp_data_dir / "entries.json"
    entries = [
        {"date": "2024-05-10", "description": "May entry"},
        {"date": "2024-07-10", "description": "July entry"},
    ]
    with open(entries_file, 'w') as f:
        json.dump(entries, f)
    
    response = client.get("/insights")
    
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "No entries found in current month"
    assert "entries" not in data  # Should not include entries key when none found


def test_get_insights_malformed_json(temp_data_dir):
    """Test get_insights handles malformed JSON gracefully"""
    entries_file = temp_data_dir / "entries.json"
    with open(entries_file, 'w') as f:
        f.write("not valid json")
    
    response = client.get("/insights")
    
    assert response.status_code == 500
    assert "Error retrieving entries" in response.json()["detail"]
