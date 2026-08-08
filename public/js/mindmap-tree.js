/**
 * Mindmap Tree Data Structure & Operations
 */

class MindmapTree {
  static generateId(prefix = 'node') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  static createBlankRoot(text = 'Chủ đề chính') {
    const rootId = this.generateId('root');
    return {
      id: rootId,
      text: text,
      shape: 'pill',
      color: '#6366f1',
      emoji: '💡',
      collapsed: false,
      children: []
    };
  }

  static createDefaultRoot(text = 'Sơ đồ tư duy mới') {
    const rootId = this.generateId('root');
    return {
      id: rootId,
      text: text,
      shape: 'pill',
      color: '#6366f1',
      emoji: '💡',
      collapsed: false,
      children: [
        {
          id: this.generateId('node'),
          text: 'Ý tưởng & Khái niệm',
          color: '#3b82f6',
          shape: 'rounded',
          emoji: '🚀',
          collapsed: false,
          children: [
            { id: this.generateId('node'), text: 'Mục tiêu chính', color: '#3b82f6', shape: 'rounded', children: [] },
            { id: this.generateId('node'), text: 'Phạm vi triển khai', color: '#3b82f6', shape: 'rounded', children: [] }
          ]
        },
        {
          id: this.generateId('node'),
          text: 'Kế hoạch hành động',
          color: '#8b5cf6',
          shape: 'rounded',
          emoji: '📋',
          collapsed: false,
          children: [
            { id: this.generateId('node'), text: 'Giai đoạn 1: Chuẩn bị', color: '#8b5cf6', shape: 'rounded', checked: true, children: [] },
            { id: this.generateId('node'), text: 'Giai đoạn 2: Thực thi', color: '#8b5cf6', shape: 'rounded', checked: false, children: [] }
          ]
        },
        {
          id: this.generateId('node'),
          text: 'Tài nguyên & Công cụ',
          color: '#10b981',
          shape: 'rounded',
          emoji: '🛠️',
          collapsed: false,
          children: [
            { id: this.generateId('node'), text: 'Nhân sự tham gia', color: '#10b981', shape: 'rounded', children: [] },
            { id: this.generateId('node'), text: 'Công nghệ sử dụng', color: '#10b981', shape: 'rounded', tags: ['Tech', 'Cloud'], children: [] }
          ]
        },
        {
          id: this.generateId('node'),
          text: 'Đánh giá & Kết quả',
          color: '#f59e0b',
          shape: 'rounded',
          emoji: '📊',
          collapsed: false,
          children: [
            { id: this.generateId('node'), text: 'Chỉ số đo lường KPI', color: '#f59e0b', shape: 'rounded', children: [] },
            { id: this.generateId('node'), text: 'Báo cáo tổng kết', color: '#f59e0b', shape: 'rounded', children: [] }
          ]
        }
      ]
    };
  }

  static createNode(text = 'Ý mới', options = {}) {
    return {
      id: this.generateId('node'),
      text: text,
      color: options.color || null,
      shape: options.shape || 'rounded',
      emoji: options.emoji || null,
      tags: options.tags || [],
      link: options.link || null,
      notes: options.notes || null,
      comments: options.comments || [],
      checked: options.checked !== undefined ? options.checked : null,
      collapsed: false,
      children: options.children || []
    };
  }

