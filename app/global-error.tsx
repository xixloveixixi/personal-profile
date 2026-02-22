'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4">500</h1>
            <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
            <p className="text-gray-600">
              An unexpected error occurred. Please try again later.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-600 shadow-md shadow-primary-600/30 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

