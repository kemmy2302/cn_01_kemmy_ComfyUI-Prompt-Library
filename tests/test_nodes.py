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


    def test_anima_character_clauses_keep_character_content_together(self):
        state = {
            "selected_ids": ["a", "outfit-a", "b", "outfit-b", "scene"],
            "assignments": {
                "a": "character_1",
                "outfit-a": "character_1",
                "b": "character_2",
                "outfit-b": "character_2",
                "scene": "shared",
            },
            "snapshot": [
                {"id": "a", "prompt": "a girl, black hair,"},
                {"id": "outfit-a", "prompt": "black kimono"},
                {"id": "b", "prompt": "a boy, white hair"},
                {"id": "outfit-b", "prompt": "school uniform."},
                {"id": "scene", "prompt": "classroom, standing side by side"},
            ],
        }
        result = OPTPromptLibrarySelector().select(
            json.dumps(state), "comma", False, True
        )
        self.assertEqual(
            result,
            (
                "(chara1 is a girl, black hair, black kimono.),\n"
                "(chara2 is a boy, white hair, school uniform.),\n"
                "classroom, standing side by side",
            ),
        )

    def test_anima_character_clauses_take_priority_over_simple_combine(self):
        state = {
            "selected_ids": ["a"],
            "assignments": {"a": "character_1"},
            "snapshot": [{"id": "a", "prompt": "a girl"}],
        }
        result = OPTPromptLibrarySelector().select(
            json.dumps(state), "comma", True, True
        )
        self.assertEqual(result, ("(chara1 is a girl.),",))

    def test_anima_character_clauses_with_shared_only(self):
        state = {
            "selected_ids": ["scene"],
            "assignments": {"scene": "shared"},
            "snapshot": [{"id": "scene", "prompt": "classroom"}],
        }
        result = OPTPromptLibrarySelector().select(
            json.dumps(state), "comma", False, True
        )
        self.assertEqual(result, ("classroom",))

if __name__ == "__main__":
    unittest.main()