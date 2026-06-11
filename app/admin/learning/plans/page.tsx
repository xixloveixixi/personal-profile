'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Link from 'next/link'

import {
  createLearningPlan,
  createTask,
  deleteLearningPlan,
  generateLearningPlan,
  getLearningGoals,
  getLearningPlans,
  updateLearningPlan,
} from '@/lib/api/private'
import type { LearningGoal, LearningPlan, GeneratedPlan } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'

export default function LearningPlansPage() {
  const [form] = Form.useForm()
  const [generateForm] = Form.useForm()
  const [plans, setPlans] = useState<LearningPlan[]>([])
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LearningPlan | null>(null)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null)
  const [savingGenerated, setSavingGenerated] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansData, goalsData] = await Promise.all([
        getLearningPlans(),
        getLearningGoals(),
      ])
      setPlans(plansData)
      setGoals(goalsData)
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  useEffect(() => { void loadData() }, [loadData])

  const handleAfterOpenChange = useCallback((open: boolean) => {
    if (!open) return
    if (!editing) {
      form.setFieldsValue({
        title: '',
        description: '',
        goalId: null,
        source: 'manual',
        status: 'draft',
        startDate: null,
        endDate: null,
      })
      return
    }
    form.setFieldsValue({
      ...editing,
      startDate: editing.startDate ? dayjs(editing.startDate) : null,
      endDate: editing.endDate ? dayjs(editing.endDate) : null,
    })
  }, [form, editing])

  const openCreate = useCallback(() => { setEditing(null); setModalOpen(true) }, [])
  const openEdit = useCallback((p: LearningPlan) => { setEditing(p); setModalOpen(true) }, [])
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
      startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
      endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
    }
    setSubmitting(true)
    try {
      if (editing) {
        await updateLearningPlan(editing.id, payload)
        messageApi.success('计划已更新')
      } else {
        await createLearningPlan(payload)
        messageApi.success('计划已创建')
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
  }, [editing, form, loadData, messageApi])

  const handleDelete = useCallback(async (p: LearningPlan) => {
    try {
      await deleteLearningPlan(p.id)
      messageApi.success('计划已删除')
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '删除失败')
    }
  }, [loadData, messageApi])

  // AI Generate handlers
  const openGenerateModal = useCallback(() => {
    setGeneratedPlan(null)
    generateForm.resetFields()
    setGenerateModalOpen(true)
  }, [generateForm])

  const closeGenerateModal = useCallback(() => {
    if (!generating && !savingGenerated) {
      setGenerateModalOpen(false)
      setGeneratedPlan(null)
      generateForm.resetFields()
    }
  }, [generating, savingGenerated, generateForm])

  const handleGenerate = useCallback(async () => {
    const values = await generateForm.validateFields()
    setGenerating(true)
    try {
      const result = await generateLearningPlan(values.goalId, values.preferences)
      setGeneratedPlan(result)
      messageApi.success('AI 计划生成成功，请确认后保存')
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }, [generateForm, messageApi])

  const handleSaveGeneratedPlan = useCallback(async () => {
    if (!generatedPlan) return
    const goalId = generateForm.getFieldValue('goalId')
    setSavingGenerated(true)
    try {
      // 1. Create plan
      const newPlan = await createLearningPlan({
        goalId,
        title: generatedPlan.plan.title,
        description: generatedPlan.plan.description,
        source: 'ai_generated',
        status: 'draft',
        startDate: generatedPlan.plan.startDate,
        endDate: generatedPlan.plan.endDate,
      })
      // 2. Create tasks
      for (const task of generatedPlan.tasks) {
        await createTask(newPlan.id, task)
      }
      messageApi.success('计划已保存')
      setGenerateModalOpen(false)
      setGeneratedPlan(null)
      generateForm.resetFields()
      await loadData()
    } catch (e) {
      messageApi.error(e instanceof ApiError ? e.message : '保存失败')
    } finally {
      setSavingGenerated(false)
    }
  }, [generatedPlan, generateForm, loadData, messageApi])

  const goalMap = useMemo(() => {
    const map = new Map<number, LearningGoal>()
    goals.forEach(g => map.set(g.id, g))
    return map
  }, [goals])

  const columns = useMemo<ColumnsType<LearningPlan>>(() => [
    {
      title: '计划名称',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, record) => (
        <Link href={`/admin/learning/plans/${record.id}`} className="text-blue-600 hover:underline">
          {v}
        </Link>
      ),
    },
    {
      title: '关联目标',
      dataIndex: 'goalId',
      key: 'goalId',
      render: (v: number | null) => v ? (goalMap.get(v)?.title || `#${v}`) : '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      render: (v: string) => <Tag color={v === 'ai_generated' ? 'purple' : 'default'}>{v === 'ai_generated' ? 'AI 生成' : '手动'}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : v === 'completed' ? 'blue' : v === 'archived' ? 'default' : 'orange'}>
          {v === 'draft' ? '草稿' : v === 'active' ? '进行中' : v === 'completed' ? '已完成' : v === 'archived' ? '已归档' : v}
        </Tag>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <Progress
          percent={record.totalTasks > 0 ? Math.round((record.completedTasks / record.totalTasks) * 100) : 0}
          size="small"
          format={() => `${record.completedTasks}/${record.totalTasks}`}
        />
      ),
    },
    {
      title: '周期',
      key: 'period',
      render: (_, record) => (record.startDate && record.endDate) ? `${record.startDate} ~ ${record.endDate}` : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 144,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除？"
            description="关联的任务也将被删除"
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
  ], [goalMap, handleDelete, openEdit])

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      {contextHolder}
      <Card
        title={<Typography.Title level={3} className="!mb-0">学习计划管理</Typography.Title>}
        extra={
          <Space>
            <Button onClick={loadData} loading={loading}>刷新</Button>
            <Button onClick={openGenerateModal}>AI 生成计划</Button>
            <Button type="primary" onClick={openCreate}>新增计划</Button>
          </Space>
        }
      >
        <Table<LearningPlan>
          rowKey="id"
          columns={columns}
          dataSource={plans}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? '编辑计划' : '新增计划'}
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
          <Form.Item label="计划标题" name="title" rules={[{ required: true, message: '请输入计划标题' }]}>
            <Input placeholder="学习计划标题" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item label="关联目标" name="goalId">
            <Select
              allowClear
              placeholder="选择学习目标（可选）"
              options={goals.map(g => ({ value: g.id, label: g.title }))}
            />
          </Form.Item>
          <Form.Item label="来源" name="source">
            <Select options={[{ value: 'manual', label: '手动' }, { value: 'ai_generated', label: 'AI 生成' }]} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select
              options={[
                { value: 'draft', label: '草稿' },
                { value: 'active', label: '进行中' },
                { value: 'completed', label: '已完成' },
                { value: 'archived', label: '已归档' },
              ]}
            />
          </Form.Item>
          <Form.Item label="开始日期" name="startDate">
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item label="结束日期" name="endDate">
            <DatePicker className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      {/* AI Generate Modal */}
      <Modal
        title="AI 生成学习计划"
        open={generateModalOpen}
        onCancel={closeGenerateModal}
        footer={
          generatedPlan ? (
            <Space>
              <Button onClick={() => setGeneratedPlan(null)}>重新生成</Button>
              <Button type="primary" loading={savingGenerated} onClick={handleSaveGeneratedPlan}>
                确认保存
              </Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={closeGenerateModal}>取消</Button>
              <Button type="primary" loading={generating} onClick={handleGenerate}>
                生成计划
              </Button>
            </Space>
          )
        }
        destroyOnClose
        width={640}
      >
        {!generatedPlan ? (
          <Spin spinning={generating}>
            <Form form={generateForm} layout="vertical" preserve={false}>
              <Form.Item
                label="选择学习目标"
                name="goalId"
                rules={[{ required: true, message: '请选择学习目标' }]}
              >
                <Select
                  placeholder="选择一个学习目标"
                  options={goals.map(g => ({ value: g.id, label: g.title }))}
                />
              </Form.Item>
              <Form.Item label="额外偏好（可选）" name="preferences">
                <Input.TextArea
                  placeholder="例如：每天学习 1 小时、偏好视频教程..."
                  autoSize={{ minRows: 2, maxRows: 4 }}
                />
              </Form.Item>
            </Form>
          </Spin>
        ) : (
          <div className="space-y-4">
            <Card size="small" title="生成的计划">
              <p><strong>标题：</strong>{generatedPlan.plan.title}</p>
              <p><strong>描述：</strong>{generatedPlan.plan.description}</p>
              <p><strong>周期：</strong>{generatedPlan.plan.startDate} ~ {generatedPlan.plan.endDate}</p>
            </Card>
            <Card size="small" title={`生成的任务（${generatedPlan.tasks.length} 个）`}>
              <ul className="list-disc pl-5 space-y-1">
                {generatedPlan.tasks.map((t, i) => (
                  <li key={i}>
                    <strong>{t.title}</strong> ({t.estimatedMinutes} 分钟)
                    {t.description && <p className="text-gray-500 text-sm">{t.description}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Modal>
    </main>
  )
}
