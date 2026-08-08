# 🧠 MindFlow - Ứng Dụng Web Mindmap & Đồng Bộ Firebase Realtime Database

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Firebase-Realtime_DB-orange?style=for-the-badge&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/UI-Glassmorphism-blueviolet?style=for-the-badge" alt="Glassmorphism UI" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License MIT" />
</p>

**MindFlow** là ứng dụng sơ đồ tư duy (Mindmap) trên nền tảng Web hiện đại, mượt mà và trực quan với phong cách thiết kế **Glassmorphism**. Ứng dụng hỗ trợ thao tác kéo thả tự do, phím tắt siêu tốc, đồng bộ dữ liệu thời gian thực lên đám mây **Firebase Realtime Database**, thảo luận bình luận trên từng nhánh và đồng bộ 2 chiều với văn bản Markdown Outline.

---

## ✨ Tính Năng Nổi Bật

### 1. 🎨 Không Gian Vẽ Canvas Hiện Đại & Tự Do
- **Vô hạn & Mượt mà**: Thu phóng (Zoom 20% - 300%), di chuyển khung nhìn (Pan) tự do bằng chuột giữa hoặc `Space + Kéo chuột`.
- **Tự do di chuyển nhánh (Free Dragging)**: Giữ và kéo bất kỳ nhánh nào đến vị trí mong muốn trong không gian. Đường nối thông minh (Smart Bezier Connectors) tự động uốn lượn mềm mại theo tọa độ của từng node.
- **Chỉnh sửa trực quan**: Nhấp đúp chuột (**Double-click**) hoặc nhấn `F2` để chỉnh sửa tiêu đề node trực tiếp.
- **Minimap toàn cảnh**: Widget điều hướng nhanh góc nhìn bản đồ góc phải màn hình.

### 2. 💬 Bình Luận & Thảo Luận Trên Từng Nhánh (Node Comments)
- **Huy hiệu số lượng (Badge)**: Hiển thị số lượng bình luận trực tiếp trên node kèm hiệu ứng phát sáng.
- **Side Drawer thảo luận**: Bảng trượt hiển thị danh sách ý kiến đóng góp, avatar, tên người gửi, thời gian tương đối (`vừa xong`, `X phút trước`...) và nút xóa bình luận.
- **Phím tắt nhanh**: Nhấn `Shift + C` hoặc click vào icon bình luận để mở nhanh bảng thảo luận.

### 3. 🔥 Đồng Bộ Đám Mây Firebase Realtime Database
- **Lưu trữ thời gian thực**: Tự động lưu (Auto-save) và đồng bộ dữ liệu tức thì lên **Firebase Realtime Database**.
- **Quản lý nhiều sơ đồ (Multi-maps Manager)**: Tạo mới, đổi tên, chuyển đổi qua lại giữa các sơ đồ qua hệ thống Tab hoặc Drawer quản lý Cloud.
- **Cơ chế lưu trữ ngoại tuyến**: Tự động sao lưu LocalStorage nếu mất kết nối mạng.

### 4. 📝 Đồng Bộ 2 Chiều Markdown Outline ⇄ Mindmap
- Soạn thảo danh sách thụt đầu dòng dạng Markdown (`- Chủ đề chính`, `  - Nhánh con`), Mindmap sẽ tự động cập nhật cấu trúc đồ họa và ngược lại.

### 5. 🏷️ Tùy Biến Node Sâu Sắc
- Tùy chỉnh màu sắc cá nhân hóa, hình dạng node (*Rounded, Pill, Box, Underline*).
- Gắn **Emoji**, **Thẻ nhãn (Tags)**, **Checkbox hoàn thành**, **Ghi chú chi tiết (Notes)** và **Liên kết Web (URL)**.
- Cho phép chỉnh sửa và tùy biến cả **Node gốc (Root Node)**.

### 6. 📊 3 Bố Cục Thông Minh (Auto-Layout) & 5 Giao Diện (Themes)
- **Bố cục**: *Radial Mindmap (Cân bằng 2 phía), Right-Tree (Phát triển sang phải), Org-Chart (Phân cấp từ trên xuống)*.
- **Giao diện**: *🌙 Midnight Cyber, ☀️ Clean Minimal, 🌸 Pastel Bloom, 🌲 Nordic Forest, 🌌 Obsidian Nebula*. Hỗ trợ chuyển đổi nhanh Light / Dark Mode.

