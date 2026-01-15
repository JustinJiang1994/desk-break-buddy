// 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const reminderType = urlParams.get('type');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 播放音效
  await playSound();
  
  if (reminderType === 'activity') {
    showActivityReminder();
  } else if (reminderType === 'water') {
    showWaterReminder();
  } else if (reminderType === 'custom') {
    const timerId = urlParams.get('id');
    const timerName = decodeURIComponent(urlParams.get('name') || '提醒');
    showCustomReminder(timerId, timerName);
  }
});

// 播放音效
async function playSound() {
  try {
    // 获取设置
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(response);
      });
    });
    
    if (response && response.settings && response.settings.soundEnabled) {
      const soundType = response.settings.soundType || 'default';
      const audio = new Audio(chrome.runtime.getURL(`sounds/${soundType}.mp3`));
      audio.volume = 0.5;
      await audio.play().catch(() => {
        // 如果音频文件不存在，静默失败
        console.log('Audio file not found');
      });
    }
  } catch (error) {
    console.log('Error playing sound:', error);
  }
}

// 显示起身活动提醒
function showActivityReminder() {
  document.getElementById('activityReminder').classList.remove('hidden');
  document.getElementById('waterReminder').classList.add('hidden');
  
  // 倒计时
  let countdown = 30;
  const countdownElement = document.getElementById('countdown');
  
  const timer = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(timer);
      closeNotification();
    }
  }, 1000);
  
  // 记录提醒
  recordReminder('activity', 'shown');
}

// 显示喝水提醒
function showWaterReminder() {
  document.getElementById('waterReminder').classList.remove('hidden');
  document.getElementById('activityReminder').classList.add('hidden');
  document.getElementById('customReminder').classList.add('hidden');
  
  // 跳过按钮
  document.getElementById('skipBtn').addEventListener('click', () => {
    recordReminder('water', 'skipped');
    closeNotification();
  });
  
  // 记录提醒
  recordReminder('water', 'shown');
}

// 显示自定义提醒
function showCustomReminder(timerId, timerName) {
  document.getElementById('customReminder').classList.remove('hidden');
  document.getElementById('activityReminder').classList.add('hidden');
  document.getElementById('waterReminder').classList.add('hidden');
  
  // 设置标题和消息
  document.getElementById('customTitle').textContent = `${timerName}时间到！`;
  document.getElementById('customMessage').textContent = `该做点什么了～`;
  
  // 跳过按钮
  document.getElementById('customSkipBtn').addEventListener('click', () => {
    recordReminder(`custom_${timerId}`, 'skipped', timerName);
    closeNotification();
  });
  
  // 记录提醒
  recordReminder(`custom_${timerId}`, 'shown', timerName);
}

// 关闭提醒窗口
function closeNotification() {
  chrome.runtime.sendMessage({ action: 'closeNotification' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error closing notification:', chrome.runtime.lastError);
    }
    window.close();
  });
}

// 记录提醒
function recordReminder(type, actionType, name = null) {
  const message = {
    action: 'reminderTriggered',
    type: type,
    actionType: actionType  // 使用 actionType 避免与 action 冲突
  };
  
  if (name) {
    message.name = name;
  }
  
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error recording reminder:', chrome.runtime.lastError.message || chrome.runtime.lastError);
    }
    // 忽略响应
  });
}
