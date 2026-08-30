# cn_01_kemmy_ComfyUI-Prompt-Library

Save frequently used prompts as named presets, find them quickly, and combine multiple presets in a deliberate order inside ComfyUI.

This node is useful when you repeatedly reuse character descriptions, outfits, poses, items, styles, quality prompts, or other prompt fragments. Presets can include optional thumbnails and categories, so you do not have to keep copying text from external notes.

The node has no Python package dependencies.

> Screenshot placeholder: full Prompt Library node with several presets selected.

## What it does

- Stores reusable prompt presets with a name, category, prompt text, and optional thumbnail.
- Includes category tabs such as `Character`, `Outfit`, `Pose`, and `Style` by default.
- Lets you create, rename, hide, and delete unused categories.
- Searches preset names, categories, and prompt contents.
- Filters the list to all, selected, or unselected presets.
- Selects multiple presets and lets you control their output order.
- Combines the selected presets into one standard ComfyUI `STRING` output.
- Keeps the selected area visible while the main library scrolls separately.
- Saves a snapshot of selected prompt text in the workflow for portability.

## Installation

### Git

Open a terminal in `ComfyUI/custom_nodes` and run:

```bash
git clone https://github.com/kemmy2302/cn_01_kemmy_ComfyUI-Prompt-Library.git
```

Restart ComfyUI after cloning.

### ZIP

1. Download this repository with **Code > Download ZIP**.
2. Extract it into `ComfyUI/custom_nodes`.
3. Make sure the final path is similar to:

   ```text
   ComfyUI/custom_nodes/cn_01_kemmy_ComfyUI-Prompt-Library/__init__.py
   ```

4. Restart ComfyUI.

## Finding the node

In ComfyUI, add:

```text
Ordered Prompt Tools
└── cn_01_kemmy_Prompt Library Selector
```

If the node does not appear, restart the ComfyUI backend, not only the browser page. After restarting, refresh the browser with `Ctrl+F5`.

## Quick start

1. Add `cn_01_kemmy_Prompt Library Selector` to your workflow.
2. Click **+ Add preset**.
3. Enter a preset name.
4. Choose a category.
5. Enter the reusable prompt text.
6. Optionally choose a PNG, JPG, JPEG, or WebP thumbnail.
7. Click **Save preset**.
8. Select one or more preset cards.
9. Connect the `prompt` output to any node that accepts `STRING`.

> Screenshot placeholder: Add preset editor with name, category, prompt, and thumbnail fields.

## Selecting and ordering prompts

Click a preset card or its checkbox to select it. Selected presets appear in **Selected prompts (output order)**.

The order shown in this area is the exact order used in the combined output. Use the up and down buttons to change it. Use **Remove** to remove one selection or **Clear all** to clear the selection without deleting presets.

For example, selecting these presets:

```text
1. Character - Alice
2. Outfit - School uniform
3. Style - Watercolor
```

can produce:

```text
1girl, Alice, long blonde hair,
school uniform, pleated skirt,
watercolor painting, soft colors
```

The exact separator is controlled by the `separator` widget.

| Separator | Result between presets |
|---|---|
| `comma + newline` | comma followed by a line break |
| `newline` | line break only |
| `comma` | comma and space |
| `BREAK` | `BREAK` on its own line |

## Categories and tabs

Click **Categories** to manage category names.

- **+ Add category** registers a reusable category name.
- The **Tab** checkbox controls whether that category is always shown as a tab.
- Renaming a category also updates presets that use it.
- A category currently used by a preset cannot be deleted.
- Category tabs scroll horizontally when the node is narrow.

The default categories are:

```text
Character
Outfit
Pose
Style
```

Categories are selected from a list when editing presets, which helps avoid spelling differences and duplicate category names.

> Screenshot placeholder: category settings and horizontally scrollable category tabs.

## Search and filters

The search box matches:

- preset name;
- category name;
- prompt text.

The selection filter supports:

- **All presets**;
- **Selected only**;
- **Unselected only**.

Selected cards are highlighted, and the selected count remains visible above the independently scrolling library.

## Editing presets and thumbnails

Each preset provides:

- **Edit**: change its name, category, prompt, or thumbnail;
- **Duplicate**: copy the preset under a new ID;
- **Delete**: permanently delete the preset after confirmation.

Supported thumbnail formats are PNG, JPG, JPEG, and WebP. The maximum upload size is 10 MB.

## Connecting the output

The node outputs a normal ComfyUI `STRING`, so it is not limited to a specific workflow or model.

Common connections include:

```text
Prompt Library -> CLIP Text Encode (text)
Prompt Library -> Sequential Prompt List (prefix_prompt or suffix_prompt)
Prompt Library -> Ollama / LLM prompt input
Prompt Library -> another text-combining node
```

It can be used for positive prompts, negative prompts, characters, styles, or any other text. The output name is intentionally the generic name `prompt`.

## Workflow snapshots

The node stores a snapshot of the currently selected presets inside the ComfyUI workflow. This allows the selected prompt text to survive when a workflow is opened on another installation that does not yet have those presets in its local library.

The complete library and thumbnail collection are not embedded in every workflow. Back up the data directory below if you want to move the whole library to another computer.

## Data storage and backup

Runtime data is stored outside the plugin directory:

```text
ComfyUI/user/ordered_prompt_tools/
├── library.json
└── thumbnails/
```

This means updating or replacing the custom-node repository does not normally delete your presets.

To back up the library, copy both `library.json` and the `thumbnails` directory. The exact `ComfyUI/user` location can differ if ComfyUI was launched with a custom user directory.

Existing data created by the earlier combined Ordered Prompt Tools package remains compatible.

## Updating

From the repository directory:

```bash
git pull
```

Restart ComfyUI and refresh the browser with `Ctrl+F5` after updating frontend files.

## Troubleshooting

### The node is missing

- Confirm the repository is directly inside `ComfyUI/custom_nodes`.
- Confirm `__init__.py` is not nested inside an extra ZIP folder.
- Restart the ComfyUI backend and check its startup log for import errors.

### The editor does not update or looks incorrect

- Refresh the browser with `Ctrl+F5` to clear cached JavaScript.
- Make sure only one copy of this custom node is installed.

### A preset exists but is hard to find

- Switch to the **All** tab.
- Set the filter to **All presets**.
- Clear the search field.
- Click **Reload library** if the file was edited outside ComfyUI.

### The workflow works but the thumbnail is missing on another computer

Prompt snapshots preserve selected text, but thumbnail files remain in the local data directory. Copy the `thumbnails` directory when moving the full library.

## License

MIT