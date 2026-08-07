require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname)));

// Service account config path (dùng làm fallback nếu không có trong .env)
const serviceAccountPath = path.join(__dirname, 'test-11432-firebase-adminsdk-9kcxe-ec224caec0.json');

let rtdb = null;
let firebaseInitialized = false;
let firebaseStatusMessage = 'Chưa khởi tạo';
const DATABASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://test-11432-default-rtdb.firebaseio.com';

// Fallback local storage file if offline (sử dụng /tmp khi chạy trên Vercel Serverless)
const LOCAL_DATA_FILE = process.env.VERCEL
  ? path.join('/tmp', '.local_mindmaps_backup.json')
  : path.join(__dirname, '.local_mindmaps_backup.json');

// Realtime SSE connected clients
const sseClients = new Set();

function loadLocalBackup() {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Lỗi đọc local backup:', err);
  }
  return {};
}

function saveLocalBackup(data) {
  try {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi ghi local backup:', err);
  }
}

// Phục vụ trang index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi tạo Firebase Admin SDK với cấu hình từ file .env (hoặc JSON fallback)
try {
  let credential = null;
  let projectId = process.env.FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    // Ưu tiên sử dụng thông tin trực tiếp từ file .env
    const formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formattedPrivateKey
    });
    console.log('[Firebase Config] Đang tải thông tin xác thực từ file .env');
  } else if (fs.existsSync(serviceAccountPath)) {
    // Fallback nếu chưa cấu hình .env
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    projectId = serviceAccount.project_id || projectId || 'test-11432';
    credential = admin.credential.cert(serviceAccount);
    console.log(`[Firebase Config] Đang tải thông tin xác thực từ file JSON: ${path.basename(serviceAccountPath)}`);
  }

  if (credential) {
    admin.initializeApp({
      credential: credential,
      projectId: projectId || 'test-11432',
      databaseURL: DATABASE_URL
    });

    rtdb = admin.database();
    firebaseInitialized = true;
    firebaseStatusMessage = `Đã kết nối Firebase Realtime Database (URL: ${DATABASE_URL})`;
    console.log(`[Firebase Realtime DB] ${firebaseStatusMessage}`);

    // Lắng nghe thay đổi Realtime để broadcast cho các tab/client đang mở
    rtdb.ref('mindmaps').on('child_changed', (snapshot) => {
      const updatedMap = snapshot.val();
      if (updatedMap && updatedMap.id) {
        broadcastSSE({ type: 'map_updated', id: updatedMap.id, title: updatedMap.title, updatedAt: updatedMap.updatedAt });
      }
    });

    rtdb.ref('mindmaps').on('child_removed', (snapshot) => {
      const removedMap = snapshot.val();
      if (removedMap && removedMap.id) {
        broadcastSSE({ type: 'map_deleted', id: removedMap.id });
      }
    });

  } else {
    firebaseStatusMessage = `Không tìm thấy thông tin xác thực Firebase trong .env hoặc file JSON`;
    console.warn(`[Firebase Realtime DB] ${firebaseStatusMessage}`);
  }
} catch (err) {
  firebaseStatusMessage = `Lỗi khởi tạo Firebase: ${err.message}`;
  console.error('[Firebase Realtime DB] Initialization error:', err);
}

// Broadcast SSE event to all connected clients
function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

// --- REST & REALTIME API ENDPOINTS ---

// 1. Realtime Server-Sent Events (SSE) Stream
app.get('/api/realtime-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: {"type":"connected","message":"Firebase Realtime Stream Active"}\n\n');

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 2. Kiểm tra trạng thái kết nối
app.get('/api/status', async (req, res) => {
  let rtdbWorking = false;
  let errorDetail = null;

  if (firebaseInitialized && rtdb) {
    try {
      const pingRef = rtdb.ref('_healthcheck/ping');
      await pingRef.set({ lastPing: Date.now() });
      rtdbWorking = true;
    } catch (e) {
      errorDetail = e.message;
    }
  }

  res.json({
    success: true,
    firebaseInitialized,
    rtdbWorking,
    databaseType: 'Firebase Realtime Database',
    databaseURL: DATABASE_URL,
    projectId: 'test-11432',
    statusMessage: firebaseStatusMessage,
    errorDetail,
    timestamp: new Date().toISOString()
  });
});

