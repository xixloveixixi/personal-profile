import { searchSimilarVectors } from './vector-store'
import { hybridSearch } from './hybrid-search'

/**
 * Agent 错误处理与容错机制
 * 基于 Hello-Agents 的可靠性设计
 */
export class AgentErrorHandler {
  /**
   * 1. 工具调用失败处理
   */
  async handleToolError(error: Error, toolName: string): Promise<string> {
    this.logError(`工具 "${toolName}" 调用失败:`, error)
    return `错误: 工具 "${toolName}" 暂时不可用，请稍后重试。如果问题持续，可以尝试用其他方式提问。`
  }

  /**
   * 2. LLM 调用失败处理
   * 注意：当前实现没有备用模型，返回错误信息
   */
  async handleLLMError(error: Error, retries = 2): Promise<string> {
    this.logError('LLM 调用失败:', error)
    
    // 可以在这里实现降级到备用模型的逻辑
    // 例如：如果 DeepSeek 失败，可以尝试其他模型
    
    if (retries > 0) {
      console.warn(`LLM 调用失败，剩余重试次数: ${retries}`)
      // 可以在这里实现重试逻辑
    }
    
    return `抱歉，AI 服务暂时不可用。错误信息: ${error.message}。请稍后重试。`
  }

  /**
   * 3. 向量搜索失败处理（降级到文本搜索）
   */
  async handleVectorSearchError(
    query: string,
    limit = 5
  ): Promise<Array<{ content: string; metadata: any; similarity: number }>> {
    this.logError('向量搜索失败，降级到文本搜索', new Error('Vector search failed'))
    
    try {
      // 降级到混合搜索（包含文本搜索）
      return await hybridSearch(query, limit)
    } catch (fallbackError: any) {
      this.logError('文本搜索也失败:', fallbackError)
      return []
    }
  }

  /**
   * 4. 超时处理
   */
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback: T
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`操作超时 (${timeoutMs}ms)`)), timeoutMs)
      ),
    ]).catch(() => {
      console.warn(`操作超时，使用降级方案`)
      return fallback
    })
  }

  /**
   * 5. 带重试的操作
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        if (i < maxRetries - 1) {
          const waitTime = delayMs * (i + 1) // 指数退避
          console.warn(`操作失败，${waitTime}ms 后重试 (${i + 1}/${maxRetries}):`, error.message)
          await this.sleep(waitTime)
        }
      }
    }

    throw lastError || new Error('操作失败，已重试所有次数')
  }

  /**
   * 6. 安全执行（捕获所有错误）
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    fallback: T,
    errorMessage?: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      this.logError(errorMessage || '操作执行失败:', error)
      return fallback
    }
  }

  /**
   * 7. 记录错误日志
   */
  private logError(message: string, error: Error | unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    console.error(`[Agent错误] ${message}`, {
      message: errorObj.message,
      stack: errorObj.stack,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 8. 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 9. 验证错误类型并处理
   */
  categorizeError(error: Error | unknown): {
    type: 'network' | 'timeout' | 'validation' | 'api' | 'unknown'
    retryable: boolean
  } {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorString = errorMessage.toLowerCase()

    if (errorString.includes('timeout') || errorString.includes('超时')) {
      return { type: 'timeout', retryable: true }
    }

    if (errorString.includes('network') || errorString.includes('fetch')) {
      return { type: 'network', retryable: true }
    }

    if (errorString.includes('validation') || errorString.includes('参数')) {
      return { type: 'validation', retryable: false }
    }

    if (errorString.includes('api') || errorString.includes('401') || errorString.includes('403')) {
      return { type: 'api', retryable: false }
    }

    return { type: 'unknown', retryable: true }
  }
}

/**
 * 全局错误处理器实例
 */
export const agentErrorHandler = new AgentErrorHandler()

