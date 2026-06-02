'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  getAdminSiteConfig,
  upsertAdminSiteConfig,
  type SiteConfigItem,
  type SiteConfigValueType,
} from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'

interface SiteConfigFormValues {
  key: string
  value: string
  valueType: SiteConfigValueType
  description?: string
}

const VALUE_TYPE_OPTIONS: Array<{
  label: string
  value: SiteConfigValueType
}> = [
  { label: '字符串 string', value: 'string' },
  { label: 'JSON json', value: 'json' },
  { label: '布尔 boolean', value: 'boolean' },
  { label: '数字 number', value: 'number' },
]

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 40100) {
      return '登录态已失效或缺少 token，请先完成后台登录后重试。'
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '未知错误，请稍后重试。'
}

function validateConfigValue(value: string, valueType: SiteConfigValueType): string | null {
  if (valueType === 'json') {
    try {
      JSON.parse(value)
    } catch {
      return 'JSON 类型的配置值必须是合法 JSON 字符串。'
    }
  }

  if (valueType === 'boolean' && !['true', 'false'].includes(value)) {
    return 'boolean 类型的配置值只能填写 true 或 false。'
  }

  if (valueType === 'number' && Number.isNaN(Number(value))) {
    return 'number 类型的配置值必须是合法数字。'
  }

  return null
}

export default function AdminSiteConfigPage() {
  const [configs, setConfigs] = useState<SiteConfigItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SiteConfigItem | null>(null)
  const [form] = Form.useForm<SiteConfigFormValues>()

  const loadConfigs = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const data = await getAdminSiteConfig()
      setConfigs(data)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfigs()
  }, [loadConfigs])

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return
      const config = editingConfig
      if (!config) {
        form.setFieldsValue({ key: '', value: '', valueType: 'string', description: '' })
        return
      }
      form.setFieldsValue({
        key: config.key,
        value: config.value,
        valueType: config.valueType,
        description: config.description || '',
      })
    },
    [form, editingConfig],
  )

  const openCreateModal = useCallback(() => {
    setEditingConfig(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((record: SiteConfigItem) => {
    setEditingConfig(record)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (saving) {
      return
    }

    setModalOpen(false)
  }, [saving])

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields()
    const key = values.key.trim()
    const validationMessage = validateConfigValue(values.value, values.valueType)

    if (validationMessage) {
      message.error(validationMessage)
      return
    }

    setSaving(true)

    try {
      const savedConfig = await upsertAdminSiteConfig(key, {
        value: values.value,
        valueType: values.valueType,
        description: values.description?.trim() ?? '',
      })

      setConfigs((currentConfigs) => {
        const exists = currentConfigs.some((item) => item.key === savedConfig.key)
        if (!exists) {
          return [...currentConfigs, savedConfig].sort((a, b) =>
            a.key.localeCompare(b.key),
          )
        }

        return currentConfigs.map((item) =>
          item.key === savedConfig.key ? savedConfig : item,
        )
      })
      setModalOpen(false)
      message.success('站点配置已保存。')
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }, [form])

  const columns = useMemo<ColumnsType<SiteConfigItem>>(
    () => [
      {
        title: 'Key',
        dataIndex: 'key',
        key: 'key',
        width: 220,
        sorter: (a, b) => a.key.localeCompare(b.key),
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
      },
      {
        title: 'Value',
        dataIndex: 'value',
        key: 'value',
        ellipsis: true,
        render: (value: string) => (
          <Typography.Text copyable={{ text: value }}>{value}</Typography.Text>
        ),
      },
      {
        title: '类型',
        dataIndex: 'valueType',
        key: 'valueType',
        width: 120,
        filters: VALUE_TYPE_OPTIONS.map((option) => ({
          text: option.value,
          value: option.value,
        })),
        onFilter: (value, record) => record.valueType === value,
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 96,
        render: (_, record) => (
          <Button type="link" onClick={() => openEditModal(record)}>
            编辑
          </Button>
        ),
      },
    ],
    [openEditModal],
  )

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <Space direction="vertical" size={4}>
            <Typography.Title level={2} className="!mb-0">
              站点配置
            </Typography.Title>
            <Typography.Text type="secondary">
              管理 site_config 表中的 key/value 配置，保存后会调用后台 upsert 接口。
            </Typography.Text>
          </Space>
        </section>

        {errorMessage ? (
          <Alert
            showIcon
            type="error"
            message="加载站点配置失败"
            description={errorMessage}
            action={
              <Button size="small" onClick={loadConfigs}>
                重试
              </Button>
            }
          />
        ) : null}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Typography.Title level={4} className="!mb-0">
              配置列表
            </Typography.Title>
            <Space>
              <Button onClick={loadConfigs} loading={loading}>
                刷新
              </Button>
              <Button type="primary" onClick={openCreateModal}>
                新增配置
              </Button>
            </Space>
          </div>

          <Table<SiteConfigItem>
            rowKey="key"
            columns={columns}
            dataSource={configs}
            loading={loading}
            pagination={false}
            locale={{ emptyText: '暂无站点配置，可点击“新增配置”创建。' }}
          />
        </section>

        <Modal
          title={editingConfig ? '编辑站点配置' : '新增站点配置'}
          open={modalOpen}
          onCancel={closeModal}
          onOk={handleSubmit}
          confirmLoading={saving}
          afterOpenChange={handleAfterOpenChange}
          destroyOnClose
          okText="保存"
          cancelText="取消"
        >
          <Form<SiteConfigFormValues>
            form={form}
            layout="vertical"
            preserve={false}
            className="pt-4"
          >
            <Form.Item
              label="Key"
              name="key"
              rules={[
                { required: true, message: '请输入配置 key。' },
                {
                  pattern: /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/,
                  message: 'key 需符合点分 path，例如 site.title 或 nav.items。',
                },
              ]}
            >
              <Input
                placeholder="例如：site.title"
                disabled={Boolean(editingConfig)}
              />
            </Form.Item>

            <Form.Item
              label="类型"
              name="valueType"
              rules={[{ required: true, message: '请选择配置类型。' }]}
            >
              <Select options={VALUE_TYPE_OPTIONS} />
            </Form.Item>

            <Form.Item
              label="Value"
              name="value"
              rules={[{ required: true, message: '请输入配置值。' }]}
            >
              <Input.TextArea rows={5} placeholder="配置值始终按字符串保存。" />
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input.TextArea rows={3} maxLength={255} showCount />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </main>
  )
}
