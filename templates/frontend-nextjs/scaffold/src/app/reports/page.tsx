'use client';

import { useReports } from '@/features/reports/use-reports';
import Link from 'next/link';

export default function ReportsPage() {
  const { data: reports, isLoading, error } = useReports();

  if (isLoading) {
    return <div className="p-8">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading reports</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <div className="space-y-4">
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="p-4 border rounded">
                <h2 className="font-semibold">{report.name}</h2>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No reports available</p>
          )}
        </div>
      </div>
    </div>
  );
}
