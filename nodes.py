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
            },
            "optional": {
                "output_mode": (
                    ["grouped characters", "legacy combined"],
                    {"default": "grouped characters"},
                ),
            },
        }

    @staticmethod
    def _separator(mode):
        return {
            "comma + newline": ",\n",
            "newline": "\n",
            "comma": ", ",
            "BREAK": "\nBREAK\n",
        }.get(mode, ",\n")

    @staticmethod
    def _is_character(entry):
        category = _clean(entry.get("category")).casefold()
        return entry.get("is_character") is True or category in {
            "character",
            "characters",
            "character preset",
            "キャラ",
            "キャラクター",
            "人物",
        }

    def select(self, selection_json, separator, output_mode="grouped characters"):
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
        if output_mode == "legacy combined":
            return (joiner.join(value for value in prompts if value),)

        assignments = state.get("assignments", {}) if isinstance(state, dict) else {}
        if not isinstance(assignments, dict):
            assignments = {}
        groups, shared, used_groups = {}, [], set()
        next_group = 1
        for entry, prompt in zip(entries, prompts):
            if not prompt:
                continue
            assignment = _clean(assignments.get(str(entry.get("id")))).casefold()
            if assignment == "shared":
                group = None
            elif assignment.startswith("character_") and assignment[10:].isdigit():
                group = int(assignment[10:])
            elif self._is_character(entry):
                while next_group in used_groups:
                    next_group += 1
                group = next_group
                next_group += 1
            else:
                group = None
            if group is None:
                shared.append(prompt)
            else:
                used_groups.add(group)
                groups.setdefault(group, []).append(prompt)

        sections = [
            f"Character {group}:\n{joiner.join(groups[group])}"
            for group in sorted(groups)
        ]
        if shared:
            sections.append(f"Shared instructions:\n{joiner.join(shared)}")
        return ("\n\n".join(sections),)


NODE_CLASS_MAPPINGS = {
    "OPTPromptLibrarySelector": OPTPromptLibrarySelector,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "OPTPromptLibrarySelector": "cn_01_kemmy_Prompt Library Selector",
}
