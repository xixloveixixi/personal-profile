'use client'

import { ConfigProvider, Layout, Menu, Button, Typography } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { clearAdminAuthCookie, useAuthStore } from '@/lib/stores/auth'

const { Header, Content, Sider } = Layout

const theme = {
  token: {
    colorPrimary: '#564B60',
  },
}

const menuItems = [
  { key: '/admin/dashboard', label: <Link href="/admin/dashboard">工作台</Link> },
  { key: '/admin/profile', label: <Link href="/admin/profile">个人资料</Link> },
  { key: '/admin/contacts', label: <Link href="/admin/contacts">联系方式</Link> },
  { key: '/admin/skills', label: <Link href="/admin/skills">技能列表</Link> },
  { key: '/admin/about/timeline', label: <Link href="/admin/about/timeline">时间线管理</Link> },
  { key: '/admin/projects', label: <Link href="/admin/projects">项目管理</Link> },
  { key: '/admin/site-config', label: <Link href="/admin/site-config">站点配置</Link> },
  {
    key: '/admin/learning',
    label: '学习工作台',
    children: [
      { key: '/admin/learning', label: <Link href="/admin/learning">概览</Link> },
      { key: '/admin/learning/goals', label: <Link href="/admin/learning/goals">学习目标</Link> },
      { key: '/admin/learning/plans', label: <Link href="/admin/learning/plans">学习计划</Link> },
      { key: '/admin/learning/chat', label: <Link href="/admin/learning/chat">AI 教练</Link> },
    ],
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    clearAdminAuthCookie()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <ConfigProvider theme={theme}>{children}</ConfigProvider>
  }

  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Sider width={220} breakpoint="lg" collapsedWidth="0">
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px' }}>
            <Typography.Text style={{ color: '#fff', fontWeight: 600 }}>
              Admin
            </Typography.Text>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ minHeight: 0, overflow: 'hidden' }}>
          <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <Typography.Text>欢迎，{user?.username ?? 'Admin'}</Typography.Text>
            <Button danger onClick={handleLogout}>退出登录</Button>
          </Header>
          <Content style={{ margin: 24, minHeight: 0, overflowY: 'auto' }}>
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
