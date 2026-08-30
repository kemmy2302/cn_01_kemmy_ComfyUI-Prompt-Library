import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nodes import OPTPromptLibrarySelector


class PromptLibrarySelectorTests(unittest.TestCase):
    def test_simple_combine_keeps_selection_order(self):
        state = {
            "selected_ids": ["b", "a"],
            "snapshot": [
                {"id": "a", "name": "Alice", "prompt": "alice"},
                {"id": "b", "name": "Bob", "prompt": "bob"},
            ],
        }
        result = OPTPromptLibrarySelector().select(
            json.dumps(state), "newline", True
        )
        self.assertEqual(result, ("bob\nalice",))

    def test_character_category_automatically_separates_characters(self):
        state = {
            "selected_ids": ["a", "b"],
            "snapshot": [
                {"id": "a", "name": "Alice", "category": "Character", "prompt": "Alice has blonde hair."},
                {"id": "b", "name": "Bob", "category": "Character", "prompt": "Bob has black hair."},
            ],
        }
        result = OPTPromptLibrarySelector().select(json.dumps(state), "newline")
        self.assertEqual(
            result,
            (
                "Character 1:\nAlice has blonde hair.\n\n"
                "Character 2:\nBob has black hair.",
            ),
        )

    def test_assignments_bind_outfit_to_character_and_keep_style_shared(self):
        state = {
            "selected_ids": ["a", "outfit", "b", "style"],
            "assignments": {
                "a": "character_1",
                "outfit": "character_1",
                "b": "character_2",
                "style": "shared",
            },
            "snapshot": [
                {"id": "a", "category": "Character", "prompt": "Alice"},
                {"id": "outfit", "category": "Outfit", "prompt": "red dress"},
                {"id": "b", "category": "Character", "prompt": "Bob"},
                {"id": "style", "category": "Style", "prompt": "watercolor"},
            ],
        }
        result = OPTPromptLibrarySelector().select(
            json.dumps(state), "comma + newline"
        )
        self.assertEqual(
            result,
            (
                "Character 1:\nAlice,\nred dress\n\n"
                "Character 2:\nBob\n\n"
                "Shared instructions:\nwatercolor",
            ),
        )

    def test_japanese_character_category_is_detected(self):
        state = {
            "selected_ids": ["a"],
            "snapshot": [
                {"id": "a", "category": "キャラクター", "prompt": "Alice"},
            ],
        }
        result = OPTPromptLibrarySelector().select(json.dumps(state), "newline")
        self.assertEqual(result, ("Character 1:\nAlice",))

    def test_character_can_be_explicitly_assigned_to_shared(self):
        state = {
            "selected_ids": ["a"],
            "assignments": {"a": "shared"},
            "snapshot": [
                {"id": "a", "category": "Character", "prompt": "Alice"},
            ],
        }
        result = OPTPromptLibrarySelector().select(json.dumps(state), "newline")
        self.assertEqual(result, ("Shared instructions:\nAlice",))


if __name__ == "__main__":
    unittest.main()