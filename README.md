# ToughFish

一个模拟CSDN开发者社区的前端项目，使用Vite构建现代Web应用。

## 技术栈

- **构建工具**: Vite
- **前端**: HTML, CSS, JavaScript (ES模块)

## 安装

确保你已安装Node.js和npm。

```bash
npm install
```

## 运行开发服务器

```bash
npm run dev
```

这将在本地启动开发服务器，通常在 `http://localhost:5173` 运行。

## 构建生产版本

```bash
npm run build
```

构建后的文件将输出到 `dist/` 文件夹。

## 预览生产版本

```bash
npm run preview
```

## 部署到Cloudflare Pages

1. 将项目代码推送到GitHub仓库。
2. 登录Cloudflare控制台，进入Pages部分。
3. 点击"Create a project"，选择"Connect to Git"连接你的GitHub仓库。
4. 选择仓库和分支（通常是`main`）。
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
6. 点击"Save and Deploy"。

部署完成后，你将获得一个Cloudflare Pages域名（如`yourproject.pages.dev`）。

## 项目结构

```
toughfish/
├── index.html          # 主HTML文件
├── package.json        # 项目配置和脚本
├── public/             # 静态资源
├── src/                # 源代码
│   ├── main.js         # 主JavaScript文件
│   ├── counter.js      # 计数器功能
│   ├── style.css       # 样式文件
│   └── assets/         # 资源文件夹
└── dist/               # 构建输出（运行build后生成）
```

## 许可证

此项目为私有项目。