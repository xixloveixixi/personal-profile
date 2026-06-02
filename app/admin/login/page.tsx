'use client'

import { Button, Card, Form, Input, message } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { login } from '@/lib/api/admin'
import { setAdminAuthCookie, useAuthStore } from '@/lib/stores/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await login(values)
      setAuth(res.accessToken, res.user)
      setAdminAuthCookie(res.accessToken, res.expiresIn)
      message.success('登录成功')
      router.push('/admin/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card title="Admin Login" style={{ width: 360 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
