import { Card, CardContent } from '@/components/ui/Card'
import { ExternalLink } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ContactLink } from '@/lib/content/about'

interface ContactCardProps {
  contact: ContactLink
}

export function ContactCard({ contact }: ContactCardProps) {
  // Dynamically get icon from lucide-react
  const iconName = contact.icon.charAt(0).toUpperCase() + contact.icon.slice(1)
  const IconComponent =
    (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] ?? ExternalLink

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 group"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200">
            <IconComponent className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-primary-600">
              {contact.label || contact.platform}
            </h3>
            <p className="text-sm text-gray-500">
              {contact.url.replace(/^https?:\/\//, '')}
            </p>
          </div>
        </a>
      </CardContent>
    </Card>
  )
}

