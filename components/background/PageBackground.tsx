'use client'

export default function PageBackground() {
  return (
    <>
      {/* 全屏背景 - 黑色背景 */}
      <div className="fixed inset-0 bg-black -z-10"></div>

      {/* 光泽层 - 添加光泽效果和动画 */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(124,58,206,0.3),transparent_60%)] animate-radial-glow -z-10" style={{ animationDelay: '2s' }}></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)] animate-glow-pulse -z-10" style={{ animationDelay: '1s' }}></div>
    </>
  )
}

