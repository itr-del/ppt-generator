# 📊 ppt-generator

> PPT 自动生成 Web 应用 — 输入主题/大纲，自动生成可下载的 PowerPoint 文件。

## ✨ 特性

- 🌐 **Web 界面**：浏览器输入主题，自动生成 PPT
- 🎨 **多模板**：内置商务 / 教育 / 科技 / 简约 4 套模板
- 🤖 **AI 大纲**：调用 LLM 自动拆分章节
- 📥 **一键导出**：生成 .pptx 文件，可直接编辑
- 🖼️ **智能配图**：自动匹配章节配图（Unsplash 集成）
- 📊 **图表生成**：自动从数据生成柱状图/折线图/饼图

## 📁 项目结构

```
ppt-generator/
├── frontend/        # React 前端
├── server/          # 后端 API
├── admin/           # 管理后台
├── public/          # 静态资源
└── .env             # 环境变量（gitignore）
```

## 🚀 快速开始

```bash
git clone https://github.com/itr-del/ppt-generator.git
cd ppt-generator

# 后端
cd server && npm install && npm start  # 端口 3000

# 前端（另一个终端）
cd frontend && npm install && npm start # 端口 5173
```

打开 http://localhost:5173 即可使用。

## ⚙️ 环境变量

```
OPENAI_API_KEY=sk-xxx        # 大纲生成
UNSPLASH_ACCESS_KEY=xxx      # 配图
PORT=3000
```

## 📜 License

MIT

## 🙏 致谢

[PPTXGenJS](https://github.com/gitbrent/PptxGenJS)、Unsplash、OpenAI。