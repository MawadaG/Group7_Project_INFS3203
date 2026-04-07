from flask import Flask, request, jsonify, send_from_directory
from config.db import test_connection, get_db
from ai_helper import generate_subtasks
from bson import ObjectId
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

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

        title = data.get("title")
        if not title:
            return jsonify({"error": "Title is required"}), 400

        description = data.get("description", "")
        subtasks = generate_subtasks(title, description)

        return jsonify({
            "success": True,
            "subtasks": subtasks,
            "count": len(subtasks)
        }), 200

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

        title = data.get("title")
        if not title:
            return jsonify({"error": "Title is required"}), 400

        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        task = {
            "title": title,
            "description": data.get("description", ""),
            "due_date": data.get("due_date"),
            "priority": data.get("priority", "low"),
            "status": data.get("status", "pending"),
            "project_id": data.get("project_id"),
            "subtasks": data.get("subtasks", [])
        }

        if data.get("generate_subtasks") is True:
            task["subtasks"] = generate_subtasks(task["title"], task["description"])

        result = db.tasks.insert_one(task)
        task["_id"] = str(result.inserted_id)

        return jsonify(task), 201

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
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        existing_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not existing_task:
            return jsonify({"error": "Task not found"}), 404

        updated_fields = {
            "title": data.get("title", existing_task.get("title")),
            "description": data.get("description", existing_task.get("description", "")),
            "due_date": data.get("due_date", existing_task.get("due_date")),
            "priority": data.get("priority", existing_task.get("priority", "low")),
            "status": data.get("status", existing_task.get("status", "pending")),
            "project_id": data.get("project_id", existing_task.get("project_id")),
            "subtasks": data.get("subtasks", existing_task.get("subtasks", []))
        }

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": updated_fields}
        )

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

        existing_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not existing_task:
            return jsonify({"error": "Task not found"}), 404

        db.tasks.delete_one({"_id": ObjectId(task_id)})

        return jsonify({
            "message": "Task deleted successfully",
            "task_id": task_id
        }), 200

    except Exception as e:
        print(f"Error in delete_task: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/tasks/<task_id>/complete", methods=["PATCH"])
def complete_task(task_id):
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500

        existing_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not existing_task:
            return jsonify({"error": "Task not found"}), 404

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"status": "completed"}}
        )

        updated_task = db.tasks.find_one({"_id": ObjectId(task_id)})
        updated_task["_id"] = str(updated_task["_id"])

        return jsonify(updated_task), 200

    except Exception as e:
        print(f"Error in complete_task: {e}")
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

        subtasks = generate_subtasks(task_title, task_description)

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"subtasks": subtasks}}
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
    

# Add these routes to serve frontend
    @app.route('/index.html')
    def serve_index():
        return send_from_directory('.', 'index.html')

    @app.route('/script.js')
    def serve_script():
        return send_from_directory('.', 'script.js')

    @app.route('/style.css')
    def serve_style():
        return send_from_directory('.', 'style.css')

    # Also serve the root path
    @app.route('/')
    def serve_frontend():
        return send_from_directory('.', 'index.html')


if __name__ == "__main__":
    print("Starting Smart Task Manager...")

    if test_connection():
        print("MongoDB connected successfully")
    else:
        print("MongoDB connection failed - check MONGO_URI and MONGO_DB_NAME")

    if os.getenv("GEMINI_API_KEY"):
        print("Gemini API key configured")
    else:
        print("GEMINI_API_KEY not set - AI features will return empty subtasks")

    app.run(debug=True, host="0.0.0.0", port=5000)