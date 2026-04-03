from flask import Flask, request, jsonify
from config.db import test_connection, get_db
<<<<<<< Updated upstream
from ai_helper import generate_subtasks, enhance_task_with_subtasks
from models.task import Task
import os
from bson import ObjectId
=======
from ai_helper import generate_subtasks
from bson import ObjectId
import os
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
# ==================== AI ENDPOINTS ====================

@app.route("/api/generate-subtasks", methods=["POST"])
def api_generate_subtasks():
    try:
<<<<<<< Updated upstream
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
        print(f"Error in api_generate_subtasks: {e}")  # Add this for debugging
        return jsonify({"error": str(e)}), 500

=======
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        # silent=True prevents Flask from raising 400 before your code handles it
        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        title = data.get("title")
        if not title:
            return jsonify({"error": "Title is required"}), 400

        description = data.get("description", "")
        subtasks = generate_subtasks(title, description)

        return jsonify({"subtasks": subtasks}), 200

    except Exception as e:
        print(f"Error in api_generate_subtasks: {e}")
        return jsonify({"error": str(e)}), 500


>>>>>>> Stashed changes
# ==================== TASK ENDPOINTS ====================

@app.route("/tasks", methods=["POST"])
def create_task():
    try:
<<<<<<< Updated upstream
        data = request.get_json()

        if not data or "title" not in data:
            return jsonify({"error": "Title is required"}), 400
        
        generate_ai_subtasks = data.get("generate_subtasks", False)
        
        if generate_ai_subtasks:
            enhanced_data = enhance_task_with_subtasks(data)
            task = Task(**enhanced_data)
        else:
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
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500
        result = db.tasks.insert_one(task_dict)
        task_dict["_id"] = str(result.inserted_id)
        
        return jsonify(task_dict), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/tasks/<task_id>/subtasks", methods=["POST"])
def generate_task_subtasks(task_id):
    try:
        data = request.get_json() or {}
        
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500
            
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
        })
    except Exception as e:
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
        return jsonify({"error": str(e)}), 500

=======
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

        # If the request asks for AI subtasks, generate them.
        # Even with no GEMINI_API_KEY, ai_helper should fall back to [] instead of crashing.
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


>>>>>>> Stashed changes
@app.route("/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    try:
        db = get_db()
        if db is None:
            return jsonify({"error": "Database connection not available"}), 500
<<<<<<< Updated upstream
            
        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"error": "Task not found"}), 404
        task["_id"] = str(task["_id"])
        return jsonify(task), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting Smart Task Manager...")
    
=======

        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            return jsonify({"error": "Task not found"}), 404

        task["_id"] = str(task["_id"])
        return jsonify(task), 200

    except Exception as e:
        print(f"Error in get_task: {e}")
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


if __name__ == "__main__":
    print("Starting Smart Task Manager...")

>>>>>>> Stashed changes
    if test_connection():
        print("✓ MongoDB connected successfully")
    else:
        print("✗ MongoDB connection failed - check MONGO_URI and MONGO_DB_NAME")
<<<<<<< Updated upstream
    
    if os.getenv("GEMINI_API_KEY"):
        print("✓ Gemini API key configured")
    else:
        print("✗ GEMINI_API_KEY not set - AI features will not work")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
=======

    if os.getenv("GEMINI_API_KEY"):
        print("✓ Gemini API key configured")
    else:
        print("✗ GEMINI_API_KEY not set - AI features will return empty subtasks")

    app.run(debug=True, host="0.0.0.0", port=5000)
>>>>>>> Stashed changes
