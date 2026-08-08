/**
 * State Manager - Central Store, Undo/Redo Engine & Firebase Auto-Save
 */

class AppState {
  constructor() {
    this.currentMap = {
      id: `map_${Date.now()}`,
      title: 'Sơ đồ tư duy mới',
      theme: 'midnight',
      layout: 'radial',
      root: MindmapTree.createDefaultRoot('Sơ đồ tư duy mới'),
      crossLinks: []
    };

    this.openTabs = [];
    this.selectedNodeId = null;
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 40;
    this.autoSaveDebounceTimer = null;

    // Lắng nghe trạng thái Cloud Sync
    if (window.firebaseClient) {
      window.firebaseClient.onSyncStatusChange((status, text) => {
        if (window.uiController) {
          window.uiController.updateCloudStatus(status, text);
        }
      });
    }
  }

  // Khởi tạo state ban đầu
  async init() {
    this.loadTabsFromStorage();

    // Thử load mindmap gần nhất từ LocalStorage hoặc Cloud
    const lastActiveId = localStorage.getItem('last_active_mindmap_id');
    if (lastActiveId) {
      await this.loadMapById(lastActiveId, false);
    } else {
      this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
      this.pushSnapshot();
      this.render();
    }

    window.uiController?.renderTabs();
  }

  // --- TABS & MULTI-MINDMAP FILES MANAGEMENT ---

  loadTabsFromStorage() {
    try {
      const stored = localStorage.getItem('mindflow_open_tabs');
      if (stored) {
        this.openTabs = JSON.parse(stored);
      }
    } catch (e) {
      this.openTabs = [];
    }
  }

  saveTabsToStorage() {
    localStorage.setItem('mindflow_open_tabs', JSON.stringify(this.openTabs));
    window.uiController?.renderTabs();
  }

  addOrUpdateTab(id, title) {
    if (!id) return;
    const existing = this.openTabs.find(t => t.id === id);
    if (existing) {
      existing.title = title || existing.title;
    } else {
      this.openTabs.push({ id, title: title || 'Sơ đồ' });
    }
    this.saveTabsToStorage();
  }

  closeTab(mapId, event) {
    if (event) event.stopPropagation();
    this.openTabs = this.openTabs.filter(t => t.id !== mapId);
    this.saveTabsToStorage();

    // Nếu tab vừa đóng là tab đang active
    if (this.currentMap.id === mapId) {
      if (this.openTabs.length > 0) {
        const nextTab = this.openTabs[this.openTabs.length - 1];
        this.loadMapById(nextTab.id, false);
      } else {
        // Nếu đóng hết tab thì tạo 1 tab mới
        this.createNewMap({ title: 'Sơ đồ tư duy mới' });
      }
    }
  }

  // --- UNDO / REDO SNAPSHOTS ---

