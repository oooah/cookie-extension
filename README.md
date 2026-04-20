# cookie-extension

这是一个基于 `WXT + Vue 3 + TypeScript` 的 Chrome Manifest V3 扩展，用来在开发调试时同步 Cookie，并通过 `declarativeNetRequest` 动态补写请求头里的 `Cookie`，缓解新版 Chrome 下部分开发场景的 Cookie 携带问题。

## 当前架构

- Popup 使用 `Vue 3` 单文件组件实现
- Background 使用 `WXT` 的 MV3 service worker 入口
- 共享逻辑使用 `TypeScript` 编写，集中在 `src/utils/`
- 测试框架为 `Vitest`
- 打包和开发体验由 `WXT` 基于 `Vite` 提供

## 本地开发

推荐先切换到项目要求的 Node 版本：

```bash
nvm use
```

然后安装依赖并启动开发模式：

```bash
npm install
npm run dev
```

WXT 会生成 `.output/chrome-mv3/` 目录，并在开发模式下自动准备扩展构建产物。

## 测试与校验

```bash
npm test
npm run typecheck
```

## 生产构建

```bash
npm run build
npm run verify:manifest
```

构建产物位于 `.output/chrome-mv3/`，可以直接作为 unpacked extension 加载到 Chrome 中验证。
