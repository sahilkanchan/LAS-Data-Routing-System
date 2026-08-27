# Use a lightweight Python image as the base
# Python 3.10 is chosen for compatibility with the Whisper library
FROM python:3.10-slim

# Set the working directory in the container
# All subsequent commands will be run from this directory
WORKDIR /app

# Install system dependencies
# ffmpeg is required for audio processing by the Whisper library
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
# This is done before copying the rest of the application to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# --no-cache-dir reduces the image size by not caching the installation files
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
# This includes app.py, WERCalculator.py, and any other necessary files
COPY . .

# Expose the port the Flask app runs on
# This documents that the container listens on port 5000
EXPOSE 5000

# Start the Flask application
# This command is executed when the container starts
CMD ["python", "app.py"]