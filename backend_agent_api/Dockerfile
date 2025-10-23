# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user with home directory
RUN groupadd -r agent && useradd -r -g agent -m -d /home/agent agent

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R agent:agent /app && \
    chown -R agent:agent /home/agent

# Switch to non-root user
USER agent

# Expose port (Render will override this with PORT env var)
EXPOSE 8001

# Health check - use PORT env var with fallback to 8001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import os, requests; port=os.environ.get('PORT', '8001'); requests.get(f'http://localhost:{port}/health', timeout=5)"

# Run the application using PORT environment variable (Render provides this)
# The ${PORT:-8001} syntax provides a default value of 8001 if PORT is not set
CMD uvicorn agent_api:app --host 0.0.0.0 --port ${PORT:-8001}