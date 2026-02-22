# RSS Feed Contract

**Route**: `GET /blog/rss.xml`  
**Content-Type**: `application/rss+xml`  
**Cache**: Public, revalidate on content update

## Response Format

Returns a valid RSS 2.0 XML feed containing all published blog articles.

## RSS Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Personal Portfolio Blog</title>
    <link>https://yourdomain.com/blog</link>
    <description>Technical articles, tutorials, and essays</description>
    <language>en</language>
    <lastBuildDate>{RFC 822 date}</lastBuildDate>
    <atom:link href="https://yourdomain.com/blog/rss.xml" rel="self" type="application/rss+xml"/>
    
    {article entries}
  </channel>
</rss>
```

## Article Entry Format

Each article is represented as an `<item>` element:

```xml
<item>
  <title>{article.title}</title>
  <link>https://yourdomain.com/blog/{article.slug}</link>
  <description>{article.description}</description>
  <pubDate>{RFC 822 formatted date}</pubDate>
  <guid isPermaLink="true">https://yourdomain.com/blog/{article.slug}</guid>
  <category>{article.category}</category>
  {tags as category elements}
</item>
```

## Field Mappings

- `title`: Article title from frontmatter
- `link`: Full URL to article page
- `description`: Article description from frontmatter
- `pubDate`: Article published date in RFC 822 format
- `guid`: Permanent link to article (same as link)
- `category`: Article category (technical, essays, tutorials)
- Additional `<category>` elements for each tag

## Date Format

Dates must be in RFC 822 format: `Wed, 05 Feb 2026 12:00:00 +0000`

## Ordering

Articles ordered by publication date (newest first).

## Filtering

Only published articles (not drafts) are included in the feed.

## Error Handling

- If no articles exist: Return empty feed with channel metadata
- If feed generation fails: Return 500 error with error message
- Invalid dates: Use current date as fallback

## Caching Strategy

- Generate feed at build time for static generation
- Or generate on-demand with appropriate cache headers
- Revalidate when new articles are published

