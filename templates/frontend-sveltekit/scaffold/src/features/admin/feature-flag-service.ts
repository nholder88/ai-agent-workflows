export interface FeatureFlag {
	key: string;
	description: string;
	enabled: boolean;
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
	const apiUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: 'http://localhost:5173';
	const baseUrl =
		import.meta.env.PUBLIC_API_BASE_URL || `${apiUrl}/api`;

	const response = await fetch(`${baseUrl}/admin/feature-flags`);

	if (!response.ok) {
		throw new Error('Failed to fetch feature flags');
	}

	return response.json();
}

export async function toggleFeatureFlag(
	key: string,
	enabled: boolean
): Promise<void> {
	const apiUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: 'http://localhost:5173';
	const baseUrl =
		import.meta.env.PUBLIC_API_BASE_URL || `${apiUrl}/api`;

	const response = await fetch(`${baseUrl}/admin/feature-flags/${key}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ enabled })
	});

	if (!response.ok) {
		throw new Error('Failed to toggle feature flag');
	}
}
