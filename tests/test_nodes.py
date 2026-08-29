import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nodes import OPTPromptLibrarySelector


class PromptLibrarySelectorTests(unittest.TestCase):
    def test_ordered_multi_selection(self):
        state = {
            "selected_ids": ["b", "a"],
            "snapshot": [
                {"id": "a", "name": "Alice", "prompt": "alice"},
                {"id": "b", "name": "Bob", "prompt": "bob"},
            ],
        }
        result = OPTPromptLibrarySelector().select(json.dumps(state), "newline")
        self.assertEqual(result, ("bob\nalice",))


if __name__ == "__main__":
    unittest.main()
