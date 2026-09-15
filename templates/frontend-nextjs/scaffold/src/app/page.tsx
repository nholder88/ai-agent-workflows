import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">{{projectName}}</h1>
          <p className="text-lg text-gray-600">
            A Next.js project scaffolded with ai-agent-workflows
          </p>
        </div>

        <nav className="flex flex-col gap-4 p-6 border rounded-lg">
          <Link
            href="/reports"
            className="p-4 border rounded hover:bg-gray-50 transition"
          >
            <h2 className="font-semibold">Reports →</h2>
            <p className="text-sm text-gray-600">View and manage reports</p>
          </Link>
          <Link
            href="/admin/feature-flags"
            className="p-4 border rounded hover:bg-gray-50 transition"
          >
            <h2 className="font-semibold">Admin →</h2>
            <p className="text-sm text-gray-600">Feature flags and audit logs</p>
          </Link>
        </nav>
      </main>
    </div>
  );
}
