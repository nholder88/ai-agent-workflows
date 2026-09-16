export interface Report {
	id: string;
	name: string;
	description: string;
	createdAt: string;
}

export async function fetchReports(): Promise<Report[]> {
	const apiUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: 'http://localhost:5173';
	const baseUrl =
		import.meta.env.PUBLIC_API_BASE_URL || `${apiUrl}/api`;

	const response = await fetch(`${baseUrl}/reports/definitions`);

	if (!response.ok) {
		throw new Error('Failed to fetch reports');
	}

	return response.json();
}

export async function runReport(reportId: string): Promise<{ jobId: string }> {
	const apiUrl =
		typeof window !== 'undefined'
			? window.location.origin
			: 'http://localhost:5173';
	const baseUrl =
		import.meta.env.PUBLIC_API_BASE_URL || `${apiUrl}/api`;

	const response = await fetch(`${baseUrl}/reports/run`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ reportId })
	});

	if (!response.ok) {
		throw new Error('Failed to run report');
	}

	return response.json();
}
