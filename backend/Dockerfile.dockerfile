# Use Python 3.10.12 image as a base
FROM python:3.10.12-slim AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining files to the working directory
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to run the FastAPI server
CMD ["python", "run.py"]