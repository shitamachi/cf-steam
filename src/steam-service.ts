import SteamAPI, { type Currency } from "steamapi";
import { z } from "zod";
import { HttpError } from "./error";
import {
  CSteamCharts_GetGamesByConcurrentPlayers_Request,
  CSteamCharts_GetGamesByConcurrentPlayers_Response,
} from "./generated/service_steamcharts";
import {
  CStoreTopSellers_GetWeeklyTopSellers_Request,
  CStoreTopSellers_GetWeeklyTopSellers_Response,
} from "./generated/service_storetopsellers";
import { LanguageSchema } from "./schemas/games";

// 完整的游戏数据类型定义
export const GameSchema = z
  .object({
    // 基本信息
    appid: z.number(),
    name: z.string(),
    type: z.string().optional(),

    // 描述信息
    shortDescription: z.string().optional(),
    detailedDescription: z.string().optional(),
    description: z.string().optional(), // 兼容旧字段

    // 价格信息
    price: z.string().optional(),
    currentPrice: z.string().optional(),
    originalPrice: z.string().optional(),
    discountedPrice: z.string().optional(),
    discountPercentage: z.string().optional(),
    discount: z.number().optional(), // 兼容旧字段
    isOnSale: z.boolean().default(false),
    isFree: z.boolean().default(false),
    priceOverview: z.any().optional(), // 新增：更详细的价格信息

    // 发布信息
    releaseDate: z.string().optional(),
    developer: z.string().optional(),
    publisher: z.string().optional(),

    // 评价信息
    reviewSummary: z.string().optional(),
    reviewDescription: z.string().optional(),
    reviewScore: z.number().optional(),
    reviewCount: z.number().optional(),
    metacritic: z.any().optional(), // 新增：Metacritic 评分

    // 媒体内容
    headerImage: z.string().optional(),
    screenshots: z.array(z.string()).optional(),
    movies: z.array(z.any()).optional(),
    background: z.string().optional(),

    // 分类和标签
    tags: z.array(z.string()).optional(),
    genres: z.array(z.any()).optional(),
    categories: z.array(z.any()).optional(),

    // 平台和技术支持
    supportedPlatforms: z.array(z.string()).optional(),
    systemRequirements: z.any().optional(),
    pcRequirements: z.any().optional(), // 新增：PC 系统要求
    macRequirements: z.any().optional(), // 新增：Mac 系统要求
    linuxRequirements: z.any().optional(), // 新增：Linux 系统要求
    supportedLanguages: z.string().optional(),
    supportedLanguagesDetailed: z.array(z.any()).optional(), // 新增：详细语言支持
    controllerSupport: z.string().optional(),

    // 游戏特性
    achievementCount: z.string().optional(),
    achievements: z.any().optional(),
    dlcList: z.array(z.string()).optional(),
    fullDlcList: z.array(z.any()).optional(), // 新增：更详细的 DLC 列表
    demos: z.array(z.any()).optional(), // 新增：试玩版信息
    requiredAge: z.number().optional(),
    contentDescriptors: z.any().optional(),

    // 社区和推荐
    recommendations: z.any().optional(),
    supportInfo: z.any().optional(),

    // 法律和账户信息
    legalNotice: z.string().optional(), // 新增：法律声明
    extUserAccountNotice: z.string().optional(), // 新增：外部用户账户通知

    // 状态标记
    isUpcoming: z.boolean().default(false),
    isEarlyAccess: z.boolean().default(false),

    // 原始数据和元数据
    steamAppData: z.any().optional(),
    scrapedAt: z.string().optional(),
    dataSource: z.string().optional(),
  })
  .partial();

export type GameInfo = z.infer<typeof GameSchema>;

export class SteamService {
  private steamAPI: SteamAPI;
  private baseURL = "https://store.steampowered.com";
  private rateLimit: number;
  private cacheTTL: number;

  constructor(
    apiKey?: string,
    options?: { rateLimit?: number; cacheTTL?: number }
  ) {
    this.steamAPI = new SteamAPI(apiKey || false);
    this.rateLimit = options?.rateLimit || 100;
    this.cacheTTL = options?.cacheTTL || 3600;
  }

