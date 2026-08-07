/**
 * Mindmap Renderer - Handles Canvas Viewport, DOM Nodes, SVG Connectors & Minimap
 */

class MindmapRenderer {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.viewport = document.getElementById('canvas-viewport');
    this.svgLayer = document.getElementById('svg-layer');
    this.nodesLayer = document.getElementById('nodes-layer');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapIndicator = document.getElementById('minimap-viewport-indicator');
    this.zoomLabel = document.getElementById('zoom-percentage');

    this.panX = 0;
    this.panY = 0;
    this.scale = 1.0;
    this.minScale = 0.2;
    this.maxScale = 3.0;

    this.currentLayoutData = null;
    this.nodeElementsMap = new Map();

    this.initViewportCenter();
  }

  initViewportCenter() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.panX = rect.width / 2;
    this.panY = rect.height / 2;
    this.applyTransform();
  }

  applyTransform() {
    if (!this.viewport) return;
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    if (this.zoomLabel) {
      this.zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
    }
    this.renderMinimap();
  }

  setZoom(newScale, clientCenterX = null, clientCenterY = null) {
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    if (newScale === this.scale) return;

    const rect = this.container.getBoundingClientRect();
    const cx = clientCenterX !== null ? clientCenterX - rect.left : rect.width / 2;
    const cy = clientCenterY !== null ? clientCenterY - rect.top : rect.height / 2;

    // Giữ điểm zoom cố định dưới con trỏ chuột
    const worldX = (cx - this.panX) / this.scale;
    const worldY = (cy - this.panY) / this.scale;

    this.scale = newScale;
    this.panX = cx - worldX * this.scale;
    this.panY = cy - worldY * this.scale;

    this.applyTransform();
  }

  zoomIn() { this.setZoom(this.scale * 1.2); }
  zoomOut() { this.setZoom(this.scale / 1.2); }

  centerRoot() {
    const rect = this.container.getBoundingClientRect();
    this.panX = rect.width / 2;
    this.panY = rect.height / 2;
    this.setZoom(1.0);
    this.applyTransform();
  }

  fitView() {
    if (!this.currentLayoutData || this.currentLayoutData.nodes.length === 0) return;
    const rect = this.container.getBoundingClientRect();
    const bounds = this.calculateBounds(this.currentLayoutData.nodes);

    const padding = 100;
    const totalW = bounds.maxX - bounds.minX + padding * 2;
    const totalH = bounds.maxY - bounds.minY + padding * 2;

    const scaleX = rect.width / totalW;
    const scaleY = rect.height / totalH;
    const newScale = Math.max(this.minScale, Math.min(1.2, Math.min(scaleX, scaleY)));

    const midX = (bounds.minX + bounds.maxX) / 2;
    const midY = (bounds.minY + bounds.maxY) / 2;

    this.scale = newScale;
    this.panX = rect.width / 2 - midX * this.scale;
    this.panY = rect.height / 2 - midY * this.scale;

    this.applyTransform();
  }

  // Render toàn bộ Mindmap
  render(mindmapData, selectedNodeId = null) {
    if (!mindmapData || !mindmapData.root) return;

    // 1. Tính toán layout
    const layout = window.layoutEngine.computeLayout(mindmapData.root, mindmapData.layout || 'radial');
    this.currentLayoutData = layout;

    // 2. Render SVG Connectors
    this.renderConnectors(layout.links, mindmapData.crossLinks || []);

    // 3. Render DOM Nodes
    this.renderNodes(layout.nodes, selectedNodeId);

    // 4. Render Minimap
    this.renderMinimap();
  }

  // Tính toán đường cong nối thông minh thích ứng theo mọi góc độ kéo thả
  computeSmartConnectorPath(fromNode, toNode, fallbackDir = 'right', dragOffset = null, draggedNodeId = null) {
    let fX = fromNode.x;
    let fY = fromNode.y;
    let tX = toNode.x;
    let tY = toNode.y;

    if (dragOffset && draggedNodeId) {
      if (fromNode.id === draggedNodeId) {
        fX += dragOffset.x;
        fY += dragOffset.y;
      }
      if (toNode.id === draggedNodeId) {
        tX += dragOffset.x;
        tY += dragOffset.y;
      }
    }

    const fW = fromNode.width || 140;
    const fH = fromNode.height || 42;
    const tW = toNode.width || 120;
    const tH = toNode.height || 38;

    const dx = tX - fX;
    const dy = tY - fY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let startX, startY, endX, endY, c1X, c1Y, c2X, c2Y;

    // Phân loại hướng kết nối theo góc tọa độ thực tế giữa 2 node
    if (absDx >= absDy * 0.7) {
      // Hướng ngang: Trái hoặc Phải
      if (dx >= 0) {
        // Con nằm bên Phải của Cha
        startX = fX + fW / 2;
        startY = fY;
        endX = tX - tW / 2;
        endY = tY;
        const dist = Math.max(24, Math.abs(endX - startX) * 0.5);
        c1X = startX + dist;
        c1Y = startY;
        c2X = endX - dist;
        c2Y = endY;
      } else {
        // Con nằm bên Trái của Cha
        startX = fX - fW / 2;
        startY = fY;
        endX = tX + tW / 2;
        endY = tY;
        const dist = Math.max(24, Math.abs(startX - endX) * 0.5);
        c1X = startX - dist;
        c1Y = startY;
        c2X = endX + dist;
        c2Y = endY;
      }
    } else {
      // Hướng dọc: Trên hoặc Dưới
      if (dy >= 0) {
        // Con nằm bên Dưới của Cha
        startX = fX;
        startY = fY + fH / 2;
        endX = tX;
        endY = tY - tH / 2;
        const dist = Math.max(24, Math.abs(endY - startY) * 0.5);
        c1X = startX;
        c1Y = startY + dist;
        c2X = endX;
        c2Y = endY - dist;
      } else {
        // Con nằm bên Trên của Cha (Tự động chuyển anchor lên đỉnh và đáy mượt mà)
        startX = fX;
        startY = fY - fH / 2;
        endX = tX;
        endY = tY + tH / 2;
        const dist = Math.max(24, Math.abs(startY - endY) * 0.5);
        c1X = startX;
        c1Y = startY - dist;
        c2X = endX;
        c2Y = endY + dist;
      }
    }

    return `M ${startX} ${startY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${endX} ${endY}`;
  }

  // Render các đường nối SVG
  renderConnectors(links, crossLinks = [], dragOffset = null, draggedNodeId = null) {
    let svgHtml = `
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
        </marker>
      </defs>
    `;

    const nodesMap = new Map();
    if (this.currentLayoutData && this.currentLayoutData.nodes) {
      this.currentLayoutData.nodes.forEach(n => nodesMap.set(n.id, n));
    }

    // Vẽ các đường nối cây chính (Cubic Bezier Curves đa hướng thông minh)
    links.forEach(link => {
      const fromNode = link.fromNode || nodesMap.get(link.fromId);
      const toNode = link.toNode || nodesMap.get(link.toId);

      let pathD = '';
      if (fromNode && toNode) {
        pathD = this.computeSmartConnectorPath(fromNode, toNode, link.direction, dragOffset, draggedNodeId);
      } else {
        const { fromX, fromY, toX, toY, direction } = link;
        if (direction === 'down') {
          const dy = (toY - fromY) * 0.55;
          pathD = `M ${fromX} ${fromY} C ${fromX} ${fromY + dy}, ${toX} ${toY - dy}, ${toX} ${toY}`;
        } else {
          const dx = (toX - fromX) * 0.55;
          pathD = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
        }
      }

      const strokeColor = link.color || 'var(--connector-default)';
      svgHtml += `<path d="${pathD}" class="connector-path" id="connector-${link.fromId}-${link.toId}" style="stroke: ${strokeColor};" />`;
    });

    // Vẽ các đường liên kết chéo (Cross-links)
    crossLinks.forEach(cl => {
      const fromEl = this.nodeElementsMap.get(cl.fromId);
      const toEl = this.nodeElementsMap.get(cl.toId);
      if (fromEl && toEl) {
        let fX = parseFloat(fromEl.dataset.x);
        let fY = parseFloat(fromEl.dataset.y);
        let tX = parseFloat(toEl.dataset.x);
        let tY = parseFloat(toEl.dataset.y);
        if (dragOffset && draggedNodeId) {
          if (cl.fromId === draggedNodeId) { fX += dragOffset.x; fY += dragOffset.y; }
          if (cl.toId === draggedNodeId) { tX += dragOffset.x; tY += dragOffset.y; }
        }
        const midX = (fX + tX) / 2;
        const midY = (fY + tY) / 2 - 40;
        const pathD = `M ${fX} ${fY} Q ${midX} ${midY}, ${tX} ${tY}`;
        svgHtml += `<path d="${pathD}" class="crosslink-path" marker-end="url(#arrow)" />`;
      }
    });

    this.svgLayer.innerHTML = svgHtml;
  }

  // Render các DOM Nodes
  renderNodes(layoutNodes, selectedNodeId) {
    const existingIds = new Set();
    this.nodeElementsMap.clear();

    layoutNodes.forEach(item => {
      existingIds.add(item.id);
      let el = document.getElementById(`node-el-${item.id}`);

      if (!el) {
        el = document.createElement('div');
        el.id = `node-el-${item.id}`;
        el.className = 'mind-node';
        this.nodesLayer.appendChild(el);
      }

      this.nodeElementsMap.set(item.id, el);
      this.updateNodeElement(el, item, item.id === selectedNodeId);
    });

    // Xóa các node không còn tồn tại
    const allRendered = this.nodesLayer.querySelectorAll('.mind-node');
    allRendered.forEach(el => {
      const id = el.id.replace('node-el-', '');
      if (!existingIds.has(id)) {
        el.remove();
      }
    });
  }

  // Cập nhật thuộc tính DOM cho từng node
  updateNodeElement(el, item, isSelected) {
    const { node, x, y, level, width, height } = item;

    el.dataset.id = node.id;
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.level = level;

    // Vị trí
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%, -50%)`;

    // Classes
    el.className = `mind-node level-${Math.min(5, level)} shape-${node.shape || 'rounded'}`;
    if (isSelected) el.classList.add('selected');
    if (node.collapsed) el.classList.add('collapsed');

    // Tùy biến màu viền nếu có màu tùy chọn (cho cả node gốc và node con)
    if (node.color) {
      if (level === 0) {
        el.style.borderColor = node.color;
        el.style.boxShadow = `0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px ${node.color}55`;
      } else {
        el.style.borderColor = node.color;
        el.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.2), 0 0 0 1px ${node.color}33`;
      }
    } else {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }

    // Xây dựng nội dung HTML bên trong node
    let innerHtml = '';

    // 1. Emoji / Icon
    if (node.emoji) {
      innerHtml += `<span class="node-emoji">${node.emoji}</span>`;
    }

    // 2. Checkbox tiến độ
    if (node.checked !== null && node.checked !== undefined) {
      innerHtml += `
        <div class="node-checkbox ${node.checked ? 'checked' : ''}" data-action="toggle-check" title="Đánh dấu hoàn thành">
          ${node.checked ? '✓' : ''}
        </div>
      `;
    }

    // 3. Nội dung văn bản
    innerHtml += `<div class="node-text" spellcheck="false">${this.escapeHtml(node.text || 'Nhánh không tên')}</div>`;

    // 4. Các nhãn Tags
    if (node.tags && node.tags.length > 0) {
      innerHtml += `<div class="node-tags">${node.tags.map(t => `<span class="node-tag">${this.escapeHtml(t)}</span>`).join('')}</div>`;
    }

    // 5. Liên kết ngoài
    if (node.link) {
      innerHtml += `<a class="node-link" href="${this.escapeHtml(node.link)}" target="_blank" title="${this.escapeHtml(node.link)}" onclick="event.stopPropagation();">🔗</a>`;
    }

    // 6. Ghi chú chi tiết
    if (node.notes) {
      innerHtml += `<span class="node-notes-icon" title="${this.escapeHtml(node.notes)}">📝</span>`;
    }

    // 7. Huy hiệu bình luận / Thảo luận
    if (node.comments && node.comments.length > 0) {
      innerHtml += `
        <div class="node-comment-badge" data-action="open-comments" title="Xem ${node.comments.length} bình luận (Nhấp để mở)">
          💬 <span class="comment-count">${node.comments.length}</span>
        </div>
      `;
    }

    // 8. Nút thao tác nhanh trên hover (+ Con, + Anh em)
    innerHtml += `
      <div class="node-quick-btn add-child" data-action="add-child" title="Thêm nhánh con (Tab)">+</div>
      ${level > 0 ? `<div class="node-quick-btn add-sibling" data-action="add-sibling" title="Thêm nhánh ngang hàng (Enter)">+</div>` : ''}
    `;

    // 8. Huy hiệu thu gọn / mở rộng
    if (node.children && node.children.length > 0) {
      innerHtml += `
        <div class="node-collapse-toggle ${node.collapsed ? 'collapsed' : ''}" data-action="toggle-collapse" title="${node.collapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}">
          ${node.collapsed ? node.children.length : '−'}
        </div>
      `;
    }

    el.innerHTML = innerHtml;
  }

  // Render Minimap toàn cảnh
  renderMinimap() {
    if (!this.minimapCanvas || !this.currentLayoutData) return;
    const ctx = this.minimapCanvas.getContext('2d');
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);
    const nodes = this.currentLayoutData.nodes;
    if (nodes.length === 0) return;

    const bounds = this.calculateBounds(nodes);
    const padding = 150;
    const mapW = bounds.maxX - bounds.minX + padding * 2;
    const mapH = bounds.maxY - bounds.minY + padding * 2;

    const scale = Math.min(w / mapW, h / mapH);
    const offsetX = (w - mapW * scale) / 2 - (bounds.minX - padding) * scale;
    const offsetY = (h - mapH * scale) / 2 - (bounds.minY - padding) * scale;

    // Vẽ các node trên minimap
    nodes.forEach(item => {
      const nx = item.x * scale + offsetX;
      const ny = item.y * scale + offsetY;
      const nw = Math.max(4, item.width * scale);
      const nh = Math.max(2.5, item.height * scale);

      ctx.fillStyle = item.level === 0 ? '#6366f1' : (item.node.color || '#94a3b8');
      ctx.beginPath();
      ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, 2);
      ctx.fill();
    });

    // Cập nhật khung nhìn Viewport Indicator trên Minimap
    if (this.minimapIndicator && this.container) {
      const cRect = this.container.getBoundingClientRect();
      const viewWorldLeft = (0 - this.panX) / this.scale;
      const viewWorldTop = (0 - this.panY) / this.scale;
      const viewWorldW = cRect.width / this.scale;
      const viewWorldH = cRect.height / this.scale;

      const indX = viewWorldLeft * scale + offsetX;
      const indY = viewWorldTop * scale + offsetY;
      const indW = viewWorldW * scale;
      const indH = viewWorldH * scale;

      this.minimapIndicator.style.left = `${Math.max(0, indX)}px`;
      this.minimapIndicator.style.top = `${Math.max(0, indY)}px`;
      this.minimapIndicator.style.width = `${Math.min(w, indW)}px`;
      this.minimapIndicator.style.height = `${Math.min(h, indH)}px`;
    }
  }

  calculateBounds(nodes) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const halfW = n.width / 2;
      const halfH = n.height / 2;
      minX = Math.min(minX, n.x - halfW);
      maxX = Math.max(maxX, n.x + halfW);
      minY = Math.min(minY, n.y - halfH);
      maxY = Math.max(maxY, n.y + halfH);
    });
    return { minX, maxX, minY, maxY };
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.mindmapRenderer = new MindmapRenderer();
