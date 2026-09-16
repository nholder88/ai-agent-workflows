# {{projectName}}

A SvelteKit project scaffolded with ai-agent-workflows.

## Stack

- **Framework**: SvelteKit 2
- **Language**: TypeScript
- **UI Components**: Skeleton UI
- **Styling**: Tailwind CSS 4
- **State Management**: Svelte Stores + TanStack Query
- **Forms**: Zod validation
- **Testing**: Vitest (unit) + Playwright (e2e)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── routes/            # SvelteKit routes
│   ├── +layout.svelte # Root layout with Skeleton
│   ├── +page.svelte   # Home page
│   ├── reports/       # Reports feature
│   └── admin/         # Admin feature
├── features/          # Feature modules
│   ├── reports/       # Report services and stores
│   └── admin/         # Admin services and stores
└── lib/               # Shared utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:e2e` - Run e2e tests with Playwright

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `PUBLIC_APP_NAME` - Application name
- `PUBLIC_API_BASE_URL` - Backend API URL
- `PUBLIC_FEATURE_FLAG_PROVIDER` - Feature flag provider

## Testing

Unit tests use Vitest with Svelte Testing Library. Place test files next to the code they test with `.test.ts` or `.test.ts` extension.

E2E tests use Playwright. Place test files in `tests/e2e/` with `.spec.ts` extension.

## Learn More

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Skeleton UI](https://www.skeleton.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
