import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_subtasks(task_title, task_description=""):
    """
    Generate subtasks for a given task using Gemini API
    
    Args:
        task_title (str): Title of the main task
        task_description (str): Optional detailed description
    
    Returns:
        list: List of subtask strings, or empty list if API fails
    """
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set")
        return []
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Combine title and description for context
        full_task = f"Title: {task_title}\n"
        if task_description:
            full_task += f"Description: {task_description}"
        
        prompt = f"""Break this task into 3-7 smaller, actionable subtasks. 
Return ONLY a JSON array of strings, no other text or formatting.

Task: {full_task}

Example format: ["Subtask 1", "Subtask 2", "Subtask 3"]"""
        
        response = model.generate_content(prompt)
        
        # Parse the response as JSON
        subtasks = json.loads(response.text.strip())
        
        # Ensure we return a list
        if isinstance(subtasks, list):
            return subtasks
        else:
            return []
            
    except json.JSONDecodeError as e:
        print(f"Failed to parse Gemini response as JSON: {e}")
        print(f"Raw response: {response.text}")
        return []
    except Exception as e:
        print(f"Gemini API error: {e}")
        return []

def enhance_task_with_subtasks(task_data):
    """
    Take a task dictionary and add AI-generated subtasks
    
    Args:
        task_data (dict): Task data with title and optional description
    
    Returns:
        dict: Task data with added subtasks
    """
    title = task_data.get("title", "")
    description = task_data.get("description", "")
    
    subtasks = generate_subtasks(title, description)
    
    # Add subtasks to task data
    enhanced_task = task_data.copy()
    enhanced_task["subtasks"] = subtasks
    
    return enhanced_task