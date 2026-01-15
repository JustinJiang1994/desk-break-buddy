const DEFAULT_SETTINGS = {
  activityReminderEnabled: true,
  activityReminderInterval: 60,
  waterReminderEnabled: true,
  waterReminderInterval: 30,
  soundEnabled: true,
  soundType: 'default',
  pauseUntil: null,
  customTimers: []
};

let currentSettings = { ...DEFAULT_SETTINGS };

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await updateStatus();
  setupEventListeners();
  
  // 每秒更新状态
  setInterval(updateStatus, 1000);
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
        if (!currentSettings.customTimers) {
          currentSettings.customTimers = [];
        }
      }
      updateUI();
      resolve();
    });
  });
}

// 更新UI
function updateUI() {
  document.getElementById('activityToggle').checked = currentSettings.activityReminderEnabled;
  document.getElementById('waterToggle').checked = currentSettings.waterReminderEnabled;
}

// 更新状态显示
async function updateStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getNextReminderTimes' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting reminder times:', chrome.runtime.lastError);
        resolve();
        return;
      }
      if (response) {
        const now = Date.now();
        const isPaused = currentSettings.pauseUntil && new Date() < new Date(currentSettings.pauseUntil);
        
        // 更新起身提醒状态
        if (isPaused) {
          const pauseUntil = new Date(currentSettings.pauseUntil);
          const minutes = Math.floor((pauseUntil - now) / 60000);
          document.getElementById('activityStatus').textContent = `暂停中 (${minutes}分钟)`;
          document.getElementById('waterStatus').textContent = `暂停中 (${minutes}分钟)`;
        } else if (currentSettings.activityReminderEnabled && response.activity) {
          const minutes = Math.floor((response.activity - now) / 60000);
          const seconds = Math.floor(((response.activity - now) % 60000) / 1000);
          if (minutes > 0) {
            document.getElementById('activityStatus').textContent = `${minutes}分钟`;
          } else {
            document.getElementById('activityStatus').textContent = `${seconds}秒`;
          }
        } else {
          document.getElementById('activityStatus').textContent = '已关闭';
        }
        
        // 更新喝水提醒状态
        if (!isPaused && currentSettings.waterReminderEnabled && response.water) {
          const minutes = Math.floor((response.water - now) / 60000);
          const seconds = Math.floor(((response.water - now) % 60000) / 1000);
          if (minutes > 0) {
            document.getElementById('waterStatus').textContent = `${minutes}分钟`;
          } else {
            document.getElementById('waterStatus').textContent = `${seconds}秒`;
          }
        } else if (!isPaused) {
          document.getElementById('waterStatus').textContent = '已关闭';
        }
        
        // 更新自定义计时器状态（如果有的话，显示在状态区域下方）
        updateCustomTimersStatus(response.custom || {});
      }
      resolve();
    });
  });
}

// 更新自定义计时器状态
function updateCustomTimersStatus(customAlarms) {
  const timers = currentSettings.customTimers || [];
  const statusSection = document.querySelector('.status-section');
  
  // 移除现有的自定义计时器状态
  const existingCustomStatus = document.querySelectorAll('.custom-timer-status');
  existingCustomStatus.forEach(el => el.remove());
  
  if (timers.length === 0) return;
  
  const now = Date.now();
  const isPaused = currentSettings.pauseUntil && new Date() < new Date(currentSettings.pauseUntil);
  
  timers.forEach(timer => {
    if (!timer.enabled) return;
    
    const statusItem = document.createElement('div');
    statusItem.className = 'status-item custom-timer-status';
    
    const alarmTime = customAlarms[timer.id];
    let statusText = '已关闭';
    
    if (isPaused) {
      const pauseUntil = new Date(currentSettings.pauseUntil);
      const minutes = Math.floor((pauseUntil - now) / 60000);
      statusText = `暂停中 (${minutes}分钟)`;
    } else if (alarmTime) {
      const minutes = Math.floor((alarmTime - now) / 60000);
      const seconds = Math.floor(((alarmTime - now) % 60000) / 1000);
      if (minutes > 0) {
        statusText = `${minutes}分钟`;
      } else {
        statusText = `${seconds}秒`;
      }
    }
    
    statusItem.innerHTML = `
      <span class="status-label">${escapeHtml(timer.name)}：</span>
      <span class="status-value">${statusText}</span>
    `;
    
    statusSection.appendChild(statusItem);
  });
}

// HTML转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 设置事件监听
function setupEventListeners() {
  // 开关切换
  document.getElementById('activityToggle').addEventListener('change', async (e) => {
    currentSettings.activityReminderEnabled = e.target.checked;
    await saveSettings();
  });
  
  document.getElementById('waterToggle').addEventListener('change', async (e) => {
    currentSettings.waterReminderEnabled = e.target.checked;
    await saveSettings();
  });
  
  // 暂停按钮
  document.getElementById('pauseBtn').addEventListener('click', () => {
    const pauseMenu = document.getElementById('pauseMenu');
    pauseMenu.classList.toggle('hidden');
  });
  
  // 暂停选项
  document.querySelectorAll('.pause-option').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const minutes = e.target.dataset.minutes;
      if (minutes === 'custom') {
        document.getElementById('customPauseInput').classList.remove('hidden');
      } else {
        await pauseReminders(parseInt(minutes));
        document.getElementById('pauseMenu').classList.add('hidden');
      }
    });
  });
  
  // 自定义暂停确认
  document.getElementById('confirmCustomPause').addEventListener('click', async () => {
    const minutes = parseInt(document.getElementById('customMinutes').value);
    if (minutes > 0 && minutes <= 480) {
      await pauseReminders(minutes);
      document.getElementById('pauseMenu').classList.add('hidden');
      document.getElementById('customPauseInput').classList.add('hidden');
      document.getElementById('customMinutes').value = '';
    }
  });
  
  // 设置按钮
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// 保存设置
async function saveSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'updateSettings',
      settings: currentSettings
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error saving settings:', chrome.runtime.lastError);
        resolve();
        return;
      }
      if (response && response.success) {
        updateStatus();
      }
      resolve();
    });
  });
}

// 暂停提醒
async function pauseReminders(minutes) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'pauseReminders',
      minutes: minutes
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error pausing reminders:', chrome.runtime.lastError);
        resolve();
        return;
      }
      if (response && response.success) {
        loadSettings();
        updateStatus();
      }
      resolve();
    });
  });
}
