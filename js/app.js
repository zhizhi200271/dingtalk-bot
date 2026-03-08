/**
 * 动态漫制作系统 - 场景管理与数据持久化 (v3.0)
 * 功能：多场景管理 + localStorage自动保存
 */

// ==================== 配置常量 ====================
const STORAGE_KEY = 'hololake-comic-studio-data';
const AUTO_SAVE_DELAY = 1000; // 自动保存延迟（毫秒）

// ==================== 全局状态 ====================
const state = {
    // 场景管理
    currentSceneId: 1,
    nextSceneId: 2,
    nextAssetId: 1,
    scenes: [
        {
            id: 1,
            name: '场景1',
            assets: []
        }
    ],
    
    // 拖放状态
    draggedAsset: null,
    selectedAssetId: null,
    
    // 保存状态
    isSaving: false,
    saveTimeout: null
};

// ==================== DOM 元素引用 ====================
const elements = {
    // 场景管理
    sceneTabs: document.getElementById('sceneTabs'),
    addSceneBtn: document.getElementById('addSceneBtn'),
    saveIndicator: document.getElementById('saveIndicator'),
    
    // 画布
    dropZone: document.getElementById('drop-zone'),
    canvasItems: document.getElementById('canvas-items'),
    placeholder: document.getElementById('placeholder'),
    canvasInfo: document.getElementById('canvas-info'),
    
    // 素材库
    assetItems: document.querySelectorAll('.asset-item')
};

// ==================== 初始化 ====================
function init() {
    // 尝试从 localStorage 加载数据
    loadFromLocalStorage();
    
    // 初始化事件监听
    initEventListeners();
    
    // 渲染初始场景
    renderScene(state.currentSceneId);
    updateSceneTabs();
    updateSaveIndicator(false);
    
    console.log('🎬 动态漫制作系统 v3.0 已启动');
    console.log('💾 自动保存已启用');
}

// ==================== localStorage 操作 ====================
function saveToLocalStorage() {
    try {
        const data = {
            currentSceneId: state.currentSceneId,
            nextSceneId: state.nextSceneId,
            nextAssetId: state.nextAssetId,
            scenes: state.scenes
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('💾 已保存到 localStorage');
        return true;
    } catch (error) {
        console.error('保存失败:', error);
        return false;
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            state.currentSceneId = data.currentSceneId || 1;
            state.nextSceneId = data.nextSceneId || 2;
            state.nextAssetId = data.nextAssetId || 1;
            state.scenes = data.scenes || [{ id: 1, name: '场景1', assets: [] }];
            console.log('📂 已从 localStorage 加载数据');
        }
    } catch (error) {
        console.error('加载失败:', error);
    }
}

// ==================== 自动保存 ====================
function triggerAutoSave() {
    // 显示"保存中"状态
    updateSaveIndicator(true);
    
    // 清除之前的定时器
    if (state.saveTimeout) {
        clearTimeout(state.saveTimeout);
    }
    
    // 延迟保存
    state.saveTimeout = setTimeout(() => {
        saveToLocalStorage();
        updateSaveIndicator(false);
    }, AUTO_SAVE_DELAY);
}

function updateSaveIndicator(isSaving) {
    if (!elements.saveIndicator) return;
    
    const dot = elements.saveIndicator.querySelector('.save-dot');
    const text = elements.saveIndicator.querySelector('.save-text');
    
    if (isSaving) {
        elements.saveIndicator.classList.add('saving');
        if (text) text.textContent = '保存中...';
    } else {
        elements.saveIndicator.classList.remove('saving');
        if (text) text.textContent = '已保存';
    }
}// ==================== 场景管理 ====================
function addScene() {
    const newScene = {
        id: state.nextSceneId++,
        name: `场景${state.nextSceneId - 1}`,
        assets: []
    };
    state.scenes.push(newScene);
    switchScene(newScene.id);
    triggerAutoSave();
}

function switchScene(sceneId) {
    // 保存当前场景状态
    saveCurrentSceneState();
    
    // 切换场景
    state.currentSceneId = sceneId;
    
    // 清空画布并渲染新场景
    renderScene(sceneId);
    updateSceneTabs();
    triggerAutoSave();
}

