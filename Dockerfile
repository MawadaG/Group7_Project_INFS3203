# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (better caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend folder
COPY backend/ ./backend/
COPY index.html .
COPY script.js .
COPY style.css .

# Set working directory to backend for Flask
WORKDIR /app/backend

# Expose port
EXPOSE 5000

# Run with gunicorn for production
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} app:app"]