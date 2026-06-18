'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
  createAdminSkill,
  deleteAdminSkill,
  getAdminSkills,
  updateAdminSkill,
} from '@/lib/api/admin'
import type { AdminSkill, AdminSkillPayload } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'

interface SkillFormValues {
  name: string
  category?: string
  proficiencyLevel?: string
  description?: string
  isPublic: boolean
  sortOrder: number
}

const SKILL_CATEGORY_OPTIONS = [
  { label: '前端基础', value: '前端基础' },
  { label: '前端框架与生态', value: '前端框架与生态' },
  { label: '数据可视化', value: '数据可视化' },
  { label: '前端工程化', value: '前端工程化' },
  { label: '后端开发', value: '后端开发' },
  { label: 'AI 工程实践', value: 'AI 工程实践' },
  { label: '开发工具与协作', value: '开发工具与协作' },
  { label: '技能证书', value: '技能证书' },
]

const SKILL_PROFICIENCY_OPTIONS = [
  { label: '熟练', value: '熟练' },
  { label: '熟悉', value: '熟悉' },
  { label: '了解', value: '了解' },
  { label: '项目实践', value: '项目实践' },
  { label: '已获证书', value: '已获证书' },
]

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return '操作失败，请稍后重试'
}

function toSkillPayload(values: SkillFormValues): AdminSkillPayload {
  return {
    name: values.name.trim(),
    category: values.category?.trim() ?? '',
    proficiencyLevel: values.proficiencyLevel?.trim() ?? '',
    description: values.description?.trim() ?? '',
    isPublic: values.isPublic,
    sortOrder: values.sortOrder ?? 0,
  }
}

export default function AdminSkillsPage() {
  const [form] = Form.useForm<SkillFormValues>()
  const [skills, setSkills] = useState<AdminSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<AdminSkill | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const loadSkills = useCallback(async () => {
    setLoading(true)

    try {
      setSkills(await getAdminSkills())
    } catch (error) {
      messageApi.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => {
    void loadSkills()
  }, [loadSkills])

  const handleAfterOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return
      const skill = editingSkill
      if (!skill) {
        form.setFieldsValue({ name: '', category: '', proficiencyLevel: '', description: '', isPublic: true, sortOrder: 0 })
        return
      }
      form.setFieldsValue({
        name: skill.name,
        category: skill.category || '',
        proficiencyLevel: skill.proficiencyLevel || '',
        description: skill.description || '',
        isPublic: skill.isPublic ?? true,
        sortOrder: skill.sortOrder ?? 0,
      })
    },
    [form, editingSkill],
  )

  const openCreateModal = useCallback(() => {
    setEditingSkill(null)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((skill: AdminSkill) => {
    setEditingSkill(skill)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    if (submitting) {
      return
    }

    setModalOpen(false)
    setEditingSkill(null)
    form.resetFields()
  }, [form, submitting])

  const handleSubmit = useCallback(async () => {
    const payload = toSkillPayload(await form.validateFields())
    setSubmitting(true)

    try {
      if (editingSkill) {
        await updateAdminSkill(editingSkill.id, payload)
        messageApi.success('技能已更新')
      } else {
        await createAdminSkill(payload)
        messageApi.success('技能已新增')
      }

      setModalOpen(false)
      setEditingSkill(null)
      form.resetFields()
      await loadSkills()
    } catch (error) {
      messageApi.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }, [editingSkill, form, loadSkills, messageApi])

  const handleDelete = useCallback(
    async (skill: AdminSkill) => {
      try {
        await deleteAdminSkill(skill.id)
        messageApi.success('技能已删除')
        await loadSkills()
      } catch (error) {
        messageApi.error(getErrorMessage(error))
      }
    },
    [loadSkills, messageApi],
  )

  const columns = useMemo<ColumnsType<AdminSkill>>(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
      },
      {
        title: '分类',
        dataIndex: 'category',
        key: 'category',
        render: (category: string) => category || '-',
      },
      {
        title: '熟练度',
        dataIndex: 'proficiencyLevel',
        key: 'proficiencyLevel',
        render: (level: string) => (level ? <Tag color="blue">{level}</Tag> : '-'),
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (description: string) => description || '-',
      },
      {
        title: '公开',
        dataIndex: 'isPublic',
        key: 'isPublic',
        width: 96,
        render: (isPublic: boolean) => (
          <Tag color={isPublic ? 'green' : 'default'}>
            {isPublic ? '公开' : '隐藏'}
          </Tag>
        ),
      },
      {
        title: '排序',
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 96,
        sorter: (a, b) => a.sortOrder - b.sortOrder,
      },
      {
        title: '操作',
        key: 'action',
        width: 144,
        render: (_, record) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => openEditModal(record)}>
              编辑
            </Button>
            <Popconfirm
              title="删除技能"
              description={`确认删除「${record.name}」吗？`}
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
    ],
    [handleDelete, openEditModal],
  )

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {contextHolder}
      <Card
        title={
          <Space direction="vertical" size={2}>
            <Typography.Title level={3} className="!mb-0">
              技能管理
            </Typography.Title>
            <Typography.Text type="secondary">
              管理公开页展示的技能、分类、熟练度与排序。
            </Typography.Text>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={loadSkills} loading={loading}>
              刷新
            </Button>
            <Button type="primary" onClick={openCreateModal}>
              新增技能
            </Button>
          </Space>
        }
      >
        <Table<AdminSkill>
          rowKey="id"
          columns={columns}
          dataSource={skills}
          loading={loading}
          scroll={{ x: 960 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingSkill ? '编辑技能' : '新增技能'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        afterOpenChange={handleAfterOpenChange}
        destroyOnClose
        okText={editingSkill ? '保存' : '新增'}
        cancelText="取消"
      >
        <Form<SkillFormValues>
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ isPublic: true, sortOrder: 0 }}
        >
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入技能名称' }]}>
            <Input maxLength={64} placeholder="例如：React" showCount />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select
              options={SKILL_CATEGORY_OPTIONS}
              placeholder="请选择技能分类"
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="熟练度" name="proficiencyLevel">
            <Select
              options={SKILL_PROFICIENCY_OPTIONS}
              placeholder="请选择熟练度"
              allowClear
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea
              maxLength={512}
              placeholder="补充技能说明"
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber className="w-full" min={0} precision={0} />
          </Form.Item>
          <Form.Item label="是否公开" name="isPublic" valuePropName="checked">
            <Switch checkedChildren="公开" unCheckedChildren="隐藏" />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}