// 3. Lấy danh sách tất cả mindmap (Metadata)
app.get('/api/mindmaps', async (req, res) => {
  try {
    if (firebaseInitialized && rtdb) {
      try {
        const snapshot = await rtdb.ref('mindmaps').once('value');
        const rawObj = snapshot.val() || {};
        const mindmaps = Object.values(rawObj).map(item => ({
          id: item.id,
          title: item.title || 'Sơ đồ không tên',
          theme: item.theme || 'midnight',
          layout: item.layout || 'radial',
          nodeCount: item.nodeCount || countNodes(item.root),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        return res.json({ success: true, source: 'firebase_realtime_db', data: mindmaps });
      } catch (rtdbErr) {
        console.warn('[Firebase RTDB] Lỗi đọc danh sách, chuyển sang local backup:', rtdbErr.message);
      }
    }

    // Fallback to local file backup
    const localDb = loadLocalBackup();
    const list = Object.values(localDb).map(item => ({
      id: item.id,
      title: item.title || 'Sơ đồ không tên',
      theme: item.theme || 'midnight',
      layout: item.layout || 'radial',
      nodeCount: item.nodeCount || countNodes(item.root),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    res.json({ success: true, source: 'local_fallback', data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Lấy chi tiết 1 mindmap
app.get('/api/mindmaps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (firebaseInitialized && rtdb) {
      try {
        const snapshot = await rtdb.ref(`mindmaps/${id}`).once('value');
        const data = snapshot.val();
        if (data) {
          return res.json({ success: true, source: 'firebase_realtime_db', data });
        }
      } catch (rtdbErr) {
        console.warn(`[Firebase RTDB] Lỗi lấy map ${id}:`, rtdbErr.message);
      }
    }

    // Fallback local
    const localDb = loadLocalBackup();
    if (localDb[id]) {
      return res.json({ success: true, source: 'local_fallback', data: localDb[id] });
    }

    res.status(404).json({ success: false, error: 'Không tìm thấy Mindmap với ID: ' + id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Tạo mới hoặc lưu cập nhật mindmap
app.post('/api/mindmaps', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.root) {
      return res.status(400).json({ success: false, error: 'Dữ liệu mindmap không hợp lệ (thiếu root node)' });
    }

    const id = payload.id || `map_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const nodeCount = countNodes(payload.root);

    const mindmapData = {
      id,
      title: payload.title || payload.root.text || 'Sơ đồ tư duy mới',
      theme: payload.theme || 'midnight',
      layout: payload.layout || 'radial',
      root: payload.root,
      crossLinks: payload.crossLinks || [],
      nodeCount,
      createdAt: payload.createdAt || now,
      updatedAt: now
    };

    let savedToRTDB = false;
    if (firebaseInitialized && rtdb) {
      try {
        await rtdb.ref(`mindmaps/${id}`).set(mindmapData);
        savedToRTDB = true;
      } catch (rtdbErr) {
        console.warn('[Firebase RTDB] Lỗi lưu vào Realtime Database:', rtdbErr.message);
      }
    }

    // Luôn lưu bản sao vào local backup để đảm bảo an toàn tuyệt đối
    const localDb = loadLocalBackup();
    localDb[id] = mindmapData;
    saveLocalBackup(localDb);

    res.json({
      success: true,
      savedToRTDB,
      source: savedToRTDB ? 'firebase_realtime_db' : 'local_backup',
      data: mindmapData,
      message: savedToRTDB ? 'Đã lưu thành công lên Firebase Realtime Database!' : 'Đã lưu vào bộ nhớ dự phòng'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Cập nhật mindmap
app.put('/api/mindmaps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const payload = req.body;
    const now = new Date().toISOString();
    const nodeCount = payload.root ? countNodes(payload.root) : undefined;

    const updateData = {
      ...payload,
      id,
      updatedAt: now
    };
    if (nodeCount !== undefined) {
      updateData.nodeCount = nodeCount;
    }

    let updatedRTDB = false;
    if (firebaseInitialized && rtdb) {
      try {
        await rtdb.ref(`mindmaps/${id}`).update(updateData);
        updatedRTDB = true;
      } catch (rtdbErr) {
        console.warn('[Firebase RTDB] Lỗi cập nhật Realtime Database:', rtdbErr.message);
      }
    }

    // Local backup
    const localDb = loadLocalBackup();
    localDb[id] = { ...(localDb[id] || {}), ...updateData };
    saveLocalBackup(localDb);

    res.json({
      success: true,
      updatedRTDB,
      data: localDb[id],
      message: 'Cập nhật thành công'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Xóa mindmap
app.delete('/api/mindmaps/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let deletedRTDB = false;
    if (firebaseInitialized && rtdb) {
      try {
        await rtdb.ref(`mindmaps/${id}`).remove();
        deletedRTDB = true;
      } catch (rtdbErr) {
        console.warn('[Firebase RTDB] Lỗi xóa Realtime Database:', rtdbErr.message);
      }
    }

    const localDb = loadLocalBackup();
    if (localDb[id]) {
      delete localDb[id];
      saveLocalBackup(localDb);
    }

    res.json({
      success: true,
      deletedRTDB,
      message: 'Đã xóa mindmap thành công'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Đếm số lượng node
function countNodes(node) {
  if (!node) return 0;
  let count = 1;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

// Khởi động server (chỉ lắng nghe cổng khi chạy trực tiếp qua node server.js / npm start)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Mindmap Web App đang chạy tại: http://localhost:${PORT}`);
    console.log(`🔥 Firebase Realtime DB URL: ${DATABASE_URL}`);
    console.log(`⚡ API Endpoints: http://localhost:${PORT}/api/mindmaps`);
    console.log(`=================================================`);
  });
}

module.exports = app;
