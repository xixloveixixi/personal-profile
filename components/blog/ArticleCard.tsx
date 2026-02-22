import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getCategoryById } from '@/lib/constants/categories'
import type { BlogArticle } from '@/lib/content/blog'

interface ArticleCardProps {
  article: BlogArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  const category = getCategoryById(article.category)

  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className="h-full hover:shadow-xl hover:shadow-primary-600/10 border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{category.name}</Badge>
            <span className="text-sm text-gray-500">
              {article.readingTime} min read
            </span>
          </div>
          <CardTitle className="group-hover:text-primary-600">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {article.description}
          </p>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

