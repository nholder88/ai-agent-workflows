'use client';

import Link from 'next/link';
import { useFeatureFlags } from '@/features/admin/use-feature-flags';

export default function FeatureFlagsPage() {
  const { data: flags, isLoading, error } = useFeatureFlags();

  if (isLoading) {
    return <div className="p-8">Loading feature flags...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading feature flags</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-6">Feature Flags</h1>
        <div className="space-y-4">
          {flags && flags.length > 0 ? (
            flags.map((flag) => (
              <div key={flag.key} className="p-4 border rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold">{flag.key}</h2>
                    <p className="text-sm text-gray-600">{flag.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      flag.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No feature flags configured</p>
          )}
        </div>
      </div>
    </div>
  );
}
