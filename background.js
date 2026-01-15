// 默认设置
const DEFAULT_SETTINGS = {
  activityReminderEnabled: true,
  activityReminderInterval: 60, // 分钟
  waterReminderEnabled: true,
  waterReminderInterval: 30, // 分钟
  soundEnabled: true,
  soundType: 'default',
  pauseUntil: null,
  activityReminderStartTime: null,
  waterReminderStartTime: null,
  reminderHistory: [],
  customTimers: [] // 自定义计时器数组 [{id, name, interval, enabled, startTime}]
};

// 初始化
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.sync.get(['settings']);
  if (!settings.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
  await initializeAlarms();
});

// 启动时初始化
chrome.runtime.onStartup.addListener(async () => {
  await initializeAlarms();
});

// 初始化定时器
async function initializeAlarms() {
  const { settings } = await chrome.storage.sync.get(['settings']);
  const currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // 清除所有现有定时器
  await chrome.alarms.clearAll();
  
  // 检查是否在暂停期间
  if (currentSettings.pauseUntil && new Date() < new Date(currentSettings.pauseUntil)) {
    updateIcon('paused');
    return;
  }
  
  // 清除暂停状态
  if (currentSettings.pauseUntil && new Date() >= new Date(currentSettings.pauseUntil)) {
    currentSettings.pauseUntil = null;
    await chrome.storage.sync.set({ settings: currentSettings });
  }
  
  // 设置起身活动提醒
  if (currentSettings.activityReminderEnabled) {
    const nextActivityTime = calculateNextReminderTime(
      currentSettings.activityReminderStartTime,
      currentSettings.activityReminderInterval
    );
    chrome.alarms.create('activityReminder', {
      when: nextActivityTime
    });
  }
  
  // 设置喝水提醒
  if (currentSettings.waterReminderEnabled) {
    const nextWaterTime = calculateNextReminderTime(
      currentSettings.waterReminderStartTime,
      currentSettings.waterReminderInterval
    );
    chrome.alarms.create('waterReminder', {
      when: nextWaterTime
    });
  }
  
  // 设置自定义计时器
  if (currentSettings.customTimers && Array.isArray(currentSettings.customTimers)) {
    currentSettings.customTimers.forEach(timer => {
      if (timer.enabled) {
        const nextTime = calculateNextReminderTime(
          timer.startTime,
          timer.interval
        );
        chrome.alarms.create(`customTimer_${timer.id}`, {
          when: nextTime
        });
      }
    });
  }
  
  updateIcon('normal');
}

// 计算下次提醒时间
function calculateNextReminderTime(startTime, intervalMinutes) {
  const now = Date.now();
  if (!startTime) {
    // 第一次设置，立即开始计时
    return now + intervalMinutes * 60 * 1000;
  }
  
  const start = new Date(startTime).getTime();
  const interval = intervalMinutes * 60 * 1000;
  let nextTime = start + interval;
  
  // 如果下次时间已过，计算下一个周期
  while (nextTime <= now) {
    nextTime += interval;
  }
  
  return nextTime;
}

// 处理定时器触发
chrome.alarms.onAlarm.addListener(async (alarm) => {
  const { settings } = await chrome.storage.sync.get(['settings']);
  const currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // 检查是否在暂停期间
  if (currentSettings.pauseUntil && new Date() < new Date(currentSettings.pauseUntil)) {
    return;
  }
  
  if (alarm.name === 'activityReminder' && currentSettings.activityReminderEnabled) {
    await showActivityReminder();
    // 记录提醒
    recordReminder('activity', 'shown');
    // 记录提醒时间
    currentSettings.activityReminderStartTime = new Date().toISOString();
    await chrome.storage.sync.set({ settings: currentSettings });
    // 设置下次提醒
    const nextTime = calculateNextReminderTime(
      currentSettings.activityReminderStartTime,
      currentSettings.activityReminderInterval
    );
    chrome.alarms.create('activityReminder', { when: nextTime });
  } else if (alarm.name === 'waterReminder' && currentSettings.waterReminderEnabled) {
    await showWaterReminder();
    // 记录提醒
    recordReminder('water', 'shown');
    // 记录提醒时间
    currentSettings.waterReminderStartTime = new Date().toISOString();
    await chrome.storage.sync.set({ settings: currentSettings });
    // 设置下次提醒
    const nextTime = calculateNextReminderTime(
      currentSettings.waterReminderStartTime,
      currentSettings.waterReminderInterval
    );
    chrome.alarms.create('waterReminder', { when: nextTime });
  } else if (alarm.name.startsWith('customTimer_')) {
    // 处理自定义计时器
    const timerId = alarm.name.replace('customTimer_', '');
    const timer = currentSettings.customTimers.find(t => t.id === timerId);
    if (timer && timer.enabled) {
      await showCustomReminder(timer);
      // 记录提醒
      recordReminder(`custom_${timerId}`, 'shown', timer.name);
      // 更新计时器开始时间
      timer.startTime = new Date().toISOString();
      await chrome.storage.sync.set({ settings: currentSettings });
      // 设置下次提醒
      const nextTime = calculateNextReminderTime(
        timer.startTime,
        timer.interval
      );
      chrome.alarms.create(`customTimer_${timerId}`, { when: nextTime });
    }
  }
});

