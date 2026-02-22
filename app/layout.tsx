import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { SkipLink } from '@/components/layout/SkipLink'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import Template from './template'
import './globals.css'
import PageBackground from '@/components/background/PageBackground'

export const metadata: Metadata = {
  title: {
    default: '阿菥的个人主页',
    template: '%s | 阿菥的个人主页',
  },
  description: '阿菥的个人主页',
  manifest: '/manifest.json',
  themeColor: '#564B60',
  icons: {
    icon: '/icons/myIcon.jpeg',
    shortcut: '/icons/myIcon.jpeg',
    apple: '/icons/myIcon.jpeg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Personal Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className="flex flex-col h-full"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", Arial, sans-serif',
        }}
      >
        <PageBackground />
        <AntdRegistry>
          <SkipLink />
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto min-h-0">
            {children}
          </main>
        </AntdRegistry>
      </body>
    </html>
  )
}

