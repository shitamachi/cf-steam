import SteamAPI from 'steamapi';
import { z } from 'zod';

// 数据类型定义
export const GameSchema = z.object({
  appid: z.number(),
  name: z.string(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
  price: z.string().optional(),
  originalPrice: z.string().optional(),
  discount: z.number().optional(),
  releaseDate: z.string().optional(),
  reviewScore: z.number().optional(),
  reviewCount: z.number().optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  headerImage: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  isOnSale: z.boolean().default(false),
  isUpcoming: z.boolean().default(false),
  isFree: z.boolean().default(false),
});

export type GameInfo = z.infer<typeof GameSchema>;

export class SteamService {
  private steamAPI: SteamAPI;
  private baseURL = 'https://store.steampowered.com';
  private rateLimit: number;
  private cacheTTL: number;

  constructor(apiKey?: string, options?: { rateLimit?: number; cacheTTL?: number }) {
    this.steamAPI = new SteamAPI(apiKey || false);
    this.rateLimit = options?.rateLimit || 100;
    this.cacheTTL = options?.cacheTTL || 3600;
  }

  /**
   * 简单的HTML文本提取器
   */
  private extractText(html: string, selector: string): string | null {
    // 这是一个简化的实现，仅用于基本的文本提取
    const patterns: Record<string, RegExp> = {
      '.apphub_AppName': /<div[^>]*class="[^"]*apphub_AppName[^"]*"[^>]*>([^<]+)<\/div>/i,
      '.game_purchase_price': /<div[^>]*class="[^"]*game_purchase_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      '.discount_final_price': /<div[^>]*class="[^"]*discount_final_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      '.discount_original_price': /<div[^>]*class="[^"]*discount_original_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      '.discount_pct': /<div[^>]*class="[^"]*discount_pct[^"]*"[^>]*>([^<]+)<\/div>/i,
      '.date': /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/i,
    };
    
    const pattern = patterns[selector];
    if (pattern) {
      const match = html.match(pattern);
      return match ? match[1].trim() : null;
    }
    return null;
  }

  /**
   * 提取链接中的游戏ID
   */
  private extractGameIds(html: string, limit: number): number[] {
    const gameIds: number[] = [];
    const searchResultPattern = /<a[^>]*href="[^"]*\/app\/(\d+)\/[^"]*"[^>]*class="[^"]*search_result_row[^"]*"/gi;
    let match;
    let count = 0;
    
    while ((match = searchResultPattern.exec(html)) !== null && count < limit) {
      gameIds.push(parseInt(match[1]));
      count++;
    }
    
    return gameIds;
  }

  /**
   * 获取所有Steam游戏列表
   */
  async getAllGames(): Promise<{ appid: number; name: string }[]> {
    try {
      const apps = await this.steamAPI.getAppList();
      return apps;
    } catch (error) {
      console.error('获取游戏列表失败:', error);
      throw new Error('无法获取Steam游戏列表');
    }
  }

  /**
   * 获取游戏详细信息（结合API和网页抓取）
   */
  async getGameDetails(appid: number): Promise<GameInfo | null> {
    try {
      // 尝试从Steam API获取基本信息
      let gameData: Partial<GameInfo> = { appid };

      try {
        const appDetails = await this.steamAPI.getGameDetails(appid);
        if (appDetails) {
          gameData = {
            ...gameData,
            name: appDetails.name,
            developer: appDetails.developers?.[0],
            publisher: appDetails.publishers?.[0],
            releaseDate: typeof appDetails.releaseDate === 'string' 
              ? appDetails.releaseDate 
              : appDetails.releaseDate?.date || '',
            description: appDetails.shortDescription,
            headerImage: appDetails.headerImage,
            screenshots: appDetails.screenshots?.map(s => s.path_full),
            isFree: appDetails.isFree,
          };
        }
      } catch (apiError) {
        console.warn(`Steam API获取游戏 ${appid} 信息失败，尝试网页抓取`);
      }

      // 补充网页抓取信息
      const webData = await this.scrapeGamePage(appid);
      if (webData) {
        gameData = { ...gameData, ...webData };
      }

      return GameSchema.parse(gameData);
    } catch (error) {
      console.error(`获取游戏 ${appid} 详情失败:`, error);
      return null;
    }
  }

  /**
   * 抓取Steam商店页面信息
   */
  private async scrapeGamePage(appid: number): Promise<Partial<GameInfo> | null> {
    try {
      const response = await fetch(`${this.baseURL}/app/${appid}/?l=schinese`);
      if (!response.ok) return null;

      const html = await response.text();
      const gameData: Partial<GameInfo> = {};

      // 游戏名称
      const name = this.extractText(html, '.apphub_AppName');
      if (name) gameData.name = name;

      // 价格信息
      const price = this.extractText(html, '.game_purchase_price') || this.extractText(html, '.discount_final_price');
      if (price) gameData.price = price;

      // 原价（如果有折扣）
      const originalPrice = this.extractText(html, '.discount_original_price');
      if (originalPrice) {
        gameData.originalPrice = originalPrice;
        gameData.isOnSale = true;
      }

      // 折扣百分比
      const discountText = this.extractText(html, '.discount_pct');
      if (discountText) {
        const discountMatch = discountText.match(/-(\d+)%/);
        if (discountMatch) {
          gameData.discount = parseInt(discountMatch[1]);
        }
      }

      // 发行日期
      const releaseDate = this.extractText(html, '.date');
      if (releaseDate) gameData.releaseDate = releaseDate;

      // 即将推出标识
      if (html.includes('early_access_header') || html.includes('coming_soon')) {
        gameData.isUpcoming = true;
      }

      // 免费游戏标识
      if (price && (price.includes('免费') || price.includes('Free'))) {
        gameData.isFree = true;
      }

      // 简化的开发商提取
      const devMatch = html.match(/开发商[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i) || 
                       html.match(/Developer[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i);
      if (devMatch) {
        gameData.developer = devMatch[1].trim();
      }

      // 简化的发行商提取
      const pubMatch = html.match(/发行商[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i) || 
                       html.match(/Publisher[^>]*>.*?<a[^>]*>([^<]+)<\/a>/i);
      if (pubMatch) {
        gameData.publisher = pubMatch[1].trim();
      }

      return gameData;
    } catch (error) {
      console.error(`抓取游戏页面 ${appid} 失败:`, error);
      return null;
    }
  }

  /**
   * 从搜索结果页面提取游戏ID
   */
  private extractGameIdsFromSearchResults(html: string, limit: number): number[] {
    return this.extractGameIds(html, limit);
  }

  /**
   * 获取热门游戏
   */
  async getPopularGames(limit: number = 20): Promise<GameInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/search/?sort_by=_ASC&supportedlang=schinese&ndl=1`);
      const html = await response.text();
      const gameIds = this.extractGameIdsFromSearchResults(html, limit);

      const games: GameInfo[] = [];
      for (const appid of gameIds) {
        const game = await this.getGameDetails(appid);
        if (game) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      console.error('获取热门游戏失败:', error);
      return [];
    }
  }

  /**
   * 获取折扣游戏
   */
  async getDiscountedGames(limit: number = 50): Promise<GameInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/search/?specials=1&ndl=1&l=schinese`);
      const html = await response.text();
      const gameIds = this.extractGameIdsFromSearchResults(html, limit);

      const games: GameInfo[] = [];
      for (const appid of gameIds) {
        const game = await this.getGameDetails(appid);
        if (game && game.isOnSale) {
          games.push(game);
        }
      }

      return games.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    } catch (error) {
      console.error('获取折扣游戏失败:', error);
      return [];
    }
  }

  /**
   * 获取即将发行的游戏
   */
  async getUpcomingGames(limit: number = 30): Promise<GameInfo[]> {
    try {
      const response = await fetch(`${this.baseURL}/search/?category1=998&ndl=1&l=schinese`);
      const html = await response.text();
      const gameIds = this.extractGameIdsFromSearchResults(html, limit);

      const games: GameInfo[] = [];
      for (const appid of gameIds) {
        const game = await this.getGameDetails(appid);
        if (game) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      console.error('获取即将发行游戏失败:', error);
      return [];
    }
  }

  /**
   * 搜索游戏
   */
  async searchGames(query: string, limit: number = 20): Promise<GameInfo[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(`${this.baseURL}/search/?term=${encodedQuery}&l=schinese`);
      const html = await response.text();
      const gameIds = this.extractGameIdsFromSearchResults(html, limit);

      const games: GameInfo[] = [];
      for (const appid of gameIds) {
        const game = await this.getGameDetails(appid);
        if (game) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      console.error(`搜索游戏 "${query}" 失败:`, error);
      return [];
    }
  }

  /**
   * 获取特定类别的游戏
   */
  async getGamesByCategory(category: string, limit: number = 20): Promise<GameInfo[]> {
    try {
      // 类别映射
      const categoryMap: Record<string, string> = {
        'action': 'category1=19',
        'adventure': 'category1=25',
        'strategy': 'category1=2',
        'rpg': 'category1=122',
        'simulation': 'category1=28',
        'sports': 'category1=701',
        'racing': 'category1=699',
        'indie': 'category1=492',
        'free': 'genre=Free%20to%20Play',
      };

      const categoryParam = categoryMap[category.toLowerCase()] || `term=${encodeURIComponent(category)}`;
      const response = await fetch(`${this.baseURL}/search/?${categoryParam}&l=schinese`);
      const html = await response.text();
      const gameIds = this.extractGameIdsFromSearchResults(html, limit);

      const games: GameInfo[] = [];
      for (const appid of gameIds) {
        const game = await this.getGameDetails(appid);
        if (game) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      console.error(`获取类别 "${category}" 游戏失败:`, error);
      return [];
    }
  }
} 