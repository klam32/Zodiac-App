# Web deployment

The Docker image uses Python 3.11 and builds the frontend with
`VITE_API_BASE_URL=/`. It runs as UID 1000 on `${PORT:-8080}`.

## What the smaller image retains

- All FastAPI routers and the compiled frontend, including its public images.
- Google login, accounts, payments, rewards, administration and support WebSockets.
- Vertex AI and Gemini SDKs, Vertex embeddings, astrology calculations/SVG charts,
  Neo4j/GraphRAG, the existing vector store and the seed SQLite database.
- Persistent uploads at `/data/uploads` and database at `/data/database.db`.

`requirements.runtime.txt` lists packages imported by the web runtime. Versions
are constrained by `requirements.txt`, with Google GenAI pinned to the version
used in the supplied successful dependency-install log. Pip still installs all
required transitive dependencies. Keep using the full development requirements
for standalone PDF ingestion/evaluation scripts; they are not web endpoints.

The final image no longer includes frontend source/public files a second time,
unused legacy uploads under `app/utils/download`, root utility files, local
environments, tests and reference documents. Original files remain in the repo
or local workspace. `COPY --chown` avoids the recursive ownership-changing layer;
pip skips bytecode compilation and its download cache.

## Checks

The Docker build runs `pip check` and `scripts/check_web_runtime.py` as UID 1000.
The smoke check creates a temporary SQLite database, imports both AI SDKs, checks
frontend assets, JWT sessions, conversations, payment packages, rewards, support
WebSockets, feature route registration, SVG chart generation and local GraphRAG.
It substitutes an offline AI model and does not contact external services.

To check locally, install `requirements.runtime.txt` into an isolated Python 3.11
environment, build the frontend, then run:

```sh
python scripts/check_web_runtime.py
docker build -t zodiac:web .
docker image inspect zodiac:web --format '{{.Size}}'
```

The optimized Linux/Python 3.11 dependency resolution contained 107 packages,
versus 153 in the supplied build log. Estimated tracked build context decreased
from 56.79 MiB to 39.74 MiB. These are not measurements of the final Docker image.

OAuth exchange, live AI responses, SMTP, payment callbacks and a remote Neo4j
connection still require correct production credentials and live verification.
Configure these in Blitz Environment; `.env` files are excluded from Docker.
Mount persistent storage at `/data` to retain accounts and uploads across deploys.

## The current Blitz failure

The supplied log completed installation and Dockerfile steps, then failed at
registry upload with:

```text
filesystem: mkdir /var/lib/registry/.../_uploads/...: no space left on device
```

This is storage exhaustion in Blitz's image registry. A smaller image reduces
storage and upload requirements but cannot repair a full registry. Contact Blitz
support at `hallo@blitzworks.io` with the app address and this error, then retry
Build the newest code once registry capacity is restored. Deleting the app or
its persistent database does not repair the provider's registry.

Docker packaging reference: https://docs.docker.com/build/building/best-practices/
Blitz support: https://blitz.cloud/docs/app-status-and-logs/
