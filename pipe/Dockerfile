# Use a lightweight Python Debian image
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    gcc \
    g++ \
    libffi-dev \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip, setuptools, and wheel for faster installs
RUN pip install --upgrade pip setuptools wheel

# Set the PYTHONPATH environment variable
ENV PYTHONPATH="/app:/app/pipe"

# Copy only requirements first (enables Docker caching)
COPY requirements.txt .

# Install dependencies with optimized flags
RUN pip install --prefer-binary --no-cache-dir -r requirements.txt

# Copy the rest of the app
COPY . .

# Keep the container alive
CMD ["sh", "-c", "tail -f /dev/null"]
