import json
import re
from pathlib import Path


def safe_name(value, suffix=".json"):
    name = str(value or "").strip().replace("\\", "/").split("/")[-1]
    name = re.sub(r"[^A-Za-z0-9_.-]+", "_", name).strip("._")
    if not name:
        raise ValueError("name is empty")
    if suffix and not name.lower().endswith(suffix):
        name += suffix
    return name


def atomic_write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def read_json(path, fallback):
    path = Path(path)
    if not path.is_file():
        return fallback
    return json.loads(path.read_text(encoding="utf-8-sig"))
