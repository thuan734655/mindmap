/**
 * Layout Engine - Computes (x, y) coordinates for Mindmap Nodes
 * Supports: Radial (Bidirectional), Right Tree (Left-to-Right), Top-Down (Org Chart)
 */

class LayoutEngine {
  constructor() {
    this.HORIZONTAL_GAP = 70; // Khoảng cách giữa các tầng ngang
    this.VERTICAL_GAP = 24;   // Khoảng cách giữa các node cùng cấp
    this.TOPDOWN_V_GAP = 60;  // Khoảng cách tầng dọc trong Org Chart
    this.TOPDOWN_H_GAP = 28;  // Khoảng cách node ngang trong Org Chart
    
    // Default node dimensions estimator
    this.ROOT_WIDTH = 220;
    this.ROOT_HEIGHT = 56;
    this.DEFAULT_NODE_WIDTH = 150;
    this.DEFAULT_NODE_HEIGHT = 40;
  }

  // Đo kích thước ước tính của node dựa trên text và các phụ kiện
  estimateNodeSize(node, level = 1) {
    if (level === 0) {
      const len = (node.text || '').length;
      return {
        width: Math.max(160, Math.min(360, len * 11 + 70)),
        height: 52
      };
    }

    const textLen = (node.text || '').length;
    let w = Math.max(90, Math.min(320, textLen * 8.5 + 40));
    let h = 38;

    if (node.emoji) w += 24;
    if (node.checked !== null && node.checked !== undefined) w += 22;
    if (node.tags && node.tags.length > 0) {
      h += 20;
      w = Math.max(w, 140);
    }
    if (node.notes || node.link) w += 20;
    if (node.comments && node.comments.length > 0) w += 32;

    return { width: w, height: h };
  }

  // Tính toán toàn bộ layout cho cây
  computeLayout(root, layoutType = 'radial') {
    if (!root) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];

    if (layoutType === 'radial') {
      this.layoutRadial(root, nodes, links);
    } else if (layoutType === 'top-down') {
      this.layoutTopDown(root, nodes, links);
    } else {
      // Default: 'right' (Left to Right)
      this.layoutRight(root, nodes, links);
    }

