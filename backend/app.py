from datetime import datetime, timezone
from flask import Flask, request, jsonify
from config.db import test_connection, get_db
from ai_helper import generate_subtasks
from models.task import Task
from bson import ObjectId
import os

app = Flask(__name__)


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


def serialize_task(task):
    task["_id"] = str(task["_id"])
    return task


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


# ==================== AI ENDPOINTS ====================

@app.route("/api/generate-subtasks", methods=["POST"])
def api_generate_subtasks():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        title = str(data.get("title", "")).strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        description = str(data.get("description", "")).strip()

        try:
            subtasks = generate_subtasks(title, description)
        except Exception as e:
            print(f"Error generating subtasks: {e}")
            subtasks = []

        return jsonify({"subtasks": subtasks}), 200

    except Exception as e:
        print(f"Error in api_generate_subtasks: {e}")
        return jsonify({"error": str(e)}), 500


# ==================== TASK ENDPOINTS ====================

@app.route("/tasks", methods=["POST"])
def create_task():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        title = str(data.get("title", "")).strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        subtasks = data.get("subtasks", [])

        if data.get("generate_subtasks") is True and not subtasks:
            try:
                subtasks = generate_subtasks(
                    title,
                    str(data.get("description", "")).strip()
                )
            except Exception as e:
                print(f"Error generating AI subtasks in create_task: {e}")
                subtasks = []

        task = Task(
            title=title,
            description=str(data.get("description", "")).strip(),
            due_date=data.get("due_date"),
            priority=str(data.get("priority", "low")).strip().lower(),
            status=str(data.get("status", "pending")).strip().lower(),
            project_id=str(data.get("project_id", "")).strip() or None,
            subtasks=subtasks
        )

        task_dict = task.to_dict()
        task_dict["created_at"] = utc_now_iso()
        task_dict["updated_at"] = task_dict["created_at"]

        result = db.tasks.insert_one(task_dict)
        task_dict["_id"] = str(result.inserted_id)

        return jsonify(task_dict), 201

    except Exception as e:
        print(f"Error in create_task: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/tasks", methods=["GET"])
def get_tasks():
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        tasks = []
        for task in db.tasks.find():
            task["_id"] = str(task["_id"])
            tasks.append(task)

        return jsonify(tasks), 200

    except Exception as e:
        print(f"Error in get_tasks: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"error": "Task not found"}), 404

        task["_id"] = str(task["_id"])
        return jsonify(task), 200

    except Exception as e:
        print(f"Error in get_task: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/tasks/<task_id>", methods=["PUT"])
def update_task(task_id):
    try:
        data = request.get_json(silent=True) or {}

        title = str(data.get("title", "")).strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        update_data = {
            "title": title,
            "description": str(data.get("description", "")).strip(),
            "due_date": data.get("due_date"),
            "priority": str(data.get("priority", "low")).strip().lower(),
            "status": str(data.get("status", "pending")).strip().lower(),
            "project_id": str(data.get("project_id", "")).strip() or None,
            "updated_at": utc_now_iso()
        }

        if "subtasks" in data:
            update_data["subtasks"] = data.get("subtasks", [])

        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        result = db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Task not found"}), 404

        updated_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        updated_task["_id"] = str(updated_task["_id"])
        return jsonify(updated_task), 200

    except Exception as e:
        print(f"Error in update_task: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        result = db.tasks.delete_one({"_id": ObjectId(task_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({"message": "Task deleted successfully"}), 200

    except Exception as e:
        print(f"Error in delete_task: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/tasks/<task_id>/subtasks", methods=["POST"])
def generate_task_subtasks(task_id):
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        data = request.get_json(silent=True) or {}
        task_doc = db.tasks.find_one({"_id": ObjectId(task_id)})

        if not task_doc:
            return jsonify({"error": "Task not found"}), 404

        task_title = task_doc.get("title", "")
        task_description = data.get("description", task_doc.get("description", ""))

        try:
            subtasks = generate_subtasks(task_title, task_description)
        except Exception as e:
            print(f"Error generating subtasks for task: {e}")
            subtasks = []

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"subtasks": subtasks, "updated_at": utc_now_iso()}}
        )

        return jsonify({
            "success": True,
            "task_id": task_id,
            "subtasks": subtasks,
            "count": len(subtasks)
        }), 200

    except Exception as e:
        print(f"Error in generate_task_subtasks: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting Smart Task Manager...")

    if test_connection():
        print("✓ MongoDB connected successfully")
    else:
        print("✗ MongoDB connection failed - check MONGO_URI and MONGO_DB_NAME")

    if os.getenv("GEMINI_API_KEY"):
        print("✓ Gemini API key configured")
    else:
        print("✗ GEMINI_API_KEY not set - AI features will return empty subtasks")

    app.run(debug=True, host="0.0.0.0", port=5000)