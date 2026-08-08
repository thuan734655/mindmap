/**
 * UI Controller - Manages Top Navigation, Modals, Drawers, Context Toolbar & Toasts
 */

class UIController {
  constructor() {
    this.activeDropdown = null;
    this.presentationActive = false;
    this.presentationNodes = [];
    this.presentationIndex = 0;

    this.initElements();
    this.bindEvents();
    this.renderTemplatesGrid();
  }

  initElements() {
    // Header elements
    this.mapTitleInput = document.getElementById('map-title-input');
    this.cloudStatusBadge = document.getElementById('cloud-status-badge');
    this.cloudStatusText = document.getElementById('cloud-status-text');

    // Tabs container
    this.tabsContainer = document.getElementById('tabs-container');

    // Drawers
    this.outlineDrawer = document.getElementById('outline-drawer');
    this.cloudDrawer = document.getElementById('cloud-drawer');
    this.commentsDrawer = document.getElementById('comments-drawer');

    // Comments Elements
    this.commentTargetNodeTitle = document.getElementById('comment-target-node-title');
    this.commentsListContainer = document.getElementById('comments-list-container');
    this.commentAuthorInput = document.getElementById('comment-author-input');
    this.commentComposeTextarea = document.getElementById('comment-compose-textarea');
    this.commentComposeTranslation = document.getElementById('comment-compose-translation');
    this.btnToggleTranslationInput = document.getElementById('btn-toggle-translation-input');
    this.btnSendComment = document.getElementById('btn-send-comment');
    this.activeCommentNodeId = null;

    // Modals
    this.newMapModal = document.getElementById('new-map-modal');
    this.templatesModal = document.getElementById('templates-modal');
    this.shortcutsModal = document.getElementById('shortcuts-modal');
    this.inputModal = document.getElementById('input-modal');

    // Node Context Toolbar
    this.nodeToolbar = document.getElementById('node-toolbar');
  }

