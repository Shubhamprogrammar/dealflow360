'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center text-slate-900">
        <h1 className="text-xl font-semibold">Application error</h1>
        <p className="max-w-md text-sm text-slate-500">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
