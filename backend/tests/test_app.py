import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    response = client.post('/api/tasks', json={
        "title": "Test Task",
        "description": "Test Description",
        "priority": "high"
    })
    assert response.status_code == 201
    assert response.json["success"] == True
    assert response.json["task"]["title"] == "Test Task"

def test_generate_subtasks_endpoint_valid(client):
    response = client.post('/api/generate-subtasks', 
                          json={"title": "Test task", "description": "Test description"})
    assert response.status_code == 200
    assert "subtasks" in response.json