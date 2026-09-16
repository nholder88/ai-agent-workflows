<script lang="ts">
	import { AppShell, AppBar } from '@skeletonlabs/skeleton-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchFeatureFlags } from '$features/admin/feature-flag-service';

	const flagsQuery = createQuery({
		queryKey: ['feature-flags'],
		queryFn: fetchFeatureFlags
	});
</script>

<svelte:head>
	<title>Feature Flags - {{projectName}}</title>
</svelte:head>

<AppShell>
	{#snippet appBar()}
		<AppBar>
			<svelte:fragment slot="lead">
				<a href="/" class="text-xl font-bold">{{projectName}}</a>
			</svelte:fragment>
		</AppBar>
	{/snippet}

	<div class="container mx-auto p-8">
		<div class="max-w-4xl mx-auto space-y-6">
			<div class="mb-6">
				<a href="/" class="anchor">← Back to home</a>
			</div>

			<h1 class="h1">Feature Flags</h1>

			{#if $flagsQuery.isLoading}
				<div class="card p-4">Loading feature flags...</div>
			{:else if $flagsQuery.error}
				<div class="card variant-ghost-error p-4">
					Error loading feature flags: {$flagsQuery.error.message}
				</div>
			{:else if $flagsQuery.data && $flagsQuery.data.length > 0}
				<div class="space-y-4">
					{#each $flagsQuery.data as flag (flag.key)}
						<div class="card p-4">
							<div class="flex justify-between items-center">
								<div>
									<h2 class="h4">{flag.key}</h2>
									<p class="text-sm text-surface-600-300">{flag.description}</p>
								</div>
								<span
									class="badge {flag.enabled
										? 'variant-filled-success'
										: 'variant-filled-surface'}"
								>
									{flag.enabled ? 'Enabled' : 'Disabled'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card p-4 text-center text-surface-600-300">
					No feature flags configured
				</div>
			{/if}
		</div>
	</div>
</AppShell>
