# jira-clone

A Jira-like issue tracking backend API.

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

### Issues API

All issue endpoints require JWT authentication via `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:projectId/issues` | Create a new issue |
| GET | `/api/projects/:projectId/issues` | List issues (with pagination and filtering) |
| GET | `/api/projects/:projectId/issues/:issueId` | Get a single issue |
| PUT | `/api/projects/:projectId/issues/:issueId` | Update an issue |
| DELETE | `/api/projects/:projectId/issues/:issueId` | Soft-delete an issue |

### Issue Fields

- `title` (required): Issue title
- `description`: Issue description  
- `status`: backlog | todo | in_progress | done | cancelled
- `priority`: lowest | low | medium | high | highest
- `type` (required): bug | task | story | epic
- `assignee`: User ObjectId

### Query Parameters (GET /issues)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status
- `priority`: Filter by priority
- `type`: Filter by type
- `assignee`: Filter by assignee ID

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```