  /**
   * 提取链接中的游戏ID
   */
  private extractGameIds(html: string, limit: number): number[] {
    const gameIds: number[] = [];
    const searchResultPattern =
      /<a[^>]*href="[^"]*\/app\/(\d+)\/[^"]*"[^>]*class="[^"]*search_result_row[^"]*"/gi;
    let match: RegExpExecArray | null = null;
    let count = 0;

    // biome-ignore lint/suspicious/noAssignInExpressions: <pass todo>
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
      console.error("获取游戏列表失败:", error);
      throw new Error("无法获取Steam游戏列表");
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
            releaseDate:
              typeof appDetails.releaseDate === "string"
                ? appDetails.releaseDate
                : appDetails.releaseDate?.date || "",
            description: appDetails.shortDescription,
            headerImage: appDetails.headerImage,
            screenshots: appDetails.screenshots?.map((s) => s.path_full),
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

      // 如果在所有数据源之后仍然没有游戏名称，则认为获取失败
      if (!gameData.name) {
        return null;
      }

      return GameSchema.parse(gameData);
    } catch (error) {
      console.error(`获取游戏 ${appid} 详情失败:`, error);
      return null;
    }
  }

  /**
   * 获取 steam api 游戏详情，仅获取 steam api 的数据
   * @param appid
   * @param lang
   */
  async getApiGameDetails(appid: number, lang: string = "english") {
    const language = LanguageSchema.catch("english").parse(lang);
    let currency: Currency;
    if (language === "schinese") {
      currency = "cn";
    } else {
      currency = "us";
    }
    
    try {
      const appDetails = await this.steamAPI.getGameDetails(appid, {
        language: language,
        currency: currency,
        filters: [],
      });
      return appDetails;
    } catch (error) {
      // 捕获特定的 "Failed to find app ID" 错误
      if (error instanceof Error && error.message === "Failed to find app ID") {
        console.info(`游戏 ${appid} 未找到或不可用`);
        return null;
      }
      // 重新抛出其他错误
      throw error;
    }
  }

  /**
   * 获取当前在线玩家数量
   * @param appid
   */
  async getNumberOfCurrentPlayers(appid: number): Promise<number> {
    try {
      return await this.steamAPI.getGamePlayers(appid);
    } catch (error) {
      console.error(`获取游戏 ${appid} 在线玩家数量失败:`, error);
      throw new Error(`无法获取游戏 ${appid} 的在线玩家数量`);
    }
  }

  /**
   * 获取 steam 商店页 url
   */
  getGameStoreUrl(appid: number, l: string = "schinese"): string {
    return `${this.baseURL}/app/${appid}/?l=${l}`;
  }

  /**
   * 获取 steam 社区页 url
   */
  getGameCommunityUrl(appid: number, section: string = ""): string {
    const communityBaseURL = "https://steamcommunity.com";
    if (section) {
      return `${communityBaseURL}/app/${appid}/${section}`;
    }
    return `${communityBaseURL}/app/${appid}`;
  }

  /**
   * 获取游戏社区页面 HTML，包含年龄验证绕过功能
   */
  async getGameCommunityHtml(
    appid: number,
    section: string = ""
  ): Promise<string> {
    const url = this.getGameCommunityUrl(appid, section);

    // 创建优化的请求头
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    };

    // 设置年龄验证 Cookie
    const cookies = [
      `wants_mature_content=1; path=/app/${appid}; domain=steamcommunity.com`,
      `wants_mature_content=1; path=/app/${appid}; domain=store.steampowered.com`,
      `wants_mature_content=1; path=/; domain=steamcommunity.com`,
      `wants_mature_content=1; path=/; domain=store.steampowered.com`,
      `wants_mature_content_apps=${appid}; path=/; domain=steamcommunity.com`,
    ].join("; ");

    if (cookies) {
      headers["Cookie"] = cookies;
    }

    try {
      // 第一次尝试：使用优化的请求头
      let response = await fetch(url, { headers });

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText);
      }

      let html = await response.text();

      // 检查是否遇到年龄验证页面
      if (this.isAgeVerificationPage(html)) {
        console.log(`检测到年龄验证页面，尝试绕过 (appid: ${appid})`);

        // 尝试直接访问已验证的 URL 格式
        const verifiedUrl = this.getVerifiedCommunityUrl(appid, section);
        const verifiedResponse = await fetch(verifiedUrl, { headers });

        if (verifiedResponse.ok) {
          html = await verifiedResponse.text();

          // 再次检查是否仍然有年龄验证
          if (!this.isAgeVerificationPage(html)) {
            console.log(`成功绕过年龄验证 (appid: ${appid})`);
            return html;
          }
        }

        // 如果直接访问失败，尝试提交年龄验证表单
        html = await this.submitAgeVerification(url, appid, headers);
      }

      return html;
    } catch (error) {
      console.error(`获取游戏社区页面失败 (appid: ${appid}):`, error);
      throw error;
    }
  }

  /**
   * 检查是否为年龄验证页面
   */
  private isAgeVerificationPage(html: string): boolean {
    const ageCheckIndicators = [
      // 传统年龄验证页面标识
      "agecheck",
      "ageYear",
      "ageMonth",
      "ageDay",
      "CheckAgeGateSubmit",
      "wants_mature_content",
      "mature_content",
      "年龄验证",
      "Age verification",

      // 内容偏好确认页面标识（基于真实页面）
      "contentcheck_desc_ctn",
      "contentcheck_header",
      "contentcheck_descriptors_ctn",
      "contentcheck_descriptor",
      "contentcheck_dev_ctn",
      "contentcheck_btns_ctn",
      "contentcheck_settings_ctn",
      "THIS GAME CONTAINS CONTENT YOU HAVE ASKED NOT TO SEE",
      "View Community Hub",
      "Update Content Preferences",
      "wants_mature_content_apps",
      "AcceptAppHub",
      "Proceed",
    ];

    return ageCheckIndicators.some((indicator) =>
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * 获取已验证的社区页面 URL
   */
  private getVerifiedCommunityUrl(appid: number, section: string = ""): string {
    const communityBaseURL = "https://steamcommunity.com";
    if (section) {
      return `${communityBaseURL}/app/${appid}/${section}?snr=1_agecheck_agecheck__`;
    }
    return `${communityBaseURL}/app/${appid}?snr=1_agecheck_agecheck__`;
  }

  /**
   * 提交年龄验证表单
   */
  private async submitAgeVerification(
    url: string,
    appid: number,
    headers: Record<string, string>
  ): Promise<string> {
    try {
      // 构造年龄验证 POST 请求
      const ageCheckUrl = `https://store.steampowered.com/agecheckset/app/${appid}/`;
      const formData = new URLSearchParams({
        sessionid: this.generateSessionId(),
        ageDay: "15",
        ageMonth: "1",
        ageYear: "1990", // 使用一个成年年龄
      });

      const postHeaders = {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: url,
        Origin: "https://store.steampowered.com",
      };

      // 提交年龄验证
      const ageCheckResponse = await fetch(ageCheckUrl, {
        method: "POST",
        headers: postHeaders,
        body: formData,
      });

      if (ageCheckResponse.ok) {
        // 重新获取原始页面
        const retryResponse = await fetch(url, { headers });
        if (retryResponse.ok) {
          return await retryResponse.text();
        }
      }

      throw new Error("年龄验证提交失败");
    } catch (error) {
      console.error("年龄验证提交失败:", error);
      throw error;
    }
  }

  /**
   * 生成随机会话 ID
   */
  private generateSessionId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * 抓取Steam商店页面的完整信息
   * 这个方法会抓取页面上所有可用的数据，包括基本信息、价格、评价、媒体内容等
   */
  async scrapeGamePage(appid: number): Promise<Partial<GameInfo> | null> {
    try {
      const response = await fetch(this.getGameStoreUrl(appid));
      if (!response.ok) return null;

      const html = await response.text();

      // 检查是否在 Cloudflare Workers 环境中
      const isWorkerEnvironment = typeof HTMLRewriter !== "undefined";

      if (isWorkerEnvironment) {
        console.debug("使用 HTMLRewriter 进行数据抓取");
        return await this.scrapeWithHTMLRewriter(html, appid);
      } else {
        console.debug("使用正则表达式进行数据抓取");
        return await this.scrapeWithRegex(html, appid);
      }
    } catch (error) {
      console.error(`抓取游戏页面失败 (${appid}):`, error);
      return null;
    }
  }

  /**
   * 使用 HTMLRewriter 进行数据抓取（Cloudflare Workers 环境）
   */
  private async scrapeWithHTMLRewriter(
    html: string,
    appid: number
  ): Promise<Partial<GameInfo> | null> {
    const gameData: any = {
      appid,
      scrapedAt: new Date().toISOString(),
      dataSource: "steam_store_page",
    };

    // 创建一个 Response 对象以便 HTMLRewriter 处理
    const response = new Response(html, {
      headers: { "Content-Type": "text/html" },
    });

    const rewriter = new HTMLRewriter()
      // 提取 JSON 数据（Steam 页面通常包含 JSON 数据）
      .on("script", {
        text(text: any) {
          const jsonDataMatch = text.text.match(
            /var\s+g_rgAppData\s*=\s*({.*?});/s
          );
          if (jsonDataMatch) {
            try {
              const appData = JSON.parse(jsonDataMatch[1]);
              const gameInfo = appData[appid];
              if (gameInfo) {
                gameData.steamAppData = gameInfo;
                // 从 JSON 数据中提取更多信息
                gameData.type = gameInfo.type;
                gameData.requiredAge = gameInfo.required_age;
                gameData.isFree = gameInfo.is_free;
                gameData.controllerSupport = gameInfo.controller_support;
                gameData.categories = gameInfo.categories;
                gameData.genres = gameInfo.genres;
                gameData.screenshots = gameInfo.screenshots;
                gameData.movies = gameInfo.movies;
                gameData.recommendations = gameInfo.recommendations;
                gameData.achievements = gameInfo.achievements;
                gameData.releaseDate = gameInfo.release_date;
                gameData.supportInfo = gameInfo.support_info;
                gameData.background = gameInfo.background;
                gameData.contentDescriptors = gameInfo.content_descriptors;
                gameData.metacritic = gameInfo.metacritic;
                gameData.demos = gameInfo.demos;
                gameData.fullDlcList = gameInfo.dlc;
                gameData.pcRequirements = gameInfo.pc_requirements;
                gameData.macRequirements = gameInfo.mac_requirements;
                gameData.linuxRequirements = gameInfo.linux_requirements;
                gameData.priceOverview = gameInfo.price_overview;
                gameData.legalNotice = gameInfo.legal_notice;
                gameData.extUserAccountNotice =
                  gameInfo.ext_user_account_notice;
                gameData.supportedLanguagesDetailed =
                  gameInfo.supported_languages;
              }
            } catch (error) {
              console.warn("HTMLRewriter: 解析 JSON 数据失败:", error);
            }
          }
        },
      })
      // 1. 基本游戏信息
      .on(".apphub_AppName", {
        text(text: any) {
          if (text.text.trim() && !gameData.name) {
            gameData.name = text.text.trim();
          }
        },
      })
      .on(".game_description_snippet", {
        text(text: any) {
          if (text.text.trim() && !gameData.shortDescription) {
            gameData.shortDescription = text.text.trim();
          }
        },
      })
      .on(".game_area_description", {
        text(text: any) {
          if (text.text.trim() && !gameData.detailedDescription) {
            gameData.detailedDescription = text.text.trim();
          }
        },
      })

      // 2. 价格信息
      .on(".game_purchase_price", {
        text(text: any) {
          if (text.text.trim() && !gameData.currentPrice) {
            gameData.currentPrice = text.text.trim();
            gameData.isFree = text.text.trim().toLowerCase().includes("免费");
          }
        },
      })
      .on(".discount_final_price", {
        text(text: any) {
          if (text.text.trim() && !gameData.discountedPrice) {
            gameData.discountedPrice = text.text.trim();
            gameData.isOnSale = true;
          }
        },
      })
      .on(".discount_original_price", {
        text(text: any) {
          if (text.text.trim() && !gameData.originalPrice) {
            gameData.originalPrice = text.text.trim();
          }
        },
      })
      .on(".discount_pct", {
        text(text: any) {
          if (text.text.trim() && !gameData.discountPercentage) {
            gameData.discountPercentage = text.text.trim();
          }
        },
      })

      // 3. 发布信息
      .on(".date", {
        text(text: any) {
          if (text.text.trim() && !gameData.releaseDate) {
            gameData.releaseDate = text.text.trim();
          }
        },
      })
      .on(".dev_row .summary", {
        text(text: any) {
          if (text.text.trim()) {
            if (!gameData.developer) {
              gameData.developer = text.text.trim();
            } else if (!gameData.publisher) {
              gameData.publisher = text.text.trim();
            }
          }
        },
      })

      // 4. 评价信息
      .on(".game_review_summary", {
        text(text: any) {
          if (text.text.trim() && !gameData.reviewSummary) {
            gameData.reviewSummary = text.text.trim();
          }
        },
      })
      .on(".responsive_reviewdesc", {
        text(text: any) {
          if (text.text.trim() && !gameData.reviewDescription) {
            gameData.reviewDescription = text.text.trim();
          }
        },
      })

      // 5. 系统需求和平台
      .on(".sysreq_tab", {
        text(text: any) {
          if (text.text.trim()) {
            if (!gameData.supportedPlatforms) {
              gameData.supportedPlatforms = [];
            }
            gameData.supportedPlatforms.push(text.text.trim());
          }
        },
      })

      // 6. 标签和类型
      .on(".app_tag", {
        text(text: any) {
          if (text.text.trim()) {
            if (!gameData.tags) {
              gameData.tags = [];
            }
            gameData.tags.push(text.text.trim());
          }
        },
      })
      .on(".details_block .blockbg", {
        text(text: any) {
          if (text.text.trim()) {
            if (!gameData.genres) {
              gameData.genres = [];
            }
            gameData.genres.push(text.text.trim());
          }
        },
      })

      // 7. 媒体内容
      .on(".game_header_image", {
        element(element: any) {
          const src = element.getAttribute("src");
          if (src && !gameData.headerImage) {
            gameData.headerImage = src;
          }
        },
      })
      .on(".highlight_screenshot_link img", {
        element(element: any) {
          const src = element.getAttribute("src");
          if (src) {
            if (!gameData.screenshots) {
              gameData.screenshots = [];
            }
            gameData.screenshots.push(src);
          }
        },
      })

      // 8. DLC 和相关内容
      .on(".game_area_dlc_row", {
        text(text: any) {
          if (text.text.trim()) {
            if (!gameData.dlcList) {
              gameData.dlcList = [];
            }
            gameData.dlcList.push(text.text.trim());
          }
        },
      })

      // 9. 语言支持
      .on(".game_language_options", {
        text(text: any) {
          if (text.text.trim() && !gameData.supportedLanguages) {
            gameData.supportedLanguages = text.text.trim();
          }
        },
      })

      // 10. 成就信息
      .on(".achievement_count", {
        text(text: any) {
          if (text.text.trim() && !gameData.achievementCount) {
            gameData.achievementCount = text.text.trim();
          }
        },
      })
      // 11. 法律声明
      .on(".legal_notice_box", {
        text(text: any) {
          if (text.text.trim() && !gameData.legalNotice) {
            gameData.legalNotice = text.text.trim();
          }
        },
      })
      // 12. 外部用户账户通知
      .on(".ext_user_account_notice_box", {
        text(text: any) {
          if (text.text.trim() && !gameData.extUserAccountNotice) {
            gameData.extUserAccountNotice = text.text.trim();
          }
        },
      });

    // 处理 HTML
    const processedResponse = rewriter.transform(response);
    await processedResponse.text(); // 触发处理

    return this.cleanAndValidateGameData(gameData);
  }

  /**
   * 使用正则表达式进行数据抓取（开发环境回退方案）
   */
  private async scrapeWithRegex(
    html: string,
    appid: number
  ): Promise<Partial<GameInfo> | null> {
    const gameData: any = {
      appid,
      scrapedAt: new Date().toISOString(),
      dataSource: "steam_store_page",
    };

    // 定义抓取规则
    const extractionRules = {
      // 基本信息
      name: /<div[^>]*class="[^"]*apphub_AppName[^"]*"[^>]*>([^<]+)<\/div>/i,
      shortDescription:
        /<div[^>]*class="[^"]*game_description_snippet[^"]*"[^>]*>([^<]+)<\/div>/i,
      detailedDescription:
        /<div[^>]*class="[^"]*game_area_description[^"]*"[^>]*>(.*?)<\/div>/is,

      // 价格信息
      currentPrice:
        /<div[^>]*class="[^"]*game_purchase_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      discountedPrice:
        /<div[^>]*class="[^"]*discount_final_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      originalPrice:
        /<div[^>]*class="[^"]*discount_original_price[^"]*"[^>]*>([^<]+)<\/div>/i,
      discountPercentage:
        /<div[^>]*class="[^"]*discount_pct[^"]*"[^>]*>([^<]+)<\/div>/i,

      // 发布信息
      releaseDate: /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/i,
      developer:
        /<div[^>]*class="[^"]*dev_row[^"]*"[^>]*>.*?<div[^>]*class="[^"]*summary[^"]*"[^>]*>([^<]+)<\/div>/is,

      // 评价信息
      reviewSummary:
        /<div[^>]*class="[^"]*game_review_summary[^"]*"[^>]*>([^<]+)<\/div>/i,
      reviewDescription:
        /<span[^>]*class="[^"]*responsive_reviewdesc[^"]*"[^>]*>([^<]+)<\/span>/i,

      // 媒体内容
      headerImage:
        /<img[^>]*class="[^"]*game_header_image[^"]*"[^>]*src="([^"]+)"/i,

      // 标签
      tags: /<a[^>]*class="[^"]*app_tag[^"]*"[^>]*>([^<]+)<\/a>/gi,

      // 平台支持
      platforms: /<div[^>]*class="[^"]*sysreq_tab[^"]*"[^>]*>([^<]+)<\/div>/gi,

      // 语言支持
      supportedLanguages:
        /<div[^>]*class="[^"]*game_language_options[^"]*"[^>]*>(.*?)<\/div>/is,

      // 成就数量
      achievementCount:
        /<div[^>]*class="[^"]*achievement_count[^"]*"[^>]*>([^<]+)<\/div>/i,

      // 截图
      screenshots:
        /<div[^>]*class="[^"]*highlight_screenshot_link[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/gi,

      // DLC 信息
      dlcList:
        /<div[^>]*class="[^"]*game_area_dlc_row[^"]*"[^>]*>(.*?)<\/div>/gi,
    };

    // 执行抓取
    for (const [key, regex] of Object.entries(extractionRules)) {
      if (regex.global) {
        // 处理多个匹配项
        const matches = [...html.matchAll(regex as RegExp)];
        if (matches.length > 0) {
          gameData[key] = matches
            .map((match) => match[1]?.trim())
            .filter(Boolean);
        }
      } else {
        // 处理单个匹配项
        const match = html.match(regex as RegExp);
        if (match && match[1]) {
          gameData[key] = match[1].trim();
        }
      }
    }

    // 特殊处理
    if (gameData.currentPrice) {
      gameData.isFree =
        gameData.currentPrice.toLowerCase().includes("免费") ||
        gameData.currentPrice.toLowerCase().includes("free");
    }

    if (gameData.discountedPrice) {
      gameData.isOnSale = true;
    }

    // 提取 JSON 数据（Steam 页面通常包含 JSON 数据）
    const jsonDataMatch = html.match(/var\s+g_rgAppData\s*=\s*({.*?});/s);
    if (jsonDataMatch) {
      try {
        const appData = JSON.parse(jsonDataMatch[1]);
        const gameInfo = appData[appid];
        if (gameInfo) {
          gameData.steamAppData = gameInfo;
          // 从 JSON 数据中提取更多信息
          gameData.type = gameInfo.type;
          gameData.requiredAge = gameInfo.required_age;
          gameData.isFree = gameInfo.is_free;
          gameData.controllerSupport = gameInfo.controller_support;
          gameData.categories = gameInfo.categories;
          gameData.genres = gameInfo.genres;
          gameData.screenshots = gameInfo.screenshots;
          gameData.movies = gameInfo.movies;
          gameData.recommendations = gameInfo.recommendations;
          gameData.achievements = gameInfo.achievements;
          gameData.releaseDate = gameInfo.release_date;
          gameData.supportInfo = gameInfo.support_info;
          gameData.background = gameInfo.background;
          gameData.contentDescriptors = gameInfo.content_descriptors;
          gameData.metacritic = gameInfo.metacritic;
          gameData.demos = gameInfo.demos;
          gameData.fullDlcList = gameInfo.dlc;
          gameData.pcRequirements = gameInfo.pc_requirements;
          gameData.macRequirements = gameInfo.mac_requirements;
          gameData.linuxRequirements = gameInfo.linux_requirements;
          gameData.priceOverview = gameInfo.price_overview;
          gameData.legalNotice = gameInfo.legal_notice;
          gameData.extUserAccountNotice = gameInfo.ext_user_account_notice;
          gameData.supportedLanguagesDetailed = gameInfo.supported_languages;
        }
      } catch (error) {
        console.warn("解析 JSON 数据失败:", error);
      }
    }

    return this.cleanAndValidateGameData(gameData);
  }

  /**
   * 清理和验证游戏数据
   */
  private cleanAndValidateGameData(gameData: any): Partial<GameInfo> | null {
    // 数据清理
    const cleanData: any = {};

    // 基本信息验证
    if (gameData.name) {
      cleanData.name = gameData.name;
      cleanData.appid = gameData.appid;
    } else {
      // 如果没有游戏名称，认为抓取失败
      return null;
    }

    // 价格信息
    if (gameData.currentPrice) cleanData.price = gameData.currentPrice;
    if (gameData.originalPrice)
      cleanData.originalPrice = gameData.originalPrice;
    if (gameData.discountedPrice)
      cleanData.discountedPrice = gameData.discountedPrice;
    if (gameData.discountPercentage)
      cleanData.discountPercentage = gameData.discountPercentage;
    cleanData.isOnSale = gameData.isOnSale || false;
    cleanData.isFree = gameData.isFree || false;

    // 描述信息
    if (gameData.shortDescription)
      cleanData.shortDescription = gameData.shortDescription;
    if (gameData.detailedDescription)
      cleanData.detailedDescription = gameData.detailedDescription;

    // 发布信息
    if (gameData.releaseDate) cleanData.releaseDate = gameData.releaseDate;
    if (gameData.developer) cleanData.developer = gameData.developer;
    if (gameData.publisher) cleanData.publisher = gameData.publisher;

    // 评价信息
    if (gameData.reviewSummary)
      cleanData.reviewSummary = gameData.reviewSummary;
    if (gameData.reviewDescription)
      cleanData.reviewDescription = gameData.reviewDescription;

    // 媒体内容
    if (gameData.headerImage) cleanData.headerImage = gameData.headerImage;
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      cleanData.screenshots = gameData.screenshots;
    }

    // 分类和标签
    if (gameData.tags && gameData.tags.length > 0) {
      cleanData.tags = [...new Set(gameData.tags)]; // 去重
    }
    if (gameData.genres && gameData.genres.length > 0) {
      cleanData.genres = [...new Set(gameData.genres)]; // 去重
    }

    // 平台支持
    if (gameData.supportedPlatforms && gameData.supportedPlatforms.length > 0) {
      cleanData.supportedPlatforms = [...new Set(gameData.supportedPlatforms)];
    }

    // 语言支持
    if (gameData.supportedLanguages)
      cleanData.supportedLanguages = gameData.supportedLanguages;

    // 成就信息
    if (gameData.achievementCount)
      cleanData.achievementCount = gameData.achievementCount;

    // DLC 信息
    if (gameData.dlcList && gameData.dlcList.length > 0) {
      cleanData.dlcList = gameData.dlcList;
    }

    // Steam 原始数据
    if (gameData.steamAppData) {
      cleanData.steamAppData = gameData.steamAppData;
    }

    // 新增字段的清理和验证
    if (gameData.metacritic) cleanData.metacritic = gameData.metacritic;
    if (gameData.demos) cleanData.demos = gameData.demos;
    if (gameData.fullDlcList) cleanData.fullDlcList = gameData.fullDlcList;
    if (gameData.pcRequirements)
      cleanData.pcRequirements = gameData.pcRequirements;
    if (gameData.macRequirements)
      cleanData.macRequirements = gameData.macRequirements;
    if (gameData.linuxRequirements)
      cleanData.linuxRequirements = gameData.linuxRequirements;
    if (gameData.priceOverview)
      cleanData.priceOverview = gameData.priceOverview;
    if (gameData.legalNotice) cleanData.legalNotice = gameData.legalNotice;
    if (gameData.extUserAccountNotice)
      cleanData.extUserAccountNotice = gameData.extUserAccountNotice;
    if (gameData.supportedLanguagesDetailed)
      cleanData.supportedLanguagesDetailed =
        gameData.supportedLanguagesDetailed;

    // 元数据
    cleanData.scrapedAt = gameData.scrapedAt;
    cleanData.dataSource = gameData.dataSource;

    return cleanData;
  }

  /**
   * 从搜索结果页面提取游戏ID
   */
  private extractGameIdsFromSearchResults(
    html: string,
    limit: number
  ): number[] {
    return this.extractGameIds(html, limit);
  }

  /**
   * 获取热门游戏
   */
  async getPopularGames(limit: number = 20): Promise<GameInfo[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/search/?sort_by=_ASC&supportedlang=schinese&ndl=1`
      );
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
      console.error("获取热门游戏失败:", error);
      return [];
    }
  }

  /**
   * 获取折扣游戏
   */
  async getDiscountedGames(limit: number = 50): Promise<GameInfo[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/search/?specials=1&ndl=1&l=schinese`
      );
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
      console.error("获取折扣游戏失败:", error);
      return [];
    }
  }

  /**
   * 获取即将发行的游戏
   */
  async getUpcomingGames(limit: number = 30): Promise<GameInfo[]> {
    try {
      const response = await fetch(
        `${this.baseURL}/search/?category1=998&ndl=1&l=schinese`
      );
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
      console.error("获取即将发行游戏失败:", error);
      return [];
    }
  }

  /**
   * 搜索游戏
   */
  async searchGames(query: string, limit: number = 20): Promise<GameInfo[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `${this.baseURL}/search/?term=${encodedQuery}&l=schinese`
      );
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
  async getGamesByCategory(
    category: string,
    limit: number = 20
  ): Promise<GameInfo[]> {
    try {
      // 类别映射
      const categoryMap: Record<string, string> = {
        action: "category1=19",
        adventure: "category1=25",
        strategy: "category1=2",
        rpg: "category1=122",
        simulation: "category1=28",
        sports: "category1=701",
        racing: "category1=699",
        indie: "category1=492",
        free: "genre=Free%20to%20Play",
      };

      const categoryParam =
        categoryMap[category.toLowerCase()] ||
        `term=${encodeURIComponent(category)}`;
      const response = await fetch(
        `${this.baseURL}/search/?${categoryParam}&l=schinese`
      );
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

  /**
   * 转换对象中的 BigInt 字段为字符串
   */
  private convertBigIntFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === "bigint") {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertBigIntFields(item));
    }

    if (typeof obj === "object") {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = this.convertBigIntFields(value);
      }
      return converted;
    }

    return obj;
  }

  /**
   * 获取 StoreTopSeller 商店销量排行榜
   */
  async getStoreTopSellers(): Promise<CStoreTopSellers_GetWeeklyTopSellers_Response> {
    const request = CStoreTopSellers_GetWeeklyTopSellers_Request.create({
      context: {
        language: "schinese", // 简体中文
        countryCode: "US", // 美国
        steamRealm: 1,
      },
      dataRequest: {
        includeAssets: true,
        includeRelease: true,
        includePlatforms: true,
        includeScreenshots: true,
        includeTrailers: true,
        includeTagCount: 20,
        includeReviews: true,
        includeBasicInfo: true,
      },
      pageCount: 100,
    });

    const inputProtobufEncoded =
      CStoreTopSellers_GetWeeklyTopSellers_Request.toBinary(request);
    const inputProtobufEncodedString =
      Buffer.from(inputProtobufEncoded).toString("base64");
    const requestUrl = `https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1?origin=https%3A%2F%2Fstore.steampowered.com&input_protobuf_encoded=${encodeURIComponent(
      inputProtobufEncodedString
    )}`;

    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Steam API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseBuffer = await response.arrayBuffer();
    const responseBytes = new Uint8Array(responseBuffer);
    const topsellersResp =
      CStoreTopSellers_GetWeeklyTopSellers_Response.fromBinary(responseBytes);

    // 转换 BigInt 字段为字符串以避免序列化问题
    const convertedResponse = this.convertBigIntFields(topsellersResp);
    return convertedResponse;
  }

  /**
   * 获取当前在线人数排行榜
   * 获取按同时在线人数排序的游戏列表
   */
  async getGamesByConcurrentPlayers(): Promise<CSteamCharts_GetGamesByConcurrentPlayers_Response> {
    const request = CSteamCharts_GetGamesByConcurrentPlayers_Request.create({
      context: {
        language: "schinese", // 简体中文
        countryCode: "US", // 美国
        steamRealm: 1,
      },
      dataRequest: {
        includeAssets: true,
        includeRelease: true,
        includePlatforms: true,
        includeScreenshots: true,
        includeTrailers: true,
        includeTagCount: 20,
        includeReviews: true,
        includeBasicInfo: true,
      },
    });

    const inputProtobufEncoded =
      CSteamCharts_GetGamesByConcurrentPlayers_Request.toBinary(request);
    const inputProtobufEncodedString =
      Buffer.from(inputProtobufEncoded).toString("base64");
    const requestUrl = `https://api.steampowered.com/ISteamChartsService/GetGamesByConcurrentPlayers/v1?origin=https%3A%2F%2Fstore.steampowered.com&input_protobuf_encoded=${encodeURIComponent(
      inputProtobufEncodedString
    )}`;

    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(
        `Steam Charts API request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseBuffer = await response.arrayBuffer();
    const responseBytes = new Uint8Array(responseBuffer);
    const chartsResp =
      CSteamCharts_GetGamesByConcurrentPlayers_Response.fromBinary(
        responseBytes
      );

    // 转换 BigInt 字段为字符串以避免序列化问题
    const convertedResponse = this.convertBigIntFields(chartsResp);
    return convertedResponse;
  }
}

/**
 * 获取本周开始（星期一）的 UTC 时间戳（秒）。
 * 这个函数会正确处理时区，并始终返回 UTC 时间的周一零点。
 * @returns {number} UTC 周一零点的秒级时间戳。
 */
function getStartOfWeek(): number {
  const now = new Date();
  // getUTCDay() 返回基于 UTC 的星期几 (0=周日, 1=周一, ..., 6=周六)
  const day = now.getUTCDay();
  // 计算到本周一的日期差异。
  // 如果今天是周日 (day === 0)，则需要减去6天。
  // 否则，减去 (day - 1) 天。
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);

  // 创建一个新的 Date 对象以避免修改原始的 'now' 对象
  const monday = new Date(now.toUTCString());
  monday.setUTCDate(diff);
  // 将时间设置为 UTC 的午夜零点
  monday.setUTCHours(0, 0, 0, 0);

  // Steam API 似乎需要秒级时间戳
  return Math.floor(monday.getTime() / 1000);
}