// 显示起身活动提醒
async function showActivityReminder() {
  updateIcon('active');
  
  // 创建提醒窗口（音效在notification.html中播放）
  chrome.windows.create({
    url: chrome.runtime.getURL('notification.html?type=activity'),
    type: 'popup',
    width: 400,
    height: 350,
    focused: true
  });
  
  // 30秒后自动关闭
  setTimeout(() => {
    chrome.windows.getAll((windows) => {
      windows.forEach((window) => {
        if (window.type === 'popup') {
          chrome.tabs.query({ windowId: window.id }, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.url && tab.url.includes('notification.html?type=activity')) {
                chrome.windows.remove(window.id);
              }
            });
          });
        }
      });
    });
    updateIcon('normal');
  }, 30000);
}

// 显示喝水提醒
async function showWaterReminder() {
  updateIcon('active');
  
  // 创建提醒窗口（音效在notification.html中播放）
  chrome.windows.create({
    url: chrome.runtime.getURL('notification.html?type=water'),
    type: 'popup',
    width: 400,
    height: 350,
    focused: true
  });
}

// 显示自定义提醒
async function showCustomReminder(timer) {
  updateIcon('active');
  
  // 创建提醒窗口
  chrome.windows.create({
    url: chrome.runtime.getURL(`notification.html?type=custom&id=${timer.id}&name=${encodeURIComponent(timer.name)}`),
    type: 'popup',
    width: 400,
    height: 350,
    focused: true
  });
}


// 记录提醒
async function recordReminder(type, action, name = null) {
  const { settings } = await chrome.storage.sync.get(['settings']);
  const currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  if (!currentSettings.reminderHistory) {
    currentSettings.reminderHistory = [];
  }
  
  const record = {
    type: type,
    time: new Date().toISOString(),
    action: action
  };
  
  if (name) {
    record.name = name;
  }
  
  currentSettings.reminderHistory.push(record);
  
  // 只保留最近30天的记录（注意：sync存储有大小限制，如果记录太多可能需要清理）
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  currentSettings.reminderHistory = currentSettings.reminderHistory.filter(
    item => new Date(item.time).getTime() > thirtyDaysAgo
  );
  
  // 限制历史记录数量，避免超过sync存储限制（每个扩展最多100KB）
  if (currentSettings.reminderHistory.length > 500) {
    currentSettings.reminderHistory = currentSettings.reminderHistory.slice(-500);
  }
  
  await chrome.storage.sync.set({ settings: currentSettings });
}

// 更新图标状态
function updateIcon(state) {
  const iconPaths = {
    normal: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    },
    active: {
      16: 'icons/icon16-active.png',
      48: 'icons/icon48-active.png',
      128: 'icons/icon128-active.png'
    },
    paused: {
      16: 'icons/icon16-paused.png',
      48: 'icons/icon48-paused.png',
      128: 'icons/icon128-paused.png'
    }
  };
  
  const icons = iconPaths[state] || iconPaths.normal;
  chrome.action.setIcon({ path: icons });
}

// 监听来自popup和options的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || DEFAULT_SETTINGS });
    });
    return true;
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.sync.set({ settings: request.settings }, async () => {
      await initializeAlarms();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'pauseReminders') {
    chrome.storage.sync.get(['settings'], async (result) => {
      const currentSettings = { ...DEFAULT_SETTINGS, ...result.settings };
      const pauseMinutes = request.minutes;
      const pauseUntil = new Date(Date.now() + pauseMinutes * 60 * 1000);
      currentSettings.pauseUntil = pauseUntil.toISOString();
      await chrome.storage.sync.set({ settings: currentSettings });
      await initializeAlarms();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getNextReminderTimes') {
    chrome.alarms.getAll((alarms) => {
      const activityAlarm = alarms.find(a => a.name === 'activityReminder');
      const waterAlarm = alarms.find(a => a.name === 'waterReminder');
      const customAlarms = {};
      
      // 获取所有自定义计时器的下次提醒时间
      alarms.forEach(alarm => {
        if (alarm.name.startsWith('customTimer_')) {
          const timerId = alarm.name.replace('customTimer_', '');
          customAlarms[timerId] = alarm.scheduledTime;
        }
      });
      
      sendResponse({
        activity: activityAlarm ? activityAlarm.scheduledTime : null,
        water: waterAlarm ? waterAlarm.scheduledTime : null,
        custom: customAlarms
      });
    });
    return true;
  }
  
  if (request.action === 'closeNotification') {
    chrome.windows.getAll((windows) => {
      windows.forEach((window) => {
        if (window.type === 'popup') {
          chrome.tabs.query({ windowId: window.id }, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.url && tab.url.includes('notification.html')) {
                chrome.windows.remove(window.id);
              }
            });
          });
        }
      });
    });
    updateIcon('normal');
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'reminderTriggered') {
    recordReminder(request.type, request.action).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
