<script lang="ts">
	import './layout.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnWindowFocus: false,
				retry: 1
			}
		}
	});

	let { children } = $props();
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
</QueryClientProvider>
