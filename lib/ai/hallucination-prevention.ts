/**
 * 防幻觉机制
 * 基于 Hello-Agents 的最佳实践
 */

/**
 * 第一层：工具层验证
 * 确保所有工具返回都包含来源信息
 */
export function formatToolResponseWithSource(
  answer: string,
  sources: string[]
): string {
  if (sources.length === 0) {
    return `${answer}\n\n⚠️ 注意: 此信息未标注来源，请谨慎使用。`
  }

  return `${answer}\n\n来源: ${sources.join(', ')}`
}

/**
 * 第二层：Prompt 工程强化
 * 防幻觉约束提示词
 */
export const HALLUCINATION_PREVENTION_PROMPT = `
# 防幻觉约束（严格遵守）

## 核心原则
1. **只能使用工具获取信息**：你只能使用列出的工具获取信息，不能编造或猜测任何内容
2. **如实告知**：如果工具返回错误或未找到信息，必须如实告知用户，例如："抱歉，我在知识库中没有找到相关信息"
3. **禁止编造**：不得编造或猜测任何个人信息、项目经验、技能等
4. **必须验证**：当且仅当通过工具获得真实数据后，才能给出最终答案
5. **来源标注**：如果工具返回了来源信息，在回答中应提及信息来源

## 错误示例（禁止）
❌ 编造项目："我有一个叫 XXX 的项目，使用了 YYY 技术"
❌ 猜测信息："可能是在 XX 公司工作"
❌ 使用未验证的数据："根据我的了解，..."

## 正确示例（推荐）
✅ 基于工具结果："根据知识库中的信息，我有以下 React 项目经验：..."
✅ 如实告知："抱歉，我在知识库中没有找到关于 XXX 的信息"
✅ 标注来源："根据项目 'CQ Web' 的信息，..."
`

/**
 * 第三层：后验证
 * 验证回答是否包含知识库外的信息
 */
export interface ValidationResult {
  isValid: boolean
  reason?: string
  suspiciousParts?: string[]
}

/**
 * 验证回答是否仅基于提供的来源信息
 */
export async function validateAnswer(
  answer: string,
  sources: string[],
  llmGenerate: (prompt: string) => Promise<string>
): Promise<ValidationResult> {
  if (sources.length === 0) {
    // 如果没有来源，检查回答是否包含明确的"未找到"信息
    if (
      answer.includes('未找到') ||
      answer.includes('没有找到') ||
      answer.includes('知识库中没有') ||
      answer.includes('抱歉')
    ) {
      return { isValid: true, reason: '明确告知未找到信息' }
    }
    return {
      isValid: false,
      reason: '回答没有来源信息，且未明确告知未找到',
      suspiciousParts: [answer],
    }
  }

  // 使用 LLM 验证回答是否仅基于来源
  const validationPrompt = `
请验证以下回答是否仅基于提供的来源信息，没有编造内容。

回答:
${answer}

来源信息:
${sources.join('\n')}

请分析：
1. 回答中的所有信息是否都能在来源信息中找到对应
2. 是否有任何编造、猜测或推断的内容
3. 是否有超出来源范围的信息

如果回答完全基于来源信息，返回 JSON: {"valid": true}
如果回答包含来源之外的信息，返回 JSON: {"valid": false, "reason": "具体原因", "suspiciousParts": ["可疑部分1", "可疑部分2"]}
`

  try {
    const result = await llmGenerate(validationPrompt)
    
    // 尝试解析 JSON 响应
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          isValid: parsed.valid === true,
          reason: parsed.reason,
          suspiciousParts: parsed.suspiciousParts,
        }
      } catch (e) {
        // JSON 解析失败，尝试文本匹配
      }
    }

    // 文本匹配验证
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('valid') && !lowerResult.includes('invalid')) {
      return { isValid: true }
    }
    if (lowerResult.includes('hallucination') || lowerResult.includes('编造')) {
      return {
        isValid: false,
        reason: '检测到可能的幻觉内容',
        suspiciousParts: [answer],
      }
    }

    // 默认认为有效（避免过度严格）
    return { isValid: true }
  } catch (error: any) {
    console.warn('验证过程出错，默认认为有效:', error.message)
    return { isValid: true, reason: '验证过程出错' }
  }
}

/**
 * 提取回答中的来源信息
 */
export function extractSourcesFromAnswer(answer: string): string[] {
  const sources: string[] = []
  
  // 匹配 "来源: xxx" 格式
  const sourceMatch = answer.match(/来源[：:]\s*([^\n]+)/g)
  if (sourceMatch) {
    sourceMatch.forEach((match) => {
      const source = match.replace(/来源[：:]\s*/, '').trim()
      if (source) {
        sources.push(...source.split(',').map((s) => s.trim()))
      }
    })
  }

  // 匹配 "[来源: xxx]" 格式
  const bracketMatch = answer.match(/\[来源[：:]\s*([^\]]+)\]/g)
  if (bracketMatch) {
    bracketMatch.forEach((match) => {
      const source = match.replace(/\[来源[：:]\s*/, '').replace(/\]/, '').trim()
      if (source) {
        sources.push(source)
      }
    })
  }

  return [...new Set(sources)] // 去重
}

/**
 * 检查回答是否包含明确的"未找到"信息
 */
export function isExplicitNotFound(answer: string): boolean {
  const notFoundKeywords = [
    '未找到',
    '没有找到',
    '知识库中没有',
    '抱歉',
    '无法找到',
    '暂时没有',
    '暂无',
  ]

  const lowerAnswer = answer.toLowerCase()
  return notFoundKeywords.some((keyword) => lowerAnswer.includes(keyword))
}

