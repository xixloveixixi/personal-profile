'use client'

import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Switch, Space, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { AdminProject, AdminProjectPayload } from '@/lib/api/admin'
import { getAdminProjects, createAdminProject, updateAdminProject, deleteAdminProject } from '@/lib/api/admin'

const { TextArea } = Input

interface ProjectFormValues {
  slug: string
  title: string
  shortDescription?: string
  longDescription?: string
  problem?: string
  solution?: string
  challenges?: string
  results?: string
  technologies: string
  githubUrl?: string
  demoUrl?: string
  featuredImage?: string
  gallery: string
  publishedAt?: string
  featured: boolean
  isPublic: boolean
  sortOrder: number
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null)
  const [form] = Form.useForm<ProjectFormValues>()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const data = await getAdminProjects()
      setProjects(data)
    } catch {
      message.error('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (project?: AdminProject) => {
    if (project) {
      setEditingProject(project)
      form.setFieldsValue({
        slug: project.slug,
        title: project.title,
        shortDescription: project.shortDescription,
        longDescription: project.longDescription,
        problem: project.problem,
        solution: project.solution,
        challenges: project.challenges,
        results: project.results,
        technologies: project.technologies.join(', '),
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        featuredImage: project.featuredImage,
        gallery: project.gallery.join(', '),
        publishedAt: project.publishedAt || '',
        featured: project.featured,
        isPublic: project.isPublic,
        sortOrder: project.sortOrder,
      })
    } else {
      setEditingProject(null)
      form.resetFields()
      form.setFieldsValue({
        featured: false,
        isPublic: true,
        sortOrder: 0,
        technologies: '',
        gallery: '',
      })
    }
    setModalVisible(true)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingProject(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      const technologiesArray = values.technologies
        ? values.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []
      const galleryArray = values.gallery
        ? values.gallery.split(',').map((g: string) => g.trim()).filter(Boolean)
        : []

      const payload: AdminProjectPayload = {
        slug: values.slug,
        title: values.title,
        shortDescription: values.shortDescription || undefined,
        longDescription: values.longDescription || undefined,
        problem: values.problem || undefined,
        solution: values.solution || undefined,
        challenges: values.challenges || undefined,
        results: values.results || undefined,
        technologies: technologiesArray,
        githubUrl: values.githubUrl || undefined,
        demoUrl: values.demoUrl || undefined,
        featuredImage: values.featuredImage || undefined,
        gallery: galleryArray,
        publishedAt: values.publishedAt || undefined,
        featured: values.featured,
        isPublic: values.isPublic,
        sortOrder: values.sortOrder,
      }

      if (editingProject) {
        await updateAdminProject(editingProject.id, payload)
        message.success('更新成功')
      } else {
        await createAdminProject(payload)
        message.success('创建成功')
      }

      handleCloseModal()
      fetchProjects()
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAdminProject(id)
      message.success('删除成功')
      fetchProjects()
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 150,
    },
    {
      title: '技术栈',
      dataIndex: 'technologies',
      key: 'technologies',
      width: 200,
      ellipsis: true,
      render: (techs: string[]) => techs.slice(0, 3).join(', ') + (techs.length > 3 ? '...' : ''),
    },
    {
      title: '精选',
      dataIndex: 'featured',
      key: 'featured',
      width: 80,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '公开',
      dataIndex: 'isPublic',
      key: 'isPublic',
      width: 80,
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: unknown, record: AdminProject) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新增项目
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: '请输入 URL slug' }]}
          >
            <Input placeholder="如: my-project" />
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入项目标题' }]}
          >
            <Input placeholder="项目标题" />
          </Form.Item>

          <Form.Item name="shortDescription" label="简短描述">
            <TextArea rows={2} placeholder="简短描述，用于列表展示" />
          </Form.Item>

          <Form.Item name="longDescription" label="详细介绍">
            <TextArea rows={4} placeholder="项目详细介绍" />
          </Form.Item>

          <Form.Item name="problem" label="问题背景">
            <TextArea rows={3} placeholder="解决的问题或背景" />
          </Form.Item>

          <Form.Item name="solution" label="解决方案">
            <TextArea rows={3} placeholder="解决方案描述" />
          </Form.Item>

          <Form.Item name="challenges" label="挑战">
            <TextArea rows={2} placeholder="遇到的挑战（可选）" />
          </Form.Item>

          <Form.Item name="results" label="成果">
            <TextArea rows={2} placeholder="项目成果（可选）" />
          </Form.Item>

          <Form.Item name="technologies" label="技术栈（逗号分隔）">
            <Input placeholder="React, TypeScript, Node.js" />
          </Form.Item>

          <Form.Item name="githubUrl" label="GitHub URL">
            <Input placeholder="https://github.com/..." />
          </Form.Item>

          <Form.Item name="demoUrl" label="Demo URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="featuredImage" label="封面图路径">
            <Input placeholder="/images/..." />
          </Form.Item>

          <Form.Item name="gallery" label="图库路径（逗号分隔）">
            <Input placeholder="/images/1.png, /images/2.png" />
          </Form.Item>

          <Form.Item name="publishedAt" label="发布日期">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Space>
            <Form.Item name="featured" valuePropName="checked" noStyle>
              <Switch checkedChildren="精选" unCheckedChildren="非精选" />
            </Form.Item>
            <Form.Item name="isPublic" valuePropName="checked" noStyle>
              <Switch checkedChildren="公开" unCheckedChildren="私密" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}