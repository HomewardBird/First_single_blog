export function CustomElements({ basePath }: { basePath: string }) {
  return (
    <>
      <div id="page-loader" role="status" aria-live="polite">
        <div class="loader-glass">
          <div class="loader-orb"></div>
          <div class="loader-ring"></div>
        </div>
        <div class="loader-text">安巢鸟的个人网站</div>
      </div>
      <img id="bg-image-light" src={`${basePath}/static/light_bg.jpg`} alt="" loading="lazy" />
      <img id="bg-image-dark" src={`${basePath}/static/dark_bg.jpg`} alt="" loading="lazy" />
      <img id="bg-image-light-pc" src={`${basePath}/static/light.jpg`} alt="" loading="lazy" />
      <img id="bg-image-dark-pc" src={`${basePath}/static/dark.jpg`} alt="" loading="lazy" />
      <div id="bg-overlay"></div>
      <div id="top-bar">
        <div class="top-bar-inner">
          <button
            id="nav-toggle-btn"
            class="tb-action-btn"
            aria-label="导航"
            aria-controls="quartz-body"
            aria-expanded="false"
            title="导航"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
            </svg>
          </button>
          <span class="top-bar-title">安巢鸟的个人网站</span>
          <div class="top-bar-right">
            <button id="tb-theme-btn" class="tb-action-btn" aria-label="切换主题" title="切换主题">
              <svg class="icon-dark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              <svg class="icon-light" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            <button id="hamburger-btn" class="hamburger-btn" aria-label="菜单" aria-expanded="false" aria-controls="hamburger-menu">
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
              <span class="hamburger-line"></span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
