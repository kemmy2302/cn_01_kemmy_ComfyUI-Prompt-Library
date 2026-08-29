import json
import uuid


def _clean(value):
    return str(value or "").strip()


def _join_prompt(*parts):
    return "\n".join(part for part in (_clean(value) for value in parts) if part)


def _parse_json(raw, fallback):
    if isinstance(raw, (dict, list)):
        return raw
    try:
        return json.loads(str(raw or ""))
    except (TypeError, ValueError, json.JSONDecodeError):
        return fallback


class OPTPromptLibrarySelector:
    """Combine an ordered multi-selection of prompt-library snapshots."""

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("prompt",)
    FUNCTION = "select"
    CATEGORY = "Ordered Prompt Tools"
    DESCRIPTION = "Select and combine multiple thumbnail-backed prompt presets in order."

    @classmethod
    def INPUT_TYPES(cls):
        default = json.dumps(
            {"selected_ids": [], "snapshot": []}, ensure_ascii=False
        )
        return {
            "required": {
                "selection_json": (
                    "STRING",
                    {"default": default, "multiline": True, "dynamicPrompts": False},
                ),
                "separator": (
                    ["comma + newline", "newline", "comma", "BREAK"],
                    {"default": "comma + newline"},
                ),
            }
        }

    @staticmethod
    def _separator(mode):
        return {
            "comma + newline": ",\n",
            "newline": "\n",
            "comma": ", ",
            "BREAK": "\nBREAK\n",
        }.get(mode, ",\n")

    def select(self, selection_json, separator):
        state = _parse_json(selection_json, {})
        snapshots = state.get("snapshot", []) if isinstance(state, dict) else []
        selected_ids = state.get("selected_ids", []) if isinstance(state, dict) else []
        by_id = {
            str(entry.get("id")): entry
            for entry in snapshots
            if isinstance(entry, dict) and entry.get("id")
        }
        entries = [by_id[item_id] for item_id in selected_ids if item_id in by_id]
        joiner = self._separator(separator)
        prompts = [
            _clean(entry.get("prompt", entry.get("positive_prompt", "")))
            for entry in entries
        ]
        return (joiner.join(value for value in prompts if value),)



NODE_CLASS_MAPPINGS = {
    "OPTPromptLibrarySelector": OPTPromptLibrarySelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OPTPromptLibrarySelector": "cn_01_kemmy_Prompt Library Selector",
}
