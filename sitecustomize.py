import base64
import os
from pathlib import Path


def _configure_google_credentials() -> None:
    if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        return

    raw_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    raw_base64 = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_BASE64")

    credentials_content = None
    if raw_json:
        credentials_content = raw_json.strip()
    elif raw_base64:
        credentials_content = base64.b64decode(raw_base64).decode("utf-8").strip()

    if not credentials_content:
        return

    credentials_path = Path(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_PATH", "/tmp/google-credentials.json"))
    credentials_path.write_text(credentials_content, encoding="utf-8")
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials_path)


_configure_google_credentials()
