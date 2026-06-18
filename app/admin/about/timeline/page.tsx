'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

import {
  createAdminTimeline,
  deleteAdminTimeline,
  getAdminTimeline,
  updateAdminTimeline,
  type AdminTimelineEntry,
  type AdminTimelinePayload,
  type AdminTimelineType,
} from '@/lib/api/admin'

const { Text, Title } = Typography
const { TextArea } = Input

const TIMELINE_TYPE_OPTIONS: Array<{ label: string; value: AdminTimelineType }> = [
  { label: '教育经历', value: 'education' },
  { label: '工作 / 实习 / 项目节点', value: 'work' },
]

type TimelineFormValues = {
  entryId: string
  type: AdminTimelineType
  title: string
  organization: string
  location?: string
  startDate: string
  endDate?: string
  description?: string
  achievementsText?: string
  technologiesText?: string
  isPublic: boolean
  sortOrder: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '操作失败，请稍后重试'
}

function parseMultilineList(value?: string): string[] {
  if (!value) return []
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatMultilineList(value?: string[]): string {
  return (value ?? []).join('\n')
}

function toTimelinePayload(values: TimelineFormValues): AdminTimelinePayload {
  return {
    entryId: values.entryId.trim(),
    type: values.type,
    title: values.title.trim(),
    organization: values.organization.trim(),
    location: values.location?.trim(),
    startDate: values.startDate.trim(),
    endDate: values.endDate?.trim() || undefined,
    description: values.description?.trim(),
    achievements: parseMultilineList(values.achievementsText),
    technologies: parseMultilineList(values.technologiesText),
    isPublic: values.isPublic,
    sortOrder: values.sortOrder,
  }
}

function isInternshipEntry(record: AdminTimelineEntry): boolean {
  return record.type === 'work' && record.organization !== '项目经历'
}

export default function AdminAboutTimelinePage() {
  const [form] = Form.useForm<TimelineFormValues>()
  const [messageApi, contextHolder] = message.useMessage()
  const [entries, setEntries] = useState<AdminTimelineEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<AdminTimelineEntry | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const data = await getAdminTimeline()
      setEntries(data)
    } catch (error) {
      const messageText = getErrorMessage(error)
      setErrorMessage(messageText)
      messageApi.error(messageText)
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return

      const entry = editingEntry
      if (!entry) {
        form.setFieldsValue({
          entryId: '',
          type: 'work',
          title: '',
          organization: '',
          location: '',
          startDate: '',
          endDate: '',
          description: '',
          achievementsText: '',
          technologiesText: '',
          isPublic: true,
          sortOrder: 0,
        })
        return
      }

      form.setFieldsValue({
        entryId: entry.entryId,
        type: entry.type,
        title: entry.title,
        organization: entry.organization,
        location: entry.location || '',
        startDate: entry.startDate,
        endDate: entry.endDate || '',
        description: entry.description || '',
        achievementsText: formatMultilineList(entry.achievements),
        technologiesText: formatMultilineList(entry.technologies),
        isPublic: entry.isPublic ?? true,
        sortOrder: entry.sortOrder ?? 0,
      })
    },
    [editingEntry, form],
  )

  const openCreateModal = () => {
    setEditingEntry(null)
    setModalOpen(true)
  }

  const openEditModal = (record: AdminTimelineEntry) => {
    setEditingEntry(record)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingEntry(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = toTimelinePayload(values)

    setSubmitting(true)
    try {
      if (editingEntry) {
        await updateAdminTimeline(editingEntry.id, payload)
        messageApi.success('时间线条目已更新')
      } else {
        await createAdminTimeline(payload)
        messageApi.success('时间线条目已新增')
      }

      closeModal()
      await loadEntries()
    } catch (error) {
      const messageText = getErrorMessage(error)
      messageApi.error(messageText)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (record: AdminTimelineEntry) => {
    setLoading(true)
    try {
      await deleteAdminTimeline(record.id)
      messageApi.success('时间线条目已删除')
      await loadEntries()
    } catch (error) {
      const messageText = getErrorMessage(error)
      setErrorMessage(messageText)
      messageApi.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const internshipCount = entries.filter(isInternshipEntry).length
    const projectNodeCount = entries.filter(
      (entry) => entry.type === 'work' && entry.organization === '项目经历',
    ).length
    const educationCount = entries.filter((entry) => entry.type === 'education').length

    return { internshipCount, projectNodeCount, educationCount }
  }, [entries])

  const columns: ColumnsType<AdminTimelineEntry> = [
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      filters: TIMELINE_TYPE_OPTIONS.map((option) => ({
        text: option.label,
        value: option.value,
      })),
      onFilter: (value, record) => record.type === value,
      render: (value: AdminTimelineType) =>
        value === 'education' ? <Tag color="blue">教育</Tag> : <Tag color="purple">工作</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 160,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: '组织 / 学校 / 公司',
      dataIndex: 'organization',
      key: 'organization',
      width: 180,
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text>{value}</Text>
          {isInternshipEntry(record) ? (
            <Text type="secondary">计入实习经历</Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: '时间范围',
      key: 'dateRange',
      width: 220,
      render: (_, record) => (
        <Text>
          {record.startDate} ~ {record.endDate || '至今'}
        </Text>
      ),
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
      title: '关键内容',
      key: 'content',
      ellipsis: true,
      render: (_, record) => {
        const firstAchievement = record.achievements?.[0]
        if (firstAchievement) {
          return <Text>{firstAchievement}</Text>
        }

        return record.description ? (
          <Text>{record.description}</Text>
        ) : (
          <Text type="secondary">未填写</Text>
        )
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除时间线条目"
            description={`确认删除 ${record.title}？`}
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
                时间线管理
              </Title>
              <Text type="secondary">
                统一管理 About 页的教育、实习、工作与项目节点。实习经历归属于工作类型条目。
              </Text>
            </div>
            <Space>
              <Button onClick={loadEntries} loading={loading}>
                刷新
              </Button>
              <Button type="primary" onClick={openCreateModal}>
                新增时间线条目
              </Button>
            </Space>
          </div>

          <Space wrap>
            <Tag color="purple">实习经历 {summary.internshipCount}</Tag>
            <Tag color="blue">教育经历 {summary.educationCount}</Tag>
            <Tag color="gold">项目节点 {summary.projectNodeCount}</Tag>
            <Tag>总条目 {entries.length}</Tag>
          </Space>

          {errorMessage ? (
            <Alert
              type="error"
              showIcon
              message="加载失败"
              description={errorMessage}
              action={<Button onClick={loadEntries}>重试</Button>}
            />
          ) : null}

          <Table<AdminTimelineEntry>
            rowKey="id"
            columns={columns}
            dataSource={entries}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        </Space>
      </Card>

      <Modal
        title={editingEntry ? '编辑时间线条目' : '新增时间线条目'}
        open={modalOpen}
        okText={editingEntry ? '保存' : '新增'}
        cancelText="取消"
        confirmLoading={submitting}
        onOk={() => void handleSubmit()}
        onCancel={closeModal}
        afterOpenChange={handleAfterOpenChange}
        destroyOnClose
        width={760}
      >
        <Form<TimelineFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            entryId: '',
            type: 'work',
            title: '',
            organization: '',
            location: '',
            startDate: '',
            endDate: '',
            description: '',
            achievementsText: '',
            technologiesText: '',
            isPublic: true,
            sortOrder: 0,
          }}
        >
          <Form.Item
            name="entryId"
            label="业务标识"
            rules={[
              { required: true, message: '请输入业务标识' },
              { max: 128, message: '业务标识不能超过 128 个字符' },
            ]}
          >
            <Input placeholder="例如：intern-baidu-fe" />
          </Form.Item>

          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={TIMELINE_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入标题' },
              { max: 128, message: '标题不能超过 128 个字符' },
            ]}
          >
            <Input placeholder="例如：前端开发实习生" />
          </Form.Item>

          <Form.Item
            name="organization"
            label="组织 / 学校 / 公司"
            rules={[
              { required: true, message: '请输入组织名称' },
              { max: 128, message: '组织名称不能超过 128 个字符' },
            ]}
          >
            <Input placeholder="例如：百度 / 湖南科技大学 / 项目经历" />
          </Form.Item>

          <Form.Item
            name="location"
            label="地点"
            rules={[{ max: 128, message: '地点不能超过 128 个字符' }]}
          >
            <Input placeholder="例如：北京" />
          </Form.Item>

          <Form.Item
            name="startDate"
            label="开始日期"
            rules={[
              { required: true, message: '请输入开始日期' },
              { pattern: /^\d{4}-\d{2}-\d{2}$/, message: '日期格式必须为 YYYY-MM-DD' },
            ]}
          >
            <Input placeholder="2025-06-01" />
          </Form.Item>

          <Form.Item
            name="endDate"
            label="结束日期"
            rules={[{ pattern: /^$|^\d{4}-\d{2}-\d{2}$/, message: '日期格式必须为 YYYY-MM-DD' }]}
          >
            <Input placeholder="留空表示至今，例如 2025-08-31" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ max: 5000, message: '描述不能超过 5000 个字符' }]}
          >
            <TextArea rows={4} placeholder="条目简介或背景描述" />
          </Form.Item>

          <Form.Item name="achievementsText" label="亮点清单（每行一条）">
            <TextArea rows={5} placeholder={'独立负责某模块\n推动某项优化落地'} />
          </Form.Item>

          <Form.Item name="technologiesText" label="技术栈（每行一条）">
            <TextArea rows={4} placeholder={'React\nTypeScript\nNext.js'} />
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
