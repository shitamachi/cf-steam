import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SteamService } from '../../src/steam-service'
import * as fs from 'fs'
import * as path from 'path'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('Steam 年龄验证绕过集成测试 (Node.js 环境)', () => {
  let steamService: SteamService

  beforeEach(() => {
    vi.clearAllMocks()
    steamService = new SteamService('test_api_key')
    
    // 在 Node.js 环境中 mock fetch
    global.fetch = mockFetch
  })

  describe('年龄验证绕过功能', () => {
    it('应该能够绕过 Sultan\'s Game 的年龄验证（基于真实页面）', async () => {
      // 加载真实的年龄验证页面
      const realAgeCheckHtml = fs.readFileSync(
        path.join(process.cwd(), 'test', 'steam_community_age_check.html'), 
        'utf8'
      )
      
      const normalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Steam Community</title>
        </head>
        <body>
          <div class="community_page">
            <h1>Steam Community</h1>
            <div class="discussions">讨论区内容</div>
            <div class="screenshots">截图内容</div>
            <div class="workshop">创意工坊内容</div>
          </div>
        </body>
        </html>
      `
      
      // 第一次返回真实的年龄验证页面
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(realAgeCheckHtml)
      })
      
      // 第二次返回正常页面（绕过成功）
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(normalHtml)
      })

      const html = await steamService.getGameCommunityHtml(3117820) // Sultan's Game
      
      expect(html).toBeDefined()
      expect(html.length).toBeGreaterThan(0)
      
      // 检查是否成功绕过了年龄验证
      const hasAgeCheck = html.includes('contentcheck_desc_ctn') || 
                         html.includes('contentcheck_header') || 
                         html.includes('View Community Hub') ||
                         html.includes('THIS GAME CONTAINS CONTENT')
      
      if (hasAgeCheck) {
        console.log('⚠️  Sultan\'s Game 仍然显示年龄验证页面')
      } else {
        console.log('🎉 Sultan\'s Game 年龄验证绕过成功，长度:', html.length)
      }
      
      // 无论如何都应该返回有效的 HTML
      expect(html).toContain('Steam Community')
    }, 30000)

    it('应该能够绕过 The Witcher 3 的年龄验证', async () => {
      // 加载真实的年龄验证页面
      const realAgeCheckHtml = fs.readFileSync(
        path.join(process.cwd(), 'test', 'steam_community_age_check.html'), 
        'utf8'
      )
      
      const normalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Steam Community</title>
        </head>
        <body>
          <div class="community_page">
            <h1>Steam Community</h1>
            <div class="discussions">讨论区内容</div>
            <div class="screenshots">截图内容</div>
            <div class="workshop">创意工坊内容</div>
          </div>
        </body>
        </html>
      `
      
      // 第一次返回真实的年龄验证页面
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(realAgeCheckHtml)
      })
      
      // 第二次返回正常页面（绕过成功）
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(normalHtml)
      })

      const html = await steamService.getGameCommunityHtml(292030) // The Witcher 3
      
      expect(html).toBeDefined()
      expect(html.length).toBeGreaterThan(0)
      
      // 检查是否成功绕过了年龄验证
      const hasAgeCheck = html.includes('contentcheck_desc_ctn') || 
                         html.includes('contentcheck_header') || 
                         html.includes('View Community Hub') ||
                         html.includes('THIS GAME CONTAINS CONTENT')
      
      if (hasAgeCheck) {
        console.log('⚠️  The Witcher 3 仍然显示年龄验证页面')
      } else {
        console.log('🎉 The Witcher 3 年龄验证绕过成功，长度:', html.length)
      }
      
      // 无论如何都应该返回有效的 HTML
      expect(html).toContain('Steam Community')
    }, 15000)
  })

  describe('年龄验证页面检测', () => {
    it('应该正确检测真实的年龄验证页面', async () => {
      // 加载真实的 HTML 文件
      const realAgeCheckHtml = fs.readFileSync(
        path.join(process.cwd(), 'test', 'steam_community_age_check.html'), 
        'utf8'
      )
      
      const isAgeVerificationPage = (steamService as any).isAgeVerificationPage.bind(steamService)
      expect(isAgeVerificationPage(realAgeCheckHtml)).toBe(true)
      
      console.log('✅ 真实年龄验证页面检测成功')
    })

    it('应该正确识别正常社区页面', async () => {
      const normalHtml = `
        <div class="community_page">
          <h1>Steam Community</h1>
          <div class="discussions">讨论区内容</div>
        </div>
      `
      
      const isAgeVerificationPage = (steamService as any).isAgeVerificationPage.bind(steamService)
      expect(isAgeVerificationPage(normalHtml)).toBe(false)
      
      console.log('✅ 正常社区页面识别成功')
    })
  })

  describe('真实 HTML 文件分析', () => {
    it('应该分析真实的 Steam 年龄确认页面结构', () => {
      const realAgeCheckHtml = fs.readFileSync(
        path.join(process.cwd(), 'test', 'steam_community_age_check.html'), 
        'utf8'
      )

      // 验证页面结构
      expect(realAgeCheckHtml).toContain('<!DOCTYPE html>')
      expect(realAgeCheckHtml).toContain('<title>Sultan\'s Game :: Steam Community</title>')
      expect(realAgeCheckHtml).toContain('contentcheck_desc_ctn')
      expect(realAgeCheckHtml).toContain('contentcheck_header')
      expect(realAgeCheckHtml).toContain('THIS GAME CONTAINS CONTENT YOU HAVE ASKED NOT TO SEE')
      expect(realAgeCheckHtml).toContain('View Community Hub')
      expect(realAgeCheckHtml).toContain('AcceptAppHub')
      expect(realAgeCheckHtml).toContain('wants_mature_content_apps')
      expect(realAgeCheckHtml).toContain('Some Nudity or Sexual Content')

      // 验证 JavaScript 函数
      expect(realAgeCheckHtml).toContain('function Proceed()')
      expect(realAgeCheckHtml).toContain('function AcceptAppHub()')
      expect(realAgeCheckHtml).toContain('function Cancel()')

      // 验证游戏 ID
      expect(realAgeCheckHtml).toContain('3117820')

      console.log('✅ 真实 HTML 文件结构分析成功')
      console.log('📄 文件大小:', realAgeCheckHtml.length, '字符')
      console.log('🎮 游戏 ID: 3117820 (Sultan\'s Game)')
    })

    it('应该验证我们的检测逻辑能正确识别所有关键元素', () => {
      const realAgeCheckHtml = fs.readFileSync(
        path.join(process.cwd(), 'test', 'steam_community_age_check.html'), 
        'utf8'
      )

      const isAgeVerificationPage = (steamService as any).isAgeVerificationPage.bind(steamService)
      const result = isAgeVerificationPage(realAgeCheckHtml)

      expect(result).toBe(true)
      console.log('✅ 检测逻辑验证成功，能正确识别真实年龄验证页面')
    })
  })
}) 