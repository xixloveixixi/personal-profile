import type { ReactNode } from 'react'
import type { NotionBlockNode } from '@/lib/notion'

interface NotionBlockRendererProps {
  blocks: NotionBlockNode[]
}

function annotationClass(annotations?: any) {
  if (!annotations) return ''
  const classes = []
  if (annotations.bold) classes.push('font-semibold')
  if (annotations.italic) classes.push('italic')
  if (annotations.strikethrough) classes.push('line-through')
  if (annotations.underline) classes.push('underline')
  if (annotations.code) classes.push('px-1.5 py-0.5 rounded bg-white/10 text-purple-100 text-[0.92em]')
  return classes.join(' ')
}

function renderRichText(richText?: any[]): ReactNode {
  if (!richText || richText.length === 0) return null

  return richText.map((item, index) => {
    const content = item?.plain_text || ''
    const href = item?.href || item?.text?.link?.url
    const className = annotationClass(item?.annotations)

    if (href) {
      return (
        <a
          key={`${content}-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-purple-200 hover:text-purple-100 underline ${className}`}
        >
          {content}
        </a>
      )
    }

    return (
      <span key={`${content}-${index}`} className={className}>
        {content}
      </span>
    )
  })
}

function getImageUrl(block: NotionBlockNode): string | null {
  const image = block.image
  if (!image) return null
  if (image.type === 'external') return image.external?.url || null
  if (image.type === 'file') return image.file?.url || null
  return null
}

function renderList(blocks: NotionBlockNode[], ordered: boolean, depth: number) {
  const Wrapper = ordered ? 'ol' : 'ul'
  return (
    <Wrapper
      className={`${ordered ? 'list-decimal' : 'list-disc'} ml-6 my-3 space-y-2`}
      key={`list-${depth}-${blocks[0]?.id || 'empty'}`}
    >
      {blocks.map((block) => {
        const data = (block as any)[block.type]
        return (
          <li key={block.id} className="text-gray-100 leading-7">
            {renderRichText(data?.rich_text)}
            {block.children && block.children.length > 0 ? renderBlocks(block.children, depth + 1) : null}
          </li>
        )
      })}
    </Wrapper>
  )
}

function renderBlocks(blocks: NotionBlockNode[], depth = 0): ReactNode[] {
  const rendered: ReactNode[] = []
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') {
      const ordered = block.type === 'numbered_list_item'
      const grouped: NotionBlockNode[] = []
      while (
        i < blocks.length &&
        blocks[i].type === (ordered ? 'numbered_list_item' : 'bulleted_list_item')
      ) {
        grouped.push(blocks[i])
        i += 1
      }
      rendered.push(renderList(grouped, ordered, depth))
      continue
    }

    switch (block.type) {
      case 'paragraph': {
        const data = (block as any).paragraph
        rendered.push(
          <p key={block.id} className="text-gray-100 leading-8 my-3">
            {renderRichText(data?.rich_text)}
          </p>
        )
        break
      }
      case 'heading_1': {
        rendered.push(
          <h1 key={block.id} className="text-3xl font-bold text-white mt-10 mb-4">
            {renderRichText((block as any).heading_1?.rich_text)}
          </h1>
        )
        break
      }
      case 'heading_2': {
        rendered.push(
          <h2 key={block.id} className="text-2xl font-semibold text-white mt-8 mb-3">
            {renderRichText((block as any).heading_2?.rich_text)}
          </h2>
        )
        break
      }
      case 'heading_3': {
        rendered.push(
          <h3 key={block.id} className="text-xl font-semibold text-white mt-6 mb-3">
            {renderRichText((block as any).heading_3?.rich_text)}
          </h3>
        )
        break
      }
      case 'quote': {
        rendered.push(
          <blockquote
            key={block.id}
            className="my-4 border-l-4 border-purple-300/70 pl-4 text-purple-100/90 italic"
          >
            {renderRichText((block as any).quote?.rich_text)}
          </blockquote>
        )
        break
      }
      case 'code': {
        const data = (block as any).code
        rendered.push(
          <pre
            key={block.id}
            className="my-4 p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-sm"
          >
            <code>{data?.rich_text?.map((t: any) => t.plain_text).join('') || ''}</code>
          </pre>
        )
        break
      }
      case 'callout': {
        const data = (block as any).callout
        const icon = data?.icon?.emoji || '💡'
        rendered.push(
          <div
            key={block.id}
            className="my-4 p-4 rounded-lg bg-purple-500/10 border border-purple-300/30 text-purple-100"
          >
            <div className="flex gap-3 items-start">
              <span className="text-xl leading-none">{icon}</span>
              <div className="leading-7">{renderRichText(data?.rich_text)}</div>
            </div>
          </div>
        )
        break
      }
      case 'to_do': {
        const data = (block as any).to_do
        rendered.push(
          <label key={block.id} className="flex items-start gap-2 my-2 text-gray-100">
            <input type="checkbox" checked={Boolean(data?.checked)} readOnly className="mt-1" />
            <span className={data?.checked ? 'line-through opacity-70' : ''}>
              {renderRichText(data?.rich_text)}
            </span>
          </label>
        )
        break
      }
      case 'toggle': {
        const data = (block as any).toggle
        rendered.push(
          <details key={block.id} className="my-3 rounded border border-white/10 bg-white/5 p-3">
            <summary className="cursor-pointer text-gray-100">{renderRichText(data?.rich_text)}</summary>
            <div className="mt-2">{block.children ? renderBlocks(block.children, depth + 1) : null}</div>
          </details>
        )
        break
      }
      case 'divider': {
        rendered.push(<hr key={block.id} className="my-6 border-white/15" />)
        break
      }
      case 'image': {
        const imageUrl = getImageUrl(block)
        const caption = (block as any).image?.caption
        if (!imageUrl) break
        rendered.push(
          <figure key={block.id} className="my-6">
            <img
              src={imageUrl}
              alt={caption?.[0]?.plain_text || 'Notion image'}
              className="w-full rounded-lg border border-white/10"
            />
            {caption?.length > 0 ? (
              <figcaption className="mt-2 text-sm text-gray-300">{renderRichText(caption)}</figcaption>
            ) : null}
          </figure>
        )
        break
      }
      default: {
        // Keep nested content visible even for unsupported block types.
        if (block.children && block.children.length > 0) {
          rendered.push(
            <div key={block.id} className="my-2">
              {renderBlocks(block.children, depth + 1)}
            </div>
          )
        }
        break
      }
    }

    i += 1
  }

  return rendered
}

export function NotionBlockRenderer({ blocks }: NotionBlockRendererProps) {
  return <div className="notion-blocks">{renderBlocks(blocks)}</div>
}