    return { nodes, links };
  }

  // 1. Radial Layout (Cân bằng nhánh Trái & Phải)
  layoutRadial(root, nodes, links) {
    const rootSize = this.estimateNodeSize(root, 0);
    const rootNodeLayout = {
      id: root.id,
      node: root,
      x: (root.offsetX || 0),
      y: (root.offsetY || 0),
      width: rootSize.width,
      height: rootSize.height,
      level: 0,
      direction: 'center'
    };
    nodes.push(rootNodeLayout);

    if (!root.children || root.children.length === 0 || root.collapsed) {
      return;
    }

    // Chia đều các nhánh con cấp 1: bên phải (chẵn) và bên trái (lẻ)
    const rightChildren = [];
    const leftChildren = [];

    root.children.forEach((child, index) => {
      if (index % 2 === 0) {
        rightChildren.push(child);
      } else {
        leftChildren.push(child);
      }
    });

    // Layout nhánh phải
    if (rightChildren.length > 0) {
      const rightHeight = this.calculateSubtreeHeight(rightChildren, 1);
      let currentY = rootNodeLayout.y - rightHeight / 2;
      const startX = rootNodeLayout.x + rootSize.width / 2 + this.HORIZONTAL_GAP;

      rightChildren.forEach(child => {
        const subtreeH = this.getNodeSubtreeHeight(child, 1);
        const childY = currentY + subtreeH / 2;
        this.layoutSubtreeRight(child, startX, childY, 1, 'right', rootNodeLayout, nodes, links);
        currentY += subtreeH + this.VERTICAL_GAP;
      });
    }

    // Layout nhánh trái
    if (leftChildren.length > 0) {
      const leftHeight = this.calculateSubtreeHeight(leftChildren, 1);
      let currentY = rootNodeLayout.y - leftHeight / 2;
      const startX = rootNodeLayout.x - (rootSize.width / 2 + this.HORIZONTAL_GAP);

      leftChildren.forEach(child => {
        const subtreeH = this.getNodeSubtreeHeight(child, 1);
        const childY = currentY + subtreeH / 2;
        this.layoutSubtreeLeft(child, startX, childY, 1, 'left', rootNodeLayout, nodes, links);
        currentY += subtreeH + this.VERTICAL_GAP;
      });
    }
  }

  // Đệ quy bố trí cây sang phải
  layoutSubtreeRight(node, x, y, level, direction, parentLayout, nodes, links) {
    const size = this.estimateNodeSize(node, level);
    const nodeLayout = {
      id: node.id,
      node: node,
      x: x + size.width / 2 + (node.offsetX || 0),
      y: y + (node.offsetY || 0),
      width: size.width,
      height: size.height,
      level: level,
      direction: 'right'
    };
    nodes.push(nodeLayout);

    // Tạo liên kết từ cha sang con
    links.push({
      fromId: parentLayout.id,
      toId: node.id,
      fromNode: parentLayout,
      toNode: nodeLayout,
      fromX: parentLayout.level === 0 ? parentLayout.x + parentLayout.width / 2 : parentLayout.x + parentLayout.width / 2,
      fromY: parentLayout.y,
      toX: nodeLayout.x - nodeLayout.width / 2,
      toY: nodeLayout.y,
      color: node.color || parentLayout.node.color || null,
      direction: 'right'
    });

    if (node.children && node.children.length > 0 && !node.collapsed) {
      const totalHeight = this.calculateSubtreeHeight(node.children, level + 1);
      let currentY = nodeLayout.y - totalHeight / 2;
      const nextX = nodeLayout.x + nodeLayout.width / 2 + this.HORIZONTAL_GAP;

      node.children.forEach(child => {
        const childSubH = this.getNodeSubtreeHeight(child, level + 1);
        const childY = currentY + childSubH / 2;
        this.layoutSubtreeRight(child, nextX, childY, level + 1, 'right', nodeLayout, nodes, links);
        currentY += childSubH + this.VERTICAL_GAP;
      });
    }
  }

  // Đệ quy bố trí cây sang trái
  layoutSubtreeLeft(node, x, y, level, direction, parentLayout, nodes, links) {
    const size = this.estimateNodeSize(node, level);
    const nodeLayout = {
      id: node.id,
      node: node,
      x: x - size.width / 2 + (node.offsetX || 0),
      y: y + (node.offsetY || 0),
      width: size.width,
      height: size.height,
      level: level,
      direction: 'left'
    };
    nodes.push(nodeLayout);

    // Tạo liên kết
    links.push({
      fromId: parentLayout.id,
      toId: node.id,
      fromNode: parentLayout,
      toNode: nodeLayout,
      fromX: parentLayout.level === 0 ? parentLayout.x - parentLayout.width / 2 : parentLayout.x - parentLayout.width / 2,
      fromY: parentLayout.y,
      toX: nodeLayout.x + nodeLayout.width / 2,
      toY: nodeLayout.y,
      color: node.color || parentLayout.node.color || null,
      direction: 'left'
    });

    if (node.children && node.children.length > 0 && !node.collapsed) {
      const totalHeight = this.calculateSubtreeHeight(node.children, level + 1);
      let currentY = nodeLayout.y - totalHeight / 2;
      const nextX = nodeLayout.x - nodeLayout.width / 2 - this.HORIZONTAL_GAP;

      node.children.forEach(child => {
        const childSubH = this.getNodeSubtreeHeight(child, level + 1);
        const childY = currentY + childSubH / 2;
        this.layoutSubtreeLeft(child, nextX, childY, level + 1, 'left', nodeLayout, nodes, links);
        currentY += childSubH + this.VERTICAL_GAP;
      });
    }
  }

  // 2. Right Tree Layout (Tất cả sang phải)
  layoutRight(root, nodes, links) {
    const rootSize = this.estimateNodeSize(root, 0);
    const rootNodeLayout = {
      id: root.id,
      node: root,
      x: (root.offsetX || 0),
      y: (root.offsetY || 0),
      width: rootSize.width,
      height: rootSize.height,
      level: 0,
      direction: 'center'
    };
    nodes.push(rootNodeLayout);

    if (root.children && root.children.length > 0 && !root.collapsed) {
      const totalH = this.calculateSubtreeHeight(root.children, 1);
      let currentY = rootNodeLayout.y - totalH / 2;
      const startX = rootNodeLayout.x + rootSize.width / 2 + this.HORIZONTAL_GAP;

      root.children.forEach(child => {
        const subH = this.getNodeSubtreeHeight(child, 1);
        const childY = currentY + subH / 2;
        this.layoutSubtreeRight(child, startX, childY, 1, 'right', rootNodeLayout, nodes, links);
        currentY += subH + this.VERTICAL_GAP;
      });
    }
  }

  // 3. Top-Down Layout (Org Chart)
  layoutTopDown(root, nodes, links) {
    const rootSize = this.estimateNodeSize(root, 0);
    const rootNodeLayout = {
      id: root.id,
      node: root,
      x: (root.offsetX || 0),
      y: (root.offsetY || 0),
      width: rootSize.width,
      height: rootSize.height,
      level: 0,
      direction: 'down'
    };
    nodes.push(rootNodeLayout);

    if (root.children && root.children.length > 0 && !root.collapsed) {
      const totalW = this.calculateSubtreeWidthTopDown(root.children, 1);
      let currentX = rootNodeLayout.x - totalW / 2;
      const nextY = rootNodeLayout.y + rootSize.height / 2 + this.TOPDOWN_V_GAP;

      root.children.forEach(child => {
        const subW = this.getNodeSubtreeWidthTopDown(child, 1);
        const childX = currentX + subW / 2;
        this.layoutSubtreeTopDown(child, childX, nextY, 1, rootNodeLayout, nodes, links);
        currentX += subW + this.TOPDOWN_H_GAP;
      });
    }
  }

  layoutSubtreeTopDown(node, x, y, level, parentLayout, nodes, links) {
    const size = this.estimateNodeSize(node, level);
    const nodeLayout = {
      id: node.id,
      node: node,
      x: x + (node.offsetX || 0),
      y: y + size.height / 2 + (node.offsetY || 0),
      width: size.width,
      height: size.height,
      level: level,
      direction: 'down'
    };
    nodes.push(nodeLayout);

    links.push({
      fromId: parentLayout.id,
      toId: node.id,
      fromNode: parentLayout,
      toNode: nodeLayout,
      fromX: parentLayout.x,
      fromY: parentLayout.y + parentLayout.height / 2,
      toX: nodeLayout.x,
      toY: nodeLayout.y - nodeLayout.height / 2,
      color: node.color || parentLayout.node.color || null,
      direction: 'down'
    });

    if (node.children && node.children.length > 0 && !node.collapsed) {
      const totalW = this.calculateSubtreeWidthTopDown(node.children, level + 1);
      let currentX = nodeLayout.x - totalW / 2;
      const nextY = nodeLayout.y + nodeLayout.height / 2 + this.TOPDOWN_V_GAP;

      node.children.forEach(child => {
        const subW = this.getNodeSubtreeWidthTopDown(child, level + 1);
        const childX = currentX + subW / 2;
        this.layoutSubtreeTopDown(child, childX, nextY, level + 1, nodeLayout, nodes, links);
        currentX += subW + this.TOPDOWN_H_GAP;
      });
    }
  }

  // Helpers tính chiều cao / rộng subtree
  getNodeSubtreeHeight(node, level) {
    const selfSize = this.estimateNodeSize(node, level);
    if (!node.children || node.children.length === 0 || node.collapsed) {
      return selfSize.height;
    }
    const childrenH = this.calculateSubtreeHeight(node.children, level + 1);
    return Math.max(selfSize.height, childrenH);
  }

  calculateSubtreeHeight(children, level) {
    if (!children || children.length === 0) return 0;
    let total = 0;
    children.forEach((child, idx) => {
      total += this.getNodeSubtreeHeight(child, level);
      if (idx < children.length - 1) total += this.VERTICAL_GAP;
    });
    return total;
  }

  getNodeSubtreeWidthTopDown(node, level) {
    const selfSize = this.estimateNodeSize(node, level);
    if (!node.children || node.children.length === 0 || node.collapsed) {
      return selfSize.width;
    }
    const childrenW = this.calculateSubtreeWidthTopDown(node.children, level + 1);
    return Math.max(selfSize.width, childrenW);
  }

  calculateSubtreeWidthTopDown(children, level) {
    if (!children || children.length === 0) return 0;
    let total = 0;
    children.forEach((child, idx) => {
      total += this.getNodeSubtreeWidthTopDown(child, level);
      if (idx < children.length - 1) total += this.TOPDOWN_H_GAP;
    });
    return total;
  }
}

window.layoutEngine = new LayoutEngine();
