import pytest
from models.task import Task

def test_task_creation():
    """Test basic task creation"""
    task = Task(
        title="Complete project",
        description="Finish the INFS3203 project",
        priority="high"
    )
    
    assert task.title == "Complete project"
    assert task.description == "Finish the INFS3203 project"
    assert task.priority == "high"
    assert task.status == "pending"
    assert task.subtasks == []

def test_task_to_dict():
    """Test task to dictionary conversion"""
    task = Task(
        title="Test task",
        subtasks=["Subtask 1", "Subtask 2"]
    )
    
    task_dict = task.to_dict()
    
    assert task_dict["title"] == "Test task"
    assert len(task_dict["subtasks"]) == 2
    assert task_dict["status"] == "pending"

def test_task_with_subtasks():
    """Test task with AI-generated subtasks"""
    task = Task(
        title="Write report",
        subtasks=["Research", "Write draft", "Review", "Submit"]
    )
    
    assert len(task.subtasks) == 4
    assert task.subtasks[0] == "Research"