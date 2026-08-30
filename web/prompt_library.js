import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const API_ROOT = "/kemmy-prompt-library";

const css = `
.dom-widget:has(> .opt-panel){background:transparent!important;border:0!important;box-shadow:none!important;outline:0!important}
.opt-panel{font:12px sans-serif;color:var(--input-text,#ddd);background:var(--comfy-input-bg,#222);padding:8px;border-radius:6px;box-sizing:border-box;width:100%;max-width:100%;overflow-x:hidden;overflow-y:auto;max-height:620px}
.opt-library-panel{height:620px;max-height:620px;overflow:hidden;display:flex;flex-direction:column}
.opt-toolbar,.opt-row-actions{display:flex;gap:5px;align-items:center;margin-bottom:6px;flex-wrap:wrap;min-width:0;max-width:100%}.opt-toolbar>*,.opt-row-actions>*{min-width:0;max-width:100%}
.opt-top-spacer{height:16px;min-height:16px;flex:none}
.opt-filter-bar{position:sticky;top:0;z-index:2;background:var(--comfy-input-bg,#222);padding:4px 0 6px}
.opt-filter-grid{display:grid;grid-template-columns:minmax(120px,1fr) minmax(90px,.6fr);gap:5px}
.opt-tabs{display:flex;gap:4px;overflow-x:auto;white-space:nowrap;padding:4px 0;scrollbar-width:thin}.opt-tab{flex:0 0 auto}.opt-tab-active{border-color:#6aa9ff!important;background:#17395d!important}
.opt-category-editor{border:1px solid #555;border-radius:6px;padding:7px;margin:6px 0}.opt-category-row{display:grid;grid-template-columns:minmax(100px,1fr) auto auto;gap:5px;align-items:center;margin:5px 0}
.opt-selection-summary{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:6px 0}.opt-selection-summary .opt-count{font-weight:700;flex:1}
.opt-selected-pane{flex:0 1 auto;max-height:190px;min-height:0;overflow:auto;border-bottom:1px solid #555;padding-bottom:6px}
.opt-library-pane{flex:1 1 auto;min-height:160px;overflow-x:hidden;overflow-y:auto;padding-top:4px}
.opt-panel button,.opt-panel input,.opt-panel select,.opt-panel textarea{font:inherit;color:inherit;background:#292929;border:1px solid #555;border-radius:4px;padding:4px;box-sizing:border-box}
.opt-panel button{cursor:pointer}.opt-panel button:hover{background:#3a3a3a}.opt-panel input[type=text],.opt-panel textarea,.opt-panel select{width:100%}
.opt-card{border:1px solid #555;border-radius:6px;padding:6px;margin:6px 0;background:#202020;max-width:100%;box-sizing:border-box}.opt-card-head{display:flex;gap:6px;align-items:center;min-width:0;max-width:100%;flex-wrap:wrap}.opt-card img,.opt-card-head>img{width:58px;height:58px;min-width:58px;object-fit:cover;border-radius:5px;background:#111}.opt-card textarea{min-height:58px;resize:vertical;margin-top:5px}.opt-muted{opacity:.7}.opt-selected{border-color:#6aa9ff;background:#17283c;box-shadow:inset 3px 0 #6aa9ff}.opt-title{font-weight:700;margin:5px 0}.opt-hidden{display:none!important}.opt-status{min-height:16px;color:#9dccff}.opt-assignment-select{width:auto!important;min-width:105px;max-width:135px}
`;

function ensureStyles() {
  if (document.getElementById("ordered-prompt-tools-style")) return;
  const style = document.createElement("style");
  style.id = "ordered-prompt-tools-style";
  style.textContent = css;
  document.head.appendChild(style);
}

