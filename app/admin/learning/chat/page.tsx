'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import {
  Avatar,
  Button,
  Empty,
  Layout,
  Popconfirm,
  Skeleton,
  Spin,
  Typography,
  message,
  Input,
} from 'antd'
import {
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'

import {
  deleteAgentConversation,
  getAgentConversationHistory,
  getAgentConversations,
} from '@/lib/api/private'
import type { AgentConversation, AgentHistoryMessage } from '@/lib/api/private'
import { ApiError } from '@/lib/api/client'
import { readAdminAuthCookie, useAuthStore } from '@/lib/stores/auth'

const { Sider, Content } = Layout
const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL ?? 'http://localhost:8000'
const HISTORY_PAGE_SIZE = 100

type ChatMessageStatus = 'idle' | 'sending' | 'streaming' | 'done' | 'error'

interface ChatMessage {
  id: number | string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt?: string
  status?: ChatMessageStatus
  errorMessage?: string
}

const siderStyle: CSSProperties = {
  background: '#fafafa',
  padding: 16,
  borderRight: '1px solid #f0f0f0',
  display: 'flex',
  flexDirection: 'column',
}

function formatConversationTime(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getAuthToken() {
  return useAuthStore.getState().token || readAdminAuthCookie() || ''
}

function normalizeHistoryMessages(messages: AgentHistoryMessage[]): ChatMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
      status: 'done',
    }))
}

function mergeMessagesById(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<number | string>()
  const merged: ChatMessage[] = []

  for (const message of messages) {
    if (seen.has(message.id)) continue
    seen.add(message.id)
    merged.push(message)
  }

  return merged
}

