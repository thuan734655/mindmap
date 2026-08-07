/**
 * Real-time Two-Way Sync between Markdown Outline and Mindmap Tree
 */

class OutlineSync {
  constructor() {
    this.editor = document.getElementById('outline-editor');
    this.isUpdatingFromTree = false;
    this.debounceTimer = null;

    if (this.editor) {
      this.editor.addEventListener('input', () => this.onEditorInput());
      this.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
    }
  }

  // Chuyển Tree Object -> Markdown Text
  treeToMarkdown(root) {
    if (!root) return '';
    let output = `# ${root.text || 'Sơ đồ tư duy'}\n`;
    if (root.children && root.children.length > 0) {
      root.children.forEach(child => {
        output += this.nodeToMarkdownLines(child, 0);
      });
    }
    return output;
  }

  nodeToMarkdownLines(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let checkPrefix = '';
    if (node.checked !== null && node.checked !== undefined) {
      checkPrefix = node.checked ? '[x] ' : '[ ] ';
    }
    const emojiPrefix = node.emoji ? `${node.emoji} ` : '';
    let line = `${indent}- ${checkPrefix}${emojiPrefix}${node.text || 'Nhánh'}\n`;

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        line += this.nodeToMarkdownLines(child, depth + 1);
      });
    }
    return line;
  }

  // Chuyển Markdown Text -> Tree Object
  markdownToTree(mdText) {
    const lines = mdText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return MindmapTree.createDefaultRoot('Sơ đồ tư duy');
    }

    let rootText = 'Sơ đồ tư duy';
    let startIndex = 0;

    // Kiểm tra dòng đầu có phải là # Title không
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('#')) {
      rootText = firstLine.replace(/^#+\s*/, '').trim();
      startIndex = 1;
    }

    const rootNode = MindmapTree.createNode(rootText, { shape: 'pill', emoji: '💡' });
    rootNode.children = [];

    // Stack lưu trữ phân cấp cây theo indent level
    const stack = [{ depth: -1, node: rootNode }];

    for (let i = startIndex; i < lines.length; i++) {
      const rawLine = lines[i];
      // Đo số khoảng trắng thụt đầu dòng (2 spaces = 1 depth level, hoặc 1 tab = 1 depth level)
      const leadingSpaces = rawLine.match(/^\s*/)[0];
      let depth = 0;
      for (const ch of leadingSpaces) {
        if (ch === '\t') depth += 1;
        else depth += 0.5;
      }
      depth = Math.floor(depth);

      // Parse nội dung line
      let content = rawLine.trim();
      content = content.replace(/^[-*+]\s+/, ''); // Xóa bullet dash

      let checked = null;
      if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
        checked = true;
        content = content.substr(4);
      } else if (content.startsWith('[ ] ')) {
        checked = false;
        content = content.substr(4);
      }

      const newNode = MindmapTree.createNode(content.trim() || 'Nhánh mới', {
        checked,
        shape: 'rounded'
      });

      // Tìm cha phù hợp trong stack
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      const parentItem = stack[stack.length - 1];
      parentItem.node.children.push(newNode);
      stack.push({ depth, node: newNode });
    }

    return rootNode;
  }

  // Cập nhật nội dung editor từ tree hiện tại
  updateEditorFromTree(root) {
    if (!this.editor) return;
    this.isUpdatingFromTree = true;
    this.editor.value = this.treeToMarkdown(root);
    this.isUpdatingFromTree = false;
  }

  // Khi người dùng gõ vào editor -> cập nhật Mindmap
  onEditorInput() {
    if (this.isUpdatingFromTree) return;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      const newRoot = this.markdownToTree(this.editor.value);
      window.appState.replaceRootFromOutline(newRoot);
    }, 350);
  }

  // Hỗ trợ gõ phím Tab trong textarea
  handleEditorKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.editor.selectionStart;
      const end = this.editor.selectionEnd;
      this.editor.value = this.editor.value.substring(0, start) + '  ' + this.editor.value.substring(end);
      this.editor.selectionStart = this.editor.selectionEnd = start + 2;
      this.onEditorInput();
    }
  }
}

window.outlineSync = new OutlineSync();
