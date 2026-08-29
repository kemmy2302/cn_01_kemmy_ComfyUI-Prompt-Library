# cn_01_kemmy_ComfyUI-Prompt-Library

A dependency-free ComfyUI custom node for storing, finding, selecting, and combining reusable prompt presets.

## Features

- Thumbnail-backed prompt presets stored outside the plugin.
- Registered categories with configurable, horizontally scrollable tabs.
- Search by preset name, category, or prompt text.
- Filter by selected or unselected state.
- Multi-selection with explicit output order.
- Independent selected-prompt and library scrolling areas.
- One combined `STRING` output compatible with standard ComfyUI text inputs.
- Workflow snapshots preserve selected prompts when sharing workflows.

## Installation

Clone into `ComfyUI/custom_nodes`, then restart ComfyUI.

```bash
git clone https://github.com/kemmy2302/cn_01_kemmy_ComfyUI-Prompt-Library.git
```

The node appears as `cn_01_kemmy_Prompt Library Selector` under `Ordered Prompt Tools`.

## Storage

Runtime data is stored in:

```text
ComfyUI/user/ordered_prompt_tools/
├── library.json
└── thumbnails/
```

Existing data created by the combined Ordered Prompt Tools package remains compatible.

## License

MIT
