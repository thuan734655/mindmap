/**
 * Built-in Mindmap Templates
 */

const MINDMAP_TEMPLATES = [
  {
    id: 'tpl_roadmap',
    title: 'Lộ trình Phát triển Sản phẩm (Roadmap)',
    desc: 'Lập kế hoạch các giai đoạn Q1, Q2, Q3 và tính năng cốt lõi',
    icon: '🚀',
    theme: 'midnight',
    layout: 'radial',
    root: {
      id: 'root_roadmap',
      text: 'Lộ trình Sản phẩm 2026',
      shape: 'pill',
      color: '#6366f1',
      emoji: '🚀',
      children: [
        {
          id: 'rm_q1',
          text: 'Quý 1: Khởi động & MVP',
          color: '#3b82f6',
          emoji: '🌱',
          children: [
            { id: 'rm_q1_1', text: 'Nghiên cứu thị trường & User Personas', checked: true },
            { id: 'rm_q1_2', text: 'Thiết kế UI/UX & Wireframes', checked: true },
            { id: 'rm_q1_3', text: 'Phát triển bản mẫu Alpha', checked: false }
          ]
        },
        {
          id: 'rm_q2',
          text: 'Quý 2: Tính năng Nâng cao',
          color: '#8b5cf6',
          emoji: '⚡',
          children: [
            { id: 'rm_q2_1', text: 'Tích hợp Firebase Cloud Realtime', checked: false },
            { id: 'rm_q2_2', text: 'Chế độ cộng tác nhiều người', checked: false },
            { id: 'rm_q2_3', text: 'Bộ công cụ xuất ảnh HD & SVG', checked: true }
          ]
        },
        {
          id: 'rm_q3',
          text: 'Quý 3: Mở rộng & Tăng trưởng',
          color: '#10b981',
          emoji: '📈',
          children: [
            { id: 'rm_q3_1', text: 'Chiến dịch tiếp thị số', checked: false },
            { id: 'rm_q3_2', text: 'Tối ưu hóa hiệu năng canvas', checked: false },
            { id: 'rm_q3_3', text: 'Thu thập phản hồi khách hàng', checked: false }
          ]
        },
        {
          id: 'rm_tech',
          text: 'Hạ tầng Kỹ thuật',
          color: '#06b6d4',
          emoji: '🛠️',
          children: [
            { id: 'rm_tech_1', text: 'Node.js & Express API', tags: ['Backend'] },
            { id: 'rm_tech_2', text: 'Firebase Firestore Database', tags: ['Database'] },
            { id: 'rm_tech_3', text: 'Hệ thống CI/CD Tự động', tags: ['DevOps'] }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_swot',
    title: 'Phân tích Chiến lược SWOT',
    desc: 'Đánh giá Điểm mạnh, Điểm yếu, Cơ hội và Thách thức',
    icon: '🎯',
    theme: 'nordic-forest',
    layout: 'radial',
    root: {
      id: 'root_swot',
      text: 'Phân tích SWOT Doanh nghiệp',
      shape: 'pill',
      color: '#10b981',
      emoji: '🎯',
      children: [
        {
          id: 'swot_s',
          text: 'Strengths (Điểm mạnh)',
          color: '#10b981',
          emoji: '💪',
          children: [
            { id: 'swot_s1', text: 'Đội ngũ kỹ thuật chuyên môn cao' },
            { id: 'swot_s2', text: 'Sản phẩm có trải nghiệm mượt mà' },
            { id: 'swot_s3', text: 'Khả năng tùy biến và mở rộng linh hoạt' }
          ]
        },
        {
          id: 'swot_w',
          text: 'Weaknesses (Điểm yếu)',
          color: '#f43f5e',
          emoji: '⚠️',
          children: [
            { id: 'swot_w1', text: 'Thương hiệu còn mới trên thị trường' },
            { id: 'swot_w2', text: 'Ngân sách marketing ban đầu có hạn' }
          ]
        },
        {
          id: 'swot_o',
          text: 'Opportunities (Cơ hội)',
          color: '#06b6d4',
          emoji: '🌟',
          children: [
            { id: 'swot_o1', text: 'Nhu cầu làm việc từ xa & tư duy thị giác tăng cao' },
            { id: 'swot_o2', text: 'Tiềm năng tích hợp Trí tuệ nhân tạo (AI)' }
          ]
        },
        {
          id: 'swot_t',
          text: 'Threats (Thách thức)',
          color: '#f59e0b',
          emoji: '🛡️',
          children: [
            { id: 'swot_t1', text: 'Sự cạnh tranh từ các đối thủ lớn' },
            { id: 'swot_t2', text: 'Biến động về chi phí công nghệ' }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_brainstorm',
    title: 'Buổi Động Não Ý Tưởng (Brainstorming)',
    desc: 'Thu thập và phân loại nhanh các sáng kiến sáng tạo',
    icon: '💡',
    theme: 'pastel-bloom',
    layout: 'radial',
    root: {
      id: 'root_brainstorm',
      text: 'Động Não: Ý Tưởng Dự Án Mới',
      shape: 'pill',
      color: '#ec4899',
      emoji: '💡',
      children: [
        {
          id: 'bs_1',
          text: 'Trải nghiệm Người dùng (UX)',
          color: '#f472b6',
          emoji: '✨',
          children: [
            { id: 'bs_1_1', text: 'Giao diện Glassmorphism hiện đại' },
            { id: 'bs_1_2', text: 'Thao tác phím tắt 1 chạm cực nhanh' },
            { id: 'bs_1_3', text: 'Chế độ trình chiếu thuyết trình mượt mà' }
          ]
        },
        {
          id: 'bs_2',
          text: 'Tính năng Đột phá',
          color: '#c084fc',
          emoji: '🔥',
          children: [
            { id: 'bs_2_1', text: 'Đồng bộ 2 chiều Markdown Outline' },
            { id: 'bs_2_2', text: 'Minimap tương tác toàn cảnh' },
            { id: 'bs_2_3', text: 'Gắn thẻ tags, checklist và liên kết ngoài' }
          ]
        },
        {
          id: 'bs_3',
          text: 'Lưu trữ & Đám mây',
          color: '#38bdf8',
          emoji: '☁️',
          children: [
            { id: 'bs_3_1', text: 'Firebase Cloud Firestore Admin SDK' },
            { id: 'bs_3_2', text: 'Tự động sao lưu ngoại tuyến Offline' }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_study',
    title: 'Kế hoạch Học tập & Ôn thi Tuần',
    desc: 'Phân chia môn học, bài tập và theo dõi tiến độ hàng ngày',
    icon: '📚',
    theme: 'minimal-light',
    layout: 'right',
    root: {
      id: 'root_study',
      text: 'Kế hoạch Học tập Tuần',
      shape: 'pill',
      color: '#2563eb',
      emoji: '📚',
      children: [
        {
          id: 'st_mon',
          text: 'Thứ Hai: Toán rời rạc & Cấu trúc dữ liệu',
          color: '#2563eb',
          children: [
            { id: 'st_m1', text: 'Ôn tập Thuật toán Cây & Đồ thị', checked: true },
            { id: 'st_m2', text: 'Làm 5 bài tập thuật toán LeetCode', checked: true }
          ]
        },
        {
          id: 'st_wed',
          text: 'Thứ Tư: Cơ sở Dữ liệu & Firebase',
          color: '#7c3aed',
          children: [
            { id: 'st_w1', text: 'Thiết kế mô hình NoSQL Firestore', checked: false },
            { id: 'st_w2', text: 'Tìm hiểu Firebase Admin SDK Rules', checked: true }
          ]
        },
        {
          id: 'st_fri',
          text: 'Thứ Sáu: Lập trình Web & Frontend Canvas',
          color: '#059669',
          children: [
            { id: 'st_f1', text: 'Tìm hiểu thuật toán vẽ Bezier Curve', checked: true },
            { id: 'st_f2', text: 'Hoàn thiện Mindmap Web App', checked: true }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_org',
    title: 'Sơ đồ Cơ cấu Tổ chức (Org Chart)',
    desc: 'Mô hình phân cấp quản lý từ trên xuống',
    icon: '🏛️',
    theme: 'obsidian-nebula',
    layout: 'top-down',
    root: {
      id: 'root_org',
      text: 'Ban Giám Đốc (CEO)',
      shape: 'box',
      color: '#a855f7',
      emoji: '👑',
      children: [
        {
          id: 'org_tech',
          text: 'Giám đốc Công nghệ (CTO)',
          color: '#6366f1',
          shape: 'box',
          children: [
            { id: 'org_t1', text: 'Trưởng nhóm Frontend' },
            { id: 'org_t2', text: 'Trưởng nhóm Backend & Cloud' }
          ]
        },
        {
          id: 'org_product',
          text: 'Giám đốc Sản phẩm (CPO)',
          color: '#ec4899',
          shape: 'box',
          children: [
            { id: 'org_p1', text: 'Trưởng nhóm Thiết kế UI/UX' },
            { id: 'org_p2', text: 'Quản lý Dự án (PM)' }
          ]
        },
        {
          id: 'org_growth',
          text: 'Giám đốc Tăng trưởng (CMO)',
          color: '#10b981',
          shape: 'box',
          children: [
            { id: 'org_g1', text: 'Chuyên viên Tiếp thị Kỹ thuật số' },
            { id: 'org_g2', text: 'Chăm sóc Khách hàng' }
          ]
        }
      ]
    }
  }
];

window.MINDMAP_TEMPLATES = MINDMAP_TEMPLATES;
