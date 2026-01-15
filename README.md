# 🏃 desk-break-buddy

> 桌面休息伙伴 - 一款帮助您养成健康办公习惯的Chrome浏览器插件

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-orange)](https://github.com/yourusername/desk-break-buddy)

通过定时提醒功能，帮助长时间使用电脑的用户规律起身活动和补充水分，缓解久坐疲劳，养成健康的办公习惯。

**✨ 新功能**：数据云端同步，在不同设备间自动同步您的设置和自定义计时器！

## ✨ 主要特性

- 🎯 **双提醒类型** - 起身活动提醒（默认60分钟）+ 喝水提醒（默认30分钟）
- ⏰ **灵活设置** - 提醒间隔可自由设置，无上限限制（至少1分钟）
- ⏰ **自定义计时器** - 创建任意数量的个性化提醒，支持5-480分钟间隔
- ☁️ **云端同步** - 数据自动同步到所有登录同一账户的设备
- 🔔 **智能提醒** - 弹窗 + 声音双重提醒，支持多种音效
- 📊 **使用记录** - 查看近7天的提醒历史统计
- ⏸️ **暂停功能** - 灵活控制提醒时间（15分钟/30分钟/1小时/自定义）
- 🎨 **简洁界面** - 清新简约的设计风格，操作简单直观

## 🚀 快速开始

### 安装方法

1. 下载或克隆本项目到本地
2. 准备图标和音效文件（见下方说明）
3. 打开Chrome浏览器，访问 `chrome://extensions/`
4. 开启"开发者模式"（右上角开关）
5. 点击"加载已解压的扩展程序"
6. 选择项目文件夹

详细安装说明请查看 [INSTALL.md](INSTALL.md)

### 使用说明

1. **快速操作**：点击浏览器工具栏的插件图标，在弹出面板中管理提醒
2. **自定义设置**：点击"进入设置"按钮，灵活设置提醒间隔（无上限限制）和音效
3. **创建计时器**：在设置页面创建自定义计时器，满足个性化需求
4. **查看记录**：在设置页面查看近7天的提醒历史统计

## 📦 准备资源文件

#### 图标文件

在 `icons/` 目录下放置以下图标文件（PNG格式）：
- `icon16.png`, `icon48.png`, `icon128.png` - 默认图标
- `icon16-active.png`, `icon48-active.png`, `icon128-active.png` - 激活状态图标
- `icon16-paused.png`, `icon48-paused.png`, `icon128-paused.png` - 暂停状态图标

#### 音效文件

在 `sounds/` 目录下放置以下音效文件（MP3格式）：
- `default.mp3` - 默认提醒音效
- `gentle.mp3` - 轻柔音效
- `alert.mp3` - 提示音效

## 📋 功能清单

- [x] 起身活动提醒（默认60分钟）
- [x] 喝水提醒（默认30分钟）
- [x] 自定义计时器
- [x] 数据云端同步
- [x] 提醒历史记录
- [x] 暂停/恢复功能
- [x] 多种音效选择
- [ ] 多语言支持
- [ ] 自定义提醒文字
- [ ] 数据导出功能
- [ ] 自定义计时器模板

## 技术说明

### 技术栈

- HTML5 / CSS3 / JavaScript
- Chrome Extension API (Manifest V3)
- Chrome Storage Sync API (云端同步存储)
- Chrome Alarms API (定时功能)

### 数据同步

- ✅ **跨设备同步**：数据会自动同步到所有登录了同一谷歌账户的设备
- ✅ **实时同步**：在一台设备上的设置会自动同步到其他设备
- ✅ **云端备份**：数据自动备份到云端，无需担心丢失

**注意**：需要登录Chrome浏览器并启用同步功能才能使用数据同步。

### 项目结构

```
desk-break-buddy/
├── manifest.json          # 插件配置文件
├── background.js          # 后台服务脚本
├── popup.html/js/css     # 快速操作面板
├── options.html/js/css    # 设置页面
├── notification.html/js/css # 提醒弹窗
├── icons/                # 图标文件目录
├── sounds/               # 音效文件目录
└── README.md            # 说明文档
```

### 权限说明

插件仅申请以下必要权限：
- `storage` - 保存用户设置
- `notifications` - 显示提醒
- `alarms` - 后台定时功能

## 开发说明

### 本地开发

1. 修改代码后，在Chrome扩展程序页面点击"重新加载"按钮
2. 测试功能是否正常
3. 查看控制台日志排查问题

### 调试技巧

- 后台脚本：在扩展程序页面点击"service worker"链接查看后台脚本控制台
- 弹窗页面：右键点击插件图标，选择"检查弹出内容"
- 设置页面：右键点击设置页面，选择"检查"

## 兼容性

- Chrome浏览器最新版本
- 支持 Windows、macOS、Linux 操作系统

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👤 作者

Your Name - [@yourusername](https://github.com/yourusername)

## 🙏 致谢

感谢所有使用和贡献这个项目的用户！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/yourusername/desk-break-buddy/issues)
- 发送邮件至 your.email@example.com

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 反馈。
