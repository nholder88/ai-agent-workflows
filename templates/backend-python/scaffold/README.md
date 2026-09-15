# {{projectName}}

A FastAPI backend service scaffolded with ai-agent-workflows.

## Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Database**: PostgreSQL (via SQLAlchemy)
- **API Documentation**: OpenAPI/Swagger (automatic)
- **Testing**: pytest

## Getting Started

Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

Run the development server:

```bash
python main.py
```

The API will be available at [http://localhost:8000](http://localhost:8000).

API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
src/
├── app.py           # Application factory
├── config.py        # Configuration
└── api/             # API routes
    ├── health.py    # Health check endpoints
    ├── reports.py   # Reports endpoints
    └── admin.py     # Admin endpoints
tests/
├── unit/            # Unit tests
└── e2e/             # E2E API tests
```

## Available Commands

Run development server:
```bash
python main.py
```

Run all tests:
```bash
pytest
```

Run unit tests only:
```bash
pytest -m "not e2e"
```

Run e2e tests:
```bash
pytest -m "e2e or smoke"
```

Run with coverage:
```bash
pytest --cov=src --cov-report=html
```

Format code:
```bash
black src tests
isort src tests
```

Type checking:
```bash
mypy src
```

## Environment Variables

See `.env.example` for required configuration:

- `SERVICE_NAME` - Service name
- `SERVICE_VERSION` - Service version
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ALLOWED_ORIGINS` - Allowed CORS origins
- `LOG_LEVEL` - Logging level

## API Endpoints

### Health

- `GET /health` - Health check
- `GET /health/ready` - Readiness probe

### Reports

- `GET /reports/definitions` - Get report definitions
- `POST /reports/run` - Run a report
- `GET /reports/{jobId}/status` - Get report job status

### Admin

- `GET /admin/feature-flags` - Get feature flags
- `GET /admin/audit` - Get audit logs

## Testing

Unit tests are located in `tests/unit/` and use pytest:

```bash
pytest -m "not e2e"
```

E2E tests verify API endpoints and are located in `tests/e2e/`:

```bash
pytest -m "e2e or smoke"
```

## Learn More

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [pytest Documentation](https://docs.pytest.org/)
