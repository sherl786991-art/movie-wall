# 电影推荐墙 · 静态版（GitHub Pages）

本目录是 `D:\trae\新建文件夹` 电影项目的**纯静态发布版**，无需 Python/后端即可浏览。

- `index.html` 电影墙（浏览 / 搜索 / 筛选 / 分页 / 详情弹窗 / 推荐语）
- `data/movies.json` 全部电影数据（含推荐语），由 movies.db 生成
- `data/credits/<id>.json` 每部电影的演员/导演精简数据（点击详情时按需加载）
- `data/poster_names.json` 已收录海报文件名清单
- `posters/` 本地海报（约 83MB）
- `adapter.js` 把原 `/api/*` 后端请求替换为本地数据

## 静态版与后端完整版差异
- 保留：海报墙、搜索、年份/评分/类型筛选、分页、详情弹窗（本地数据+演员）、推荐语。
- 移除：登录、心情助手（AI 标签/描述需 DeepSeek 后端）、实时 TMDB 检索。

## 本地预览
在该目录运行任意静态服务器后打开 index.html，例如：
    npx http-server -p 8080
