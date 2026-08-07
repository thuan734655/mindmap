/**
 * Export & Import Engine - PNG (HD), SVG, JSON, Markdown
 */

class ExportImportEngine {
  constructor() {
    this.fileInput = document.getElementById('file-import-input');
    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => this.handleFileSelected(e));
    }
  }

  // 1. Xuất file PNG chất lượng cao (HD)
  async exportPNG() {
    const map = window.appState.currentMap;
    const layout = window.mindmapRenderer.currentLayoutData;
    if (!layout || layout.nodes.length === 0) return;

    window.uiController.showToast('Đang kết xuất ảnh PNG HD...', 'info');

    const bounds = window.mindmapRenderer.calculateBounds(layout.nodes);
    const padding = 80;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;

    const scaleFactor = 2; // Độ phân giải 2x cho hình ảnh sắc nét
    const canvas = document.createElement('canvas');
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);

    // Vẽ nền theo theme hiện tại
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#0b0f19';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Dịch chuyển gốc tọa độ theo bounds
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Vẽ các đường nối SVG connectors
    layout.links.forEach(link => {
      const fromX = link.fromX + offsetX;
      const fromY = link.fromY + offsetY;
      const toX = link.toX + offsetX;
      const toY = link.toY + offsetY;

      ctx.strokeStyle = link.color || '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      if (link.direction === 'down') {
        const dy = (toY - fromY) * 0.55;
        ctx.bezierCurveTo(fromX, fromY + dy, toX, toY - dy, toX, toY);
      } else {
        const dx = (toX - fromX) * 0.55;
        ctx.bezierCurveTo(fromX + dx, fromY, toX - dx, toY, toX, toY);
      }
      ctx.stroke();
    });

    // Vẽ các Node
    layout.nodes.forEach(item => {
      const nx = item.x + offsetX;
      const ny = item.y + offsetY;
      const nw = item.width;
      const nh = item.height;
      const level = item.level;
      const node = item.node;

      const left = nx - nw / 2;
      const top = ny - nh / 2;

      // Nền node
      ctx.save();
      if (level === 0) {
        ctx.fillStyle = '#6366f1';
      } else {
        const nodeBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#111827';
        ctx.fillStyle = nodeBg;
      }

      ctx.beginPath();
      const radius = node.shape === 'pill' ? nh / 2 : (node.shape === 'box' ? 4 : 8);
      ctx.roundRect(left, top, nw, nh, radius);
      ctx.fill();

      // Viền node
      ctx.strokeStyle = node.color || (level === 0 ? 'rgba(255,255,255,0.4)' : '#374151');
      ctx.lineWidth = level === 0 ? 2 : 1.5;
      ctx.stroke();

      // Text bên trong
      ctx.fillStyle = level === 0 ? '#ffffff' : (getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f3f4f6');
      ctx.font = level === 0 ? 'bold 15px Plus Jakarta Sans, sans-serif' : '13px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let displayText = node.text || 'Nhánh';
      if (node.emoji) displayText = `${node.emoji} ${displayText}`;
      ctx.fillText(displayText, nx, ny);
      ctx.restore();
    });

    // Tải xuống file PNG
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const filename = `${this.sanitizeFilename(map.title || 'mindmap')}.png`;
      this.triggerDownload(url, filename);
      URL.revokeObjectURL(url);
      window.uiController.showToast('Đã xuất file PNG thành công!', 'success');
    }, 'image/png');
  }

  // 2. Xuất file SVG Vector
  exportSVG() {
    const map = window.appState.currentMap;
    const layout = window.mindmapRenderer.currentLayoutData;
    if (!layout || layout.nodes.length === 0) return;

    const bounds = window.mindmapRenderer.calculateBounds(layout.nodes);
    const padding = 60;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#0b0f19';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f3f4f6';

    let svg = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .node-text { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 13px; fill: ${textColor}; dominant-baseline: middle; text-anchor: middle; }
    .root-text { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; font-size: 16px; font-weight: bold; fill: #ffffff; dominant-baseline: middle; text-anchor: middle; }
    .connector { fill: none; stroke-width: 2.5; stroke-linecap: round; }
  </style>
  <rect width="100%" height="100%" fill="${bgColor}" />
  <g id="connectors">
`;

    layout.links.forEach(link => {
      const fromX = link.fromX + offsetX;
      const fromY = link.fromY + offsetY;
      const toX = link.toX + offsetX;
      const toY = link.toY + offsetY;
      let pathD = '';
      if (link.direction === 'down') {
        const dy = (toY - fromY) * 0.55;
        pathD = `M ${fromX} ${fromY} C ${fromX} ${fromY + dy}, ${toX} ${toY - dy}, ${toX} ${toY}`;
      } else {
        const dx = (toX - fromX) * 0.55;
        pathD = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;
      }
      svg += `    <path d="${pathD}" class="connector" stroke="${link.color || '#4f46e5'}" />\n`;
    });

    svg += `  </g>\n  <g id="nodes">\n`;

    layout.nodes.forEach(item => {
      const nx = item.x + offsetX;
      const ny = item.y + offsetY;
      const nw = item.width;
      const nh = item.height;
      const level = item.level;
      const node = item.node;
      const left = nx - nw / 2;
      const top = ny - nh / 2;
      const fill = level === 0 ? '#6366f1' : '#1e293b';
      const stroke = node.color || (level === 0 ? '#ffffff' : '#475569');

      svg += `    <rect x="${left}" y="${top}" width="${nw}" height="${nh}" rx="${node.shape === 'pill' ? nh / 2 : 8}" fill="${fill}" stroke="${stroke}" stroke-width="${level === 0 ? 2 : 1.5}" />\n`;
      svg += `    <text x="${nx}" y="${ny}" class="${level === 0 ? 'root-text' : 'node-text'}">${this.escapeXml((node.emoji ? node.emoji + ' ' : '') + node.text)}</text>\n`;
    });

    svg += `  </g>\n</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, `${this.sanitizeFilename(map.title || 'mindmap')}.svg`);
    URL.revokeObjectURL(url);
    window.uiController.showToast('Đã xuất file SVG thành công!', 'success');
  }

  // 3. Xuất file JSON (Project Format)
  exportJSON() {
    const map = window.appState.currentMap;
    const jsonStr = JSON.stringify(map, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, `${this.sanitizeFilename(map.title || 'mindmap')}.json`);
    URL.revokeObjectURL(url);
    window.uiController.showToast('Đã tải xuống file JSON sao lưu!', 'success');
  }

  // 4. Xuất file Markdown (.md)
  exportMarkdown() {
    const map = window.appState.currentMap;
    const mdText = window.outlineSync.treeToMarkdown(map.root);
    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.triggerDownload(url, `${this.sanitizeFilename(map.title || 'mindmap')}.md`);
    URL.revokeObjectURL(url);
    window.uiController.showToast('Đã xuất file Markdown Outline!', 'success');
  }

  // 5. Mở file chọn nhập dữ liệu
  triggerFileInput() {
    if (this.fileInput) {
      this.fileInput.value = '';
      this.fileInput.click();
    }
  }

  handleFileSelected(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');
    const isMd = file.name.endsWith('.md') || file.name.endsWith('.txt');

    reader.onload = (event) => {
      const content = event.target.result;
      try {
        if (isJson) {
          const parsed = JSON.parse(content);
          if (parsed && parsed.root) {
            window.appState.loadMindmap(parsed);
            window.uiController.showToast('Đã nạp file JSON thành công!', 'success');
          } else {
            throw new Error('Cấu trúc JSON không hợp lệ');
          }
        } else if (isMd) {
          const newRoot = window.outlineSync.markdownToTree(content);
          const title = file.name.replace(/\.[^/.]+$/, '');
          window.appState.loadMindmap({
            id: `map_${Date.now()}`,
            title: title,
            root: newRoot
          });
          window.uiController.showToast('Đã nhập Markdown thành Mindmap!', 'success');
        }
      } catch (err) {
        window.uiController.showToast(`Lỗi đọc file: ${err.message}`, 'danger');
      }
    };

    reader.readAsText(file);
  }

  triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  sanitizeFilename(name) {
    return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'mindmap';
  }

  escapeXml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}

window.exportImportEngine = new ExportImportEngine();
