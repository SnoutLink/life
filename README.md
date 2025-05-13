# 目录结构分析器

一个基于Web的智能目录分析工具，可以读取文件夹结构并使用AI分析其用途。该项目完全在浏览器端运行，无需服务器支持，可以轻松部署在GitHub Pages上。

## 🌟 功能特点

- 📁 支持文件夹拖放上传
- 🔍 自动扫描并显示完整的目录结构
- 📊 显示文件大小和层级关系
- 🤖 使用AI分析目录用途
- 🎯 支持多种AI模型选择
- ⚙️ 可自定义扫描深度和忽略规则
- 💻 完全在浏览器端运行，无需后端服务

## 🚀 在线演示

访问 [在线演示](https://your-username.github.io/directory-analyzer/) 体验完整功能。

## 🛠️ 使用方法

1. 打开网页后，你可以：
   - 直接将文件夹拖放到虚线框内
   - 或点击"选择文件夹"按钮选择文件夹

2. 在设置面板中：
   - 选择要使用的AI模型
   - 调整递归扫描深度（1-10）
   - 设置要忽略的文件模式（用逗号分隔）

3. 上传文件夹后，页面会显示：
   - 完整的文件夹结构
   - 每个文件的大小
   - AI对文件夹用途的分析结果

## 📦 本地部署

1. 克隆仓库：
```bash
git clone https://github.com/your-username/directory-analyzer.git
```

2. 进入项目目录：
```bash
cd directory-analyzer
```

3. 使用任意HTTP服务器托管文件，例如使用Python的简单HTTP服务器：
```bash
python -m http.server 8000
```

4. 在浏览器中访问 `http://localhost:8000`

## 🌐 GitHub Pages部署

1. Fork本仓库到你的GitHub账号

2. 在仓库设置中启用GitHub Pages：
   - 进入仓库的Settings
   - 找到Pages选项
   - 在Source中选择main分支
   - 点击Save

3. 等待几分钟后，你的应用就会在GitHub Pages上运行

## 🔧 技术栈

- HTML5
- CSS3 (Bootstrap 5)
- JavaScript (原生)
- AI API (OpenRouter代理服务)

## 📝 注意事项

- 所有文件处理都在浏览器端完成，不会上传到任何服务器
- 文件夹分析结果通过AI API生成，可能需要几秒钟时间
- 建议不要上传过大的文件夹，以免影响性能
- 目前支持的最大递归深度为10层

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进这个项目！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件 