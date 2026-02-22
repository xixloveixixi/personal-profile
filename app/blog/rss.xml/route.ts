import { NextResponse } from 'next/server'
import { getAllArticles } from '@/lib/content/blog'
import { generateRSSFeed } from '@/lib/utils/rss'

export async function GET() {
  try {
    const articles = getAllArticles()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'
    const rss = generateRSSFeed(articles, siteUrl)

    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}

