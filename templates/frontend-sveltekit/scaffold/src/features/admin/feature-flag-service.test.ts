import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFeatureFlags, toggleFeatureFlag } from './feature-flag-service';

describe('fetchFeatureFlags', () => {
	const mockFlags = [
		{
			key: 'new-ui',
			description: 'Enable new UI',
			enabled: true
		},
		{
			key: 'beta-features',
			description: 'Beta features',
			enabled: false
		}
	];

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should fetch feature flags successfully', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => mockFlags
		} as Response);

		const result = await fetchFeatureFlags();

		expect(result).toEqual(mockFlags);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('/admin/feature-flags')
		);
	});

	it('should throw error on fetch failure', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 500
		} as Response);

		await expect(fetchFeatureFlags()).rejects.toThrow(
			'Failed to fetch feature flags'
		);
	});
});

describe('toggleFeatureFlag', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should toggle feature flag successfully', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		} as Response);

		await toggleFeatureFlag('new-ui', false);

		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining('/admin/feature-flags/new-ui'),
			expect.objectContaining({
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: false })
			})
		);
	});

	it('should throw error on toggle failure', async () => {
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			status: 500
		} as Response);

		await expect(toggleFeatureFlag('new-ui', false)).rejects.toThrow(
			'Failed to toggle feature flag'
		);
	});
});