  bindEvents() {
    // 1. Map Title Change
    if (this.mapTitleInput) {
      this.mapTitleInput.addEventListener('change', () => {
        const newTitle = this.mapTitleInput.value.trim() || 'Sơ đồ tư duy mới';
        window.appState.updateMapTitle(newTitle);
      });
    }

    // 2. Undo / Redo
    document.getElementById('btn-undo')?.addEventListener('click', () => window.appState.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => window.appState.redo());

    // 3. Dropdown toggles
    this.setupDropdown('btn-layout-dropdown', 'layout-menu');
    this.setupDropdown('btn-theme-dropdown', 'theme-menu');
    this.setupDropdown('btn-export-dropdown', 'export-menu');

    // 4. Layout selector actions
    document.querySelectorAll('#layout-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const layout = e.currentTarget.dataset.layout;
        if (layout) {
          window.appState.setLayout(layout);
          document.getElementById('current-layout-label').textContent = e.currentTarget.textContent.split(' ')[1] + ' ' + (e.currentTarget.textContent.split(' ')[2] || '');
          this.closeAllDropdowns();
        }
      });
    });

    document.getElementById('btn-reset-layout')?.addEventListener('click', () => {
      window.appState.resetAllNodeOffsets();
      this.closeAllDropdowns();
    });

    // 5. Theme selector actions
    document.querySelectorAll('#theme-menu .dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        if (theme) {
          window.appState.setTheme(theme);
          this.closeAllDropdowns();
        }
      });
    });

    // 6. Fast Light / Dark Mode Toggle
    const btnToggleDarkMode = document.getElementById('btn-toggle-darkmode');
    if (btnToggleDarkMode) {
      btnToggleDarkMode.addEventListener('click', () => {
        const currentTheme = window.appState.currentMap.theme || 'midnight';
        if (currentTheme === 'minimal-light') {
          window.appState.setTheme('midnight');
        } else {
          window.appState.setTheme('minimal-light');
        }
      });
    }

    // 7. Export Actions
    document.getElementById('btn-export-png')?.addEventListener('click', () => {
      window.exportImportEngine.exportPNG();
      this.closeAllDropdowns();
    });
    document.getElementById('btn-export-svg')?.addEventListener('click', () => {
      window.exportImportEngine.exportSVG();
      this.closeAllDropdowns();
    });
    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      window.exportImportEngine.exportJSON();
      this.closeAllDropdowns();
    });
    document.getElementById('btn-export-md')?.addEventListener('click', () => {
      window.exportImportEngine.exportMarkdown();
      this.closeAllDropdowns();
    });
    document.getElementById('btn-import-file')?.addEventListener('click', () => {
      window.exportImportEngine.triggerFileInput();
      this.closeAllDropdowns();
    });

    // 8. New Mindmap Actions & Modals
    document.getElementById('btn-quick-create-map')?.addEventListener('click', () => this.openNewMapModal());
    document.getElementById('btn-tab-add-new')?.addEventListener('click', () => this.openNewMapModal());
    document.getElementById('btn-new-map')?.addEventListener('click', () => {
      this.closeDrawer(this.cloudDrawer);
      this.openNewMapModal();
    });
    document.getElementById('btn-close-new-map-modal')?.addEventListener('click', () => this.closeModal(this.newMapModal));
    document.getElementById('btn-cancel-new-map')?.addEventListener('click', () => this.closeModal(this.newMapModal));
    
    document.getElementById('btn-confirm-new-map')?.addEventListener('click', () => {
      const title = document.getElementById('new-map-title-input')?.value.trim() || 'Sơ đồ tư duy mới';
      const templateId = document.getElementById('new-map-template-select')?.value || 'blank';
      const layout = document.getElementById('new-map-layout-select')?.value || 'radial';
      const theme = document.getElementById('new-map-theme-select')?.value || 'midnight';

      window.appState.createNewMap({ title, templateId, layout, theme });
      this.closeModal(this.newMapModal);
    });

    // Duplicate current map button
    document.getElementById('btn-duplicate-current')?.addEventListener('click', () => {
      window.appState.duplicateMap();
      this.closeDrawer(this.cloudDrawer);
    });

    // Realtime search in Cloud drawer
    const searchInput = document.getElementById('cloud-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.loadCloudMapsList(e.target.value.trim());
      });
    }

    // 9. Drawer Toggles & Closes
    const toggleOutlineBtn = document.getElementById('btn-toggle-outline');
    if (toggleOutlineBtn) {
      toggleOutlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDrawer(this.outlineDrawer);
      });
    }

    const closeOutlineBtn = document.getElementById('btn-close-outline');
    if (closeOutlineBtn) {
      closeOutlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDrawer(this.outlineDrawer);
      });
    }

    const openCloudBtn = document.getElementById('btn-open-cloud');
    if (openCloudBtn) {
      openCloudBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDrawer(this.cloudDrawer);
        this.loadCloudMapsList();
      });
    }

    const closeCloudBtn = document.getElementById('btn-close-cloud');
    if (closeCloudBtn) {
      closeCloudBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDrawer(this.cloudDrawer);
      });
    }

    document.getElementById('btn-refresh-cloud')?.addEventListener('click', () => {
      const kw = document.getElementById('cloud-search-input')?.value || '';
      this.loadCloudMapsList(kw);
    });

    // 10. Comments Drawer Events
    const closeCommentsBtn = document.getElementById('btn-close-comments');
    if (closeCommentsBtn) {
      closeCommentsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDrawer(this.commentsDrawer);
      });
    }

    if (this.btnToggleTranslationInput) {
      this.btnToggleTranslationInput.addEventListener('click', () => {
        if (this.commentComposeTranslation) {
          const isHidden = this.commentComposeTranslation.classList.toggle('hidden');
          if (!isHidden) {
            this.commentComposeTranslation.focus();
          }
        }
      });
    }

    if (this.btnSendComment) {
      this.btnSendComment.addEventListener('click', () => this.handleSendComment());
    }

    if (this.commentComposeTextarea) {
      this.commentComposeTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
          e.preventDefault();
          this.handleSendComment();
        }
      });
    }

    if (this.commentComposeTranslation) {
      this.commentComposeTranslation.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.handleSendComment();
        }
      });
    }

    if (this.commentAuthorInput) {
      const savedAuthor = localStorage.getItem('mindmap_author_name');
      if (savedAuthor) {
        this.commentAuthorInput.value = savedAuthor;
      }
      this.commentAuthorInput.addEventListener('change', () => {
        const name = this.commentAuthorInput.value.trim() || 'Bạn';
        localStorage.setItem('mindmap_author_name', name);
      });
    }

    // 11. Modals
    document.getElementById('btn-open-templates')?.addEventListener('click', () => this.openModal(this.templatesModal));
    document.getElementById('btn-close-templates-modal')?.addEventListener('click', () => this.closeModal(this.templatesModal));
    document.getElementById('btn-shortcuts-help')?.addEventListener('click', () => this.openModal(this.shortcutsModal));
    document.getElementById('btn-close-shortcuts-modal')?.addEventListener('click', () => this.closeModal(this.shortcutsModal));
    document.getElementById('btn-close-input-modal')?.addEventListener('click', () => this.closeModal(this.inputModal));
    document.getElementById('btn-cancel-input-modal')?.addEventListener('click', () => this.closeModal(this.inputModal));

    // 12. Zoom / Canvas Controls
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => window.mindmapRenderer.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => window.mindmapRenderer.zoomOut());
    document.getElementById('btn-fit-view')?.addEventListener('click', () => window.mindmapRenderer.fitView());
    document.getElementById('btn-center-root')?.addEventListener('click', () => window.mindmapRenderer.centerRoot());

    // 13. Presentation Mode Button
    document.getElementById('btn-presentation')?.addEventListener('click', () => this.togglePresentationMode());

    // 14. Context Toolbar Actions
    this.bindNodeToolbarEvents();

    // Close dropdowns & drawers on canvas click or Esc
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('#btn-layout-dropdown') && !e.target.closest('#btn-theme-dropdown') && !e.target.closest('#btn-export-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDrawer(this.outlineDrawer);
        this.closeDrawer(this.cloudDrawer);
        this.closeDrawer(this.commentsDrawer);
        this.closeModal(this.newMapModal);
        this.closeModal(this.templatesModal);
        this.closeModal(this.shortcutsModal);
        this.closeModal(this.inputModal);
      }

      // Ctrl + N: Tạo sơ đồ mới
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.openNewMapModal();
      }
    });
  }

  // --- FLOATING NODE TOOLBAR ACTIONS ---

  bindNodeToolbarEvents() {
    // Add child
    document.getElementById('tb-add-child')?.addEventListener('click', () => {
      if (window.appState.selectedNodeId) {
        const newNode = window.appState.addChildNode(window.appState.selectedNodeId);
        if (newNode) {
          window.appState.setSelectedNode(newNode.id);
          window.interactionManager.startNodeEdit(newNode.id, true);
        }
      }
    });

    // Add sibling
    document.getElementById('tb-add-sibling')?.addEventListener('click', () => {
      if (window.appState.selectedNodeId) {
        const newNode = window.appState.addSiblingNode(window.appState.selectedNodeId);
        if (newNode) {
          window.appState.setSelectedNode(newNode.id);
          window.interactionManager.startNodeEdit(newNode.id, true);
        }
      }
    });

    // Edit text
    document.getElementById('tb-edit-text')?.addEventListener('click', () => {
      if (window.appState.selectedNodeId) {
        window.interactionManager.startNodeEdit(window.appState.selectedNodeId);
      }
    });

    // Color Swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        if (window.appState.selectedNodeId && color) {
          window.appState.updateNodeProperties(window.appState.selectedNodeId, { color });
        }
      });
    });

    // Shape Toggle
    document.getElementById('tb-shape-toggle')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const node = MindmapTree.findNode(window.appState.currentMap.root, window.appState.selectedNodeId);
      if (!node) return;
      const shapes = ['rounded', 'pill', 'box', 'underline'];
      const nextShape = shapes[(shapes.indexOf(node.shape || 'rounded') + 1) % shapes.length];
      window.appState.updateNodeProperties(window.appState.selectedNodeId, { shape: nextShape });
    });

    // Emoji Picker
    document.getElementById('tb-emoji-picker')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const emojis = ['💡', '🚀', '🎯', '✨', '🔥', '📌', '⭐', '✔️', '❓', '⚠️', '🛠️', '📊', '💼', '❤️'];
      let html = `<div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; font-size: 22px;">`;
      emojis.forEach(em => {
        html += `<button class="btn btn-secondary btn-icon" style="font-size: 20px;" onclick="window.appState.updateNodeProperties(window.appState.selectedNodeId, { emoji: '${em}' }); window.uiController.closeModal(window.uiController.inputModal);">${em}</button>`;
      });
      html += `</div><div style="margin-top: 12px; text-align: right;"><button class="btn btn-sm btn-danger" onclick="window.appState.updateNodeProperties(window.appState.selectedNodeId, { emoji: null }); window.uiController.closeModal(window.uiController.inputModal);">Xóa Emoji</button></div>`;

      this.openInputModal('Chọn biểu tượng Emoji', html, null);
    });

    // Checkbox Toggle
    document.getElementById('tb-checkbox-toggle')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const node = MindmapTree.findNode(window.appState.currentMap.root, window.appState.selectedNodeId);
      if (!node) return;
      const newChecked = node.checked === null || node.checked === undefined ? false : null;
      window.appState.updateNodeProperties(window.appState.selectedNodeId, { checked: newChecked });
    });

    // Add Tag
    document.getElementById('tb-add-tag')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const node = MindmapTree.findNode(window.appState.currentMap.root, window.appState.selectedNodeId);
      const currentTags = (node.tags || []).join(', ');

      const html = `
        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">Nhập các thẻ nhãn (phân tách bởi dấu phẩy):</label>
        <input type="text" id="modal-tag-input" class="map-title-input" style="width: 100%; max-width: 100%; border: 1px solid var(--border-glass);" value="${currentTags}" placeholder="Ví dụ: Dev, Priority, Bug">
      `;

      this.openInputModal('Gắn nhãn (Tags)', html, () => {
        const val = document.getElementById('modal-tag-input').value;
        const tags = val.split(',').map(t => t.trim()).filter(t => t.length > 0);
        window.appState.updateNodeProperties(window.appState.selectedNodeId, { tags });
      });
    });

    // Add Link
    document.getElementById('tb-add-link')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const node = MindmapTree.findNode(window.appState.currentMap.root, window.appState.selectedNodeId);
      const currentLink = node.link || '';

      const html = `
        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">Nhập đường dẫn URL (https://...):</label>
        <input type="url" id="modal-link-input" class="map-title-input" style="width: 100%; max-width: 100%; border: 1px solid var(--border-glass);" value="${currentLink}" placeholder="https://example.com">
      `;

      this.openInputModal('Liên kết Website', html, () => {
        const val = document.getElementById('modal-link-input').value.trim();
        window.appState.updateNodeProperties(window.appState.selectedNodeId, { link: val || null });
      });
    });

    // Add Note
    document.getElementById('tb-add-note')?.addEventListener('click', () => {
      if (!window.appState.selectedNodeId) return;
      const node = MindmapTree.findNode(window.appState.currentMap.root, window.appState.selectedNodeId);
      const currentNotes = node.notes || '';

      const html = `
        <label style="display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px;">Nội dung ghi chú chi tiết cho nhánh:</label>
        <textarea id="modal-notes-input" style="width: 100%; height: 120px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-glass); border-radius: 6px; padding: 8px; color: var(--text-primary); font-family: inherit; font-size: 13px;" placeholder="Ghi chú thêm...">${currentNotes}</textarea>
      `;

      this.openInputModal('Ghi chú chi tiết', html, () => {
        const val = document.getElementById('modal-notes-input').value.trim();
        window.appState.updateNodeProperties(window.appState.selectedNodeId, { notes: val || null });
      });
    });

    // Comments / Discussion Drawer
    document.getElementById('tb-add-comment')?.addEventListener('click', () => {
      if (window.appState.selectedNodeId) {
        window.appState.openCommentsDrawer(window.appState.selectedNodeId);
      }
    });

    // Delete Node
    document.getElementById('tb-delete-node')?.addEventListener('click', () => {
      window.appState.deleteSelectedNode();
    });
  }

  // --- DROPDOWN & DRAWER HELPERS ---

  setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = menu.classList.contains('active');
      this.closeAllDropdowns();
      if (!isActive) {
        menu.classList.add('active');
        this.activeDropdown = menu;
      }
    });
  }

  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
    this.activeDropdown = null;
  }

  toggleDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.toggle('open');
  }

  closeDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.remove('open');
  }

  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
  }

  openInputModal(title, htmlContent, onConfirmCallback) {
    document.getElementById('input-modal-title').textContent = title;
    document.getElementById('input-modal-content').innerHTML = htmlContent;

    const confirmBtn = document.getElementById('btn-confirm-input-modal');
    confirmBtn.onclick = () => {
      if (onConfirmCallback) onConfirmCallback();
      this.closeModal(this.inputModal);
    };

    this.openModal(this.inputModal);
  }

  // --- UPDATE THEME UI ---

  updateThemeUI(themeName) {
    const icon = document.getElementById('darkmode-icon');
    const btn = document.getElementById('btn-toggle-darkmode');
    if (themeName === 'minimal-light') {
      if (icon) icon.textContent = '🌙';
      if (btn) {
        btn.setAttribute('data-tooltip', 'Chuyển sang Chế độ Tối (Dark)');
        btn.title = 'Chuyển sang Chế độ Tối (Dark)';
      }
    } else {
      if (icon) icon.textContent = '☀️';
      if (btn) {
        btn.setAttribute('data-tooltip', 'Chuyển sang Chế độ Sáng (Light)');
        btn.title = 'Chuyển sang Chế độ Sáng (Light)';
      }
    }

    // Cập nhật active indicator trong menu theme
    document.querySelectorAll('#theme-menu .dropdown-item').forEach(item => {
      if (item.dataset.theme === themeName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // --- UPDATE CLOUD STATUS BADGE ---

  updateCloudStatus(status, text) {
    if (!this.cloudStatusBadge) return;
    this.cloudStatusBadge.className = `cloud-status-badge status-${status}`;
    if (this.cloudStatusText) {
      this.cloudStatusText.textContent = text;
    }
  }

  // --- UPDATE CONTEXT TOOLBAR STATE ---

  updateNodeToolbar(selectedNodeId) {
    if (!this.nodeToolbar) return;
    if (selectedNodeId) {
      this.nodeToolbar.classList.add('active');
      const isRoot = window.appState?.currentMap?.root?.id === selectedNodeId;
      const deleteBtn = document.getElementById('tb-delete-node');
      if (deleteBtn) {
        deleteBtn.setAttribute('data-tooltip', isRoot ? 'Xóa sơ đồ & đặt lại nút gốc (Delete)' : 'Xóa nhánh này (Delete)');
        deleteBtn.title = isRoot ? 'Xóa sơ đồ & đặt lại nút gốc (Delete)' : 'Xóa nhánh này (Delete)';
      }
    } else {
      this.nodeToolbar.classList.remove('active');
    }
  }

  // --- MULTI-TAB MINDMAP BAR ---

  renderTabs() {
    const container = this.tabsContainer || document.getElementById('tabs-container');
    if (!container || !window.appState) return;

    const tabs = window.appState.openTabs || [];
    const currentId = window.appState.currentMap ? window.appState.currentMap.id : null;

    let html = '';
    tabs.forEach(tab => {
      const isCurrent = tab.id === currentId;
      html += `
        <div class="mindmap-tab ${isCurrent ? 'active' : ''}" onclick="window.appState.loadMapById('${tab.id}')" title="${this.escapeHtml(tab.title)}">
          <span class="tab-icon">🧠</span>
          <span class="tab-title">${this.escapeHtml(tab.title || 'Sơ đồ')}</span>
          <span class="tab-close" onclick="window.appState.closeTab('${tab.id}', event)" title="Đóng tab">&times;</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- OPEN NEW MAP MODAL ---

  openNewMapModal() {
    const titleInput = document.getElementById('new-map-title-input');
    if (titleInput) {
      titleInput.value = 'Sơ đồ tư duy mới';
    }
    const themeSelect = document.getElementById('new-map-theme-select');
    if (themeSelect && window.appState?.currentMap?.theme) {
      themeSelect.value = window.appState.currentMap.theme;
    }
    const layoutSelect = document.getElementById('new-map-layout-select');
    if (layoutSelect && window.appState?.currentMap?.layout) {
      layoutSelect.value = window.appState.currentMap.layout;
    }

    this.openModal(this.newMapModal);
    setTimeout(() => {
      titleInput?.focus();
      titleInput?.select();
    }, 100);
  }

  // --- LOAD CLOUD MAPS LIST IN DRAWER ---

  async loadCloudMapsList(filterKeyword = '') {
    const listContainer = document.getElementById('cloud-maps-list');
    if (!listContainer) return;

    listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px;">Đang tải danh sách từ Firebase...</div>`;

    const maps = await window.firebaseClient.getMindmaps();
    if (!maps || maps.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có sơ đồ nào trên Cloud.<br>Hãy tạo hoặc lưu sơ đồ hiện tại!</div>`;
      return;
    }

    let filtered = maps;
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase();
      filtered = maps.filter(m => (m.title || '').toLowerCase().includes(kw));
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Không tìm thấy sơ đồ nào khớp với "${this.escapeHtml(filterKeyword)}"</div>`;
      return;
    }

    let html = '';
    filtered.forEach(m => {
      const isCurrent = window.appState.currentMap && window.appState.currentMap.id === m.id;
      const updatedTime = m.updatedAt ? new Date(m.updatedAt).toLocaleString('vi-VN') : 'Gần đây';

      html += `
        <div class="cloud-map-item ${isCurrent ? 'active' : ''}" onclick="window.appState.loadMapById('${m.id}')">
          <div style="flex: 1; overflow: hidden;">
            <div class="cloud-map-title">${this.escapeHtml(m.title || 'Sơ đồ')}</div>
            <div class="cloud-map-meta">📊 ${m.nodeCount || 1} nhánh • 🕒 ${updatedTime}</div>
          </div>
          <div style="display: flex; gap: 4px;" onclick="event.stopPropagation();">
            <button class="btn btn-icon btn-sm btn-secondary" onclick="window.appState.duplicateMap('${m.id}'); window.uiController.closeDrawer(window.uiController.cloudDrawer);" title="Nhân bản sơ đồ này">
              📋
            </button>
            <button class="btn btn-icon btn-sm btn-danger" onclick="window.uiController.confirmDeleteMap('${m.id}', '${this.escapeHtml(m.title)}');" title="Xóa sơ đồ">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  async confirmDeleteMap(id, title) {
    if (confirm(`Bạn có chắc muốn xóa sơ đồ "${title}" khỏi Firebase Cloud không?`)) {
      await window.firebaseClient.deleteMindmap(id);
      window.appState?.closeTab(id);
      this.showToast(`Đã xóa "${title}"`, 'info');
      const kw = document.getElementById('cloud-search-input')?.value || '';
      this.loadCloudMapsList(kw);
    }
  }

  // --- TEMPLATES GRID ---

  renderTemplatesGrid() {
    const grid = document.getElementById('templates-grid');
    if (!grid || !window.MINDMAP_TEMPLATES) return;

    let html = '';
    window.MINDMAP_TEMPLATES.forEach(tpl => {
      html += `
        <div class="glass-panel" style="padding: 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent-primary)'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-glass)'; this.style.transform='translateY(0)';" onclick="window.appState.applyTemplate('${tpl.id}'); window.uiController.closeModal(window.uiController.templatesModal);">
          <div style="font-size: 26px; margin-bottom: 8px;">${tpl.icon}</div>
          <h4 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;">${tpl.title}</h4>
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">${tpl.desc}</p>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  // --- PRESENTATION / ZEN MODE ---

  togglePresentationMode() {
    this.presentationActive = !this.presentationActive;
    const body = document.body;

    if (this.presentationActive) {
      body.classList.add('presentation-mode');
      this.showToast('Bật chế độ Thuyết trình (Nhấn Esc hoặc F5 để thoát)', 'info');
      this.presentationNodes = window.mindmapRenderer.currentLayoutData?.nodes || [];
      this.presentationIndex = 0;
      this.spotlightNode(this.presentationIndex);
    } else {
      body.classList.remove('presentation-mode');
      document.querySelectorAll('.mind-node.spotlight').forEach(el => el.classList.remove('spotlight'));
    }
  }

  spotlightNode(index) {
    if (!this.presentationNodes || this.presentationNodes.length === 0) return;
    document.querySelectorAll('.mind-node.spotlight').forEach(el => el.classList.remove('spotlight'));

    const item = this.presentationNodes[index];
    if (item) {
      const el = document.getElementById(`node-el-${item.id}`);
      if (el) {
        el.classList.add('spotlight');
        // Zoom focus smoothly
        window.mindmapRenderer.panX = window.mindmapRenderer.container.clientWidth / 2 - item.x * window.mindmapRenderer.scale;
        window.mindmapRenderer.panY = window.mindmapRenderer.container.clientHeight / 2 - item.y * window.mindmapRenderer.scale;
        window.mindmapRenderer.applyTransform();
      }
    }
  }

  // --- TOAST NOTIFICATIONS ---

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- NODE COMMENTS & DISCUSSIONS ---

  openCommentsDrawer(nodeId) {
    if (!this.commentsDrawer) return;
    this.activeCommentNodeId = nodeId;
    this.closeDrawer(this.outlineDrawer);
    this.closeDrawer(this.cloudDrawer);
    this.commentsDrawer.classList.add('open');
    this.renderCommentsDrawer(nodeId);

    // Focus vào ô nhập bình luận
    setTimeout(() => {
      if (this.commentComposeTextarea) {
        this.commentComposeTextarea.focus();
      }
    }, 150);
  }

  renderCommentsDrawer(nodeId) {
    if (!this.commentsDrawer) return;
    const targetId = nodeId || this.activeCommentNodeId;
    if (!targetId || !window.appState.currentMap.root) return;

    const node = MindmapTree.findNode(window.appState.currentMap.root, targetId);
    if (!node) return;

    // Cập nhật tiêu đề node đang chọn
    if (this.commentTargetNodeTitle) {
      const nodeEmoji = node.emoji ? `${node.emoji} ` : '';
      this.commentTargetNodeTitle.textContent = `${nodeEmoji}${node.text || 'Nhánh không tên'}`;
    }

    const comments = node.comments || [];
    if (!this.commentsListContainer) return;

    if (comments.length === 0) {
      this.commentsListContainer.innerHTML = `
        <div class="comments-empty-state">
          <div class="empty-icon">💬</div>
          <div class="empty-title">Chưa có bình luận nào</div>
          <div class="empty-desc">Hãy để lại ý kiến đóng góp hoặc ghi chú thảo luận cho nhánh này bên dưới.</div>
        </div>
      `;
      return;
    }

    let html = '';
    comments.forEach(cmt => {
      const authorInitial = (cmt.author || 'B').trim().charAt(0).toUpperCase();
      const timeStr = this.formatTimeAgo(cmt.createdAt);
      const editedBadge = cmt.updatedAt ? `<span class="comment-edited-badge" title="Đã sửa lúc ${new Date(cmt.updatedAt).toLocaleString('vi-VN')}">(đã sửa)</span>` : '';
      const hasTranslation = Boolean(cmt.translation && cmt.translation.trim());

      html += `
        <div class="comment-card" id="comment-card-${cmt.id}" data-comment-id="${cmt.id}">
          <div class="comment-card-header">
            <div class="comment-author-avatar">${authorInitial}</div>
            <div class="comment-meta">
              <span class="comment-author-name">${this.escapeHtml(cmt.author || 'Bạn')}</span>
              <span class="comment-timestamp" title="${cmt.createdAt ? new Date(cmt.createdAt).toLocaleString('vi-VN') : ''}">
                ${timeStr} ${editedBadge}
              </span>
            </div>
            <div class="comment-actions">
              <button class="btn btn-icon btn-sm btn-comment-trans" title="${hasTranslation ? 'Sửa bản dịch (🇯🇵/🇻🇳)' : '+ Thêm bản dịch (🇯🇵/🇻🇳)'}" onclick="window.uiController.startEditComment('${targetId}', '${cmt.id}', true)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              </button>
              <button class="btn btn-icon btn-sm btn-comment-edit" title="Chỉnh sửa bình luận" onclick="window.uiController.startEditComment('${targetId}', '${cmt.id}', false)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn btn-icon btn-sm btn-comment-delete" title="Xóa bình luận" onclick="window.appState.deleteNodeComment('${targetId}', '${cmt.id}')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div class="comment-card-body" id="comment-body-${cmt.id}">
            <div class="comment-main-text" ondblclick="window.uiController.startEditComment('${targetId}', '${cmt.id}', false)" title="Nhấp đúp để chỉnh sửa">${this.formatCommentText(cmt.text)}</div>
            ${hasTranslation ? `
              <div class="comment-translation-box" ondblclick="window.uiController.startEditComment('${targetId}', '${cmt.id}', true)" title="Nhấp đúp để sửa bản dịch">
                <div class="comment-translation-header">
                  <span class="translation-tag">🌐 Bản dịch (🇯🇵 日本語 / 🇻🇳 Tiếng Việt)</span>
                </div>
                <div class="comment-translation-text">${this.formatCommentText(cmt.translation)}</div>
              </div>
            ` : `
              <div class="comment-translation-add-btn">
                <button class="btn btn-ghost btn-xs btn-add-trans" onclick="window.uiController.startEditComment('${targetId}', '${cmt.id}', true)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  <span>+ Thêm bản dịch (🇯🇵/🇻🇳)</span>
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    });

    this.commentsListContainer.innerHTML = html;

    // Scroll xuống cuối danh sách
    const drawerBody = document.getElementById('comments-drawer-body');
    if (drawerBody) {
      drawerBody.scrollTop = drawerBody.scrollHeight;
    }
  }

  startEditComment(nodeId, commentId, focusTranslation = false) {
    const card = document.getElementById(`comment-card-${commentId}`);
    if (!card) return;

    const node = MindmapTree.findNode(window.appState.currentMap.root, nodeId);
    if (!node || !node.comments) return;

    const cmt = node.comments.find(c => c.id === commentId);
    if (!cmt) return;

    const bodyEl = document.getElementById(`comment-body-${commentId}`);
    if (!bodyEl) return;

    if (card.classList.contains('is-editing')) return;
    card.classList.add('is-editing');

    bodyEl.innerHTML = `
      <div class="comment-edit-form">
        <div class="edit-field-group">
          <label class="edit-field-label">📝 Nội dung chính (Tiếng Việt / 日本語):</label>
          <textarea class="comment-edit-textarea" id="comment-edit-input-${commentId}" rows="2" placeholder="Nội dung chính...">${this.escapeHtml(cmt.text || '')}</textarea>
        </div>
        <div class="edit-field-group">
          <label class="edit-field-label">🌐 Bản dịch (🇯🇵 日本語 / 🇻🇳 Tiếng Việt):</label>
          <textarea class="comment-edit-textarea comment-trans-textarea" id="comment-edit-trans-${commentId}" rows="2" placeholder="Nhập bản dịch tiếng Nhật hoặc tiếng Việt...">${this.escapeHtml(cmt.translation || '')}</textarea>
        </div>
        <div class="comment-edit-actions">
          <button class="btn btn-ghost btn-xs btn-cancel-comment-edit" onclick="window.uiController.cancelEditComment('${nodeId}', '${commentId}')">Hủy</button>
          <button class="btn btn-primary btn-xs btn-save-comment-edit" onclick="window.uiController.saveEditComment('${nodeId}', '${commentId}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Lưu thay đổi (Ctrl+Enter)</span>
          </button>
        </div>
      </div>
    `;

    const mainInput = document.getElementById(`comment-edit-input-${commentId}`);
    const transInput = document.getElementById(`comment-edit-trans-${commentId}`);

    const targetInput = (focusTranslation && transInput) ? transInput : mainInput;
    if (targetInput) {
      targetInput.focus();
      targetInput.setSelectionRange(targetInput.value.length, targetInput.value.length);
    }

    [mainInput, transInput].forEach(textarea => {
      if (!textarea) return;
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.saveEditComment(nodeId, commentId);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.cancelEditComment(nodeId, commentId);
        }
      });
    });
  }

  saveEditComment(nodeId, commentId) {
    const mainInput = document.getElementById(`comment-edit-input-${commentId}`);
    const transInput = document.getElementById(`comment-edit-trans-${commentId}`);
    if (!mainInput && !transInput) return;

    const newText = mainInput ? mainInput.value.trim() : '';
    const newTranslation = transInput ? transInput.value.trim() : '';

    if (!newText && !newTranslation) {
      this.showToast('Vui lòng nhập nội dung bình luận hoặc bản dịch', 'warning');
      return;
    }

    window.appState.updateNodeComment(nodeId, commentId, {
      text: newText,
      translation: newTranslation
    });
  }

  cancelEditComment(nodeId, commentId) {
    this.renderCommentsDrawer(nodeId);
  }

  handleSendComment() {
    if (!this.activeCommentNodeId) return;
    const text = this.commentComposeTextarea ? this.commentComposeTextarea.value.trim() : '';
    const translation = this.commentComposeTranslation ? this.commentComposeTranslation.value.trim() : '';
    if (!text && !translation) return;

    const author = (this.commentAuthorInput ? this.commentAuthorInput.value.trim() : '') || 'Bạn';
    localStorage.setItem('mindmap_author_name', author);

    window.appState.addNodeComment(this.activeCommentNodeId, text, author, translation);

    if (this.commentComposeTextarea) {
      this.commentComposeTextarea.value = '';
    }
    if (this.commentComposeTranslation) {
      this.commentComposeTranslation.value = '';
      this.commentComposeTranslation.classList.add('hidden');
    }
  }

  formatTimeAgo(isoString) {
    if (!isoString) return 'Vừa xong';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 45) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  formatCommentText(text) {
    if (!text) return '';
    const escaped = this.escapeHtml(text);
    // Convert newlines to <br>
    return escaped.replace(/\n/g, '<br>');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.uiController = new UIController();
