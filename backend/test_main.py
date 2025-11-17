import pytest
from fastapi.testclient import TestClient
from pathlib import Path
import json
import tempfile
import shutil
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
