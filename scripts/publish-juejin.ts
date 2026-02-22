require('dotenv').config({ path: '.env.local' })
const { Client } = require('@notionhq/client')
const { NotionToMarkdown } = require('notion-to-md')

const NOTION_TOKEN = process.env.NOTION_TOKEN
const JUEJIN_SESSION_ID = process.env.JUEJIN_SESSION_ID
const JUEJIN_SESSION_ID_SS = process.env.JUEJIN_SESSION_ID_SS
const JUEJIN_TAG_IDS = process.env.JUEJIN_TAG_IDS
const JUEJIN_TAG_MAP = process.env.JUEJIN_TAG_MAP

function ensureEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`缺少环境变量: ${name}`)
  }
}

async function getArticleFromNotion(pageId: string) {
  ensureEnv('NOTION_TOKEN', NOTION_TOKEN)

  const headers = {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
  }

  const pageRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers,
  })
  const page = await pageRes.json()
  if (!pageRes.ok) {
    throw new Error(`获取 Notion 页面失败: ${page?.message || pageRes.statusText}`)
  }

  const blocks = await fetchAllBlocks(pageId, headers)

  const title = page.properties?.文章?.title?.[0]?.plain_text || ''
  const tags = page.properties?.标签?.multi_select?.map((t: any) => t.name) || []
  const notionClient = new Client({ auth: NOTION_TOKEN })
  const n2m = new NotionToMarkdown({ notionClient })
  const mdBlocks = await n2m.pageToMarkdown(pageId)
  const markdown = n2m.toMarkdownString(mdBlocks)?.parent || ''

  return { title, tags, blocks, markdown }
}

async function fetchAllBlocks(blockId: string, headers: Record<string, string>): Promise<any[]> {
  const all: any[] = []
  let hasMore = true
  let cursor = ''

  while (hasMore) {
    const qs = new URLSearchParams({ page_size: '100' })
    if (cursor) qs.set('start_cursor', cursor)
    const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children?${qs.toString()}`, {
      headers,
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(`获取 Notion 内容失败: ${json?.message || res.statusText}`)
    }

    all.push(...(json.results || []))
    hasMore = Boolean(json.has_more)
    cursor = json.next_cursor || ''
  }

  const withChildren: any[] = await Promise.all(
    all.map(async (block: any): Promise<any> => {
      if (!block?.has_children) return block
      const children: any[] = await fetchAllBlocks(block.id, headers)
      return { ...block, children }
    })
  )

  return withChildren
}

function parseEnvTagIds(raw?: string): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

function parseTagMap(raw?: string): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    console.warn('⚠️ JUEJIN_TAG_MAP 不是合法 JSON，已忽略。')
    return {}
  }
}

function resolveJuejinTagIds(notionTags: string[]): string[] {
  const idsFromEnv = parseEnvTagIds(JUEJIN_TAG_IDS)
  const tagMap = parseTagMap(JUEJIN_TAG_MAP)

  const idsFromMap = notionTags
    .map((tag) => tagMap[tag] || tagMap[tag.toLowerCase()])
    .filter(Boolean)

  const tagIds = Array.from(new Set([...idsFromMap, ...idsFromEnv]))

  if (tagIds.length === 0) {
    throw new Error(
      '缺少掘金标签ID。请在 .env.local 配置 JUEJIN_TAG_IDS=标签ID1,标签ID2，或配置 JUEJIN_TAG_MAP={"ai":"标签ID"}'
    )
  }

  return tagIds
}

async function publishToJuejin(title: string, content: string, tagIds: string[]) {
  ensureEnv('JUEJIN_SESSION_ID', JUEJIN_SESSION_ID)
  ensureEnv('JUEJIN_SESSION_ID_SS', JUEJIN_SESSION_ID_SS)

  const cookie = `sessionid=${JUEJIN_SESSION_ID}; sessionid_ss=${JUEJIN_SESSION_ID_SS}`

  const draftRes = await fetch('https://api.juejin.cn/content_api/v1/article_draft/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: 'https://juejin.cn',
      Referer: 'https://juejin.cn/',
    },
    body: JSON.stringify({
      title,
      mark_content: content,
      markdown_content: content,
      edit_type: 10,
      category_id: '6809637769959178254',
      tag_ids: tagIds,
    }),
  })

  const draft = await draftRes.json()
  console.log('草稿创建结果:', draft)

  if (!draft.data?.id) {
    throw new Error(`创建掘金草稿失败: ${draft?.err_msg || '未知错误'}`)
  }

  const draftId = String(draft.data.id)
  const draftUrl = `https://juejin.cn/editor/drafts/${draftId}`

  const publishRes = await fetch('https://api.juejin.cn/content_api/v1/article/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: 'https://juejin.cn',
      Referer: 'https://juejin.cn/',
    },
    body: JSON.stringify({
      draft_id: draftId,
      sync_to_org: false,
    }),
  })

  const publishResult = await publishRes.json()
  return {
    draftId,
    draftUrl,
    publishResult,
  }
}

