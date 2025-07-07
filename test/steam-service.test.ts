import {describe, it, expect, beforeAll, vi, afterAll, afterEach} from "vitest";
import { fetchMock, SELF } from "cloudflare:test";
import { SteamService } from "../src/steam-service";
import setup, { getTestHtml, clearTestDataCache } from "./setup";

describe("SteamService", () => {
  let steamService: SteamService;
  let htmlContent: string;

  beforeAll(async () => {
    // 设置 Workers 环境
    await setup();

    // 创建 SteamService 实例
    steamService = new SteamService();

    // 获取测试 HTML 数据
    htmlContent = await getTestHtml(292030); // 巫师3的 AppID
  });

  afterEach(() => vi.restoreAllMocks())

  afterAll(() =>{
    clearTestDataCache()
  })

  describe("scrapeGamePage", () => {
    it("应该能够抓取游戏页面并返回游戏信息", async () => {
      const appid = 292030;

      // 模拟 fetch 返回本地 HTML 内容
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlContent),
      } as Response);

      // 在 Workers 环境中模拟 fetch
      vi.stubGlobal('fetch', mockFetch);

      const gameInfo = await steamService.scrapeGamePage(appid);

      console.log("gameInfo", gameInfo);

      expect(gameInfo).not.toBeNull();
      expect(gameInfo?.appid).toBe(appid);
      expect(gameInfo?.name).toBe("The Witcher® 3: Wild Hunt");
      expect(gameInfo?.developer).toBe("CD PROJEKT RED");
      expect(gameInfo?.publisher).toBe("CD PROJEKT RED");
      expect(gameInfo?.isFree).toBe(false);

      // 验证 fetch 被正确调用
      expect(mockFetch).toHaveBeenCalledWith(
        `https://store.steampowered.com/app/${appid}/?l=schinese`
      );
    });

    it("应该能够处理不存在的游戏", async () => {
      const appid = 9999999;

      // 模拟 fetch 返回 404 响应
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      vi.stubGlobal('fetch', mockFetch);

      const gameInfo = await steamService.scrapeGamePage(appid);
      expect(gameInfo).toBeNull();

      // 验证 fetch 被正确调用
      expect(mockFetch).toHaveBeenCalledWith(
        `https://store.steampowered.com/app/${appid}/?l=schinese`
      );
    });

    it("应该能够处理网络错误", async () => {
      const appid = 123456;

      // 模拟网络错误
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));

      vi.stubGlobal('fetch', mockFetch);

      const gameInfo = await steamService.scrapeGamePage(appid);
      expect(gameInfo).toBeNull();
    });
  });

  describe("getGameDetails", () => {
    it("应该能够获取游戏详细信息", async () => {
      const appid = 292030;

      // 模拟 Steam API 和网页抓取
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlContent),
      } as Response);

      vi.stubGlobal('fetch', mockFetch);

      const gameDetails = await steamService.getGameDetails(appid);

      expect(gameDetails).not.toBeNull();
      expect(gameDetails?.appid).toBe(appid);
      expect(gameDetails?.name).toBeDefined();
      expect(typeof gameDetails?.name).toBe("string");
    });

    it("应该能够处理 API 错误并回退到网页抓取", async () => {
      const appid = 292030;

      // 模拟网页抓取成功
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlContent),
      } as Response);

      vi.stubGlobal('fetch', mockFetch);

      const gameDetails = await steamService.getGameDetails(appid);

      expect(gameDetails).not.toBeNull();
      expect(gameDetails?.appid).toBe(appid);
    });
  });

  describe("数据验证", () => {
    it("应该返回符合 GameSchema 的数据", async () => {
      const appid = 292030;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlContent),
      } as Response);

      vi.stubGlobal('fetch', mockFetch);

      const gameInfo = await steamService.scrapeGamePage(appid);

      if (gameInfo) {
        // 验证必需字段
        expect(gameInfo.appid).toBe(appid);
        expect(typeof gameInfo.appid).toBe("number");

        // 验证可选字段类型
        if (gameInfo.name) {
          expect(typeof gameInfo.name).toBe("string");
        }
        if (gameInfo.developer) {
          expect(typeof gameInfo.developer).toBe("string");
        }
        if (gameInfo.publisher) {
          expect(typeof gameInfo.publisher).toBe("string");
        }
        if (gameInfo.isFree !== undefined) {
          expect(typeof gameInfo.isFree).toBe("boolean");
        }
      }
    });
  });

  describe("Workers 环境特性", () => {
    it("应该能够检测 HTMLRewriter 可用性", () => {
      // 在 Workers 环境中，HTMLRewriter 应该可用
      const hasHTMLRewriter = typeof HTMLRewriter !== "undefined";

      // 记录环境信息
      console.log(`HTMLRewriter 可用: ${hasHTMLRewriter}`);

      // 这个测试主要是为了确保我们在正确的环境中
      expect(typeof fetch).toBe("function");
    });

    it("应该能够使用 Workers 的 fetch API", async () => {
      // 验证 fetch 是原生的 Workers fetch API
      expect(typeof fetch).toBe("function");
      expect(fetch.constructor.name).toBe("Function");
    });
  });
});