  static findNode(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = this.findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  static findParent(root, id, parent = null) {
    if (!root) return null;
    if (root.id === id) return parent;
    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = this.findParent(child, id, root);
        if (found) return found;
      }
    }
    return null;
  }

  static getNodeDepth(root, id, depth = 0) {
    if (!root) return -1;
    if (root.id === id) return depth;
    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        const d = this.getNodeDepth(child, id, depth + 1);
        if (d !== -1) return d;
      }
    }
    return -1;
  }

  static addChild(root, parentId, text = 'Nhánh con mới', options = {}) {
    const parent = this.findNode(root, parentId);
    if (!parent) return null;
    if (!parent.children) parent.children = [];
    
    // Kế thừa màu nếu node con chưa chỉ định
    const color = options.color || parent.color || null;
    const newNode = this.createNode(text, { ...options, color });
    parent.children.push(newNode);
    parent.collapsed = false;
    return newNode;
  }

  static addSibling(root, targetId, text = 'Nhánh mới', options = {}) {
    const parent = this.findParent(root, targetId);
    if (!parent) return null; // Root không có sibling
    
    const index = parent.children.findIndex(c => c.id === targetId);
    const color = options.color || parent.children[index]?.color || parent.color || null;
    const newNode = this.createNode(text, { ...options, color });
    
    parent.children.splice(index + 1, 0, newNode);
    return newNode;
  }

  static deleteNode(root, id) {
    if (root.id === id) return false; // Không xóa root
    const parent = this.findParent(root, id);
    if (!parent || !parent.children) return false;
    const index = parent.children.findIndex(c => c.id === id);
    if (index !== -1) {
      parent.children.splice(index, 1);
      return true;
    }
    return false;
  }

  static reparentNode(root, nodeId, newParentId, targetIndex = null) {
    if (nodeId === root.id || nodeId === newParentId) return false;
    // Kiểm tra không được di chuyển cha vào con của chính nó
    const movingNode = this.findNode(root, nodeId);
    if (!movingNode) return false;
    if (this.findNode(movingNode, newParentId)) return false; // Loop cycle prevent

    const oldParent = this.findParent(root, nodeId);
    const newParent = this.findNode(root, newParentId);
    if (!oldParent || !newParent) return false;

    // Xóa khỏi old parent
    const oldIndex = oldParent.children.findIndex(c => c.id === nodeId);
    if (oldIndex === -1) return false;
    oldParent.children.splice(oldIndex, 1);

    // Thêm vào new parent
    if (!newParent.children) newParent.children = [];
    if (targetIndex !== null && targetIndex >= 0 && targetIndex <= newParent.children.length) {
      newParent.children.splice(targetIndex, 0, movingNode);
    } else {
      newParent.children.push(movingNode);
    }
    newParent.collapsed = false;
    return true;
  }

  static toggleCollapse(node) {
    if (!node || !node.children || node.children.length === 0) return;
    node.collapsed = !node.collapsed;
  }

  static countNodes(root) {
    if (!root) return 0;
    let count = 1;
    if (Array.isArray(root.children)) {
      for (const child of root.children) {
        count += this.countNodes(child);
      }
    }
    return count;
  }

  static addComment(root, nodeId, commentDataOrText, authorName) {
    const node = this.findNode(root, nodeId);
    if (!node) return null;
    if (!node.comments) node.comments = [];

    let text = '';
    let translation = '';
    let author = 'Bạn';
    let avatar = '💬';
    let createdAt = new Date().toISOString();

    if (typeof commentDataOrText === 'object' && commentDataOrText !== null) {
      text = commentDataOrText.text || '';
      translation = commentDataOrText.translation || '';
      author = commentDataOrText.author || 'Bạn';
      avatar = commentDataOrText.avatar || '💬';
      createdAt = commentDataOrText.createdAt || new Date().toISOString();
    } else {
      text = String(commentDataOrText || '');
      author = authorName || 'Bạn';
    }

    const newComment = {
      id: this.generateId('cmt'),
      author: author.trim(),
      avatar: avatar,
      text: text.trim(),
      translation: (translation || '').trim(),
      createdAt: createdAt
    };
    node.comments.push(newComment);
    return newComment;
  }

  static deleteComment(root, nodeId, commentId) {
    const node = this.findNode(root, nodeId);
    if (!node || !node.comments) return false;
    const initialLen = node.comments.length;
    node.comments = node.comments.filter(c => c.id !== commentId);
    return node.comments.length < initialLen;
  }

  static updateComment(root, nodeId, commentId, updateDataOrText) {
    const node = this.findNode(root, nodeId);
    if (!node || !node.comments) return null;
    const c = node.comments.find(item => item.id === commentId);
    if (c) {
      if (typeof updateDataOrText === 'object' && updateDataOrText !== null) {
        if (updateDataOrText.text !== undefined) c.text = updateDataOrText.text.trim();
        if (updateDataOrText.translation !== undefined) c.translation = updateDataOrText.translation.trim();
      } else {
        c.text = String(updateDataOrText || '').trim();
      }
      c.updatedAt = new Date().toISOString();
      return c;
    }
    return null;
  }

  static cloneTree(root) {
    return JSON.parse(JSON.stringify(root));
  }
}

window.MindmapTree = MindmapTree;
