# Jira Clone API

A RESTful API for issue tracking, built with Express.js and TypeScript.

## Features

- CRUD operations for issues
- Auto-generated issue keys (PROJ-1, PROJ-2, etc.)
- Pagination, filtering, and sorting
- Input validation with Zod
- Soft delete support
- Consistent error response format

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### Issues

All issue endpoints are scoped under `/api/projects/:projectId/issues`.

#### List Issues

```
GET /api/projects/:projectId/issues
```

Query Parameters:
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (enum: backlog, todo, in_progress, in_review, done, closed)
- `priority` (enum: lowest, low, medium, high, highest)
- `type` (enum: bug, task, story, epic)
- `assigneeId` (UUID)
- `q` (string, search in title and description)
- `sortBy` (enum: createdAt, updatedAt, priority)
- `sortOrder` (enum: asc, desc)

#### Get Single Issue

```
GET /api/projects/:projectId/issues/:issueId
```

The `:issueId` parameter accepts either a UUID or an issue key (e.g., `PROJ-1`).

#### Create Issue

```
POST /api/projects/:projectId/issues
Content-Type: application/json

{
  "title": "Bug in login",
  "description": "Optional description",
  "type": "bug",
  "status": "backlog",
  "priority": "high",
  "reporterId": "user-uuid",
  "assigneeId": "user-uuid"
}
```

Required fields: `title`, `type`, `reporterId`

#### Update Issue

```
PUT /api/projects/:projectId/issues/:issueId
Content-Type: application/json

{
  "status": "in_progress",
  "assigneeId": null
}
```

All fields are optional. Set `assigneeId` to `null` to unassign.

#### Delete Issue

```
DELETE /api/projects/:projectId/issues/:issueId
```

Returns 204 No Content. Issues are soft-deleted.

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        { "field": "title", "message": "Title is required" }
      ]
    }
  }
}
```

Error codes:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)

## Issue Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID | auto | - | Unique identifier |
| issueKey | string | auto | - | Auto-generated (PROJ-1) |
| title | string | yes | - | 1-255 characters |
| description | string | no | - | Up to 5000 characters |
| status | enum | no | backlog | Issue status |
| priority | enum | no | medium | Issue priority |
| type | enum | yes | - | bug, task, story, epic |
| assigneeId | UUID | no | - | Assigned user |
| reporterId | UUID | yes | - | Reporter user |
| projectId | UUID | auto | - | Parent project |
| createdAt | timestamp | auto | - | Creation time |
| updatedAt | timestamp | auto | - | Last update time |
| deletedAt | timestamp | auto | - | Soft delete time |