function deleteScene(sceneId) {
    // 至少保留一个场景
    if (state.scenes.length <= 1) {
        alert('至少保留一个场景');
        return;
    }
    
    // 确认删除
    if (!confirm(`确定删除"${state.scenes.find(s => s.id === sceneId)?.name}"吗？`)) {
        return;
    }
    
    // 删除场景
    state.scenes = state.scenes.filter(s => s.id !== sceneId);
    
    // 如果删除的是当前场景，切换到第一个场景
    if (state.currentSceneId === sceneId) {
        state.currentSceneId = state.scenes[0].id;
        renderScene(state.currentSceneId);
    }
    
    updateSceneTabs();
    triggerAutoSave();
}

function saveCurrentSceneState() {
    const currentScene = state.scenes.find(s => s.id === state.currentSceneId);
    if (currentScene) {
        // 保存当前画布上的所有素材
        currentScene.assets = Array.from(elements.canvasItems.children).map(item => ({
            id: parseInt(item.dataset.id),
            type: item.dataset.type,
            name: item.dataset.name,
            emoji: item.querySelector('.asset-emoji')?.textContent || '',
            x: parseInt(item.style.left) || 0,
            y: parseInt(item.style.top) || 0
        }));
    }
}

function renderScene(sceneId) {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    // 清空画布
    elements.canvasItems.innerHTML = '';
    
    // 渲染场景中的所有素材
    scene.assets.forEach(asset => {
        createCanvasItem(asset);
    });
    
    // 更新素材计数
    updateCanvasInfo();
    
    // 显示/隐藏占位符
    updatePlaceholder();
}

function updateSceneTabs() {
    if (!elements.sceneTabs) return;
    
    elements.sceneTabs.innerHTML = '';
    
    state.scenes.forEach(scene => {
        const tab = document.createElement('div');
        tab.className = `scene-tab ${scene.id === state.currentSceneId ? 'active' : ''}`;
        tab.innerHTML = `
            <span class="scene-name">${scene.name}</span>
            ${state.scenes.length > 1 ? `<span class="delete-btn" data-scene-id="${scene.id}">×</span>` : ''}
        `;
        
        // 点击切换场景
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                switchScene(scene.id);
            }
        });
        
        // 删除按钮
        const deleteBtn = tab.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteScene(scene.id);
            });
        }
        
        elements.sceneTabs.appendChild(tab);
    });
}// ==================== 画布操作 ====================
function createCanvasItem(asset) {
    const item = document.createElement('div');
    item.className = 'canvas-item';
    item.dataset.id = asset.id;
    item.dataset.type = asset.type;
    item.dataset.name = asset.name;
    item.style.left = `${asset.x}px`;
    item.style.top = `${asset.y}px`;
    
    item.innerHTML = `
        <div class="asset-emoji">${asset.emoji}</div>
        <div class="asset-label">${asset.name}</div>
    `;
    
    // 点击选中
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectAsset(item);
    });
    
    // 拖拽移动
    makeDraggable(item);
    
    elements.canvasItems.appendChild(item);
    return item;
}

