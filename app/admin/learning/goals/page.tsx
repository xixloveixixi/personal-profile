'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

import {
  createLearningGoal,
  deleteLearningGoal,
  getLearningGoals,
  updateLearningGoal,
} from '@/lib/api/private'
import type { LearningGoal } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'

export default function LearningGoalsPage() {
  const [form] = Form.useForm()
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LearningGoal | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const loadGoals = useCallback(async () => {
    setLoading(true)
    try {
      setGoals(await getLearningGoals())
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => { void loadGoals() }, [loadGoals])

  const handleAfterOpenChange = useCallback((open: boolean) => {
    if (!open) return
    if (!editing) {
      form.setFieldsValue({ title: '', description: '', goalType: 'skill', priority: 0, deadline: null, status: 'not_started', progressPercent: 0 })
      return
    }
    form.setFieldsValue({
      ...editing,
      deadline: editing.deadline ? dayjs(editing.deadline) : null,
    })
  }, [form, editing])

  const openCreate = useCallback(() => { setEditing(null); setModalOpen(true) }, [])
  const openEdit = useCallback((g: LearningGoal) => { setEditing(g); setModalOpen(true) }, [])
  const closeModal = useCallback(() => { if (!submitting) { setModalOpen(false); setEditing(null); form.resetFields() } }, [form, submitting])

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateLearningGoal(editing.id, payload)
        messageApi.success('目标已更新')
      } else {
        await createLearningGoal(payload)
        messageApi.success('目标已创建')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      await loadGoals()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }, [editing, form, loadGoals, messageApi])

  const handleDelete = useCallback(async (g: LearningGoal) => {
    try {
      await deleteLearningGoal(g.id)
      messageApi.success('目标已删除')
      await loadGoals()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '删除失败')
    }
  }, [loadGoals, messageApi])

  const columns = useMemo<ColumnsType<LearningGoal>>(() => [
    { title: '目标', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'goalType', key: 'goalType', render: (v: string) => <Tag>{v || '-'}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'active' ? 'blue' : 'default'}>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80 },
    { title: '进度', dataIndex: 'progressPercent', key: 'progressPercent', width: 80, render: (v: number) => `${v}%` },
    { title: '截止日期', dataIndex: 'deadline', key: 'deadline', render: (v: string | null) => v || '-' },
    {
      title: '操作', key: 'action', width: 144,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => handleDelete(record)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleDelete, openEdit])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {contextHolder}
      <Card
        title={<Typography.Title level={3} className="!mb-0">学习目标管理</Typography.Title>}
        extra={<Space><Button onClick={loadGoals} loading={loading}>刷新</Button><Button type="primary" onClick={openCreate}>新增目标</Button></Space>}
      >
        <Table<LearningGoal> rowKey="id" columns={columns} dataSource={goals} loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editing ? '编辑目标' : '新增目标'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        afterOpenChange={handleAfterOpenChange}
        destroyOnClose
        okText={editing ? '保存' : '新增'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入目标标题' }]}>
            <Input placeholder="学习目标" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="类型" name="goalType">
            <Select options={[{ value: 'skill', label: '技能' }, { value: 'project', label: '项目' }, { value: 'interview', label: '面试' }]} />
          </Form.Item>
          <Form.Item label="优先级" name="priority">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="截止日期" name="deadline">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={[{ value: 'not_started', label: '未开始' }, { value: 'active', label: '进行中' }, { value: 'completed', label: '已完成' }, { value: 'paused', label: '已暂停' }]} />
          </Form.Item>
          <Form.Item label="进度" name="progressPercent">
            <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  )
}
