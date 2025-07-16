import { handle } from 'hono/netlify'

// 导入您现有的Hono应用
import {app} from '../../src'

// 使用官方适配器处理请求
export default handle(app) 