import os
import json
import re
import requests
from dotenv import load_dotenv

load_dotenv()

# Use the Vertex AI endpoint (instructor's requirement)
MODEL = "gemini-2.5-flash-lite"
API_ENDPOINT = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{MODEL}:generateContent"

def _call(prompt: str) -> str:
    """Make API call to Gemini using Vertex AI endpoint"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not set")
        return "[]"
    
    url = f"{API_ENDPOINT}?key={api_key}"
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    try:
        print(f"Calling API: {url}")  # Debug
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        print(f"Response status: {response.status_code}")  # Debug
        
        if response.status_code != 200:
            print(f"Error response: {response.text}")
            return "[]"
        
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "[]"

def _clean_json(text: str) -> str:
    """Extract JSON from markdown code blocks if present"""
    text = re.sub(r"^```(?:json)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def generate_subtasks(task_title: str, task_description: str = "") -> list:
    """
    Generate subtasks for a task using Gemini AI
    """
    prompt = f"""Break this task into 3-7 smaller, actionable subtasks.
Return ONLY a JSON array of strings, no other text or formatting.

Task Title: {task_title}
Task Description: {task_description}

Example format: ["Subtask 1", "Subtask 2", "Subtask 3"]"""
    
    try:
        response_text = _call(prompt)
        print(f"Raw response: {response_text}")  # Debug
        cleaned = _clean_json(response_text)
        subtasks = json.loads(cleaned)
        
        if isinstance(subtasks, list):
            return subtasks
        return []
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Failed to parse: {cleaned}")
        return []
    except Exception as e:
        print(f"Error generating subtasks: {e}")
        return []

def enhance_task_with_subtasks(task_data: dict) -> dict:
    """
    Add AI-generated subtasks to task data
    """
    title = task_data.get("title", "")
    description = task_data.get("description", "")
    
    subtasks = generate_subtasks(title, description)
    
    enhanced_task = task_data.copy()
    enhanced_task["subtasks"] = subtasks
    
    return enhanced_task