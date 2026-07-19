FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files
COPY main.py preprocess.py train.py forecast.py ./

# Create directories
RUN mkdir -p data models

# Copy dataset if present
COPY data/ ./data/

# Expose FastAPI port (Railway will override this with its own PORT env var, but 8000 is standard)
EXPOSE 8000

# Start FastAPI on the port assigned by Railway (fallback to 8000)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}