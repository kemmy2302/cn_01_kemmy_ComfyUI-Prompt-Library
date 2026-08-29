import mimetypes
from pathlib import Path

from aiohttp import web
from server import PromptServer

from .storage import atomic_write_json, read_json, safe_name


_REGISTERED = False


def _data_root():
    try:
        import folder_paths

        root = Path(folder_paths.get_user_directory())
    except (ImportError, AttributeError):
        root = Path(__file__).resolve().parent / "_data"
    result = root / "ordered_prompt_tools"
    (result / "thumbnails").mkdir(parents=True, exist_ok=True)
    return result


def _library_path():
    return _data_root() / "library.json"


def _default_library():
    return {"version": 2, "categories": [], "entries": []}


def register_routes():
    global _REGISTERED
    if _REGISTERED:
        return
    _REGISTERED = True
    routes = PromptServer.instance.routes

    @routes.get("/kemmy-prompt-library/library")
    async def get_library(request):
        return web.json_response(read_json(_library_path(), _default_library()))

    @routes.post("/kemmy-prompt-library/library")
    async def save_library(request):
        data = await request.json()
        entries = data.get("entries", []) if isinstance(data, dict) else []
        categories = data.get("categories", []) if isinstance(data, dict) else []
        if not isinstance(entries, list):
            raise web.HTTPBadRequest(text="entries must be an array")
        if not isinstance(categories, list):
            raise web.HTTPBadRequest(text="categories must be an array")
        payload = {"version": 2, "categories": categories, "entries": entries}
        atomic_write_json(_library_path(), payload)
        return web.json_response(payload)

    @routes.post("/kemmy-prompt-library/thumbnail")
    async def upload_thumbnail(request):
        reader = await request.multipart()
        entry_id, file_part = None, None
        async for part in reader:
            if part.name == "entry_id":
                entry_id = await part.text()
            elif part.name == "file":
                file_part = part
                break
        if not entry_id or file_part is None:
            raise web.HTTPBadRequest(text="entry_id and file are required")
        extension = Path(file_part.filename or "").suffix.lower()
        if extension not in {".png", ".jpg", ".jpeg", ".webp"}:
            raise web.HTTPBadRequest(text="thumbnail must be png, jpg, jpeg, or webp")
        filename = safe_name(entry_id, "") + extension
        target = _data_root() / "thumbnails" / filename
        size = 0
        with target.open("wb") as output:
            while True:
                chunk = await file_part.read_chunk()
                if not chunk:
                    break
                size += len(chunk)
                if size > 10 * 1024 * 1024:
                    output.close()
                    target.unlink(missing_ok=True)
                    raise web.HTTPRequestEntityTooLarge(max_size=10 * 1024 * 1024, actual_size=size)
                output.write(chunk)
        return web.json_response({"thumbnail": filename})

    @routes.get("/kemmy-prompt-library/thumbnail/{name}")
    async def get_thumbnail(request):
        try:
            name = safe_name(request.match_info["name"], "")
        except ValueError as error:
            raise web.HTTPBadRequest(text=str(error)) from error
        target = _data_root() / "thumbnails" / name
        if not target.is_file():
            raise web.HTTPNotFound()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        return web.FileResponse(target, headers={"Content-Type": content_type})
