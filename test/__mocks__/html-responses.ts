/**
 * HTML响应Mock数据
 * 用于测试Steam网页抓取功能
 */

// The Witcher 3 Steam页面HTML模拟
export const witcher3Html = `
<!DOCTYPE html>
<html>
<head>
    <title>Save 85% on The Witcher 3: Wild Hunt on Steam</title>
</head>
<body>
    <div class="apphub_AppName">The Witcher 3: Wild Hunt</div>
    <div class="game_description_snippet">作为怪物猎人杰洛特，踏上前往找寻命中注定之子的旅程，这个孩子是能拯救或摧毁这个世界的关键。</div>
    
    <!-- 价格信息 -->
    <div class="game_purchase_price price" data-price-final="12700">¥ 127.00</div>
    <div class="discount_original_price">¥ 298.00</div>
    <div class="discount_pct">-57%</div>
    
    <!-- 发布信息 -->
    <div class="release_date">
        <div class="date">2015年5月18日</div>
    </div>
    
    <!-- 开发商和发行商 -->
    <div class="summary column">
        <div class="dev_row">
            <b>开发商:</b>
            <a href="#">CD PROJEKT RED</a>
        </div>
        <div class="dev_row">
            <b>发行商:</b>
            <a href="#">CD PROJEKT RED</a>
        </div>
    </div>
    
    <!-- 评价信息 -->
    <div class="user_reviews_summary_row">
        <div class="subtitle column">最新评测:</div>
        <div class="summary column">
            <span class="game_review_summary positive">好评如潮</span>
            <span class="responsive_reviewdesc">(547,203)</span>
        </div>
    </div>
    
    <!-- 标签 -->
    <div class="glance_tags popular_tags">
        <a class="app_tag">RPG</a>
        <a class="app_tag">开放世界</a>
        <a class="app_tag">故事丰富</a>
        <a class="app_tag">选择重要</a>
        <a class="app_tag">第三人称</a>
    </div>
    
    <!-- 系统要求 -->
    <div class="game_area_sys_req sysreq_content active">
        <div class="game_area_sys_req_leftCol">
            <ul>
                <li><strong>操作系统:</strong> Windows 7 64-bit</li>
                <li><strong>处理器:</strong> Intel Core i5-2500K 3.3GHz</li>
                <li><strong>内存:</strong> 6 GB RAM</li>
            </ul>
        </div>
    </div>
    
    <!-- 成就 -->
    <div class="block_content_inner">
        <div class="achievement_block">
            <div class="achievement_count">78 项成就</div>
        </div>
    </div>
</body>
</html>
`

// Counter-Strike 2 免费游戏HTML模拟
export const cs2Html = `
<!DOCTYPE html>
<html>
<head>
    <title>Counter-Strike 2 on Steam</title>
</head>
<body>
    <div class="apphub_AppName">Counter-Strike 2</div>
    <div class="game_description_snippet">有史以来最受欢迎的团队射击游戏的新时代已经开始。</div>
    
    <!-- 免费游戏 -->
    <div class="game_purchase_price price">免费游戏</div>
    
    <!-- 发布信息 -->
    <div class="release_date">
        <div class="date">2023年9月27日</div>
    </div>
    
    <!-- 开发商 -->
    <div class="summary column">
        <div class="dev_row">
            <b>开发商:</b>
            <a href="#">Valve</a>
        </div>
        <div class="dev_row">
            <b>发行商:</b>
            <a href="#">Valve</a>
        </div>
    </div>
    
    <!-- 评价 -->
    <div class="user_reviews_summary_row">
        <div class="summary column">
            <span class="game_review_summary mixed">多半好评</span>
            <span class="responsive_reviewdesc">(1,250,000)</span>
        </div>
    </div>
    
    <!-- 标签 -->
    <div class="glance_tags popular_tags">
        <a class="app_tag">射击</a>
        <a class="app_tag">多人</a>
        <a class="app_tag">竞技</a>
        <a class="app_tag">战术</a>
        <a class="app_tag">团队</a>
    </div>
</body>
</html>
`

// Cyberpunk 2077 折扣游戏HTML模拟
export const cyberpunk2077Html = `
<!DOCTYPE html>
<html>
<head>
    <title>Save 50% on Cyberpunk 2077 on Steam</title>
</head>
<body>
    <div class="apphub_AppName">Cyberpunk 2077</div>
    <div class="game_description_snippet">《赛博朋克2077》是一款开放世界动作冒险RPG，故事发生在末世大都会夜之城。</div>
    
    <!-- 折扣价格 -->
    <div class="discount_block game_purchase_discount">
        <div class="discount_pct">-50%</div>
        <div class="discount_prices">
            <div class="discount_original_price">¥ 178.00</div>
            <div class="discount_final_price">¥ 89.00</div>
        </div>
    </div>
    
    <!-- 发布信息 -->
    <div class="release_date">
        <div class="date">2020年12月10日</div>
    </div>
    
    <!-- 开发商 -->
    <div class="summary column">
        <div class="dev_row">
            <b>开发商:</b>
            <a href="#">CD PROJEKT RED</a>
        </div>
        <div class="dev_row">
            <b>发行商:</b>
            <a href="#">CD PROJEKT RED</a>
        </div>
    </div>
    
    <!-- 评价 -->
    <div class="user_reviews_summary_row">
        <div class="summary column">
            <span class="game_review_summary mixed">多半好评</span>
            <span class="responsive_reviewdesc">(689,542)</span>
        </div>
    </div>
    
    <!-- 标签 -->
    <div class="glance_tags popular_tags">
        <a class="app_tag">开放世界</a>
        <a class="app_tag">RPG</a>
        <a class="app_tag">科幻</a>
        <a class="app_tag">射击</a>
        <a class="app_tag">成人</a>
    </div>
    
    <!-- 年龄限制 -->
    <div class="mature_content">
        <div class="mature_content_notice">此游戏内容可能不适合所有年龄段：18+</div>
    </div>
</body>
</html>
`

