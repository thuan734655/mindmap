/**
 * Interaction Manager - Keyboard Shortcuts, Drag & Drop, Free-form Movement, Canvas Panning & Zooming
 */

class InteractionManager {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.isSpacePressed = false;
    this.editingNodeId = null;

    // Drag-and-drop & Free-form movement state
    this.pendingDragNodeId = null;
    this.dragStartClientX = 0;
    this.dragStartClientY = 0;
    this.isDraggingNode = false;
    this.draggedNodeId = null;
    this.dropTargetNodeId = null;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Mouse Panning & Zooming trên Canvas
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.container.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // 2. Keyboard Navigation & Shortcuts
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // 3. Node Action Delegation (Click on nodes / buttons / Double click to edit)
    this.container.addEventListener('click', (e) => this.onCanvasClick(e));
    this.container.addEventListener('dblclick', (e) => this.onCanvasDblClick(e));
  }

  // --- MOUSE PANNING & DRAGGING ---

  onMouseDown(e) {
    // Nếu đang sửa text
    if (this.editingNodeId) {
      const nodeEl = document.getElementById(`node-el-${this.editingNodeId}`);
      if (nodeEl && nodeEl.contains(e.target)) {
        return; // Cho phép click đặt con trỏ bên trong text đang sửa
      }
      this.commitNodeEdit();
    }

    // Bỏ qua nếu click vào nút thao tác nhanh, checkbox, thu gọn, link
    if (
      e.target.closest('.node-quick-btn') ||
      e.target.closest('.node-collapse-toggle') ||
      e.target.closest('.node-checkbox') ||
      e.target.closest('.node-link')
    ) {
      return;
    }

    // 1. Chuột giữa hoặc Space + Chuột trái hoặc click trực tiếp vào vùng canvas trống
    const isCanvasBg = e.target === this.container || e.target.id === 'svg-layer' || e.target.id === 'canvas-viewport' || e.target.id === 'nodes-layer';
    if (e.button === 1 || (e.button === 0 && (this.isSpacePressed || isCanvasBg))) {
      this.isPanning = true;
      this.panStartX = e.clientX - window.mindmapRenderer.panX;
      this.panStartY = e.clientY - window.mindmapRenderer.panY;
      this.container.classList.add('panning');
      e.preventDefault();
      return;
    }

    // 2. Nhấp chuột trái vào mind-node: Chuẩn bị Drag hoặc Click/DblClick
    const nodeEl = e.target.closest('.mind-node');
    if (nodeEl && e.button === 0) {
      this.pendingDragNodeId = nodeEl.dataset.id;
      this.dragStartClientX = e.clientX;
      this.dragStartClientY = e.clientY;
      this.isDraggingNode = false;
      this.draggedNodeId = null;
      this.dropTargetNodeId = null;
    }
  }

  onMouseMove(e) {
    // 1. Xử lý Panning Canvas
    if (this.isPanning) {
      window.mindmapRenderer.panX = e.clientX - this.panStartX;
      window.mindmapRenderer.panY = e.clientY - this.panStartY;
      window.mindmapRenderer.applyTransform();
      return;
    }

    // 2. Xử lý Dragging Node (Di chuyển tự do hoặc Kéo thả sang nhánh khác)
    if (this.pendingDragNodeId && !this.isEditing()) {
      const dx = e.clientX - this.dragStartClientX;
      const dy = e.clientY - this.dragStartClientY;
      const dist = Math.hypot(dx, dy);

      // Kích hoạt Drag khi chuột di chuyển quá ngưỡng 4px
      if (dist > 4 && !this.isDraggingNode) {
        this.isDraggingNode = true;
        this.draggedNodeId = this.pendingDragNodeId;
        const el = document.getElementById(`node-el-${this.draggedNodeId}`);
        if (el) el.classList.add('dragging');
        window.appState.setSelectedNode(this.draggedNodeId);
      }

      if (this.isDraggingNode && this.draggedNodeId) {
        this.updateNodeDrag(e);
      }
    }
  }

  updateNodeDrag(e) {
    const worldDx = (e.clientX - this.dragStartClientX) / window.mindmapRenderer.scale;
    const worldDy = (e.clientY - this.dragStartClientY) / window.mindmapRenderer.scale;

    // Tìm node dưới con trỏ chuột (để làm cha mới nếu kéo thả lên node khác)
    const elUnder = document.elementFromPoint(e.clientX, e.clientY);
    const targetNodeEl = elUnder ? elUnder.closest('.mind-node') : null;

    // Xóa highlight target cũ
    document.querySelectorAll('.mind-node.drag-target').forEach(el => el.classList.remove('drag-target'));

    const draggedNode = MindmapTree.findNode(window.appState.currentMap.root, this.draggedNodeId);

    if (
      targetNodeEl &&
      targetNodeEl.dataset.id !== this.draggedNodeId &&
      this.draggedNodeId !== window.appState.currentMap.root.id
    ) {
      const targetId = targetNodeEl.dataset.id;
      // Kiểm tra không kéo thả cha vào con của chính nó
      const isDescendant = draggedNode && MindmapTree.findNode(draggedNode, targetId);
      if (!isDescendant) {
        this.dropTargetNodeId = targetId;
        targetNodeEl.classList.add('drag-target');
      } else {
        this.dropTargetNodeId = null;
      }
    } else {
      this.dropTargetNodeId = null;
      // Live preview di chuyển mượt mà tại chỗ
      const el = document.getElementById(`node-el-${this.draggedNodeId}`);
      if (el) {
        el.style.transform = `translate(calc(-50% + ${worldDx}px), calc(-50% + ${worldDy}px))`;
      }
    }

    // Cập nhật đường nối SVG linh hoạt theo thời gian thực (Adaptive dynamic drag curves)
    if (window.mindmapRenderer && window.mindmapRenderer.currentLayoutData) {
      window.mindmapRenderer.renderConnectors(
        window.mindmapRenderer.currentLayoutData.links,
        window.appState.currentMap.crossLinks || [],
        { x: worldDx, y: worldDy },
        this.draggedNodeId
      );
    }
  }

  onMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.container.classList.remove('panning');
    }

    if (this.isDraggingNode && this.draggedNodeId) {
      const draggedId = this.draggedNodeId;
      const targetId = this.dropTargetNodeId;
      const worldDx = (e.clientX - this.dragStartClientX) / window.mindmapRenderer.scale;
      const worldDy = (e.clientY - this.dragStartClientY) / window.mindmapRenderer.scale;

      // Xóa các classes drag
      document.querySelectorAll('.mind-node.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.mind-node.drag-target').forEach(el => el.classList.remove('drag-target'));

      this.isDraggingNode = false;
      this.draggedNodeId = null;
      this.dropTargetNodeId = null;
      this.pendingDragNodeId = null;

      // 1. Nếu thả vào một node cha khác -> Reparent
      if (targetId && targetId !== draggedId) {
        window.appState.reparentNode(draggedId, targetId);
      }
      // 2. Nếu thả tự do trên không gian canvas -> Di chuyển tự do vị trí (Manual Offset)
      else if (Math.abs(worldDx) > 3 || Math.abs(worldDy) > 3) {
        window.appState.moveNodeOffset(draggedId, worldDx, worldDy);
      } else {
        window.mindmapRenderer.render(window.appState.currentMap, window.appState.selectedNodeId);
      }
      return;
    }

    this.pendingDragNodeId = null;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    window.mindmapRenderer.setZoom(window.mindmapRenderer.scale * zoomFactor, e.clientX, e.clientY);
  }

  // --- CLICK & DOUBLE CLICK ACTIONS ---

  onCanvasClick(e) {
    // Nếu vừa thực hiện thao tác kéo thả thì bỏ qua click
    if (this.isDraggingNode) return;

    // 1. Action: Checkbox Toggle
    const checkboxEl = e.target.closest('[data-action="toggle-check"]');
    if (checkboxEl) {
      const nodeEl = checkboxEl.closest('.mind-node');
      if (nodeEl) {
        window.appState.toggleNodeChecked(nodeEl.dataset.id);
      }
      return;
    }

    // 2. Action: Quick Add Child
    const addChildBtn = e.target.closest('[data-action="add-child"]');
    if (addChildBtn) {
      const nodeEl = addChildBtn.closest('.mind-node');
      if (nodeEl) {
        const newNode = window.appState.addChildNode(nodeEl.dataset.id);
        if (newNode) {
          window.appState.setSelectedNode(newNode.id);
          this.startNodeEdit(newNode.id, true);
        }
      }
      return;
    }

    // 3. Action: Quick Add Sibling
    const addSiblingBtn = e.target.closest('[data-action="add-sibling"]');
    if (addSiblingBtn) {
      const nodeEl = addSiblingBtn.closest('.mind-node');
      if (nodeEl) {
        const newNode = window.appState.addSiblingNode(nodeEl.dataset.id);
        if (newNode) {
          window.appState.setSelectedNode(newNode.id);
          this.startNodeEdit(newNode.id, true);
        }
      }
      return;
    }

    // 4. Action: Toggle Collapse
    const collapseBtn = e.target.closest('[data-action="toggle-collapse"]');
    if (collapseBtn) {
      const nodeEl = collapseBtn.closest('.mind-node');
      if (nodeEl) {
        window.appState.toggleNodeCollapse(nodeEl.dataset.id);
      }
      return;
    }

    // 5. Action: Open Node Comments
    const commentBadge = e.target.closest('[data-action="open-comments"]');
    if (commentBadge) {
      const nodeEl = commentBadge.closest('.mind-node');
      if (nodeEl) {
        window.appState.openCommentsDrawer(nodeEl.dataset.id);
      }
      return;
    }

    // 6. Select Node
    const nodeEl = e.target.closest('.mind-node');
    if (nodeEl) {
      const id = nodeEl.dataset.id;
      window.appState.setSelectedNode(id);
    } else {
      // Click ra ngoài canvas trống -> bỏ chọn
      if (!e.target.closest('#node-toolbar') && !e.target.closest('.side-drawer') && !e.target.closest('#app-header') && !e.target.closest('#tabs-bar')) {
        window.appState.setSelectedNode(null);
      }
    }
  }

  // --- DOUBLE CLICK ĐỂ SỬA TRỰC TIẾP NỘI DUNG ---

  onCanvasDblClick(e) {
    if (
      e.target.closest('.node-quick-btn') ||
      e.target.closest('.node-collapse-toggle') ||
      e.target.closest('.node-checkbox') ||
      e.target.closest('.node-comment-badge') ||
      e.target.closest('.node-link')
    ) {
      return;
    }

    const nodeEl = e.target.closest('.mind-node');
    if (nodeEl) {
      e.preventDefault();
      e.stopPropagation();
      const nodeId = nodeEl.dataset.id;
      window.appState.setSelectedNode(nodeId);
      this.startNodeEdit(nodeId, true);
    }
  }

  // --- IN-PLACE TEXT EDITING ---

  isEditing() {
    return this.editingNodeId !== null;
  }

  startNodeEdit(nodeId, selectAll = false) {
    if (this.editingNodeId && this.editingNodeId !== nodeId) {
      this.commitNodeEdit();
    }

    const nodeEl = document.getElementById(`node-el-${nodeId}`);
    if (!nodeEl) return;

    const textEl = nodeEl.querySelector('.node-text');
    if (!textEl) return;

    this.editingNodeId = nodeId;
    nodeEl.classList.add('editing');
    textEl.setAttribute('contenteditable', 'true');
    textEl.focus();

    // Tự động bôi đen toàn bộ chữ hoặc đặt con trỏ ở cuối
    const range = document.createRange();
    range.selectNodeContents(textEl);
    if (!selectAll) {
      range.collapse(false);
    }
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Tự động lưu khi click ra ngoài
    textEl.onblur = () => {
      this.commitNodeEdit();
    };

    // Phím Enter lưu, Escape hủy
    textEl.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textEl.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelNodeEdit();
      }
    };
  }

  commitNodeEdit() {
    if (!this.editingNodeId) return;
    const currentId = this.editingNodeId;
    this.editingNodeId = null;

    const nodeEl = document.getElementById(`node-el-${currentId}`);
    if (nodeEl) {
      nodeEl.classList.remove('editing');
      const textEl = nodeEl.querySelector('.node-text');
      if (textEl) {
        textEl.removeAttribute('contenteditable');
        textEl.onblur = null;
        textEl.onkeydown = null;
        const newText = textEl.innerText.trim() || 'Nhánh không tên';
        window.appState.updateNodeText(currentId, newText);
      }
    }
  }

  cancelNodeEdit() {
    if (!this.editingNodeId) return;
    const currentId = this.editingNodeId;
    this.editingNodeId = null;

    const nodeEl = document.getElementById(`node-el-${currentId}`);
    if (nodeEl) {
      nodeEl.classList.remove('editing');
      const textEl = nodeEl.querySelector('.node-text');
      if (textEl) {
        textEl.removeAttribute('contenteditable');
        textEl.onblur = null;
        textEl.onkeydown = null;
      }
    }
    window.mindmapRenderer.render(window.appState.currentMap, window.appState.selectedNodeId);
  }

  // --- KEYBOARD SHORTCUTS ---

  onKeyDown(e) {
    if (e.code === 'Space' && !this.isEditing() && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      this.isSpacePressed = true;
      this.container.style.cursor = 'grab';
    }

    // Khi đang chỉnh sửa text node, không kích hoạt phím điều hướng
    if (this.isEditing()) return;

    // Nếu đang focus vào input hoặc textarea khác (Outline, modal, etc.)
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    const selectedId = window.appState.selectedNodeId;

    // Undo / Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        window.appState.redo();
      } else {
        window.appState.undo();
      }
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      window.appState.redo();
      return;
    }

    // Save shortcut (Ctrl+S)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      window.appState.saveCurrentMap(true);
      return;
    }

    if (!selectedId) return;

    // 1. Tab: Thêm nhánh con
    if (e.key === 'Tab') {
      e.preventDefault();
      const newNode = window.appState.addChildNode(selectedId);
      if (newNode) {
        window.appState.setSelectedNode(newNode.id);
        this.startNodeEdit(newNode.id, true);
      }
      return;
    }

    // 2. Enter: Thêm nhánh ngang hàng (hoặc thêm nhánh chính từ root)
    if (e.key === 'Enter') {
      e.preventDefault();
      const newNode = window.appState.addSiblingNode(selectedId);
      if (newNode) {
        window.appState.setSelectedNode(newNode.id);
        this.startNodeEdit(newNode.id, true);
      }
      return;
    }

    // 3. F2: Chỉnh sửa text
    if (e.key === 'F2') {
      e.preventDefault();
      this.startNodeEdit(selectedId, true);
      return;
    }

    // 4. Delete / Backspace: Xóa / Đặt lại node
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      window.appState.deleteSelectedNode();
      return;
    }

    // 5. Shift + C: Mở bảng bình luận & thảo luận
    if (e.key === 'C' && e.shiftKey) {
      e.preventDefault();
      window.appState.openCommentsDrawer(selectedId);
      return;
    }

    // 6. Mũi tên điều hướng không gian
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      this.navigateWithArrows(e.key, selectedId);
      return;
    }

    // 7. Phím Escape: Bỏ chọn
    if (e.key === 'Escape') {
      window.appState.setSelectedNode(null);
    }
  }

  onKeyUp(e) {
    if (e.code === 'Space') {
      this.isSpacePressed = false;
      this.container.style.cursor = 'default';
    }
  }

  // --- SPATIAL ARROW NAVIGATION ---

  navigateWithArrows(direction, currentId) {
    const layoutNodes = window.mindmapRenderer.currentLayoutData?.nodes;
    if (!layoutNodes || layoutNodes.length <= 1) return;

    const current = layoutNodes.find(n => n.id === currentId);
    if (!current) return;

    let closestNode = null;
    let minDistance = Infinity;

    layoutNodes.forEach(other => {
      if (other.id === currentId) return;

      const dx = other.x - current.x;
      const dy = other.y - current.y;

      let isCandidate = false;
      if (direction === 'ArrowRight' && dx > 20 && Math.abs(dy) < Math.abs(dx) * 1.5) isCandidate = true;
      if (direction === 'ArrowLeft' && dx < -20 && Math.abs(dy) < Math.abs(dx) * 1.5) isCandidate = true;
      if (direction === 'ArrowDown' && dy > 15 && Math.abs(dx) < Math.abs(dy) * 2.0) isCandidate = true;
      if (direction === 'ArrowUp' && dy < -15 && Math.abs(dx) < Math.abs(dy) * 2.0) isCandidate = true;

      if (isCandidate) {
        const dist = Math.hypot(dx, dy);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = other;
        }
      }
    });

    if (closestNode) {
      window.appState.setSelectedNode(closestNode.id);
    }
  }
}

window.interactionManager = new InteractionManager();
