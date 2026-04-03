import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

import pytest
from unittest.mock import MagicMock, patch

# Mock the database before importing app
mock_db = MagicMock()
mock_collection = MagicMock()
mock_db.tasks = mock_collection
mock_collection.insert_one.return_value = MagicMock(inserted_id="676e1234567890abcdef1234")
mock_collection.find.return_value = []
mock_collection.find_one.return_value = {"_id": "676e1234567890abcdef1234", "title": "Test Task"}

# Apply mock
with patch('config.db.get_db', return_value=mock_db):
    from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {"status": "ok"}

def test_home_endpoint(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"Smart Task Manager" in response.data

def test_generate_subtasks_endpoint_no_data(client):
    response = client.post('/api/generate-subtasks', 
                          content_type='application/json')
    assert response.status_code == 400

def test_generate_subtasks_endpoint_missing_title(client):
    response = client.post('/api/generate-subtasks', 
                          json={},
                          content_type='application/json')
    assert response.status_code == 400

def test_create_task_endpoint(client):
    response = client.post('/tasks', 
                          json={
                              "title": "Test Task",
                              "description": "Test Description",
                              "priority": "high"
                          },
                          content_type='application/json')
    assert response.status_code == 201
    assert response.json["title"] == "Test Task"

def test_create_task_with_ai_subtasks(client):
    response = client.post('/tasks', 
                          json={
                              "title": "Complete project",
                              "description": "Finish the INFS3203 project",
                              "generate_subtasks": True
                          },
                          content_type='application/json')
    assert response.status_code == 201
    assert "subtasks" in response.json

def test_generate_subtasks_endpoint_valid(client):
    response = client.post('/api/generate-subtasks', 
                          json={"title": "Test task", "description": "Test description"},
                          content_type='application/json')
    assert response.status_code == 200
    assert "subtasks" in response.json