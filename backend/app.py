from flask import Flask
from config.db import test_connection

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

if __name__ == "__main__":
    if test_connection():
        print("MongoDB connected successfully")
    else:
        print("MongoDB connection failed")

    app.run(debug=True)