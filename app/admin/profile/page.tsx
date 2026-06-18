'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Input, Select, Space, Spin, Typography, message } from 'antd'

import {
  type AdminProfile,
  type AdminProfilePayload,
  getAdminProfile,
  updateAdminProfile,
} from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const visibilityOptions = [
  { label: '公开', value: 'public' },
  { label: '私密', value: 'private' },
  { label: '隐藏', value: 'hidden' },
]

const defaultProfileValues: AdminProfilePayload = {
  displayName: '',
  headline: '',
  bio: '',
  avatarUrl: '',
  currentFocus: '',
  location: '',
  visibility: 'public',
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后重试'
}

function toFormValues(profile: AdminProfile): AdminProfilePayload {
  return {
    displayName: profile.displayName ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
    currentFocus: profile.currentFocus ?? '',
    location: profile.location ?? '',
    visibility: profile.visibility ?? 'public',
  }
}

export default function AdminProfilePage() {
  const [form] = Form.useForm<AdminProfilePayload>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [profile, setProfile] = useState<AdminProfile>()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setErrorMessage(undefined)

    try {
      const nextProfile = await getAdminProfile()
      setProfile(nextProfile)
      form.setFieldsValue(toFormValues(nextProfile))
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      form.setFieldsValue(defaultProfileValues)
    } finally {
      setLoading(false)
    }
  }, [form])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleFinish = async (values: AdminProfilePayload) => {
    setSaving(true)

    try {
      const nextProfile = await updateAdminProfile({
        ...values,
        headline: values.headline ?? '',
        bio: values.bio ?? '',
        avatarUrl: values.avatarUrl ?? '',
        currentFocus: values.currentFocus ?? '',
        location: values.location ?? '',
        visibility: values.visibility ?? 'public',
      })
      setProfile(nextProfile)
      form.setFieldsValue(toFormValues(nextProfile))
      setErrorMessage(undefined)
      message.success('个人信息已保存')
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Title level={2} className="!mb-2">
                个人信息管理
              </Title>
              <Paragraph className="!mb-0 text-slate-600">
                编辑公开页展示的个人资料，保存后会同步写入后台 profile 接口。
              </Paragraph>
            </div>
            <Space wrap>
              <Button type="primary" htmlType="submit" form="admin-profile-form" loading={saving} disabled={loading}>
                保存
              </Button>
              <Button onClick={() => void loadProfile()} disabled={loading || saving}>
                重新加载
              </Button>
            </Space>
          </div>

          {errorMessage ? (
            <Alert
              showIcon
              type="error"
              message="加载个人信息失败"
              description={errorMessage}
              action={
                <Button size="small" danger onClick={() => void loadProfile()}>
                  重试
                </Button>
              }
            />
          ) : null}

          <Card>
            <Spin spinning={loading} tip="正在加载个人信息...">
              <Form<AdminProfilePayload>
                id="admin-profile-form"
                form={form}
                layout="vertical"
                initialValues={defaultProfileValues}
                onFinish={handleFinish}
                disabled={loading}
              >
                <Form.Item
                  label="展示名称"
                  name="displayName"
                  rules={[
                    { required: true, message: '请输入展示名称' },
                    { max: 64, message: '展示名称不能超过 64 个字符' },
                  ]}
                >
                  <Input placeholder="例如：Yixi Jiang" />
                </Form.Item>

                <Form.Item
                  label="首页主标题"
                  name="headline"
                  rules={[{ max: 255, message: '首页主标题不能超过 255 个字符' }]}
                >
                  <Input placeholder="例如：Frontend × AI Agent Engineer" />
                </Form.Item>

                <Form.Item
                  label="简介"
                  name="bio"
                  rules={[{ max: 10000, message: '简介不能超过 10000 个字符' }]}
                >
                  <TextArea rows={6} placeholder="请输入个人简介" showCount maxLength={10000} />
                </Form.Item>

                <Form.Item
                  label="头像 URL"
                  name="avatarUrl"
                  rules={[{ max: 512, message: '头像 URL 不能超过 512 个字符' }]}
                >
                  <Input placeholder="https://..." />
                </Form.Item>

                <Form.Item
                  label="当前关注"
                  name="currentFocus"
                  rules={[{ max: 255, message: '当前关注不能超过 255 个字符' }]}
                >
                  <Input placeholder="例如：前端 Agent 工程师" />
                </Form.Item>

                <Form.Item>
                  {profile?.id ? <Text type="secondary">当前记录 ID：{profile.id}</Text> : null}
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Space>
      </div>
    </main>
  )
}
