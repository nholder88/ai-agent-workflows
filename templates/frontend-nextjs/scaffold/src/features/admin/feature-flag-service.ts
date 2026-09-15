export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  updatedAt: string;
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/admin/feature-flags`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch feature flags');
  }
  
  return response.json();
}
