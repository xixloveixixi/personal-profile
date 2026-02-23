'use client'

import { Avatar } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { Message } from '@ai-sdk/react'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <Avatar
          icon={<RobotOutlined />}
          className="!bg-primary-600 flex-shrink-0"
        />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      {isUser && (
        <Avatar
          icon={<UserOutlined />}
          className="!bg-accent-pink flex-shrink-0"
        />
      )}
    </motion.div>
  )
}