export default function LearningChatPage() {
  const [conversations, setConversations] = useState<AgentConversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false)
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [historyBeforeId, setHistoryBeforeId] = useState<number | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  const listEndRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottomRef = useRef(true)
  const historyRequestIdRef = useRef(0)

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) {
      shouldScrollToBottomRef.current = true
      return
    }

    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const conversationTitleMap = useMemo(() => {
    const map = new Map<number, string>()
    conversations.forEach((item) => map.set(item.id, item.title))
    return map
  }, [conversations])

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true)
    try {
      const data = await getAgentConversations()
      setConversations(data)
    } catch (error) {
      messageApi.error(error instanceof ApiError ? error.message : '加载历史对话失败')
    } finally {
      setLoadingConversations(false)
    }
  }, [messageApi])

  const loadConversationHistory = useCallback(
    async (targetConversationId: number) => {
      const requestId = historyRequestIdRef.current + 1
      historyRequestIdRef.current = requestId

      setLoadingHistory(true)
      shouldScrollToBottomRef.current = true
      setConversationId(targetConversationId)

      try {
        const response = await getAgentConversationHistory(targetConversationId, {
          limit: HISTORY_PAGE_SIZE,
        })

        if (historyRequestIdRef.current !== requestId) {
          return
        }

        const nextMessages = normalizeHistoryMessages(response.messages ?? [])
        setMessages(nextMessages)
        setHistoryHasMore(Boolean(response.hasMore))
        setHistoryBeforeId(response.nextBeforeId ?? null)
      } catch (error) {
        if (historyRequestIdRef.current !== requestId) {
          return
        }
        messageApi.error(error instanceof ApiError ? error.message : '加载历史消息失败')
      } finally {
        if (historyRequestIdRef.current === requestId) {
          setLoadingHistory(false)
        }
      }
    },
    [messageApi],
  )

  const handleLoadEarlierMessages = useCallback(async () => {
    if (!conversationId || !historyHasMore || !historyBeforeId || loadingMoreHistory) {
      return
    }

    setLoadingMoreHistory(true)
    shouldScrollToBottomRef.current = false

    try {
      const response = await getAgentConversationHistory(conversationId, {
        limit: HISTORY_PAGE_SIZE,
        beforeId: historyBeforeId,
      })

      const nextMessages = normalizeHistoryMessages(response.messages ?? [])
      setMessages((prev) => mergeMessagesById([...nextMessages, ...prev]))
      setHistoryHasMore(Boolean(response.hasMore))
      setHistoryBeforeId(response.nextBeforeId ?? null)
    } catch (error) {
      messageApi.error(error instanceof ApiError ? error.message : '加载更早消息失败')
    } finally {
      setLoadingMoreHistory(false)
    }
  }, [conversationId, historyBeforeId, historyHasMore, loadingMoreHistory, messageApi])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  const handleNewConversation = useCallback(() => {
    if (sending) return

    historyRequestIdRef.current += 1
    shouldScrollToBottomRef.current = true
    setMessages([])
    setConversationId(null)
    setHistoryHasMore(false)
    setHistoryBeforeId(null)
    setInput('')
    setLoadingHistory(false)
  }, [sending])

  const updateLastAssistantMessage = useCallback((updater: (message: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      for (let index = prev.length - 1; index >= 0; index -= 1) {
        if (prev[index]?.role !== 'assistant') continue

        const next = prev.slice()
        next[index] = updater(prev[index])
        return next
      }

      return prev
    })
  }, [])

  const appendAssistantToken = useCallback((token: string) => {
    updateLastAssistantMessage((last) => ({
      ...last,
      content: last.content + token,
      status: 'streaming',
      errorMessage: undefined,
    }))
  }, [updateLastAssistantMessage])

  const handleDeleteConversation = useCallback(
    async (targetConversationId: number) => {
      try {
        await deleteAgentConversation(targetConversationId)
        messageApi.success('对话已删除')

        setConversations((prev) => prev.filter((item) => item.id !== targetConversationId))

        if (conversationId === targetConversationId) {
          setConversationId(null)
          setMessages([])
          setHistoryHasMore(false)
          setHistoryBeforeId(null)
        }
      } catch (error) {
        messageApi.error(error instanceof ApiError ? error.message : '删除对话失败')
      }
    },
    [conversationId, messageApi],
  )

  const handleRetryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find((item) => item.role === 'user')
    if (!lastUserMessage?.content || sending) {
      return
    }

    setInput(lastUserMessage.content)
    messageApi.info('已回填上一条消息，可重新发送')
  }, [messageApi, messages, sending])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || sending) return

    const token = getAuthToken()
    if (!token) {
      messageApi.error('未登录，请先登录后再使用 AI 教练')
      return
    }

    const wasNewConversation = conversationId === null

    shouldScrollToBottomRef.current = true
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        status: 'done',
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        status: 'sending',
      },
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
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let nextConversationId = conversationId

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
            const data = JSON.parse(payload) as {
              type?: string
              content?: string
              conversation_id?: number
              id?: string
              name?: string
            }

            if (data.type === 'token' && typeof data.content === 'string') {
              appendAssistantToken(data.content)
            } else if (data.type === 'tool_call' || data.type === 'tool_result') {
              // Tool events remain hidden in the UI; they are consumed to keep the SSE stream healthy.
            } else if (data.type === 'done' && typeof data.conversation_id === 'number') {
              nextConversationId = data.conversation_id
              setConversationId(data.conversation_id)
              updateLastAssistantMessage((last) => ({
                ...last,
                status: 'done',
                errorMessage: undefined,
              }))
            } else if (data.type === 'error' && typeof data.content === 'string') {
              throw new Error(data.content)
            }
          } catch (error) {
            if (error instanceof Error) {
              throw error
            }
          }
        }
      }

      if (wasNewConversation && nextConversationId) {
        await loadConversations()
      } else if (nextConversationId) {
        await loadConversations()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送失败'
      updateLastAssistantMessage((last) => ({
        ...last,
        status: 'error',
        errorMessage,
      }))
      messageApi.error(errorMessage)
    } finally {
      setSending(false)
    }
  }, [appendAssistantToken, conversationId, input, loadConversations, messageApi, sending, updateLastAssistantMessage])

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }, [handleSend])

  const renderMessage = useCallback((item: ChatMessage) => {
    if (item.role === 'tool' || item.role === 'system') {
      return null
    }

    const isUser = item.role === 'user'
    const assistantStatusText =
      item.status === 'sending'
        ? '发送中...'
        : item.status === 'streaming'
          ? '生成中...'
          : item.status === 'error'
            ? item.errorMessage || '发送失败'
            : ''

    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Avatar
          icon={isUser ? <UserOutlined /> : <RobotOutlined />}
          style={{
            backgroundColor: isUser ? '#564B60' : '#888',
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
            whiteSpace: isUser ? 'pre-wrap' : 'normal',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {isUser ? (
            item.content
          ) : item.content ? (
            <div className="chat-markdown">
              <ReactMarkdown>{item.content}</ReactMarkdown>
            </div>
          ) : assistantStatusText ? (
            <Typography.Text type={item.status === 'error' ? 'danger' : 'secondary'}>
              {assistantStatusText}
            </Typography.Text>
          ) : (
            ' '
          )}

          {!isUser && item.status === 'error' ? (
            <div style={{ marginTop: 8 }}>
              <Button size="small" onClick={handleRetryLastMessage} disabled={sending}>
                重试上一条消息
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }, [handleRetryLastMessage, sending])

  return (
    <Layout
      style={{
        height: '100%',
        minHeight: 0,
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {contextHolder}
      <Sider width={280} style={siderStyle}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>AI 教练</div>
        <Button block icon={<PlusOutlined />} onClick={handleNewConversation} disabled={sending}>
          新建对话
        </Button>

        <div style={{ marginTop: 16, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {loadingConversations ? (
            <div style={{ paddingTop: 8 }}>
              <Skeleton active paragraph={{ rows: 6 }} title={false} />
            </div>
          ) : conversations.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史对话" style={{ marginTop: 32 }} />
          ) : (
            conversations.map((item) => {
              const selected = item.id === conversationId

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadConversationHistory(item.id)}
                  disabled={sending || loadingHistory}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: selected ? '1px solid #564B60' : '1px solid #f0f0f0',
                    background: selected ? '#f7f3fb' : '#fff',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#222',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.title || `对话 #${item.id}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                        {formatConversationTime(item.updatedAt)}
                      </div>
                    </div>
                    <Popconfirm
                      title="确认删除该对话吗？"
                      okText="删除"
                      cancelText="取消"
                      onConfirm={(event) => {
                        event?.stopPropagation()
                        return handleDeleteConversation(item.id)
                      }}
                      onPopupClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column', padding: 16, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
          {loadingHistory ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
              <Spin />
            </div>
          ) : (
            <>
              {historyHasMore ? (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <Button onClick={() => void handleLoadEarlierMessages()} loading={loadingMoreHistory}>
                    加载更早消息
                  </Button>
                </div>
              ) : null}

              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', marginTop: 80 }}>
                  <MessageOutlined style={{ fontSize: 24, marginBottom: 12 }} />
                  <div>
                    {conversationId
                      ? `当前对话：${conversationTitleMap.get(conversationId) ?? `#${conversationId}`}`
                      : '开始与 AI 教练对话吧'}
                  </div>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
            </>
          )}
          <div ref={listEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Input.TextArea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="请输入消息，Enter 发送，Shift+Enter 换行"
            autoSize={{ minRows: 2, maxRows: 6 }}
            disabled={sending || loadingHistory}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            onClick={() => void handleSend()}
            loading={sending}
            disabled={!input.trim() || loadingHistory}
            style={{ alignSelf: 'flex-end' }}
          >
            发送
          </Button>
        </div>
        <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
          assistant 回复支持 Markdown 渲染；新对话首次发送成功后会自动出现在左侧历史列表。
        </Typography.Text>
      </Content>
    </Layout>
  )
}
