/**
 * HTTP 错误类，用于处理 HTTP 请求相关的错误
 */
export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    
    // 确保原型链正确设置（适用于 TypeScript 编译目标为 ES5 的情况）
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  /**
   * 创建一个 HTTP 错误实例
   */
  static create(status: number, message: string): HttpError {
    return new HttpError(status, message);
  }

  /**
   * 检查是否为客户端错误（4xx）
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * 检查是否为服务器错误（5xx）
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * 获取错误的详细信息
   */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      stack: this.stack,
    };
  }
}

/**
 * Steam API 相关错误
 */
export class SteamAPIError extends HttpError {
  constructor(status: number, message: string, public readonly appid?: number) {
    super(status, `Steam API Error: ${message}`);
    this.name = 'SteamAPIError';
    Object.setPrototypeOf(this, SteamAPIError.prototype);
  }
}

/**
 * 网页抓取相关错误
 */
export class ScrapingError extends Error {
  constructor(message: string, public readonly url?: string) {
    super(message);
    this.name = 'ScrapingError';
    Object.setPrototypeOf(this, ScrapingError.prototype);
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends HttpError {
  constructor(message: string = '请求过于频繁，请稍后重试') {
    super(429, message);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 错误处理帮助方法
 * 如果捕获的错误是 HttpError，则使用其状态码和消息
 * 否则使用默认的错误信息和状态码
 */
export function handleError(error: unknown, defaultMessage: string, defaultStatus: number = 500) {
    if (error instanceof HttpError) {
        return {
            status: error.status as any,
            response: {
                success: false as const,
                error: defaultMessage,
                message: error.message,
            }
        }
    }

    return {
        status: defaultStatus as any,
        response: {
            success: false as const,
            error: defaultMessage,
            message: error instanceof Error ? error.message : "未知错误",
        }
    }
}