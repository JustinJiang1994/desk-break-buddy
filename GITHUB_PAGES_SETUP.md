# GitHub Pages 设置指南

## 为什么需要GitHub Pages

Chrome应用商店要求隐私权政策链接必须直接指向一个**有效的隐私权政策页面**，而不是GitHub仓库主页。GitHub Pages可以让我们创建一个独立的网页来展示隐私权政策。

## 设置步骤

### 方法一：使用GitHub Pages（推荐）

1. **上传privacy-policy.html到GitHub**
   - 确保 `privacy-policy.html` 文件在仓库根目录
   - 提交并推送到GitHub

2. **启用GitHub Pages**
   - 访问仓库设置：https://github.com/JustinJiang1994/desk-break-buddy/settings/pages
   - 在"Source"部分选择"Deploy from a branch"
   - 选择分支：`main`
   - 选择文件夹：`/ (root)`
   - 点击"Save"

3. **等待部署**
   - GitHub会自动部署，通常需要几分钟
   - 部署完成后，访问：https://justinjiang1994.github.io/desk-break-buddy/privacy-policy.html

4. **在Chrome应用商店使用**
   - 隐私权政策链接填写：
   - `https://justinjiang1994.github.io/desk-break-buddy/privacy-policy.html`

### 方法二：使用docs文件夹（更专业）

1. **创建docs文件夹**
   ```bash
   mkdir docs
   cp privacy-policy.html docs/index.html
   ```

2. **启用GitHub Pages**
   - 在仓库设置中选择"Deploy from a branch"
   - 选择分支：`main`
   - 选择文件夹：`/docs`
   - 点击"Save"

3. **访问URL**
   - `https://justinjiang1994.github.io/desk-break-buddy/`

### 方法三：使用GitHub的README渲染（临时方案）

如果GitHub Pages暂时无法使用，可以：
1. 将隐私权政策内容放在README.md的开头
2. 使用GitHub的README渲染URL：
   - `https://github.com/JustinJiang1994/desk-break-buddy#隐私权政策`
   - 但这不是最佳方案，因为会显示整个README

## 验证

部署完成后，访问隐私权政策URL，确保：
- ✅ 页面可以正常访问
- ✅ 内容完整显示
- ✅ 格式美观易读
- ✅ 没有404错误

## 注意事项

- GitHub Pages的URL格式：`https://[用户名].github.io/[仓库名]/[文件路径]`
- 如果仓库是私有的，需要升级到GitHub Pro才能使用GitHub Pages
- 部署可能需要几分钟时间
- 如果更改了文件，需要重新部署（通常是自动的）
