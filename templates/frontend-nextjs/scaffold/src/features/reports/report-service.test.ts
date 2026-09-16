import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchReports, runReport } from './report-service';

global.fetch = vi.fn();

describe('report-service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchReports', () => {
    it('returns reports when API call succeeds', async () => {
      const mockReports = [
        { id: '1', name: 'Monthly Sales', description: 'Sales report', createdAt: '2026-09-01' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReports,
      });

      const result = await fetchReports();
      expect(result).toEqual(mockReports);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/reports/definitions');
    });

    it('throws error when API call fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });

      await expect(fetchReports()).rejects.toThrow('Failed to fetch reports');
    });
  });

  describe('runReport', () => {
    it('returns job ID when report run succeeds', async () => {
      const mockResponse = { jobId: 'job-123' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await runReport('report-1');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/reports/run',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reportId: 'report-1' }),
        })
      );
    });
  });
});
