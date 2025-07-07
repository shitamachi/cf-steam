# 项目调试配置说明

## 问题解决

之前断点无法进入的问题已经解决。主要修复了以下配置：

### 1. VSCode 调试配置 (`.vscode/launch.json`)
- 修正了输出文件路径，指向正确的构建目录 `dist/steam/`
- 添加了完整的源映射路径覆盖配置
- 配置了两种调试模式：启动模式和附加模式

### 2. 构建配置优化
- **Vite配置** (`vite.config.ts`): 启用了源映射生成，禁用了生产模式的代码压缩
- **TypeScript配置** (`tsconfig.json`): 优化了源映射相关选项
- **Wrangler配置** (`wrangler.jsonc`): 添加了调试端口配置

### 3. Package.json 脚本更新
- `dev:debug`: 使用正确的wrangler调试参数

## 使用方法

### 方法一：使用VSCode调试面板（推荐）
1. 在VSCode中按 `F5` 或打开调试面板
2. 选择 "Launch Worker (Debug)" 配置
3. 点击绿色播放按钮启动调试
4. 在代码中设置断点，访问 http://127.0.0.1:8787 触发断点

### 方法二：手动启动后附加
1. 在终端运行：`npm run dev:debug`
2. 等待服务启动（看到 "Ready on http://127.0.0.1:8787"）
3. 在VSCode调试面板选择 "Attach to Wrangler"
4. 点击启动按钮附加到进程

## 验证调试是否正常工作

1. 调试端口检查：
   ```powershell
   netstat -an | findstr :9229
   ```
   应该看到端口9229在LISTENING状态

2. 在 `src/index.ts` 的任意位置设置断点
3. 访问 http://127.0.0.1:8787 的任意端点
4. 断点应该能够正常命中

## 调试端点示例

- 健康检查: http://127.0.0.1:8787/health
- API文档: http://127.0.0.1:8787/doc
- Steam API: http://127.0.0.1:8787/steam/*

## 常见问题

1. **断点不命中**: 确保已经构建项目 (`npm run build`)
2. **端口冲突**: 检查9229端口是否被其他进程占用
3. **源映射问题**: 确保在 `src/` 目录下的TypeScript文件中设置断点

## 技术说明

- 使用wrangler的 `--inspector-port 9229` 参数启用Node.js调试协议
- VSCode通过源映射将编译后的JavaScript映射回TypeScript源代码
- 调试器会自动跳过Node.js内部模块 (`<node_internals>/**`) 