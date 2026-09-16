<script lang="ts">
	import { AppShell, AppBar } from '@skeletonlabs/skeleton-svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import { fetchReports } from '$features/reports/report-service';

	const reportsQuery = createQuery({
		queryKey: ['reports'],
		queryFn: fetchReports
	});
</script>

<svelte:head>
	<title>Reports - {{projectName}}</title>
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

			<h1 class="h1">Reports</h1>

			{#if $reportsQuery.isLoading}
				<div class="card p-4">Loading reports...</div>
			{:else if $reportsQuery.error}
				<div class="card variant-ghost-error p-4">
					Error loading reports: {$reportsQuery.error.message}
				</div>
			{:else if $reportsQuery.data && $reportsQuery.data.length > 0}
				<div class="space-y-4">
					{#each $reportsQuery.data as report (report.id)}
						<div class="card p-4">
							<h2 class="h4">{report.name}</h2>
							<p class="text-sm text-surface-600-300">{report.description}</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card p-4 text-center text-surface-600-300">
					No reports available
				</div>
			{/if}
		</div>
	</div>
</AppShell>
