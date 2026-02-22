import { GithubOutlined, WechatOutlined } from '@ant-design/icons'

export const GithubIcon = ({ className }: { className?: string }) => (
  <GithubOutlined className={className} style={{ fontSize: '25px', width: '20px', height: '20x' }} />
)
// 微信图标 - 使用 antd 的 WechatOutlined
export const WeChatIcon = ({ className }: { className?: string }) => (
  <WechatOutlined className={className} style={{ fontSize: '24px', width: '20px', height: '20px' }} />
)

// CSDN 图标 - 简单的字母 C
export const CSDNIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">C</text>
  </svg>
)

// 掘金图标 - 使用更美观的图标（简洁的六边形/钻石形状）
export const JuejinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width={24} height={24}>
    <path d="M12 2l8 4.5v9l-8 4.5-8-4.5v-9L12 2zm0 2.25L5.5 7.5v9L12 19.75l6.5-3.25v-9L12 4.25z"/>
    <path d="M12 6l-4 2v8l4 2 4-2V8l-4-2z" fill="currentColor" opacity="0.6"/>
  </svg>
)


// 图标映射表
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  GitHub: GithubIcon,
  WeChat: WeChatIcon,
  微信: WeChatIcon, // 添加中文映射
  CSDN: CSDNIcon,
  掘金: JuejinIcon,
}

