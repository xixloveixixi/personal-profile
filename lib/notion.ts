import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { unstable_cache } from 'next/cache'

export interface NotionPost {
  id: string
  title: string
  status?: string
  tags: string[]
  publishedDate?: string
}

export interface NotionBlockNode {
  id: string
  type: string
  has_children: boolean
  [key: string]: any
  children?: NotionBlockNode[]
}

const notionToken = process.env.NOTION_TOKEN
const databaseId = process.env.NOTION_DATABASE_ID

function ensureNotionEnv() {
  if (!notionToken || !databaseId) {
    throw new Error('Missing NOTION_TOKEN or NOTION_DATABASE_ID in environment variables.')
  }
}

function getNotionClient() {
  ensureNotionEnv()
  return new Client({
    auth: notionToken,
  })
}

async function queryAllPages(notion: Client) {
  const notionAny = notion as any
  const allResults: any[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    if (notionAny.databases?.query) {
      const response = await notionAny.databases.query({
        database_id: databaseId!,
        start_cursor: startCursor,
        page_size: 100,
      })
      allResults.push(...(response.results || []))
      hasMore = Boolean(response.has_more)
      startCursor = response.next_cursor || undefined
      continue
    }

    if (notionAny.dataSources?.query) {
      const response = await notionAny.dataSources.query({
        data_source_id: databaseId!,
        start_cursor: startCursor,
        page_size: 100,
      })
      allResults.push(...(response.results || []))
      hasMore = Boolean(response.has_more)
      startCursor = response.next_cursor || undefined
      continue
    }

    throw new Error('Current @notionhq/client version does not expose query API.')
  }

  return allResults
}

function getProperty(page: any, keys: string[]) {
  for (const key of keys) {
    if (page?.properties?.[key]) return page.properties[key]
  }
  return undefined
}

function readTitle(page: any) {
  const prop = getProperty(page, ['文章', '标题', 'Name', 'name', 'Title'])
  if (!prop) return '无标题'
  if (prop.type === 'title') return prop.title?.[0]?.plain_text || '无标题'
  if (prop.type === 'rich_text') return prop.rich_text?.[0]?.plain_text || '无标题'
  return '无标题'
}

function readStatus(page: any) {
  const prop = getProperty(page, ['状态', 'Status', 'status'])
  if (!prop) return ''
  if (prop.type === 'status') return prop.status?.name || ''
  if (prop.type === 'select') return prop.select?.name || ''
  return ''
}

function readTags(page: any): string[] {
  const prop = getProperty(page, ['标签', 'Tags', 'tags'])
  if (!prop) return []
  if (prop.type === 'multi_select') return prop.multi_select?.map((t: any) => t.name) || []
  return []
}

function readPublishedDate(page: any) {
  const prop = getProperty(page, ['发布日期', '发布时间', 'Published', 'publishedDate'])
  if (!prop) return undefined
  if (prop.type === 'date') return prop.date?.start
  return undefined
}

function mapPageToPost(page: any): NotionPost {
  return {
    id: page.id,
    title: readTitle(page),
    status: readStatus(page),
    tags: readTags(page),
    publishedDate: readPublishedDate(page),
  }
}

async function getPublishedPostsImpl(): Promise<NotionPost[]> {
  const notion = getNotionClient()
  const pages = await queryAllPages(notion)

  const posts = pages.map((page: any) => mapPageToPost(page))

  const publishedSet = new Set([
    '已发布',
    '发布',
    'published',
    'Published',
    '完成',
    'Done',
    'done',
  ])

  const sortByDateDesc = (a: NotionPost, b: NotionPost) => {
    const at = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
    const bt = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
    return bt - at
  }

  const filtered = posts.filter((post) => publishedSet.has((post.status || '').trim()))
  // Fallback: when status naming differs, still show articles instead of empty page.
  if (filtered.length === 0) return posts.sort(sortByDateDesc)
  return filtered.sort(sortByDateDesc)
}

export async function getPostContent(pageId: string): Promise<string> {
  const notion = getNotionClient()
  const n2m = new NotionToMarkdown({ notionClient: notion })
  const mdblocks = await n2m.pageToMarkdown(pageId)
  const mdString = n2m.toMarkdownString(mdblocks)
  return mdString.parent
}

async function getPostByIdImpl(pageId: string): Promise<NotionPost | null> {
  const notion = getNotionClient()
  const response = await notion.pages.retrieve({ page_id: pageId })
  const page = response as any
  if (!page?.properties) return null
  return mapPageToPost(page)
}

async function listAllChildren(notion: Client, blockId: string) {
  const children: any[] = []
  let hasMore = true
  let startCursor: string | undefined

  while (hasMore) {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: startCursor,
      page_size: 100,
    })

    children.push(...(response.results || []))
    hasMore = Boolean(response.has_more)
    startCursor = response.next_cursor || undefined
  }

  return children
}

async function buildBlockTree(
  notion: Client,
  blockId: string,
  depth = 0
): Promise<NotionBlockNode[]> {
  // Prevent accidental deep recursion on malformed data.
  if (depth > 24) return []

  const children = await listAllChildren(notion, blockId)
  return Promise.all(
    (children as any[]).map(async (block) => {
      const node: NotionBlockNode = {
        ...block,
        children: [],
      }

      if (block.has_children) {
        node.children = await buildBlockTree(notion, block.id, depth + 1)
      }

      return node
    })
  )
}

async function getPostBlocksImpl(pageId: string): Promise<NotionBlockNode[]> {
  const notion = getNotionClient()
  return buildBlockTree(notion, pageId)
}

const getPublishedPostsCached = unstable_cache(getPublishedPostsImpl, ['notion-published-posts'], {
  revalidate: 60,
})

const getPostByIdCached = unstable_cache(getPostByIdImpl, ['notion-post-by-id'], {
  revalidate: 300,
})

const getPostBlocksCached = unstable_cache(getPostBlocksImpl, ['notion-post-blocks'], {
  revalidate: 300,
})

export async function getPublishedPosts(): Promise<NotionPost[]> {
  return getPublishedPostsCached()
}

export async function getPostById(pageId: string): Promise<NotionPost | null> {
  return getPostByIdCached(pageId)
}

export async function getPostBlocks(pageId: string): Promise<NotionBlockNode[]> {
  return getPostBlocksCached(pageId)
}

