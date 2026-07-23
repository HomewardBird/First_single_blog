# 项目备忘

## 部署
- CF Pages 生产分支: `release-ver`
- 开发分支: `dev`
- 域名: `homewardbird.dpdns.org`
- 一键推送: 双击 `push.bat`

## 评论审核
- 词库加密文件: `GFW补充词库.txt.enc`
- 解密密钥: GitHub Secret `BANNED_WORDS_KEY`
- Token: GitHub Secret `GH_TOKEN` (需 discussion 读写权限)
- 管理员: GitHub Secret `ADMIN_USERS`

## 内容管理
- 文章放 `content/` 下，多级目录用文件夹
- 文件夹内 `index.md` 的 `title` = 导航栏显示名
- 文件名加数字前缀控制排序: `01-xxx.md`
- 首页 `content/index.md`，留言 `content/留言.md`

## 资源文件
- 视频背景: `quartz/static/light_bg.mp4`, `dark_bg.mp4`
- 音频: `quartz/static/*.m4a`, `*.mp3`
- 名言: `quotes.json`
- 修改后运行 `push.bat` 同步到两个分支

## 自定义功能
- 视频背景 + 毛玻璃: `quartz/components/renderPage.tsx` + `quartz/styles/custom.scss`
- 阅读模式: 颜色切换、字体切换
- 音乐播放器: 单击播放/暂停，双击切歌
- 加载等待界面: `#page-loader`
- 移动端防双击缩放: `touch-action: manipulation`

## Giscus 评论
- 配置在 `quartz.config.yaml`
- 评论数据存在 GitHub Discussions
- 审核通过 GitHub Actions: `.github/workflows/moderate-comments.yml`
- 脚本: `scripts/moderate-single.ts`, `scripts/moderate-comments.ts`
