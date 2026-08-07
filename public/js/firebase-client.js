/**
 * Firebase Client API Connector with Firebase Realtime Database Live Sync & SSE
 */

class FirebaseClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.isConnected = false;
    this.isSyncing = false;
    this.syncListeners = [];
    this.lastSavedTimestamp = null;
    this.eventSource = null;

    this.init();
    this.initRealtimeStream();
  }

  onSyncStatusChange(callback) {
    this.syncListeners.push(callback);
  }

  notifyStatus(status, detail = '') {
    this.syncListeners.forEach(cb => cb(status, detail));
  }

  async init() {
    try {
      const res = await fetch(`${this.baseUrl}/api/status`);
      if (res.ok) {
        const data = await res.json();
        this.isConnected = data.firebaseInitialized && data.rtdbWorking;
        if (this.isConnected) {
          this.notifyStatus('synced', `Firebase Realtime DB (Live)`);
        } else {
          this.notifyStatus('offline', 'Chế độ Offline (Local Storage)');
        }
      } else {
        this.isConnected = false;
        this.notifyStatus('offline', 'Server Offline (Local Storage)');
      }
    } catch (e) {
      this.isConnected = false;
      this.notifyStatus('offline', 'Local Storage Fallback');
    }
  }

  initRealtimeStream() {
    try {
      if (typeof EventSource !== 'undefined') {
        this.eventSource = new EventSource(`${this.baseUrl}/api/realtime-stream`);
        this.eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'map_updated') {
              // Nếu Cloud Drawer đang mở, tự động cập nhật danh sách
              if (window.uiController?.cloudDrawer?.classList.contains('active')) {
                window.uiController.renderCloudMapsList();
              }
            }
          } catch (err) {}
        };
        this.eventSource.onerror = () => {
          // EventSource tự động reconnect
        };
      }
    } catch (err) {
      console.warn('[Realtime Stream] EventSource không khả dụng:', err);
    }
  }

  async getMindmaps() {
    try {
      const res = await fetch(`${this.baseUrl}/api/mindmaps`);
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách mindmap từ Realtime DB, dùng LocalStorage:', err);
    }
    // Fallback LocalStorage
    return this.getLocalMindmapsList();
  }

  async getMindmap(id) {
    try {
      const res = await fetch(`${this.baseUrl}/api/mindmaps/${id}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn(`Lỗi tải mindmap ${id} từ Realtime DB:`, err);
    }
    // Fallback
    const local = localStorage.getItem(`mindmap_${id}`);
    if (local) {
      try { return JSON.parse(local); } catch(e) {}
    }
    return null;
  }

  async saveMindmap(mindmapData) {
    this.notifyStatus('syncing', 'Đang lưu Realtime DB...');
    
    // Lưu local backup
    try {
      localStorage.setItem(`mindmap_${mindmapData.id}`, JSON.stringify(mindmapData));
      this.updateLocalMindmapsIndex(mindmapData);
    } catch (e) {}

    try {
      const res = await fetch(`${this.baseUrl}/api/mindmaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mindmapData)
      });
      if (res.ok) {
        const result = await res.json();
        this.lastSavedTimestamp = new Date().toLocaleTimeString();
        this.notifyStatus('synced', `Đã lưu Realtime DB lúc ${this.lastSavedTimestamp}`);
        return { success: true, data: result.data };
      }
    } catch (err) {
      console.warn('Không thể kết nối Realtime DB API, đã lưu vào LocalStorage:', err);
    }

    this.lastSavedTimestamp = new Date().toLocaleTimeString();
    this.notifyStatus('offline', `Đã lưu Local lúc ${this.lastSavedTimestamp}`);
    return { success: true, localOnly: true, data: mindmapData };
  }

  async deleteMindmap(id) {
    try {
      await fetch(`${this.baseUrl}/api/mindmaps/${id}`, { method: 'DELETE' });
    } catch (e) {}
    
    // Delete local
    localStorage.removeItem(`mindmap_${id}`);
    const list = this.getLocalMindmapsList().filter(m => m.id !== id);
    localStorage.setItem('mindmaps_index', JSON.stringify(list));
    return { success: true };
  }

  getLocalMindmapsList() {
    try {
      const raw = localStorage.getItem('mindmaps_index');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  updateLocalMindmapsIndex(mindmapData) {
    const list = this.getLocalMindmapsList().filter(m => m.id !== mindmapData.id);
    list.unshift({
      id: mindmapData.id,
      title: mindmapData.title,
      theme: mindmapData.theme,
      layout: mindmapData.layout,
      nodeCount: window.MindmapTree ? MindmapTree.countNodes(mindmapData.root) : 1,
      updatedAt: new Date().toISOString()
    });
    localStorage.setItem('mindmaps_index', JSON.stringify(list));
  }
}

window.firebaseClient = new FirebaseClient();
