// Workers 环境测试设置
// 移除 Node.js 依赖，使用 Workers 的 fetch API

// 测试数据存储 - 使用内存存储替代文件系统
const testDataCache = new Map<string, string>();

// 获取测试 HTML 数据的函数
async function getTestHtml(appId: number = 292030): Promise<string> {
  const cacheKey = `test-html-${appId}`;
  
  // 检查缓存
  if (testDataCache.has(cacheKey)) {
    return testDataCache.get(cacheKey)!;
  }
  
  try {
    console.log(`正在获取测试 HTML 数据 (AppID: ${appId})...`);
    const response = await fetch(`https://store.steampowered.com/app/${appId}/?l=schinese`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // 缓存数据
    testDataCache.set(cacheKey, html);
    console.log(`测试 HTML 数据已获取并缓存 (AppID: ${appId})`);
    
    return html;
  } catch (error) {
    console.error(`获取测试 HTML 数据失败 (AppID: ${appId}):`, error);
    
    // 返回模拟数据作为后备
    const mockHtml = `
      <html>
        <head><title>The Witcher® 3: Wild Hunt</title></head>
        <body>
          <div class="apphub_AppName">The Witcher® 3: Wild Hunt</div>
          <div class="dev_row">
            <div class="summary column">
              <a href="/developer/CD%20PROJEKT%20RED">CD PROJEKT RED</a>
            </div>
          </div>
          <div class="summary column">
            <a href="/publisher/CD%20PROJEKT%20RED">CD PROJEKT RED</a>
          </div>
          <div class="game_description_snippet">
            The Witcher 3: Wild Hunt is a story-driven, next-generation open world role-playing game.
          </div>
          <div class="game_purchase_price price">¥ 127.00</div>
        </body>
      </html>
    `;
    
    testDataCache.set(cacheKey, mockHtml);
    return mockHtml;
  }
}

// 清理测试数据缓存
function clearTestDataCache(): void {
  testDataCache.clear();
  console.log('测试数据缓存已清理');
}

// 设置 Workers 环境的全局变量
async function setupWorkersEnvironment(): Promise<void> {
  // 在 Workers 环境中，这些全局变量应该已经存在
  // 这里主要是为了确保测试环境的一致性
  
  // 确保 fetch 可用
  if (typeof fetch === 'undefined') {
    throw new Error('fetch API 不可用，请确保在 Workers 环境中运行测试');
  }
  
  // 确保 HTMLRewriter 可用
  if (typeof HTMLRewriter === 'undefined') {
    console.warn('HTMLRewriter 不可用，将使用正则表达式解析');
  }
  
  console.log('Workers 环境设置完成');
}

// 主设置函数
async function setup(): Promise<void> {
  try {
    await setupWorkersEnvironment();
    console.log('测试环境设置完成');
  } catch (error) {
    console.error('测试环境设置失败:', error);
    throw error;
  }
}

// 导出工具函数
export { getTestHtml, clearTestDataCache };
export default setup;
