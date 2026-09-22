FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_API_BASE_URL=/
RUN npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DB_PATH=/data/database.db

WORKDIR /app

COPY requirements.txt ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential \
    && rm -rf /var/lib/apt/lists/* /tmp/* /root/.cache

COPY . .
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

RUN mkdir -p /data/uploads \
    && rm -rf /app/uploads \
    && ln -s /data/uploads /app/uploads \
    && chown -R 1000:1000 /app /data

USER 1000
EXPOSE 8080

CMD ["sh", "-c", "mkdir -p /data/uploads && if [ -z \"${GOOGLE_APPLICATION_CREDENTIALS:-}\" ]; then for f in /app/*.json; do if [ -f \"$f\" ] && grep -q '\"type\"[[:space:]]*:[[:space:]]*\"service_account\"' \"$f\"; then export GOOGLE_APPLICATION_CREDENTIALS=\"$f\"; break; fi; done; fi && python deploy_bootstrap.py && uvicorn app_deploy:app --host 0.0.0.0 --port ${PORT:-8080}"]
