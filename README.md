# cn_01_kemmy_ComfyUI-Prompt-Library

Save frequently used prompts as named presets, find them quickly, and combine multiple presets in a deliberate order inside ComfyUI.

This node is useful when you repeatedly reuse character descriptions, outfits, poses, items, styles, quality prompts, or other prompt fragments. Presets can include optional thumbnails and categories, so you do not have to keep copying text from external notes.

The node has no Python package dependencies.

<img width="318" height="656" alt="PLS01" src="https://github.com/user-attachments/assets/0588f133-aed9-4c9f-9346-14c50d4c4de9" /><img width="512" height="512" alt="rinFlanime_v14_t2i_hires_00103_" src="https://github.com/user-attachments/assets/c764a8b8-86d9-4977-aead-fde14b6cc5f0" />


## What it does

- Stores reusable prompt presets with a name, category, prompt text, and optional thumbnail.
- Includes category tabs such as `Character`, `Outfit`, `Pose`, and `Style` by default.
- Lets you create, rename, hide, and delete unused categories.
- Searches preset names, categories, and prompt contents.
- Filters the list to all, selected, or unselected presets.
- Selects multiple presets and lets you control their output order.
- Keeps multiple characters separate with `Character 1`, `Character 2`, and `Shared` assignments.
- Assigns outfits, poses, items, and other presets to a specific character.
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
9. For multiple characters, assign each selected preset to `Character 1`, `Character 2`, or `Shared`.
10. Connect the `prompt` output to any node that accepts `STRING`.

<img width="395" height="806" alt="PLS02" src="https://github.com/user-attachments/assets/3a1a7ed7-68c4-46c0-9f30-554cf981a753" />

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

## Multiple characters and assignments

By default, character grouping is active. Leave `simple_combine` unchecked when a prompt contains more than one character.

Every selected preset has an assignment selector in **Selected prompts (output order)**:

- `Character 1`, `Character 2`, and so on place that preset inside a specific character block;
- `Shared` places it under instructions that apply to the whole image.

Presets in the `Character`, `Characters`, `キャラ`, `キャラクター`, or `人物` categories are automatically assigned to separate character numbers when selected. You can also enable **Treat as character** while editing any preset. The assignment can always be changed manually afterward.

For example:

```text
Alice character preset       -> Character 1
Red dress outfit             -> Character 1
Bob character preset         -> Character 2
School uniform outfit        -> Character 2
Standing side by side pose   -> Shared
Classroom background         -> Shared
```

produces:

```text
Character 1:
Alice character description,
red dress

Character 2:
Bob character description,
school uniform

Shared instructions:
standing side by side,
classroom background
```

This structured text is particularly useful before an Ollama or other LLM node because the model can tell which appearance, outfit, item, or pose belongs to which person. It also gives Anima's text encoder clearer character boundaries than one undifferentiated tag list.

Check `simple_combine` when you want all selected prompts joined into one unlabelled string in selection order. While it is checked, the `Character 1 / Character 2 / Shared` assignment selectors are disabled because those assignments are not used.

Assignments and the `Treat as character` flag are stored in workflow snapshots. Older presets remain compatible; recognized character categories are detected automatically.

> Screenshot placeholder: selected presets assigned to Character 1, Character 2, and Shared.
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

<img width="395" height="801" alt="PLS03" src="https://github.com/user-attachments/assets/23429138-771b-4460-a30a-935c9f95611d" />

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
