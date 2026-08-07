/**
 * Application Bootstrap Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Khởi động MindFlow Mindmap Application...');
  
  // Khởi tạo State & Render lần đầu
  window.appState.init();

  // Căn giữa màn hình sau khi tải xong layout
  setTimeout(() => {
    window.mindmapRenderer.centerRoot();
  }, 100);

  // Resize window handler để cập nhật Minimap & Canvas
  window.addEventListener('resize', () => {
    window.mindmapRenderer.applyTransform();
  });
});
