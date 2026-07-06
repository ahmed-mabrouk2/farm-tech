FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 7860

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend project files
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the default Hugging Face Space port
EXPOSE 7860

# Command to run database migrations and start Gunicorn on port 7860
CMD python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:7860
