'use client'

import { Card, Typography } from 'antd'

export default function AdminDashboardPage() {
  return (
    <Card>
      <Typography.Title level={3}>工作台</Typography.Title>
      <Typography.Paragraph>
        请从左侧菜单进入个人资料、联系方式、技能列表或站点配置管理。
      </Typography.Paragraph>
    </Card>
  )
}
