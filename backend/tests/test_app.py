import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

import pytest
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
    response = client.post('/api/generate-subtasks')
    assert response.status_code == 400

def test_generate_subtasks_endpoint_missing_title(client):
    response = client.post('/api/generate-subtasks', json={})
    assert response.status_code == 400

def test_create_task_endpoint(client):
    # Fix: Use '/tasks' not '/api/tasks'
    response = client.post('/tasks', json={
        "title": "Test Task",
        "description": "Test Description",
        "priority": "high"
    })
    assert response.status_code == 201
    # The response returns the task dict directly, not wrapped in {"success": true, "task": {...}}
    assert response.json["title"] == "Test Task"

def test_create_task_with_ai_subtasks(client):
    # Fix: Use '/tasks' not '/api/tasks'
    response = client.post('/tasks', json={
        "title": "Complete project",
        "description": "Finish the INFS3203 project",
        "generate_subtasks": True
    })
    assert response.status_code == 201
    assert "subtasks" in response.json

def test_generate_subtasks_endpoint_valid(client):
    response = client.post('/api/generate-subtasks', 
                          json={"title": "Test task", "description": "Test description"})
    assert response.status_code == 200
    assert "subtasks" in response.json