'use client'

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Avatar, Button, Input, Layout, message } from 'antd'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'

import { useAuthStore } from '@/lib/stores/auth'

const { Sider, Content } = Layout

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const AGENT_BASE = 'http://localhost:8000'

export default function LearningChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const listEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleNewConversation = () => {
    if (sending) return
    setMessages([])
    setConversationId(null)
    setInput('')
  }

  const appendAssistantToken = (token: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      if (last.role !== 'assistant') return prev
      const next = prev.slice(0, -1)
      next.push({ role: 'assistant', content: last.content + token })
      return next
    })
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return

    const token = useAuthStore.getState().token
    if (!token) {
      messageApi.error('未登录，请先登录后再使用 AI 教练')
      return
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ])
    setInput('')
    setSending(true)

    try {
      const response = await fetch(`${AGENT_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload) continue
          try {
            const data = JSON.parse(payload)
            if (data.type === 'token' && typeof data.content === 'string') {
              appendAssistantToken(data.content)
            } else if (data.type === 'done') {
              if (typeof data.conversation_id === 'number') {
                setConversationId(data.conversation_id)
              }
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <Layout style={{ height: 'calc(100vh - 112px)', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
      {contextHolder}
      <Sider
        width={240}
        style={{ background: '#fafafa', padding: 16, borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI 教练</div>
        <Button block onClick={handleNewConversation} disabled={sending}>
          新建对话
        </Button>
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column', padding: 16 }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', marginTop: 80 }}>
              开始与 AI 教练对话吧
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Avatar
                  icon={m.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{
                    backgroundColor: m.role === 'user' ? '#564B60' : '#888',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    maxWidth: '70%',
                    background: '#f0f0f0',
                    color: '#333',
                    padding: '8px 12px',
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.content || (m.role === 'assistant' && sending ? '...' : ' ')}
                </div>
              </div>
            ))
          )}
          <div ref={listEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入消息，Enter 发送，Shift+Enter 换行"
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={sending}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            发送
          </Button>
        </div>
      </Content>
    </Layout>
  )
}
