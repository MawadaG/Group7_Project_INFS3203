from flask import Flask, request, jsonify
from config.db import test_connection
from ai_helper import generate_subtasks, enhance_task_with_subtasks
from models.task import Task
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "Smart Task Manager Backend Running"

@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/db-health")
def db_health():
    try:
        if test_connection():
            return {"database": "connected"}
        return {"database": "not connected"}, 500
    except Exception as e:
        return {"database": "error", "error": str(e)}, 500

@app.route("/api/generate-subtasks", methods=["POST"])
def api_generate_subtasks():
    """
    Endpoint to generate subtasks using Gemini AI
    Expects JSON: {"title": "Task title", "description": "Optional description"}
    """
    try:
        data = request.get_json()
        if not data or "title" not in data:
            return jsonify({"error": "Missing task title"}), 400
        
        title = data["title"]
        description = data.get("description", "")
        
        subtasks = generate_subtasks(title, description)
        
        return jsonify({
            "success": True,
            "subtasks": subtasks,
            "count": len(subtasks)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks", methods=["POST"])
def create_task():
    """
    Create a new task, optionally with AI-generated subtasks
    Expects JSON: {
        "title": "Task title",
        "description": "Optional description",
        "due_date": "2024-12-31",
        "priority": "low/medium/high",
        "project_id": "optional_project_id",
        "generate_subtasks": true/false
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or "title" not in data:
            return jsonify({"error": "Missing task title"}), 400
        
        # Check if we should generate subtasks with AI
        generate_ai_subtasks = data.get("generate_subtasks", False)
        
        if generate_ai_subtasks:
            # Use AI to enhance the task with subtasks
            enhanced_data = enhance_task_with_subtasks(data)
            task = Task(**enhanced_data)
        else:
            # Create task without AI subtasks
            task = Task(
                title=data["title"],
                description=data.get("description", ""),
                due_date=data.get("due_date"),
                priority=data.get("priority", "low"),
                status=data.get("status", "pending"),
                project_id=data.get("project_id"),
                subtasks=data.get("subtasks", [])
            )
        
        # TODO: Save to database (once database integration is complete)
        # For now, just return the task data
        return jsonify({
            "success": True,
            "task": task.to_dict(),
            "message": "Task created successfully (database integration pending)"
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/tasks/<task_id>/subtasks", methods=["POST"])
def generate_task_subtasks(task_id):
    """
    Generate AI subtasks for an existing task
    Expects JSON: {"description": "Optional additional context"}
    """
    try:
        data = request.get_json() or {}
        
        # TODO: Fetch task from database using task_id
        # For now, use placeholder
        task_title = data.get("title", "Sample Task")
        task_description = data.get("description", "")
        
        subtasks = generate_subtasks(task_title, task_description)
        
        return jsonify({
            "success": True,
            "task_id": task_id,
            "subtasks": subtasks,
            "count": len(subtasks)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Smart Task Manager...")
    
    # Test database connection
    if test_connection():
        print("✓ MongoDB connected successfully")
    else:
        print("✗ MongoDB connection failed - check MONGO_URI and MONGO_DB_NAME")
    
    # Check Gemini API key
    if os.getenv("GEMINI_API_KEY"):
        print("✓ Gemini API key configured")
    else:
        print("✗ GEMINI_API_KEY not set - AI features will not work")
    
    app.run(debug=True, host='0.0.0.0', port=5000)