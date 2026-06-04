'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, Typography, message } from 'antd'
import { useRouter } from 'next/navigation'

import { getLearningProfile, updateLearningProfile } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'

export default function LearningProfilePage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLearningProfile()
      form.setFieldsValue(data)
    } catch (e) {
      if (e instanceof ApiError && e.code === 40400) {
        // profile not initialized yet, keep form empty
      } else {
        messageApi.error(e instanceof ApiError ? e.message : '加载失败')
      }
    } finally {
      setLoading(false)
    }
  }, [form, messageApi])

  useEffect(() => { void loadProfile() }, [loadProfile])

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await updateLearningProfile(values)
      messageApi.success('学习画像已保存')
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }, [form, messageApi])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {contextHolder}
      <Card
        title={<Typography.Title level={3} className="!mb-0">学习画像编辑</Typography.Title>}
        loading={loading}
        extra={<Button onClick={() => router.push('/admin/learning')}>返回</Button>}
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          <Form.Item label="目标岗位" name="targetRole">
            <Input placeholder="例如：前端架构师" />
          </Form.Item>
          <Form.Item label="背景摘要" name="backgroundSummary">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder="你的背景经历" />
          </Form.Item>
          <Form.Item label="技能摘要" name="skillSummary">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder="核心技能概要" />
          </Form.Item>
          <Form.Item label="弱点摘要" name="weaknessSummary">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} placeholder="需要提升的方面" />
          </Form.Item>
          <Form.Item label="学习偏好" name="learningPreference">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="偏好的学习方式" />
          </Form.Item>
          <Form.Item label="简历快照" name="resumeSnapshot">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} placeholder="简历关键信息" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </main>
  )
}
