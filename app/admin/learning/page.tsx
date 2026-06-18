'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import Link from 'next/link'

import { getLearningProfile, getLearningGoals } from '@/lib/api/private'
import type { LearningProfile, LearningGoal } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'

export default function LearningDashboardPage() {
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, g] = await Promise.allSettled([getLearningProfile(), getLearningGoals()])
      if (p.status === 'fulfilled') setProfile(p.value)
      if (g.status === 'fulfilled') setGoals(g.value)
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => { void loadData() }, [loadData])

  const columns: ColumnsType<LearningGoal> = [
    { title: '目标', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'goalType', key: 'goalType', render: (v: string) => <Tag>{v || '-'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'active' ? 'blue' : 'default'}>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '进度', dataIndex: 'progressPercent', key: 'progressPercent', width: 80, render: (v: number) => `${v}%` },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string | null) => v || '-' },
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6 overflow:hidden">
      {contextHolder}
      <Card
        title="学习画像概览"
        extra={<Link href="/admin/learning/profile"><Button type="link">编辑画像</Button></Link>}
        style={{ marginBottom: 24 }}
      >
        {profile ? (
          <Space direction="vertical" size={4}>
            <Typography.Text><strong>目标岗位：</strong>{profile.targetRole || '-'}</Typography.Text>
            <Typography.Text><strong>技能摘要：</strong>{profile.skillSummary || '-'}</Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">暂无学习画像，点击右上角编辑</Typography.Text>
        )}
      </Card>

      <Card
        title="学习目标列表"
        extra={<Link href="/admin/learning/goals"><Button type="primary">管理目标</Button></Link>}
      >
        <Table<LearningGoal>
          rowKey="id"
          columns={columns}
          dataSource={goals}
          loading={loading}
          pagination={false}
        />
      </Card>
    </main>
  )
}