function parseJSON(value, fallback) {
  try { return typeof value === "string" ? JSON.parse(value) : (value ?? fallback); }
  catch { return fallback; }
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() || `opt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findWidget(node, name) {
  return node.widgets?.find((widget) => widget.name === name);
}

function hideWidget(widget) {
  if (!widget) return;
  widget.hidden = true;
  widget.type = "hidden";
  widget.draw = () => {};
  widget.computeSize = () => [0, 0];
  widget.computeLayoutSize = () => ({ minHeight: 0, maxHeight: 0, minWidth: 0, maxWidth: 0 });
  widget.serializeValue = async () => widget.value;
}

function element(tag, properties = {}, children = []) {
  const item = document.createElement(tag);
  Object.assign(item, properties);
  for (const child of children) item.append(child);
  return item;
}

async function jsonRequest(url, options = {}) {
  const response = await api.fetchApi(url, options);
  if (!response.ok) throw new Error((await response.text()) || `${response.status}`);
  return response.json();
}

function addDomEditor(node, name, container, minHeight = 520) {
  const widgetMargin = 0;
  const syncWidth = () => {
    const width = Math.max(100, Number(node.size?.[0] || 0) - widgetMargin * 2);
    container.style.width = `${width}px`;
    container.style.maxWidth = `${width}px`;
    container.style.minWidth = "0";
  };
  const widget = node.addDOMWidget(name, "custom", container, {
    serialize: false,
    hideOnZoom: false,
    getValue: () => null,
    setValue: () => {},
    margin: widgetMargin,
    onDraw: syncWidth,
    afterResize: syncWidth,
  });
  syncWidth();
  container.style.setProperty("--comfy-widget-min-height", `${minHeight}px`);
  container.style.setProperty("--comfy-widget-height", `${minHeight}px`);
  widget.computeSize = () => [0, minHeight];
  node.setSize([node.size[0], Math.max(node.size[1], minHeight + 150)]);
  return widget;
}
function setupLibraryNode(node) {
  ensureStyles();
  const stateWidget = findWidget(node, "selection_json");
  const simpleCombineWidget = findWidget(node, "simple_combine");
  hideWidget(stateWidget);
  let state = parseJSON(stateWidget?.value, { selected_ids: [], snapshot: [] });
  state.selected_ids ||= [];
  state.snapshot ||= [];
  state.assignments ||= {};
  let library = { version: 2, categories: [], entries: [...state.snapshot] };

  const container = element("div", { className: "opt-panel opt-library-panel" });
  const topSpacer = element("div", { className: "opt-top-spacer" });
  const status = element("div", { className: "opt-status" });
  const selectedArea = element("div", { className: "opt-selected-pane" });
  const libraryArea = element("div", { className: "opt-library-pane" });
  let selectedCollapsed = false;
  const searchInput = element("input", { type: "text", placeholder: "Search name, category, or prompt" });
  let activeCategory = "all";
  const categoryTabs = element("div", { className: "opt-tabs" });
  const selectionFilter = element("select", {}, [
    element("option", { value: "all", textContent: "All presets" }),
    element("option", { value: "selected", textContent: "Selected only" }),
    element("option", { value: "unselected", textContent: "Unselected only" }),
  ]);
  const filterGrid = element("div", { className: "opt-filter-grid" }, [searchInput, selectionFilter]);
  const filterBar = element("div", { className: "opt-filter-bar" }, [filterGrid, categoryTabs]);
  searchInput.oninput = () => renderLibrary();
  selectionFilter.onchange = () => renderLibrary();

  function normalizeLibrary(data) {
    const entries = Array.isArray(data?.entries) ? data.entries : [];
    const defaults = ["Character", "Outfit", "Pose", "Style"];
    const configured = Array.isArray(data?.categories) ? data.categories : [];
    const categories = [];
    const addCategory = (value, defaultVisible = true) => {
      const item = typeof value === "string" ? { name: value, visible: defaultVisible } : value;
      const name = String(item?.name || "").trim();
      if (!name || categories.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
      categories.push({ name, visible: item?.visible !== false });
    };
    configured.forEach((category) => addCategory(category));
    if (!configured.length) defaults.forEach((name) => addCategory(name));
    entries.forEach((entry) => addCategory(entry.category || "Uncategorized"));
    return { version: 2, categories, entries };
  }
  library = normalizeLibrary(library);
  function isCharacterPreset(entry) {
    const category = String(entry?.category || "").trim().toLocaleLowerCase();
    return entry?.is_character === true || ["character", "characters", "character preset", "キャラ", "キャラクター", "人物"].includes(category);
  }
  function nextCharacterAssignment() {
    const used = new Set(Object.values(state.assignments || {}).map((value) => {
      const match = /^character_(\d+)$/.exec(String(value));
      return match ? Number(match[1]) : null;
    }).filter(Boolean));
    let number = 1;
    while (used.has(number)) number += 1;
    return `character_${number}`;
  }
  function ensureAssignments() {
    state.assignments ||= {};
    const byId = new Map(library.entries.map((entry) => [entry.id, entry]));
    state.selected_ids.forEach((id) => {
      if (state.assignments[id]) return;
      const entry = byId.get(id);
      state.assignments[id] = isCharacterPreset(entry) ? nextCharacterAssignment() : "shared";
    });
  }
  function setSelected(entry, selected) {
    state.assignments ||= {};
    if (selected) {
      if (!state.selected_ids.includes(entry.id)) state.selected_ids.push(entry.id);
      if (!state.assignments[entry.id]) state.assignments[entry.id] = isCharacterPreset(entry) ? nextCharacterAssignment() : "shared";
    } else {
      state.selected_ids = state.selected_ids.filter((id) => id !== entry.id);
      delete state.assignments[entry.id];
    }
  }
  function assignmentSelect(entry) {
    ensureAssignments();
    const assignedNumbers = Object.values(state.assignments).map((value) => {
      const match = /^character_(\d+)$/.exec(String(value));
      return match ? Number(match[1]) : 0;
    });
    const selectedCharacterCount = state.selected_ids.filter((id) => {
      const item = library.entries.find((entry) => entry.id === id);
      return isCharacterPreset(item);
    }).length;
    const maximum = Math.max(2, selectedCharacterCount, ...assignedNumbers) + 1;
    const groupingDisabled = simpleCombineWidget?.value === true;
    const select = element("select", { className: "opt-assignment-select", disabled: groupingDisabled, title: groupingDisabled ? "Character grouping is disabled while simple combination is enabled" : "Assign this preset to a character or to shared instructions" }, [
      element("option", { value: "shared", textContent: "Shared" }),
      ...Array.from({ length: maximum }, (_, index) => element("option", {
        value: `character_${index + 1}`,
        textContent: `Character ${index + 1}`,
      })),
    ]);
    select.value = state.assignments[entry.id] || "shared";
    select.onchange = () => { state.assignments[entry.id] = select.value; sync(); render(); };
    return select;
  }
  function sync() {
    ensureAssignments();
    const byId = new Map(library.entries.map((entry) => [entry.id, entry]));
    state.snapshot = state.selected_ids.map((id) => byId.get(id)).filter(Boolean);
    if (stateWidget) {
      stateWidget.value = JSON.stringify(state);
      stateWidget.callback?.(stateWidget.value);
    }
    node.graph?.setDirtyCanvas(true, true);
  }

  function selectedMove(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= state.selected_ids.length) return;
    [state.selected_ids[index], state.selected_ids[next]] = [state.selected_ids[next], state.selected_ids[index]];
    sync(); render();
  }

  function renderSelected() {
    selectedArea.replaceChildren();
    const summary = element("div", { className: "opt-selection-summary" }, [
      element("span", { className: "opt-count", textContent: `Selected: ${state.selected_ids.length}` }),
      element("button", { textContent: selectedCollapsed ? "Show selected" : "Hide selected", onclick: () => { selectedCollapsed = !selectedCollapsed; renderSelected(); } }),
      element("button", { textContent: "Clear all", disabled: !state.selected_ids.length, onclick: () => { state.selected_ids = []; state.assignments = {}; sync(); render(); } }),
    ]);
    selectedArea.append(summary);
    if (selectedCollapsed) return;

    selectedArea.append(element("div", { className: "opt-title", textContent: "Selected prompts (output order)" }));
    const byId = new Map(library.entries.map((entry) => [entry.id, entry]));
    state.selected_ids.forEach((id, index) => {
      const entry = byId.get(id);
      if (!entry) return;
      const row = element("div", { className: "opt-card-head" });
      const image = element("img", { src: thumbnailUrl(entry), alt: entry.name });
      if (!entry.thumbnail) image.style.display = "none";
      row.append(
        image,
        element("span", { textContent: `${index + 1}. ${entry.name}`, style: "flex:1" }),
        assignmentSelect(entry),
        element("button", { textContent: "↑", onclick: () => selectedMove(index, -1) }),
        element("button", { textContent: "↓", onclick: () => selectedMove(index, 1) }),
        element("button", { textContent: "Remove", onclick: () => { state.selected_ids.splice(index, 1); delete state.assignments[id]; sync(); render(); } }),
      );
      selectedArea.append(row);
    });
    if (!state.selected_ids.length) selectedArea.append(element("div", { className: "opt-muted", textContent: "No presets selected." }));
  }
  function thumbnailUrl(entry) {
    return entry.thumbnail ? api.apiURL(`${API_ROOT}/thumbnail/${encodeURIComponent(entry.thumbnail)}`) : "";
  }

  function editCategories() {
    library = normalizeLibrary(library);
    const editor = element("div", { className: "opt-category-editor" });
    editor.append(element("div", { className: "opt-title", textContent: "Category settings" }));
    const rows = element("div");
    const draft = library.categories.map((category) => ({ ...category, originalName: category.name }));
    const renderRows = () => {
      rows.replaceChildren();
      draft.forEach((category, index) => {
        const name = element("input", { type: "text", value: category.name, placeholder: "Category name" });
        const visible = element("input", { type: "checkbox", checked: category.visible !== false, title: "Show as a category tab" });
        const used = library.entries.some((entry) => (entry.category || "Uncategorized") === category.name);
        rows.append(element("div", { className: "opt-category-row" }, [
          name,
          element("label", { textContent: " Tab", title: "Show as a category tab" }, [visible]),
          element("button", { textContent: "Delete", disabled: used, title: used ? "This category is used by presets" : "Delete category", onclick: () => { draft.splice(index, 1); renderRows(); } }),
        ]));
        name.oninput = () => { category.name = name.value; };
        visible.onchange = () => { category.visible = visible.checked; };
      });
    };
    const newName = element("input", { type: "text", placeholder: "New category name", style: "flex:1" });
    const add = () => {
      const name = newName.value.trim();
      if (!name || draft.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
      draft.push({ name, visible: true }); newName.value = ""; renderRows();
    };
    const addRow = element("div", { className: "opt-toolbar" }, [newName, element("button", { textContent: "+ Add category", onclick: add })]);
    newName.onkeydown = (event) => { if (event.key === "Enter") { event.preventDefault(); add(); } };
    const actions = element("div", { className: "opt-toolbar" }, [
      element("button", { textContent: "Save categories", onclick: async () => {
        const cleaned = [];
        for (const category of draft) {
          const name = category.name.trim();
          if (!name || cleaned.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) continue;
          cleaned.push({ name, visible: category.visible !== false });
        }
        draft.forEach((category) => {
          const oldName = category.originalName;
          const newName = category.name.trim();
          if (!oldName || !newName || oldName === newName) return;
          library.entries.forEach((entry) => { if ((entry.category || "Uncategorized") === oldName) entry.category = newName; });
          if (activeCategory === oldName) activeCategory = newName;
        });
        library.categories = cleaned;
        await saveLibrary(); render(); status.textContent = "Categories saved";
      }}),
      element("button", { textContent: "Cancel", onclick: () => render() }),
    ]);
    renderRows(); editor.append(rows, addRow, actions); libraryArea.replaceChildren(editor);
  }

  function editEntry(entry = null) {
    const current = entry ? { ...entry, prompt: entry.prompt ?? entry.positive_prompt ?? "" } : { id: uuid(), name: "New preset", category: "Character", prompt: "", thumbnail: "", tags: [] };
    const card = element("div", { className: "opt-card" });
    const name = element("input", { type: "text", value: current.name, placeholder: "Name" });
    library = normalizeLibrary(library);
    const category = element("select", {}, library.categories.map((item) => element("option", { value: item.name, textContent: item.name })));
    category.value = current.category || library.categories[0]?.name || "Uncategorized";
    const prompt = element("textarea", { value: current.prompt || "", placeholder: "Prompt" });
    const file = element("input", { type: "file", accept: "image/png,image/jpeg,image/webp" });
    const characterFlag = element("input", { type: "checkbox", checked: isCharacterPreset(current) });
    const characterLabel = element("label", { textContent: " Treat as character", title: "Automatically assign this preset to its own character group when selected" }, [characterFlag]);
    const actions = element("div", { className: "opt-toolbar" });
    actions.append(
      element("button", { textContent: "Save preset", onclick: async () => {
        current.name = name.value.trim() || "Untitled";
        current.category = category.value.trim() || "Uncategorized";
        current.prompt = prompt.value;
        current.is_character = characterFlag.checked;
        if (file.files[0]) {
          const form = new FormData(); form.append("entry_id", current.id); form.append("file", file.files[0]);
          const uploaded = await jsonRequest(`${API_ROOT}/thumbnail`, { method: "POST", body: form });
          current.thumbnail = uploaded.thumbnail;
        }
        const index = library.entries.findIndex((item) => item.id === current.id);
        if (index >= 0) library.entries[index] = current; else library.entries.push(current);
        await saveLibrary(); sync(); render(); status.textContent = `Saved: ${current.name}`;
      }}),
      element("button", { textContent: "Cancel", onclick: () => render() }),
    );
    card.append(name, category, characterLabel, prompt, file, actions);
    libraryArea.replaceChildren(card);
  }

  async function saveLibrary() {
    library = normalizeLibrary(await jsonRequest(`${API_ROOT}/library`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(library) }));
  }

  function renderLibrary() {
    library = normalizeLibrary(library);
    const visibleCategories = library.categories.filter((category) => category.visible !== false);
    if (activeCategory !== "all" && !visibleCategories.some((category) => category.name === activeCategory)) activeCategory = "all";
    const tabs = [{ name: "all", label: "All" }, ...visibleCategories.map((category) => ({ name: category.name, label: category.name }))];
    categoryTabs.replaceChildren(...tabs.map((tab) => element("button", {
      textContent: tab.label,
      className: `opt-tab${activeCategory === tab.name ? " opt-tab-active" : ""}`,
      onclick: () => { activeCategory = tab.name; renderLibrary(); },
    })));

    const query = searchInput.value.trim().toLocaleLowerCase();
    const visibleEntries = library.entries.filter((entry) => {
      const chosen = state.selected_ids.includes(entry.id);
      const category = entry.category || "Uncategorized";
      const text = `${entry.name || ""}\n${category}\n${entry.prompt || entry.positive_prompt || ""}`.toLocaleLowerCase();
      if (query && !text.includes(query)) return false;
      if (activeCategory !== "all" && category !== activeCategory) return false;
      if (selectionFilter.value === "selected" && !chosen) return false;
      if (selectionFilter.value === "unselected" && chosen) return false;
      return true;
    });

    libraryArea.replaceChildren(element("div", { className: "opt-title", textContent: `Prompt library (${visibleEntries.length}/${library.entries.length})` }));
    for (const entry of visibleEntries) {
      const chosen = state.selected_ids.includes(entry.id);
      const image = element("img", { src: thumbnailUrl(entry), alt: entry.name });
      if (!entry.thumbnail) image.style.display = "none";
      const checkbox = element("input", { type: "checkbox", checked: chosen, onclick: (event) => event.stopPropagation(), onchange: () => {
        setSelected(entry, checkbox.checked);
        sync(); render();
      }});
      const card = element("div", { className: `opt-card${chosen ? " opt-selected" : ""}`, title: "Click card to select or unselect", onclick: (event) => {
        if (event.target.closest("button,input,textarea,select")) return;
        setSelected(entry, !state.selected_ids.includes(entry.id));
        sync(); render();
      }});
      const info = element("div", { style: "flex:1" }, [
        element("div", { textContent: entry.name, className: "opt-title" }),
        element("div", { textContent: entry.category || "Uncategorized", className: "opt-muted" }),
      ]);
      const head = element("div", { className: "opt-card-head" }, [checkbox, image, info]);
      const actions = element("div", { className: "opt-toolbar" }, [
        element("button", { textContent: "Edit", onclick: () => editEntry(entry) }),
        element("button", { textContent: "Duplicate", onclick: async () => { library.entries.push({ ...entry, id: uuid(), name: `${entry.name} copy`, thumbnail: "" }); await saveLibrary(); render(); } }),
        element("button", { textContent: "Delete", onclick: async () => { if (!confirm(`Delete ${entry.name}?`)) return; library.entries = library.entries.filter((item) => item.id !== entry.id); state.selected_ids = state.selected_ids.filter((id) => id !== entry.id); delete state.assignments[entry.id]; await saveLibrary(); sync(); render(); } }),
      ]);
      card.append(head, actions);
      libraryArea.append(card);
    }
    if (!visibleEntries.length) libraryArea.append(element("div", { className: "opt-muted", textContent: "No presets match the current filters." }));
  }
  function render() { renderSelected(); renderLibrary(); }
  const toolbar = element("div", { className: "opt-toolbar" }, [
    element("button", { textContent: "+ Add preset", onclick: () => editEntry() }),
    element("button", { textContent: "Categories", onclick: () => editCategories() }),
    element("button", { textContent: "Reload library", onclick: async () => { library = await jsonRequest(`${API_ROOT}/library`); sync(); render(); status.textContent = "Library reloaded"; } }),
  ]);
  container.append(topSpacer, toolbar, filterBar, status, selectedArea, libraryArea);
  addDomEditor(node, "prompt_library_editor", container, 560);
  if (simpleCombineWidget) {
    const originalSimpleCombineCallback = simpleCombineWidget.callback;
    simpleCombineWidget.callback = function () {
      originalSimpleCombineCallback?.apply(this, arguments);
      renderSelected();
    };
  }

  jsonRequest(`${API_ROOT}/library`).then((remote) => {
    const merged = new Map(state.snapshot.map((entry) => [entry.id, entry]));
    remote.entries.forEach((entry) => merged.set(entry.id, entry));
    library = normalizeLibrary({ ...remote, entries: [...merged.values()] }); sync(); render();
  }).catch((error) => { status.textContent = `Using workflow snapshot: ${error.message}`; render(); });
  render();
  // LiteGraph restores widgets_values after onNodeCreated. Re-read the canonical
  // hidden widget on the next task so a loaded workflow never falls back to defaults.
  setTimeout(() => {
    state = parseJSON(stateWidget?.value, state);
    state.selected_ids ||= [];
    state.snapshot ||= [];
  state.assignments ||= {};
    const merged = new Map(library.entries.map((entry) => [entry.id, entry]));
    state.snapshot.forEach((entry) => merged.set(entry.id, entry));
    library.entries = [...merged.values()];
    render();
  }, 0);
}


app.registerExtension({
  name: "KemmyPromptLibrary.Editor",
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData.name === "OPTPromptLibrarySelector") {
      const original = nodeType.prototype.onNodeCreated;
      nodeType.prototype.onNodeCreated = function () { original?.apply(this, arguments); setupLibraryNode(this); };
    }
  },
});
