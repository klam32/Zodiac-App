from __future__ import annotations

import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent


def _count_rows(db_path: Path, table: str) -> int | None:
    if not db_path.exists() or db_path.stat().st_size == 0:
        return None

    try:
        with sqlite3.connect(str(db_path)) as conn:
            cur = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                (table,),
            )
            if not cur.fetchone():
                return None
            cur = conn.execute(f"SELECT COUNT(*) FROM {table}")
            return int(cur.fetchone()[0])
    except sqlite3.Error:
        return None


def _pick_seed_db(target: Path) -> Path | None:
    candidates = [
        os.getenv("DB_SEED_PATH"),
        str(ROOT / "database.db"),
        str(ROOT / "database.db.original"),
        "/app/database.db",
        "/app/database.db.original",
    ]

    seen: set[Path] = set()
    for raw in candidates:
        if not raw:
            continue
        path = Path(raw).expanduser().resolve()
        if path in seen or path == target.resolve():
            continue
        seen.add(path)
        if path.exists() and path.is_file() and path.stat().st_size > 0:
            return path

    return None


def _backup_existing(target: Path) -> None:
    if not target.exists() or target.stat().st_size == 0:
        return

    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    backup = target.with_suffix(target.suffix + f".blank-{stamp}.bak")
    shutil.copy2(target, backup)
    print(f"[deploy_bootstrap] Backed up existing DB to {backup}")


def seed_database_if_needed() -> None:
    target = Path(os.getenv("DB_PATH", str(ROOT / "database.db"))).expanduser().resolve()
    seed = _pick_seed_db(target)

    if not seed:
        print("[deploy_bootstrap] No seed database found; startup will create an empty DB if needed.")
        return

    target.parent.mkdir(parents=True, exist_ok=True)

    target_user_count = _count_rows(target, "users")
    seed_user_count = _count_rows(seed, "users") or 0

    should_seed = (
        not target.exists()
        or target.stat().st_size == 0
        or target_user_count is None
        or (os.getenv("SEED_DB_IF_EMPTY", "1") == "1" and target_user_count == 0 and seed_user_count > 0)
        or os.getenv("RESET_DB_FROM_SEED", "0") == "1"
    )

    if not should_seed:
        print(f"[deploy_bootstrap] Existing DB kept at {target} (users={target_user_count}).")
        return

    if target.exists() and target_user_count == 0 and seed_user_count > 0:
        _backup_existing(target)

    shutil.copy2(seed, target)
    print(f"[deploy_bootstrap] Seeded DB from {seed} to {target} (seed users={seed_user_count}).")


def main() -> None:
    seed_database_if_needed()


if __name__ == "__main__":
    main()
