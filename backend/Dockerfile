# Use official Python image
FROM python:3.13

# Install system dependencies for OpenCV (libGL)
RUN apt-get update && apt-get install -y libgl1 && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY backend/ .

# Expose port
EXPOSE 5000

# Start backend
CMD ["python", "main.py"]