function selectAsset(item) {
    // 取消之前的选中
    document.querySelectorAll('.canvas-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 选中当前
    item.classList.add('selected');
    state.selectedAssetId = parseInt(item.dataset.id);
}

function deleteSelectedAsset() {
    if (!state.selectedAssetId) return;
    
    const item = document.querySelector(`.canvas-item[data-id="${state.selectedAssetId}"]`);
    if (item) {
        item.remove();
        state.selectedAssetId = null;
        updateCanvasInfo();
        updatePlaceholder();
        triggerAutoSave();
    }
}

function updateCanvasInfo() {
    if (elements.canvasInfo) {
        const count = elements.canvasItems.children.length;
        elements.canvasInfo.textContent = `已放置: ${count}个素材`;
    }
}

function updatePlaceholder() {
    if (elements.placeholder) {
        const hasItems = elements.canvasItems.children.length > 0;
        elements.placeholder.style.display = hasItems ? 'none' : 'flex';
    }
}

// ==================== 拖拽功能 ====================
function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseInt(element.style.left) || 0;
        startTop = parseInt(element.style.top) || 0;
        element.style.cursor = 'grabbing';
        selectAsset(element);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        element.style.left = `${startLeft + dx}px`;
        element.style.top = `${startTop + dy}px`;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'grab';
            triggerAutoSave();
        }
    });
}// ==================== 事件监听 ====================
function initEventListeners() {
    // 场景管理按钮
    if (elements.addSceneBtn) {
        elements.addSceneBtn.addEventListener('click', addScene);
    }
    
    // 素材库拖放
    elements.assetItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            state.draggedAsset = {
                type: item.dataset.type,
                name: item.dataset.name,
                emoji: item.dataset.emoji
            };
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
    
    // 画布拖放区域
    if (elements.dropZone) {
        elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            elements.dropZone.classList.add('drag-over');
        });
        
        elements.dropZone.addEventListener('dragleave', () => {
            elements.dropZone.classList.remove('drag-over');
        });
        
        elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.dropZone.classList.remove('drag-over');
            
            if (!state.draggedAsset) return;
            
            const rect = elements.dropZone.getBoundingClientRect();
            const x = e.clientX - rect.left - 40; // 居中偏移
            const y = e.clientY - rect.top - 40;
            
            // 创建新素材
            const newAsset = {
                id: state.nextAssetId++,
                type: state.draggedAsset.type,
                name: state.draggedAsset.name,
                emoji: state.draggedAsset.emoji,
                x: Math.max(0, x),
                y: Math.max(0, y)
            };
            
            // 添加到当前场景
            const currentScene = state.scenes.find(s => s.id === state.currentSceneId);
            if (currentScene) {
                currentScene.assets.push(newAsset);
                createCanvasItem(newAsset);
                updateCanvasInfo();
                updatePlaceholder();
                triggerAutoSave();
            }
            
            state.draggedAsset = null;
        });
    }
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Delete 键删除选中素材
        if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedAssetId) {
            deleteSelectedAsset();
        }
    });
    
    // 点击空白处取消选中
    if (elements.dropZone) {
        elements.dropZone.addEventListener('click', (e) => {
            if (e.target === elements.dropZone || e.target === elements.canvasItems) {
                document.querySelectorAll('.canvas-item.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                state.selectedAssetId = null;
            }
        });
    }
}

// ==================== 启动应用 ====================
document.addEventListener('DOMContentLoaded', init);


// ==================== 导出功能 ====================

/**
 * 截图下载 - 将当前场景保存为PNG图片
 */
function exportAsImage() {
    const previewArea = document.getElementById('drop-zone');
    if (!previewArea) {
        alert('❌ 找不到画布区域');
        return;
    }
    
    // 使用 html2canvas 捕获画布
    html2canvas(previewArea, {
        backgroundColor: '#1a1a2e',
        scale: 2 // 高清截图
    }).then(canvas => {
        // 转换为 PNG 并下载
        const link = document.createElement('a');
        const sceneName = getCurrentSceneName() || '场景';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `comic-${sceneName}-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('📸 截图已保存！');
    }).catch(err => {
        console.error('截图失败:', err);
        alert('❌ 截图失败，请重试');
    });
}

/**
 * 导出 JSON - 导出所有场景数据
 */
function exportAsJSON() {
    const data = {
        scenes: scenes,
        exportTime: new Date().toISOString(),
        version: '1.0'
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    link.download = `dynamic-comic-data-${timestamp}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    showToast('📥 数据已导出！');
}

/**
 * 导入 JSON - 从文件恢复场景数据
 */
function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                // 验证数据结构
                if (!data.scenes || !Array.isArray(data.scenes)) {
                    throw new Error('文件格式不正确');
                }
                
                // 确认覆盖
                if (!confirm('导入将覆盖当前所有数据，确定吗？')) {
                    return;
                }
                
                // 恢复数据
                scenes = data.scenes;
                saveToLocalStorage();
                renderSceneTabs();
                loadScene(scenes[0]?.id || 0);
                
                showToast('📤 数据已导入！');
                
            } catch (err) {
                console.error('导入失败:', err);
                alert('❌ 文件格式不正确');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

/**
 * 获取当前场景名称
 */
function getCurrentSceneName() {
    const scene = scenes.find(s => s.id === currentSceneId);
    return scene ? scene.name : '';
}

/**
 * 显示提示消息
 */
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2d2d44;
        color: #fff;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid #444;
        z-index: 9999;
        font-size: 14px;
        animation: fadeIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