  pushSnapshot() {
    const snapshot = JSON.stringify(this.currentMap);
    // Tránh push snapshot trùng lặp liên tiếp
    if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === snapshot) {
      return;
    }
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo on new action
  }

  undo() {
    if (this.undoStack.length <= 1) {
      window.uiController?.showToast('Không có thao tác nào để hoàn tác', 'info');
      return;
    }
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const previous = this.undoStack[this.undoStack.length - 1];
    if (previous) {
      this.currentMap = JSON.parse(previous);
      this.render();
      this.scheduleAutoSave();
      window.uiController?.showToast('Đã hoàn tác (Undo)', 'info');
    }
  }

  redo() {
    if (this.redoStack.length === 0) {
      window.uiController?.showToast('Không có thao tác nào để làm lại', 'info');
      return;
    }
    const next = this.redoStack.pop();
    this.undoStack.push(next);
    this.currentMap = JSON.parse(next);
    this.render();
    this.scheduleAutoSave();
    window.uiController?.showToast('Đã làm lại (Redo)', 'info');
  }

  // --- NODE MUTATIONS ---

  setSelectedNode(nodeId) {
    this.selectedNodeId = nodeId;
    window.mindmapRenderer.render(this.currentMap, this.selectedNodeId);
    window.uiController?.updateNodeToolbar(this.selectedNodeId);
  }

  addChildNode(parentId) {
    this.pushSnapshot();
    const newNode = MindmapTree.addChild(this.currentMap.root, parentId, 'Ý con mới');
    if (newNode) {
      this.render();
      this.scheduleAutoSave();
      return newNode;
    }
    return null;
  }

  addSiblingNode(targetId) {
    if (!targetId) return null;
    // Nếu đang chọn nút gốc mà bấm Enter, tự động tạo nhánh chính mới
    if (targetId === this.currentMap.root.id) {
      return this.addChildNode(targetId);
    }
    this.pushSnapshot();
    const newNode = MindmapTree.addSibling(this.currentMap.root, targetId, 'Ý mới');
    if (newNode) {
      this.render();
      this.scheduleAutoSave();
      return newNode;
    }
    return null;
  }

  deleteSelectedNode() {
    if (!this.selectedNodeId) return;

    // Cho phép xóa / đặt lại nút gốc (Root node)
    if (this.selectedNodeId === this.currentMap.root.id) {
      this.pushSnapshot();
      const newRoot = MindmapTree.createBlankRoot('Chủ đề chính');
      this.currentMap.root = newRoot;
      this.currentMap.title = 'Chủ đề chính';
      this.currentMap.crossLinks = [];
      if (window.uiController?.mapTitleInput) {
        window.uiController.mapTitleInput.value = 'Chủ đề chính';
      }
      this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
      this.setSelectedNode(newRoot.id);
      this.render();
      this.scheduleAutoSave();
      window.mindmapRenderer.centerRoot();
      setTimeout(() => {
        window.interactionManager?.startNodeEdit(newRoot.id, true);
      }, 50);
      window.uiController?.showToast('Đã xóa sơ đồ và đặt lại nút gốc (Ctrl+Z để hoàn tác)', 'info');
      return;
    }

    this.pushSnapshot();
    const parent = MindmapTree.findParent(this.currentMap.root, this.selectedNodeId);
    const success = MindmapTree.deleteNode(this.currentMap.root, this.selectedNodeId);
    if (success) {
      this.setSelectedNode(parent ? parent.id : null);
      this.render();
      this.scheduleAutoSave();
      window.uiController?.showToast('Đã xóa nhánh', 'info');
    }
  }

  updateNodeText(nodeId, text) {
    const node = MindmapTree.findNode(this.currentMap.root, nodeId);
    if (node && node.text !== text) {
      this.pushSnapshot();
      node.text = text;
      // Nếu là root node thì cập nhật ngay tiêu đề map và thanh tab
      if (nodeId === this.currentMap.root.id) {
        this.currentMap.title = text;
        if (window.uiController?.mapTitleInput) {
          window.uiController.mapTitleInput.value = text;
        }
        this.addOrUpdateTab(this.currentMap.id, text);
      }
      this.render();
      this.scheduleAutoSave();
    }
  }

  updateNodeProperties(nodeId, properties = {}) {
    const node = MindmapTree.findNode(this.currentMap.root, nodeId);
    if (node) {
      this.pushSnapshot();
      Object.assign(node, properties);
      this.render();
      this.scheduleAutoSave();
    }
  }

  toggleNodeChecked(nodeId) {
    const node = MindmapTree.findNode(this.currentMap.root, nodeId);
    if (node && node.checked !== null && node.checked !== undefined) {
      this.pushSnapshot();
      node.checked = !node.checked;
      this.render();
      this.scheduleAutoSave();
    }
  }

  toggleNodeCollapse(nodeId) {
    const node = MindmapTree.findNode(this.currentMap.root, nodeId);
    if (node) {
      MindmapTree.toggleCollapse(node);
      this.render();
      this.scheduleAutoSave();
    }
  }

  reparentNode(nodeId, newParentId) {
    this.pushSnapshot();
    const success = MindmapTree.reparentNode(this.currentMap.root, nodeId, newParentId);
    if (success) {
      this.render();
      this.scheduleAutoSave();
      window.uiController?.showToast('Đã di chuyển nhánh sang cha mới', 'success');
    }
  }

  moveNodeOffset(nodeId, dx, dy) {
    if (!nodeId) return;
    const node = MindmapTree.findNode(this.currentMap.root, nodeId);
    if (node) {
      this.pushSnapshot();
      node.offsetX = (node.offsetX || 0) + Math.round(dx);
      node.offsetY = (node.offsetY || 0) + Math.round(dy);
      this.render();
      this.scheduleAutoSave();
    }
  }

  // --- NODE COMMENTS MANAGEMENT ---

  addNodeComment(nodeId, text, author, translation = '') {
    if (!nodeId || (!text && !translation)) return null;
    this.pushSnapshot();
    const comment = MindmapTree.addComment(this.currentMap.root, nodeId, {
      text: (text || '').trim(),
      translation: (translation || '').trim(),
      author: author || 'Bạn'
    });
    if (comment) {
      this.render();
      this.scheduleAutoSave();
      window.uiController?.renderCommentsDrawer(nodeId);
      window.uiController?.showToast('Đã thêm bình luận mới', 'success');
    }
    return comment;
  }

  updateNodeComment(nodeId, commentId, updateDataOrText) {
    if (!nodeId || !commentId) return null;
    this.pushSnapshot();
    const updated = MindmapTree.updateComment(this.currentMap.root, nodeId, commentId, updateDataOrText);
    if (updated) {
      this.render();
      this.scheduleAutoSave();
      window.uiController?.renderCommentsDrawer(nodeId);
      window.uiController?.showToast('Đã lưu thay đổi bình luận', 'success');
    }
    return updated;
  }

  deleteNodeComment(nodeId, commentId) {
    if (!nodeId || !commentId) return;
    this.pushSnapshot();
    const success = MindmapTree.deleteComment(this.currentMap.root, nodeId, commentId);
    if (success) {
      this.render();
      this.scheduleAutoSave();
      window.uiController?.renderCommentsDrawer(nodeId);
      window.uiController?.showToast('Đã xóa bình luận', 'info');
    }
  }

  openCommentsDrawer(nodeId) {
    const id = nodeId || this.selectedNodeId;
    if (!id) {
      window.uiController?.showToast('Vui lòng chọn một nhánh để xem bình luận', 'warning');
      return;
    }
    this.setSelectedNode(id);
    window.uiController?.openCommentsDrawer(id);
  }

  resetAllNodeOffsets() {
    this.pushSnapshot();
    const clearOffsets = (node) => {
      delete node.offsetX;
      delete node.offsetY;
      if (node.children) node.children.forEach(clearOffsets);
    };
    clearOffsets(this.currentMap.root);
    this.render();
    this.scheduleAutoSave();
    window.uiController?.showToast('Đã sắp xếp lại vị trí tự động', 'info');
  }

  replaceRootFromOutline(newRoot) {
    this.pushSnapshot();
    this.currentMap.root = newRoot;
    this.currentMap.title = newRoot.text || this.currentMap.title;
    if (window.uiController?.mapTitleInput) {
      window.uiController.mapTitleInput.value = this.currentMap.title;
    }
    this.render(false); // don't update outline editor back to avoid input jitter
    this.scheduleAutoSave();
  }

  // --- MAP LEVEL PROPERTIES ---

  setTheme(themeName) {
    this.currentMap.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    window.uiController?.updateThemeUI(themeName);
    this.render();
    this.scheduleAutoSave();
    const themeDisplay = themeName === 'minimal-light' ? 'Sáng (Light)' : (themeName === 'midnight' ? 'Tối (Midnight)' : themeName);
    window.uiController?.showToast(`Đã chuyển sang giao diện: ${themeDisplay}`, 'info');
  }

  setLayout(layoutName) {
    this.currentMap.layout = layoutName;
    this.render();
    this.scheduleAutoSave();
    window.mindmapRenderer.centerRoot();
  }

  updateMapTitle(title) {
    this.currentMap.title = title || 'Sơ đồ tư duy mới';
    if (this.currentMap.root) {
      this.currentMap.root.text = this.currentMap.title;
    }
    this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
    this.render();
    this.scheduleAutoSave();
  }

  // --- MAP LOADING & CREATION ---

  createNewMap({ title = 'Sơ đồ tư duy mới', templateId = 'blank', layout = 'radial', theme = 'midnight' } = {}) {
    let newRoot = null;
    if (templateId && templateId !== 'blank') {
      const tpl = window.MINDMAP_TEMPLATES?.find(t => t.id === templateId);
      if (tpl && tpl.root) {
        newRoot = MindmapTree.cloneTree(tpl.root);
        if (title) newRoot.text = title;
      }
    }

    if (!newRoot) {
      newRoot = MindmapTree.createDefaultRoot(title || 'Sơ đồ tư duy mới');
    }

    const newMapId = `map_${Date.now()}`;
    this.pushSnapshot();
    this.currentMap = {
      id: newMapId,
      title: title || newRoot.text || 'Sơ đồ tư duy mới',
      theme: theme || 'midnight',
      layout: layout || 'radial',
      root: newRoot,
      crossLinks: []
    };

    this.selectedNodeId = null;
    this.undoStack = [JSON.stringify(this.currentMap)];
    this.redoStack = [];

    this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
    this.applyCurrentMapProperties();
    this.render();
    this.saveCurrentMap(); // Lưu ngay lên Firebase Cloud
    window.mindmapRenderer.centerRoot();
    window.uiController?.showToast(`Đã tạo sơ đồ mới: "${this.currentMap.title}"`, 'success');
  }

  async duplicateMap(targetMapId = null) {
    let sourceMap = this.currentMap;
    if (targetMapId && targetMapId !== this.currentMap.id) {
      const fetched = await window.firebaseClient.getMindmap(targetMapId);
      if (fetched) sourceMap = fetched;
    }

    const duplicatedRoot = MindmapTree.cloneTree(sourceMap.root);
    const newTitle = `${sourceMap.title || 'Sơ đồ'} (Bản sao)`;
    duplicatedRoot.text = newTitle;

    const duplicatedMap = {
      id: `map_${Date.now()}`,
      title: newTitle,
      theme: sourceMap.theme || 'midnight',
      layout: sourceMap.layout || 'radial',
      root: duplicatedRoot,
      crossLinks: JSON.parse(JSON.stringify(sourceMap.crossLinks || []))
    };

    this.pushSnapshot();
    this.currentMap = duplicatedMap;
    this.selectedNodeId = null;
    this.undoStack = [JSON.stringify(this.currentMap)];
    this.redoStack = [];

    this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
    this.applyCurrentMapProperties();
    this.render();
    this.saveCurrentMap(); // Lưu ngay vào Firebase
    window.mindmapRenderer.centerRoot();
    window.uiController?.showToast(`Đã nhân bản sơ đồ thành công!`, 'success');
  }

  loadMindmap(mindmapData) {
    this.currentMap = {
      id: mindmapData.id || `map_${Date.now()}`,
      title: mindmapData.title || mindmapData.root?.text || 'Sơ đồ tư duy',
      theme: mindmapData.theme || 'midnight',
      layout: mindmapData.layout || 'radial',
      root: mindmapData.root || MindmapTree.createDefaultRoot(),
      crossLinks: mindmapData.crossLinks || []
    };
    this.selectedNodeId = null;
    this.undoStack = [JSON.stringify(this.currentMap)];
    this.redoStack = [];

    this.addOrUpdateTab(this.currentMap.id, this.currentMap.title);
    this.applyCurrentMapProperties();
    this.render();
    this.scheduleAutoSave();
    window.mindmapRenderer.centerRoot();
  }

  async loadMapById(id, showNotice = true) {
    const data = await window.firebaseClient.getMindmap(id);
    if (data && data.root) {
      this.loadMindmap(data);
      localStorage.setItem('last_active_mindmap_id', id);
      if (showNotice) window.uiController?.showToast(`Đã mở "${data.title}"`, 'success');
    }
  }

  applyTemplate(templateId) {
    const tpl = window.MINDMAP_TEMPLATES?.find(t => t.id === templateId);
    if (!tpl) return;

    this.createNewMap({
      title: tpl.title,
      templateId: tpl.id,
      layout: tpl.layout || 'radial',
      theme: tpl.theme || 'midnight'
    });
  }

  applyCurrentMapProperties() {
    if (window.uiController?.mapTitleInput) {
      window.uiController.mapTitleInput.value = this.currentMap.title || 'Sơ đồ tư duy';
    }
    const theme = this.currentMap.theme || 'midnight';
    document.documentElement.setAttribute('data-theme', theme);
    window.uiController?.updateThemeUI(theme);
    localStorage.setItem('last_active_mindmap_id', this.currentMap.id);
  }

  // --- RENDER DISPATCHER ---

  render(updateOutline = true) {
    window.mindmapRenderer.render(this.currentMap, this.selectedNodeId);
    if (updateOutline && window.outlineSync) {
      window.outlineSync.updateEditorFromTree(this.currentMap.root);
    }
  }

  // --- AUTO-SAVE (FIREBASE & LOCALSTORAGE) ---

  scheduleAutoSave() {
    clearTimeout(this.autoSaveDebounceTimer);
    this.autoSaveDebounceTimer = setTimeout(() => {
      this.saveCurrentMap();
    }, 1200);
  }

  async saveCurrentMap(manual = false) {
    const res = await window.firebaseClient.saveMindmap(this.currentMap);
    if (manual && res.success) {
      window.uiController?.showToast(res.localOnly ? 'Đã lưu vào bộ nhớ máy (Offline)' : 'Đã lưu thành công lên Firebase Cloud!', 'success');
    }
  }
}

window.appState = new AppState();