function richTextToPlain(richText?: any[]): string {
  if (!richText || richText.length === 0) return ''
  return richText.map((t: any) => t?.plain_text || '').join('')
}

function renderBlock(block: any, depth = 0): string {
  const indent = '  '.repeat(depth)
  const childrenText =
    block.children && block.children.length
      ? '\n' + block.children.map((child: any) => renderBlock(child, depth + 1)).filter(Boolean).join('\n')
      : ''

  switch (block.type) {
    case 'paragraph':
      return `${indent}${richTextToPlain(block.paragraph?.rich_text)}`
    case 'heading_1':
      return `${indent}# ${richTextToPlain(block.heading_1?.rich_text)}`
    case 'heading_2':
      return `${indent}## ${richTextToPlain(block.heading_2?.rich_text)}`
    case 'heading_3':
      return `${indent}### ${richTextToPlain(block.heading_3?.rich_text)}`
    case 'bulleted_list_item':
      return `${indent}- ${richTextToPlain(block.bulleted_list_item?.rich_text)}${childrenText}`
    case 'numbered_list_item':
      return `${indent}1. ${richTextToPlain(block.numbered_list_item?.rich_text)}${childrenText}`
    case 'to_do': {
      const checked = block.to_do?.checked ? 'x' : ' '
      return `${indent}- [${checked}] ${richTextToPlain(block.to_do?.rich_text)}${childrenText}`
    }
    case 'quote':
      return `${indent}> ${richTextToPlain(block.quote?.rich_text)}${childrenText}`
    case 'callout': {
      const icon = block.callout?.icon?.emoji || '💡'
      return `${indent}> ${icon} ${richTextToPlain(block.callout?.rich_text)}${childrenText}`
    }
    case 'toggle':
      return `${indent}<details><summary>${richTextToPlain(block.toggle?.rich_text)}</summary>\n${childrenText}\n${indent}</details>`
    case 'code':
      return `\`\`\`${block.code?.language || ''}\n${richTextToPlain(block.code?.rich_text)}\n\`\`\``
    case 'divider':
      return `${indent}---`
    case 'image': {
      const imageUrl = block.image?.external?.url || block.image?.file?.url || ''
      const caption = richTextToPlain(block.image?.caption)
      if (!imageUrl) return ''
      return `${indent}![${caption || 'image'}](${imageUrl})`
    }
    default:
      return childrenText.trim()
  }
}

function blocksToMarkdown(blocks: any[]): string {
  return blocks.map((block) => renderBlock(block, 0)).filter(Boolean).join('\n\n')
}

async function main() {
  const pageId = process.argv[2]

  if (!pageId) {
    console.error('用法: npm run publish:juejin -- <page-id>')
    process.exit(1)
  }

  try {
    console.log('获取 Notion 文章...')
    const article = await getArticleFromNotion(pageId)
    console.log('标题:', article.title)
    console.log('标签:', article.tags.join(', ') || '(无)')
    const tagIds = resolveJuejinTagIds(article.tags)
    console.log('掘金标签ID:', tagIds.join(', '))

    const markdown = article.markdown?.trim() ? article.markdown : blocksToMarkdown(article.blocks || [])
    if (!markdown.trim()) {
      throw new Error('文章正文为空，无法发布')
    }

    console.log('发布到掘金...')
    const result = await publishToJuejin(article.title, markdown, tagIds)
    console.log('发布结果:', result.publishResult)

    if (result.publishResult?.err_no === 0) {
      console.log('✅ 发布成功! 文章ID:', result.publishResult.data?.article_id)
    } else {
      console.warn('⚠️ 自动发布失败，已保留草稿。')
      console.warn('原因:', result.publishResult?.err_msg || '未知错误')
      console.log(`👉 请打开草稿手动发布: ${result.draftUrl}`)
    }
  } catch (error) {
    console.error('错误:', error)
    process.exit(1)
  }
}

main()

