import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-slate-50 p-8 text-center text-slate-900">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link
        href="/"
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Back to DealFlow360
      </Link>
    </div>
  );
}
