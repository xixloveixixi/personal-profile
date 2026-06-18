'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import {
  createTask,
  deleteTask,
  getLearningPlans,
  getPlanTasks,
  getTaskProgress,
  logTaskProgress,
  updateTask,
} from '@/lib/api/private'
import type { LearningPlan, LearningTask, LearningProgress } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'

export default function PlanTasksPage() {
  const params = useParams()
  const planId = Number(params.id)

  const [form] = Form.useForm()
  const [progressForm] = Form.useForm()
  const [plan, setPlan] = useState<LearningPlan | null>(null)
  const [tasks, setTasks] = useState<LearningTask[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LearningTask | null>(null)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressTask, setProgressTask] = useState<LearningTask | null>(null)
  const [progressHistory, setProgressHistory] = useState<LearningProgress[]>([])
  const [loadingProgress, setLoadingProgress] = useState(false)
  const [loggingProgress, setLoggingProgress] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const loadData = useCallback(async () => {
    if (!planId) return
    setLoading(true)
    try {
      const [plansData, tasksData] = await Promise.all([
        getLearningPlans(),
        getPlanTasks(planId),
      ])
      setPlan(plansData.find(p => p.id === planId) || null)
      setTasks(tasksData)
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [planId, messageApi])

  useEffect(() => { void loadData() }, [loadData])

  const handleAfterOpenChange = useCallback((open: boolean) => {
    if (!open) return
    if (!editing) {
      form.setFieldsValue({
        title: '',
        description: '',
        taskType: 'learning',
        status: 'pending',
        priority: 0,
        estimatedMinutes: 60,
        dueDate: null,
        sortOrder: tasks.length,
      })
      return
    }
    form.setFieldsValue({
      ...editing,
      dueDate: editing.dueDate ? dayjs(editing.dueDate) : null,
    })
  }, [form, editing, tasks.length])

  const openCreate = useCallback(() => { setEditing(null); setModalOpen(true) }, [])
  const openEdit = useCallback((t: LearningTask) => { setEditing(t); setModalOpen(true) }, [])
  const closeModal = useCallback(() => {
    if (!submitting) {
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
    }
  }, [form, submitting])

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateTask(editing.id, payload)
        messageApi.success('任务已更新')
      } else {
        await createTask(planId, payload)
        messageApi.success('任务已创建')
      }
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '操作失败')
    } finally {
      setSubmitting(false)
    }
  }, [editing, form, planId, loadData, messageApi])

  const handleDelete = useCallback(async (t: LearningTask) => {
    try {
      await deleteTask(t.id)
      messageApi.success('任务已删除')
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '删除失败')
    }
  }, [loadData, messageApi])

  const handleStatusChange = useCallback(async (t: LearningTask, newStatus: string) => {
    try {
      await updateTask(t.id, { status: newStatus })
      messageApi.success('状态已更新')
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '更新失败')
    }
  }, [loadData, messageApi])

  // Progress handlers
  const openProgressModal = useCallback(async (t: LearningTask) => {
    setProgressTask(t)
    setProgressModalOpen(true)
    progressForm.resetFields()
    setLoadingProgress(true)
    try {
      const history = await getTaskProgress(t.id)
      setProgressHistory(history)
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '加载进度失败')
    } finally {
      setLoadingProgress(false)
    }
  }, [progressForm, messageApi])

  const closeProgressModal = useCallback(() => {
    if (!loggingProgress) {
      setProgressModalOpen(false)
      setProgressTask(null)
      setProgressHistory([])
      progressForm.resetFields()
    }
  }, [loggingProgress, progressForm])

  const handleLogProgress = useCallback(async () => {
    if (!progressTask) return
    const values = await progressForm.validateFields()
    setLoggingProgress(true)
    try {
      await logTaskProgress(progressTask.id, {
        minutesSpent: values.minutesSpent,
        note: values.note || '',
      })
      messageApi.success('进度已记录')
      // Refresh progress history
      const history = await getTaskProgress(progressTask.id)
      setProgressHistory(history)
      progressForm.resetFields()
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '记录失败')
    } finally {
      setLoggingProgress(false)
    }
  }, [progressTask, progressForm, loadData, messageApi])

  const columns = useMemo<ColumnsType<LearningTask>>(() => [
    { title: '#', dataIndex: 'sortOrder', key: 'sortOrder', width: 50 },
    { title: '任务', dataIndex: 'title', key: 'title' },
    {
      title: '类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (v: string) => <Tag>{v || '-'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string, record) => (
        <Select
          value={v}
          size="small"
          style={{ width: 100 }}
          onChange={(newStatus) => handleStatusChange(record, newStatus)}
          options={[
            { value: 'pending', label: '待开始' },
            { value: 'in_progress', label: '进行中' },
            { value: 'completed', label: '已完成' },
          ]}
        />
      ),
    },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 70 },
    {
      title: '耗时',
      key: 'time',
      width: 120,
      render: (_, record) => `${record.actualMinutes}/${record.estimatedMinutes} 分钟`,
    },
    { title: '截止', dataIndex: 'dueDate', key: 'dueDate', render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openProgressModal(record)}>记录进度</Button>
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除？"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleDelete, handleStatusChange, openEdit, openProgressModal])

  const completionPercent = plan && plan.totalTasks > 0
    ? Math.round((plan.completedTasks / plan.totalTasks) * 100)
    : 0

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {contextHolder}
      <div className="mb-4">
        <Link href="/admin/learning/plans" className="text-blue-600 hover:underline">
          ← 返回计划列表
        </Link>
      </div>

      {plan && (
        <Card className="mb-6">
          <Descriptions title={<Typography.Title level={4}>{plan.title}</Typography.Title>} column={3}>
            <Descriptions.Item label="状态">
              <Tag color={plan.status === 'active' ? 'green' : plan.status === 'completed' ? 'blue' : 'orange'}>
                {plan.status === 'draft' ? '待开始' : plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : plan.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="来源">
              <Tag color={plan.source === 'ai_generated' ? 'purple' : 'default'}>
                {plan.source === 'ai_generated' ? 'AI 生成' : '手动'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="周期">
              {plan.startDate && plan.endDate ? `${plan.startDate} ~ ${plan.endDate}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="进度" span={3}>
              <Progress percent={completionPercent} format={() => `${plan.completedTasks}/${plan.totalTasks}`} />
            </Descriptions.Item>
            {plan.description && (
              <Descriptions.Item label="描述" span={3}>{plan.description}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      <Card
        title={<Typography.Title level={4} className="!mb-0">任务列表</Typography.Title>}
        extra={
          <Space>
            <Button onClick={loadData} loading={loading}>刷新</Button>
            <Button type="primary" onClick={openCreate}>新增任务</Button>
          </Space>
        }
      >
        <Table<LearningTask>
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          pagination={{ pageSize: 20 }}
          locale={{
            emptyText: '当前计划还没有任务，先新增任务再开始执行。',
          }}
        />
      </Card>

      {/* Create/Edit Task Modal */}
      <Modal
        title={editing ? '编辑任务' : '新增任务'}
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
          <Form.Item label="任务标题" name="title" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="任务标题" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="类型" name="taskType">
            <Select
              options={[
                { value: 'learning', label: '学习' },
                { value: 'practice', label: '练习' },
                { value: 'project', label: '项目' },
                { value: 'review', label: '复习' },
              ]}
            />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={[
                { value: 'pending', label: '待开始' },
                { value: 'in_progress', label: '进行中' },
                { value: 'completed', label: '已完成' },
              ]}
            />
          </Form.Item>
          <Form.Item label="优先级" name="priority">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="预估耗时（分钟）" name="estimatedMinutes">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="截止日期" name="dueDate">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Progress Modal */}
      <Modal
        title={`记录进度 - ${progressTask?.title || ''}`}
        open={progressModalOpen}
        onCancel={closeProgressModal}
        footer={null}
        destroyOnClose
        width={560}
      >
        <div className="space-y-6">
          {/* Log new progress */}
          <Card size="small" title="记录新进度">
            <Form form={progressForm} layout="inline" preserve={false}>
              <Form.Item name="minutesSpent" rules={[{ required: true, message: '请输入耗时' }]}>
                <InputNumber min={1} placeholder="耗时" addonAfter="分钟" />
              </Form.Item>
              <Form.Item name="note" style={{ flex: 1 }}>
                <Input placeholder="学习笔记（可选）" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" loading={loggingProgress} onClick={handleLogProgress}>
                  记录
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* Progress history */}
          <Card size="small" title="进度历史" loading={loadingProgress}>
            {progressHistory.length === 0 ? (
              <Typography.Text type="secondary">暂无进度记录</Typography.Text>
            ) : (
              <Timeline
                items={progressHistory.map(p => ({
                  children: (
                    <div>
                      <div>
                        <strong>{p.minutesSpent} 分钟</strong>
                        <span className="text-gray-400 ml-2">{dayjs(p.loggedAt).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                      {p.note && <div className="text-gray-600">{p.note}</div>}
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </div>
      </Modal>
    </main>
  )
}