### 7. 📤 Xuất & Nhập Dữ Liệu Đa Dạng
- Xuất ảnh **PNG siêu nét** (2x HD Resolution), ảnh vector **SVG**.
- Xuất & Nhập file **JSON sao lưu** và định dạng **Markdown (.md)**.

### 8. 🎥 Chế Độ Thuyết Trình (Presentation Mode)
- Nhấn `F5` hoặc nút Thuyết trình để kích hoạt chế độ toàn màn hình, tự động chiếu sáng (Spotlight) và điều hướng từng nhánh theo kịch bản.

---

## ⌨️ Bảng Phím Tắt Tiện Dụng

| Phím tắt | Chức năng |
| :--- | :--- |
| <kbd>Tab</kbd> | Tạo nhánh con (Child Node) |
| <kbd>F2</kbd> / Double Click | Chỉnh sửa văn bản trực tiếp trên nhánh |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Xóa nhánh đang chọn |
| <kbd>Shift</kbd> + <kbd>C</kbd> | Mở bảng Bình luận & Thảo luận nhánh |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Di chuyển chọn các node lân cận trong không gian |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Hoàn tác / Làm lại (Undo / Redo) |
| <kbd>Space</kbd> + Kéo chuột | Di chuyển khung nhìn Canvas (Pan) |
| <kbd>Ctrl</kbd> + Cuộn chuột | Thu phóng màn hình (Zoom) |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Lưu tức thời lên Cloud |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | Tạo sơ đồ tư duy mới |
| <kbd>F5</kbd> / <kbd>Esc</kbd> | Bật / Tắt chế độ Thuyết trình |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên.
- Trình quản lý gói `npm` (đi kèm sẵn với Node.js).

### 2. Cài Đặt Thư Viện
Mở terminal tại thư mục dự án và chạy:

```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (`.env`)
Tạo file `.env` tại thư mục gốc (tham khảo từ file `.env.example`):

```bash
cp .env.example .env
```

Điền các thông số kết nối Firebase của bạn vào `.env`:

```env
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

> 🔒 **Lưu ý bảo mật**: File `.env` và các file private key `.json` đã được cấu hình trong `.gitignore` để không bao giờ bị lộ khi commit lên Git.

### 4. Khởi Chạy Ứng Dụng

```bash
npm start
```

Mở trình duyệt và truy cập:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Cấu Trúc Mã Nguồn

```
mindmap/
├── .env.example            # Mẫu cấu hình biến môi trường
├── .gitignore              # Chặn commit thông tin nhạy cảm và node_modules
├── server.js               # Backend Node.js Express + Firebase Realtime DB REST API
├── package.json            # Quản lý dependencies (express, cors, firebase-admin, dotenv)
├── index.html              # Cấu trúc giao diện Mindmap Web App
├── README.md               # Tài liệu hướng dẫn sử dụng dự án
├── css/
│   ├── main.css            # Hệ thống biến thiết kế, glassmorphism, modal & tooltip
│   ├── canvas.css          # Tùy biến Canvas, SVG connectors, node styling & comment badges
│   ├── toolbar.css         # Thanh công cụ top, context bar, minimap & side drawers
│   └── themes.css          # 5 bảng màu giao diện chủ đề (Light & Dark)
└── js/
    ├── app.js              # Khởi tạo và liên kết các module ứng dụng
    ├── state.js            # Quản lý State tập trung, Undo/Redo, Comments & Auto-save
    ├── firebase-client.js  # Client API kết nối Backend Firebase qua SSE & Fetch
    ├── mindmap-tree.js     # Cấu trúc dữ liệu cây Node & Comments CRUD
    ├── layout-engine.js    # Thuật toán Auto-Layout (Radial, Right-Tree, Org-Chart)
    ├── renderer.js         # Engine render SVG Bezier, DOM Node Layer & Minimap
    ├── interaction.js      # Xử lý tương tác chuột, kéo thả tự do, phím tắt & inline edit
    ├── outline-sync.js     # Đồng bộ 2 chiều Markdown Outline
    ├── export-import.js    # Xuất ảnh PNG HD, SVG, sao lưu JSON & Markdown
    ├── templates.js        # Mẫu Mindmap có sẵn (Roadmap, SWOT, Brainstorming...)
    └── ui-controller.js    # Điều khiển giao diện, Side Drawers, Modal & Toast
```

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **MIT License**.