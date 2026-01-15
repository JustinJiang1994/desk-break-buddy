const DEFAULT_SETTINGS = {
  activityReminderEnabled: true,
  activityReminderInterval: 60,
  waterReminderEnabled: true,
  waterReminderInterval: 30,
  soundEnabled: true,
  soundType: 'default',
  pauseUntil: null,
  reminderHistory: [],
  customTimers: []
};

let currentSettings = { ...DEFAULT_SETTINGS };
let editingTimerId = null;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
  updateCustomTimersList();
  updateHistory();
});

// 加载设置
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        updateUI();
        resolve();
        return;
      }
      if (response && response.settings) {
        currentSettings = { ...DEFAULT_SETTINGS, ...response.settings };
        if (!currentSettings.reminderHistory) {
          currentSettings.reminderHistory = [];
        }
      }
      updateUI();
      resolve();
    });
  });
}

// 更新UI
function updateUI() {
  document.getElementById('activityInterval').value = currentSettings.activityReminderInterval;
  document.getElementById('waterInterval').value = currentSettings.waterReminderInterval;
  document.getElementById('soundEnabled').checked = currentSettings.soundEnabled;
  document.getElementById('soundType').value = currentSettings.soundType || 'default';
  
  if (!currentSettings.customTimers) {
    currentSettings.customTimers = [];
  }
}

// 设置事件监听
function setupEventListeners() {
  // 保存按钮
  document.getElementById('saveBtn').addEventListener('click', async () => {
    await saveSettings();
  });
  
  // 恢复默认设置
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('确定要恢复默认设置吗？这将清除所有自定义设置。')) {
      resetToDefault();
    }
  });
  
  // 输入验证（只验证最小值）
  document.getElementById('activityInterval').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
  });
  
  document.getElementById('waterInterval').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
  });
  
  // 自定义计时器相关事件
  document.getElementById('addTimerBtn').addEventListener('click', () => {
    showTimerForm();
  });
  
  document.getElementById('saveTimerBtn').addEventListener('click', async () => {
    await saveTimer();
  });
  
  document.getElementById('cancelTimerBtn').addEventListener('click', () => {
    hideTimerForm();
  });
}

// 保存设置
async function saveSettings() {
  currentSettings.activityReminderInterval = parseInt(document.getElementById('activityInterval').value);
  currentSettings.waterReminderInterval = parseInt(document.getElementById('waterInterval').value);
  currentSettings.soundEnabled = document.getElementById('soundEnabled').checked;
  currentSettings.soundType = document.getElementById('soundType').value;
  
  // 验证最小值（至少1分钟）
  if (currentSettings.activityReminderInterval < 1) {
    alert('起身提醒间隔至少为1分钟');
    return;
  }
  
  if (currentSettings.waterReminderInterval < 1) {
    alert('喝水提醒间隔至少为1分钟');
    return;
  }
  
  // 验证是否为有效数字
  if (isNaN(currentSettings.activityReminderInterval) || currentSettings.activityReminderInterval <= 0) {
    alert('请输入有效的起身提醒间隔');
    return;
  }
  
  if (isNaN(currentSettings.waterReminderInterval) || currentSettings.waterReminderInterval <= 0) {
    alert('请输入有效的喝水提醒间隔');
    return;
  }
  
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        alert('保存设置失败，请重试');
        resolve();
        return;
      }
      if (response && response.success) {
        showSaveMessage();
      }
      resolve();
    });
  });
}

// 恢复默认设置
async function resetToDefault() {
  currentSettings = { ...DEFAULT_SETTINGS };
  updateUI();
  await saveSettings();
}

// 显示保存成功消息
function showSaveMessage() {
  const message = document.getElementById('saveMessage');
  message.classList.remove('hidden');
  setTimeout(() => {
    message.classList.add('hidden');
  }, 2000);
}

// 更新提醒记录
function updateHistory() {
  const historyContainer = document.getElementById('reminderHistory');
  const history = currentSettings.reminderHistory || [];
  
  // 只显示最近7天的记录
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentHistory = history.filter(item => new Date(item.time).getTime() > sevenDaysAgo);
  
  if (recentHistory.length === 0) {
    historyContainer.innerHTML = '<p class="empty-message">暂无记录</p>';
    return;
  }
  
  // 按日期分组
  const groupedByDate = {};
  recentHistory.forEach(item => {
    const date = new Date(item.time).toLocaleDateString('zh-CN');
    if (!groupedByDate[date]) {
      groupedByDate[date] = { activity: 0, water: 0, custom: {} };
    }
    if (item.type === 'activity') {
      groupedByDate[date].activity++;
    } else if (item.type === 'water') {
      groupedByDate[date].water++;
    } else if (item.type && item.type.startsWith('custom_')) {
      const timerName = item.name || '自定义';
      if (!groupedByDate[date].custom[timerName]) {
        groupedByDate[date].custom[timerName] = 0;
      }
      groupedByDate[date].custom[timerName]++;
    }
  });
  
  // 生成HTML
  let html = '<div class="history-list">';
  Object.keys(groupedByDate).sort().reverse().forEach(date => {
    const counts = groupedByDate[date];
    let badges = '';
    if (counts.activity > 0) {
      badges += `<span class="count-badge activity">起身: ${counts.activity}</span>`;
    }
    if (counts.water > 0) {
      badges += `<span class="count-badge water">喝水: ${counts.water}</span>`;
    }
    Object.keys(counts.custom).forEach(name => {
      badges += `<span class="count-badge custom">${escapeHtml(name)}: ${counts.custom[name]}</span>`;
    });
    
    html += `
      <div class="history-item">
        <span class="history-date">${date}</span>
        <span class="history-counts">${badges}</span>
      </div>
    `;
  });
  html += '</div>';
  
  historyContainer.innerHTML = html;
}

