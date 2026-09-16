export interface Report {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export async function fetchReports(): Promise<Report[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/reports/definitions`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  
  return response.json();
}

export async function runReport(reportId: string): Promise<{ jobId: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const response = await fetch(`${apiUrl}/reports/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to run report');
  }
  
  return response.json();
}
