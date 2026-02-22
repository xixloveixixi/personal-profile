'use client'

import Image from 'next/image'
import { LinkOutlined } from '@ant-design/icons'
import { iconMap } from '@/components/icons/SocialIcons'
import { Typography, Space, Tag, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import contactData from '@/content/about/contact.json'
import LightRays from '@/components/background/LightRays'

const { Title, Paragraph, Text } = Typography

export default function Home() {
  const [contactLinks, setContactLinks] = useState<any[]>([])

  useEffect(() => {
    // 直接使用导入的 JSON 数据
    setContactLinks(contactData || [])
  }, [])

  return (
    <div className="relative h-[100vh] w-[100%] flex flex-col">
      {/* React Bits 光线效果背景 - 仅在首页显示 */}
      <div className="fixed inset-0 -z-10">
        <LightRays
          raysOrigin="top-center"
          raysColor="#cca8df"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={4}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          className="custom-rays"
          pulsating={false}
          fadeDistance={3}
          saturation={1}
        />
      </div>

      {/* 内容区域 - 全局居中 */}
      <div className="flex items-center justify-center">
        <div className="text-center px-4 w-full max-w-2xl mx-auto animate-fade-in mt-[15%]">
          {/* 名字 */}
          <Title
            level={1}
            className="!text-4xl md:!text-4xl lg:!text-4xl !font-bold !mb-4 !text-white"
          >
            Hi，我是阿菥
          </Title>

          {/* 角色描述 */}
          <Space direction="vertical" size="middle" className="mb-8 w-full">
            <Paragraph className="!text-lg md:!text-xl !text-gray-200 !mb-0">
              ISFJ ｜ 逛公园爱好者 ｜ 喜欢旅游 ｜ 爱追综艺 ｜ 享受生活
            </Paragraph>

            <Text className="!text-base md:!text-lg !text-gray-300">
              正在努力成为前端Agent工程师！！！
            </Text>
          </Space>
        </div>
      </div>

        <div className="flex justify-center">
          <Space size="large" className="flex justify-center">
            {contactLinks.map((contact) => {
              const IconComponent =
                iconMap[contact.platform] ||
                iconMap[contact.icon] ||
                iconMap[contact.icon.charAt(0).toUpperCase() + contact.icon.slice(1)] ||
                LinkOutlined

              // 微信显示电话号码，其他显示平台名称
              const tooltipText = contact.platform === '微信' || contact.platform === 'WeChat' ? '18723832290' : (contact.label || contact.platform)

              return (
                <Tooltip key={contact.platform} title={tooltipText} placement="top">
                  <a
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-200 hover:text-white transition-all duration-300 hover:scale-125 active:scale-95 cursor-pointer inline-flex items-center justify-center w-6 h-6"
                    aria-label={contact.label || contact.platform}
                  >
                    <IconComponent className="w-6 h-6" />
                  </a>
                </Tooltip>
              )
            })}
          </Space>
        </div>
    </div>
  )
}
