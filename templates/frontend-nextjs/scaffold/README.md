# {{projectName}}

A Next.js project scaffolded with ai-agent-workflows.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/               # Next.js App Router pages
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Home page
│   ├── reports/      # Reports feature
│   └── admin/        # Admin feature
├── features/          # Feature modules
│   ├── reports/      # Report services and hooks
│   └── admin/        # Admin services and hooks
└── test/             # Test setup
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:unit` - Run unit tests with Vitest
- `npm run test:e2e` - Run e2e tests with Playwright

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_FEATURE_FLAG_PROVIDER` - Feature flag provider

## Testing

Unit tests use Vitest with React Testing Library. Place test files next to the code they test with `.test.ts` or `.test.tsx` extension.

E2E tests use Playwright. Place test files in `tests/e2e/` with `.spec.ts` extension.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
