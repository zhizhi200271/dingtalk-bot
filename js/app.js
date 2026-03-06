// 动态漫制作系统 · HoloLake
// Dynamic Comic Studio · app.js

console.log('🎬 动态漫制作系统 · HoloLake · 启动成功');

// === 图层选中 ===
document.querySelectorAll('.layer-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        console.log('选中图层:', item.querySelector('.layer-name').textContent);
    });
});

// === 播放按钮 ===
const playBtn = document.querySelector('.btn-play');
let isPlaying = false;

if (playBtn) {
    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playBtn.textContent = isPlaying ? '⏸️' : '▶️';
        console.log(isPlaying ? '▶️ 播放中...' : '⏸️ 已暂停');
    });
}

// === 图层可见性切换 ===
document.querySelectorAll('.layer-visibility').forEach(eye => {
    eye.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = eye.textContent === '👁️';
        eye.textContent = isVisible ? '🚫' : '👁️';
        const layerName = eye.parentElement.querySelector('.layer-name').textContent;
        console.log(layerName, isVisible ? '👁️ 已隐藏' : '👁️ 已显示');
    });
});

// === 图层锁定切换 ===
document.querySelectorAll('.layer-lock').forEach(lock => {
    lock.addEventListener('click', (e) => {
        e.stopPropagation();
        const isLocked = lock.textContent === '🔒';
        lock.textContent = isLocked ? '🔓' : '🔒';
        const layerName = lock.parentElement.querySelector('.layer-name').textContent;
        console.log(layerName, isLocked ? '🔓 已解锁' : '🔒 已锁定');
    });
});

console.log('✅ 所有交互已绑定');
