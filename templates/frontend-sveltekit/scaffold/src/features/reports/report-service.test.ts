import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchReports, runReport } from './report-service';

describe('fetchReports', () => {
	const mockReports = [
		{
			id: '1',
			name: 'Sales Report',
			description: 'Monthly sales data',
			createdAt: '2026-01-01T00:00:00Z'
		},
		{
			id: '2',
			name: 'User Report',
			description: 'Active users',
			createdAt: '2026-01-02T00:00:00Z'
		}
	];

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should fetch reports successfully', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => mockReports
		} as Response);

		const result = await fetchReports();

		expect(result).toEqual(mockReports);
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reports/definitions'));
	});

	it('should throw error on fetch failure', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 500
		} as Response);

		await expect(fetchReports()).rejects.toThrow('Failed to fetch reports');
	});
});

describe('runReport', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should run report successfully', async () => {
		const mockResponse = { jobId: 'job-123' };

		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse
		} as Response);

		const result = await runReport('report-1');

		expect(result).toEqual(mockResponse);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('/reports/run'),
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reportId: 'report-1' })
			})
		);
	});

	it('should throw error on run failure', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 500
		} as Response);

		await expect(runReport('report-1')).rejects.toThrow('Failed to run report');
	});
});