// 监听存储变化，更新记录显示
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.settings) {
    currentSettings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
    updateCustomTimersList();
    updateHistory();
  }
});

// 更新自定义计时器列表
function updateCustomTimersList() {
  const listContainer = document.getElementById('customTimersList');
  const timers = currentSettings.customTimers || [];
  
  if (timers.length === 0) {
    listContainer.innerHTML = '<p class="empty-message">暂无自定义计时器</p>';
    return;
  }
  
  let html = '';
  timers.forEach(timer => {
    html += `
      <div class="timer-item" data-timer-id="${timer.id}">
        <div class="timer-info">
          <div class="timer-name">${escapeHtml(timer.name)}</div>
          <div class="timer-details">每 ${timer.interval} 分钟提醒一次</div>
        </div>
        <div class="timer-actions">
          <label class="timer-toggle">
            <input type="checkbox" ${timer.enabled ? 'checked' : ''} 
                   onchange="toggleTimer('${timer.id}')">
            <span class="slider"></span>
          </label>
          <button class="btn-icon btn-edit" onclick="editTimer('${timer.id}')">编辑</button>
          <button class="btn-icon btn-delete" onclick="deleteTimer('${timer.id}')">删除</button>
        </div>
      </div>
    `;
  });
  
  listContainer.innerHTML = html;
}

// 显示计时器表单
function showTimerForm(timer = null) {
  const form = document.getElementById('timerForm');
  const title = document.getElementById('timerFormTitle');
  const nameInput = document.getElementById('timerName');
  const intervalInput = document.getElementById('timerInterval');
  
  editingTimerId = timer ? timer.id : null;
  
  if (timer) {
    title.textContent = '编辑计时器';
    nameInput.value = timer.name;
    intervalInput.value = timer.interval;
  } else {
    title.textContent = '添加计时器';
    nameInput.value = '';
    intervalInput.value = 60;
  }
  
  form.classList.remove('hidden');
}

// 隐藏计时器表单
function hideTimerForm() {
  const form = document.getElementById('timerForm');
  form.classList.add('hidden');
  editingTimerId = null;
}

// 保存计时器
async function saveTimer() {
  const name = document.getElementById('timerName').value.trim();
  const interval = parseInt(document.getElementById('timerInterval').value);
  
  if (!name) {
    alert('请输入计时器名称');
    return;
  }
  
  // 验证最小值（至少1分钟）
  if (interval < 1) {
    alert('提醒间隔至少为1分钟');
    return;
  }
  
  // 验证是否为有效数字
  if (isNaN(interval) || interval <= 0) {
    alert('请输入有效的提醒间隔');
    return;
  }
  
  if (!currentSettings.customTimers) {
    currentSettings.customTimers = [];
  }
  
  if (editingTimerId) {
    // 编辑现有计时器
    const timer = currentSettings.customTimers.find(t => t.id === editingTimerId);
    if (timer) {
      timer.name = name;
      timer.interval = interval;
    }
  } else {
    // 添加新计时器
    const newTimer = {
      id: Date.now().toString(),
      name: name,
      interval: interval,
      enabled: true,
      startTime: null
    };
    currentSettings.customTimers.push(newTimer);
  }
  
  await saveSettings();
  updateCustomTimersList();
  hideTimerForm();
}

// 切换计时器启用状态
async function toggleTimer(timerId) {
  const timer = currentSettings.customTimers.find(t => t.id === timerId);
  if (timer) {
    timer.enabled = !timer.enabled;
    await saveSettings();
    updateCustomTimersList();
  }
}

// 编辑计时器
function editTimer(timerId) {
  const timer = currentSettings.customTimers.find(t => t.id === timerId);
  if (timer) {
    showTimerForm(timer);
  }
}

// 删除计时器
async function deleteTimer(timerId) {
  if (confirm('确定要删除这个计时器吗？')) {
    currentSettings.customTimers = currentSettings.customTimers.filter(t => t.id !== timerId);
    await saveSettings();
    updateCustomTimersList();
  }
}

// HTML转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 将函数暴露到全局作用域，供HTML中的onclick使用
window.toggleTimer = toggleTimer;
window.editTimer = editTimer;
window.deleteTimer = deleteTimer;