// 404 页面HTML模拟
export const notFoundHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>页面未找到</title>
</head>
<body>
    <div class="error_ctn">
        <h3>抱歉!</h3>
        <h1>出现错误了。</h1>
        <p>无法找到您要访问的页面。</p>
    </div>
</body>
</html>
`

// 搜索结果页面HTML模拟
export const searchResultsHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Steam 搜索结果</title>
</head>
<body>
    <div id="search_resultsRows">
        <a href="/app/292030/The_Witcher_3_Wild_Hunt/" class="search_result_row">
            <div class="search_name">
                <span class="title">The Witcher 3: Wild Hunt</span>
            </div>
            <div class="search_price_discount_combined">
                <div class="search_price">¥ 127.00</div>
            </div>
        </a>
        
        <a href="/app/730/Counter_Strike_2/" class="search_result_row">
            <div class="search_name">
                <span class="title">Counter-Strike 2</span>
            </div>
            <div class="search_price_discount_combined">
                <div class="search_price">免费游戏</div>
            </div>
        </a>
        
        <a href="/app/1091500/Cyberpunk_2077/" class="search_result_row">
            <div class="search_name">
                <span class="title">Cyberpunk 2077</span>
            </div>
            <div class="search_price_discount_combined">
                <div class="search_discount">
                    <span class="search_discount_pct">-50%</span>
                    <div class="search_price">
                        <strike>¥ 178.00</strike> ¥ 89.00
                    </div>
                </div>
            </div>
        </a>
    </div>
</body>
</html>
`

// 热门游戏页面HTML模拟
export const popularGamesHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Steam 热门游戏</title>
</head>
<body>
    <div class="search_resultsRows">
        <a href="/app/292030/" class="search_result_row">
            <div class="search_name">The Witcher 3: Wild Hunt</div>
        </a>
        <a href="/app/730/" class="search_result_row">
            <div class="search_name">Counter-Strike 2</div>
        </a>
        <a href="/app/1091500/" class="search_result_row">
            <div class="search_name">Cyberpunk 2077</div>
        </a>
    </div>
</body>
</html>
`

// 模拟HTML响应的工厂函数
export function createHtmlResponse(html: string, status: number = 200): Response {
	return new Response(html, {
		status,
		statusText: status === 200 ? "OK" : "Error",
		headers: {
			"Content-Type": "text/html; charset=utf-8"
		}
	})
}

// HTML响应映射
export const htmlResponses = {
	// 游戏详情页
	"/app/292030/": witcher3Html,
	"/app/730/": cs2Html,
	"/app/1091500/": cyberpunk2077Html,
	
	// 搜索和分类页面
	"/search/": searchResultsHtml,
	"/search/?term=witcher": witcher3Html,
	"/search/?term=counter": cs2Html,
	"/search/?term=cyberpunk": cyberpunk2077Html,
	
	// 特殊页面
	"/app/999999/": notFoundHtml,
	"/error": notFoundHtml,
	
	// 分类页面
	"/category/popular/": popularGamesHtml,
	"/specials/": cyberpunk2077Html, // 折扣页面
}

// 根据URL获取对应的HTML响应
export function getHtmlResponseByUrl(url: string): string {
	// 简化URL匹配
	const path = new URL(url).pathname
	
	// 精确匹配
	if (htmlResponses[path as keyof typeof htmlResponses]) {
		return htmlResponses[path as keyof typeof htmlResponses]
	}
	
	// 模糊匹配
	if (path.includes("/app/292030/")) return witcher3Html
	if (path.includes("/app/730/")) return cs2Html
	if (path.includes("/app/1091500/")) return cyberpunk2077Html
	if (path.includes("/app/999999/")) return notFoundHtml
	if (path.includes("/search/")) return searchResultsHtml
	if (path.includes("/specials/")) return cyberpunk2077Html
	
	// 默认返回404
	return notFoundHtml
}

export default {
	witcher3Html,
	cs2Html,
	cyberpunk2077Html,
	notFoundHtml,
	searchResultsHtml,
	popularGamesHtml,
	createHtmlResponse,
	getHtmlResponseByUrl,
	htmlResponses
} 