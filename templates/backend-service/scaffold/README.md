# {{projectName}}

A NestJS backend service scaffolded with ai-agent-workflows.

## Stack

- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit + e2e)

## Getting Started

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

Run the development server:

```bash
npm run start:dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

API Documentation: [http://localhost:3001/api](http://localhost:3001/api)

## Project Structure

```
src/
├── main.ts           # Application entry point
├── app.module.ts     # Root module
├── health/           # Health check endpoints
├── reports/          # Reports feature
│   ├── entities/     # TypeORM entities
│   ├── dto/          # Data transfer objects
│   └── ...
└── admin/            # Admin feature
```

## Available Scripts

- `npm run start` - Start application
- `npm run start:dev` - Start in watch mode
- `npm run start:prod` - Start production build
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run tests with coverage

## Environment Variables

See `.env.example` for required configuration:

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `SERVICE_NAME` - Service name for logging
- `SERVICE_VERSION` - Service version

## API Endpoints

### Health

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

### Reports

- `GET /reports/definitions` - Get report definitions
- `POST /reports/run` - Run a report
- `GET /reports/:jobId/status` - Get report job status

### Admin

- `GET /admin/feature-flags` - Get feature flags
- `GET /admin/audit` - Get audit logs

## Testing

Unit tests use Jest and are colocated with source files:

```bash
npm run test:unit
```

E2E tests verify API endpoints:

```bash
npm run test:e2e
```

## Learn More

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Swagger/OpenAPI](https://swagger.io/)
