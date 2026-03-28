from config.db import test_connection, db
from flask import Flask, request, jsonify
from models.task import Task

app = Flask(__name__)

@app.route("/")
def home():
    return "Smart Task Manager Backend Running"

@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/db-health")
def db_health():
    if test_connection():
        return {"database": "connected"}
    return {"database": "not connected"}, 500

@app.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json()

    if not data or "title" not in data:
        return jsonify({"error": "Title is required"}), 400

    # creates the task
    task = Task(
        title=data.get("title"),
        description=data.get("description", ""),
        due_date=data.get("due_date"),
        priority=data.get("priority", "low"),
        status=data.get("status", "pending"),
        project_id=data.get("project_id"),
        subtasks=data.get("subtasks", [])
    )

    task_dict = task.to_dict()

    result = db.tasks.insert_one(task_dict)

    task_dict["_id"] = str(result.inserted_id)

    return jsonify(task_dict), 201

if __name__ == "__main__":
    if test_connection():
        print("MongoDB connected successfully")
    else:
        print("MongoDB connection failed")

    app.run(debug=True)