export default function BlogDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 relative z-10">
      <div className="h-10 w-3/4 rounded bg-white/10 animate-pulse mb-6" />
      <div className="flex gap-2 mb-8">
        <div className="h-6 w-16 rounded bg-white/10 animate-pulse" />
        <div className="h-6 w-20 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  )
}






