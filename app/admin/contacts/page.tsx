'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  createAdminContact,
  deleteAdminContact,
  getAdminContacts,
  updateAdminContact,
} from '@/lib/api/admin'
import type { AdminContact, ContactPayload } from '@/lib/api/admin'

const { Text, Title } = Typography

type ContactFormValues = {
  platform: string
  label?: string
  url?: string
  icon?: string
  isPublic: boolean
  sortOrder: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '操作失败，请稍后重试'
}

function toContactPayload(values: ContactFormValues): ContactPayload {
  return {
    platform: values.platform.trim(),
    label: values.label?.trim(),
    url: values.url?.trim(),
    icon: values.icon?.trim(),
    isPublic: values.isPublic,
    sortOrder: values.sortOrder,
  }
}

export default function AdminContactsPage() {
  const [form] = Form.useForm<ContactFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const [contacts, setContacts] = useState<AdminContact[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<AdminContact | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadContacts = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const data = await getAdminContacts()
      setContacts(data)
    } catch (error) {
      const messageText = getErrorMessage(error)
      setErrorMessage(messageText)
      messageApi.error(messageText)
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return
      const contact = editingContact
      if (!contact) return
      form.setFieldsValue({
        platform: contact.platform,
        label: contact.label || '',
        url: contact.url || '',
        icon: contact.icon || '',
        isPublic: contact.isPublic ?? true,
        sortOrder: contact.sortOrder ?? 0,
      })
    },
    [form, editingContact],
  )

  const openCreateModal = () => {
    setEditingContact(null)
    setModalOpen(true)
  }

  const openEditModal = (record: AdminContact) => {
    setEditingContact(record)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingContact(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = toContactPayload(values)

    setSubmitting(true)
    try {
      if (editingContact) {
        await updateAdminContact(editingContact.id, payload)
        messageApi.success('联系方式已更新')
      } else {
        await createAdminContact(payload)
        messageApi.success('联系方式已新增')
      }

      closeModal()
      await loadContacts()
    } catch (error) {
      const messageText = getErrorMessage(error)
      messageApi.error(messageText)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (record: AdminContact) => {
    setLoading(true)
    try {
      await deleteAdminContact(record.id)
      messageApi.success('联系方式已删除')
      await loadContacts()
    } catch (error) {
      const messageText = getErrorMessage(error)
      setErrorMessage(messageText)
      messageApi.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<AdminContact> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 140,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: '展示名称',
      dataIndex: 'label',
      key: 'label',
      width: 160,
      render: (value: string) => value || <Text type="secondary">未填写</Text>,
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (value: string) =>
        value ? (
          <a href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          <Text type="secondary">未填写</Text>
        ),
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 120,
      render: (value: string) => value || <Text type="secondary">未填写</Text>,
    },
    {
      title: '公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 100,
      render: (value: boolean) =>
        value ? <Tag color="green">公开</Tag> : <Tag>隐藏</Tag>,
      filters: [
        { text: '公开', value: true },
        { text: '隐藏', value: false },
      ],
      onFilter: (value, record) => record.isPublic === value,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除联系方式"
            description={`确认删除 ${record.label || record.platform}？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      {contextHolder}
      <Card>
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Title level={2} className="!mb-2">
                联系方式管理
              </Title>
              <Text type="secondary">
                管理公开页展示的联系方式，支持新增、编辑、删除与刷新。
              </Text>
            </div>
            <Space>
              <Button onClick={loadContacts} loading={loading}>
                刷新
              </Button>
              <Button type="primary" onClick={openCreateModal}>
                新增联系方式
              </Button>
            </Space>
          </div>

          {errorMessage ? (
            <Alert
              type="error"
              showIcon
              message="加载失败"
              description={errorMessage}
              action={<Button onClick={loadContacts}>重试</Button>}
            />
          ) : null}

          <Table<AdminContact>
            rowKey="id"
            columns={columns}
            dataSource={contacts}
            loading={loading}
            scroll={{ x: 960 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title={editingContact ? '编辑联系方式' : '新增联系方式'}
        open={modalOpen}
        okText={editingContact ? '保存' : '新增'}
        cancelText="取消"
        confirmLoading={submitting}
        onOk={() => void handleSubmit()}
        onCancel={closeModal}
        afterOpenChange={handleAfterOpenChange}
        destroyOnClose
      >
        <Form<ContactFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            platform: '',
            label: '',
            url: '',
            icon: '',
            isPublic: true,
            sortOrder: 0,
          }}
        >
          <Form.Item
            name="platform"
            label="平台"
            rules={[
              { required: true, message: '请输入平台标识' },
              { max: 64, message: '平台标识不能超过 64 个字符' },
            ]}
          >
            <Input placeholder="例如：github / email / linkedin" />
          </Form.Item>

          <Form.Item
            name="label"
            label="展示名称"
            rules={[{ max: 128, message: '展示名称不能超过 128 个字符' }]}
          >
            <Input placeholder="例如：GitHub" />
          </Form.Item>

          <Form.Item
            name="url"
            label="链接"
            rules={[{ max: 512, message: '链接不能超过 512 个字符' }]}
          >
            <Input placeholder="https://github.com/jiangyixi" />
          </Form.Item>

          <Form.Item
            name="icon"
            label="图标"
            rules={[{ max: 64, message: '图标标识不能超过 64 个字符' }]}
          >
            <Input placeholder="例如：github" />
          </Form.Item>

          <Form.Item name="sortOrder" label="排序">
            <InputNumber className="w-full" min={0} precision={0} />
          </Form.Item>

          <Form.Item name="isPublic" label="是否公开" valuePropName="checked">
            <Switch checkedChildren="公开" unCheckedChildren="隐藏" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
