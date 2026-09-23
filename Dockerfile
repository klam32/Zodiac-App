FROM node:22-bookworm-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_BASE_URL=/
RUN npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DB_PATH=/data/database.db

WORKDIR /app

COPY requirements.txt requirements.runtime.txt ./
RUN pip install --no-cache-dir --no-compile -r requirements.runtime.txt \
    && pip check

# Runtime files only: frontend sources/public assets already exist in dist.
# Set ownership while copying, avoiding another layer rewriting all of /app.
COPY --chown=1000:1000 app/ ./app/
COPY --chown=1000:1000 chatbot/ ./chatbot/
COPY --chown=1000:1000 vector_store/ ./vector_store/
COPY --chown=1000:1000 app_deploy.py deploy_bootstrap.py sitecustomize.py ./
COPY --chown=1000:1000 database.db ./database.db
COPY --chown=1000:1000 --from=frontend-build /app/frontend/dist ./frontend/dist
COPY --chown=1000:1000 scripts/check_web_runtime.py ./scripts/check_web_runtime.py

RUN mkdir -p /data/uploads \
    && ln -s /data/uploads /app/uploads \
    && chown 1000:1000 /app /data /data/uploads

USER 1000
# Fail during build if the reduced runtime is missing a web dependency or asset.
RUN python scripts/check_web_runtime.py
EXPOSE 8080

CMD ["sh", "-c", "mkdir -p /data/uploads && if [ -z \"${GOOGLE_APPLICATION_CREDENTIALS:-}\" ]; then for f in /app/*.json; do if [ -f \"$f\" ] && grep -q '\"type\"[[:space:]]*:[[:space:]]*\"service_account\"' \"$f\"; then export GOOGLE_APPLICATION_CREDENTIALS=\"$f\"; break; fi; done; fi && python deploy_bootstrap.py && uvicorn app_deploy:app --host 0.0.0.0 --port ${PORT:-8080}"]
