// 动态漫制作系统 · HoloLake
// Dynamic Comic Studio · app.js · v2.0 环节2

console.log('🎬 动态漫制作系统 · HoloLake · v2.0 启动');

// ============================
// 全局状态
// ============================
const state = {
  canvasAssets: [],     // 画布上的素材列表
  selectedId: null,     // 当前选中的素材ID
  nextId: 1             // 素材ID计数器
};

// ============================
// 1. 素材拖放
// ============================
const dropZone = document.getElementById('drop-zone');
const canvasItems = document.getElementById('canvas-items');
const placeholder = document.getElementById('placeholder');
const canvasInfo = document.getElementById('canvas-info');

// 给所有素材卡片绑定拖动事件
document.querySelectorAll('.asset-item').forEach(item => {
  item.addEventListener('dragstart', (e) => {
    item.classList.add('dragging');
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: item.dataset.type,
      name: item.dataset.name,
      emoji: item.dataset.emoji
    }));
    console.log('开始拖动:', item.dataset.name);
  });
  
  item.addEventListener('dragend', () => {
    item.classList.remove('dragging');
  });
});

// 预览区接收拖放
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 30;
    
    addAssetToCanvas(data, x, y);
    console.log('放置素材:', data.name, '位置:', Math.round(x), Math.round(y));
  } catch (err) {
    console.error('拖放数据解析失败:', err);
  }
});

// ============================
// 2. 画布素材管理
// ============================
function addAssetToCanvas(data, x, y) {
  const id = state.nextId++;
  const asset = { id, ...data, x, y };
  state.canvasAssets.push(asset);
  
  // 隐藏占位提示
  if (placeholder) placeholder.style.display = 'none';
  
  // 创建画布上的素材元素
  const el = document.createElement('div');
  el.className = 'canvas-asset';
  el.dataset.id = id;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.innerHTML = `
    <span class="asset-emoji">${data.emoji}</span>
    <span class="asset-label">${data.name}</span>
  `;
  
  // 点击选中
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    selectAsset(id);
  });
  
  canvasItems.appendChild(el);
  selectAsset(id);
  updateCanvasInfo();
  updateLayerPanel();
}

function selectAsset(id) {
  state.selectedId = id;
  document.querySelectorAll('.canvas-asset').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.id) === id);
  });
  console.log('选中素材 #' + id);
}

function updateCanvasInfo() {
  if (canvasInfo) {
    canvasInfo.textContent = '已放置: ' + state.canvasAssets.length + '个素材';
  }
}

// 点击画布空白取消选中
dropZone.addEventListener('click', (e) => {
  if (e.target === dropZone || e.target === canvasItems) {
    state.selectedId = null;
    document.querySelectorAll('.canvas-asset').forEach(el => el.classList.remove('selected'));
    console.log('取消选中');
  }
});

// ============================
// 3. 键盘移动选中素材
// ============================
document.addEventListener('keydown', (e) => {
  if (!state.selectedId) return;
  
  const asset = state.canvasAssets.find(a => a.id === state.selectedId);
  if (!asset) return;
  
  const step = e.shiftKey ? 20 : 5;
  let moved = false;
  
  switch (e.key) {
    case 'ArrowUp': asset.y -= step; moved = true; break;
    case 'ArrowDown': asset.y += step; moved = true; break;
    case 'ArrowLeft': asset.x -= step; moved = true; break;
    case 'ArrowRight': asset.x += step; moved = true; break;
    case 'Delete':
    case 'Backspace':
      removeAsset(state.selectedId);
      return;
  }
  
  if (moved) {
    e.preventDefault();
    const el = document.querySelector(`.canvas-asset[data-id="${asset.id}"]`);
    if (el) {
      el.style.left = asset.x + 'px';
      el.style.top = asset.y + 'px';
    }
  }
});

function removeAsset(id) {
  state.canvasAssets = state.canvasAssets.filter(a => a.id !== id);
  const el = document.querySelector(`.canvas-asset[data-id="${id}"]`);
  if (el) el.remove();
  
  state.selectedId = null;
  updateCanvasInfo();
  updateLayerPanel();
  
  if (state.canvasAssets.length === 0 && placeholder) {
    placeholder.style.display = '';
  }
  
  console.log('删除素材 #' + id);
}

// ============================
// 4. 图层面板自动同步
// ============================
function updateLayerPanel() {
  const layerBody = document.querySelector('.panel-layers .panel-body');
  if (!layerBody) return;
  
  // 保留原有静态图层
  const staticLayers = layerBody.querySelectorAll('.layer-item:not(.dynamic)');
  layerBody.querySelectorAll('.layer-item.dynamic').forEach(el => el.remove());
  
  // 添加动态图层（倒序，最新的在上面）
  const firstStatic = staticLayers[0];
  state.canvasAssets.forEach(asset => {
    const layerEl = document.createElement('div');
    layerEl.className = 'layer-item dynamic';
    layerEl.innerHTML = `
      <span class="layer-visibility">👁️</span>
      <span class="layer-name">${asset.emoji} ${asset.name}</span>
      <span class="layer-lock">🔓</span>
    `;
    layerEl.addEventListener('click', () => selectAsset(asset.id));
    
    if (firstStatic) {
      layerBody.insertBefore(layerEl, firstStatic);
    } else {
      layerBody.appendChild(layerEl);
    }
  });
}

// ============================
// 5. 其他交互
// ============================

// 图层选中
document.querySelectorAll('.layer-item:not(.dynamic)').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    console.log('选中图层:', item.querySelector('.layer-name').textContent);
  });
});

// 播放按钮
const playBtn = document.querySelector('.btn-play');
let isPlaying = false;
if (playBtn) {
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
    console.log(isPlaying ? '播放中...' : '已暂停');
  });
}

// 图层可见性切换（事件委托）
document.querySelector('.panel-layers').addEventListener('click', (e) => {
  if (e.target.classList.contains('layer-visibility')) {
    e.stopPropagation();
    const isVisible = e.target.textContent === '👁️';
    e.target.textContent = isVisible ? '🚫' : '👁️';
    const name = e.target.parentElement.querySelector('.layer-name').textContent;
    console.log(name, isVisible ? '已隐藏' : '已显示');
  }
  
  if (e.target.classList.contains('layer-lock')) {
    e.stopPropagation();
    const isLocked = e.target.textContent === '🔒';
    e.target.textContent = isLocked ? '🔓' : '🔒';
    const name = e.target.parentElement.querySelector('.layer-name').textContent;
    console.log(name, isLocked ? '已解锁' : '已锁定');
  }
});

console.log('✅ v2.0 所有交互已绑定（含拖放）');
