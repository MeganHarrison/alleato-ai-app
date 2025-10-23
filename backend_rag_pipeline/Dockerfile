# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r ragpipeline && useradd -r -g ragpipeline ragpipeline

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make entrypoint executable
RUN chmod +x docker_entrypoint.py

# Create data directories and set permissions
RUN mkdir -p /app/Local_Files/data /app/Google_Drive/credentials && \
    chown -R ragpipeline:ragpipeline /app

# Switch to non-root user
USER ragpipeline

# Environment variables with defaults
ENV RAG_PIPELINE_TYPE=local
ENV RUN_MODE=continuous
ENV CHECK_INTERVAL=60
ENV PYTHONUNBUFFERED=1

# Entrypoint - let docker_entrypoint.py handle defaults from environment variables
ENTRYPOINT ["python", "docker_entrypoint.py"]