# jira-clone

A Jira-like project management application built with Node.js and Express.

## Features

- **Projects API**: Full CRUD operations for project management
  - Create projects with unique keys (e.g., PROJ, SCRUM)
  - List projects with pagination and filtering
  - Update project name and description
  - Delete projects (with ownership validation)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## API Documentation

### Projects API

#### Create Project
```http
POST /api/projects
Authorization: X-User-Id: <user-id>
Content-Type: application/json

{
  "name": "My Project",
  "key": "MYPROJ",
  "description": "Project description"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "MYPROJ",
    "name": "My Project",
    "description": "Project description",
    "ownerId": "user-id",
    "createdAt": "2026-03-04T10:00:00.000Z",
    "updatedAt": "2026-03-04T10:00:00.000Z",
    "links": {
      "self": "/api/projects/MYPROJ",
      "issues": "/api/projects/MYPROJ/issues"
    }
  }
}
```

#### List Projects
```http
GET /api/projects?page=1&limit=20&ownerId=<optional>
```

#### Get Project
```http
GET /api/projects/:key
```

#### Update Project
```http
PATCH /api/projects/:key
Authorization: X-User-Id: <user-id>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Project
```http
DELETE /api/projects/:key
Authorization: X-User-Id: <user-id>
```

### Project Key Rules

- Must start with a letter (A-Z)
- Can contain letters (A-Z) and numbers (0-9)
- Length: 2-10 characters
- Automatically converted to uppercase
- Cannot be changed after creation
- Reserved keys: API, ADMIN, NEW, ALL, NONE, SYSTEM, ROOT

### Error Responses

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "status": 400,
    "errors": [
      { "field": "key", "message": "Specific field error" }
    ]
  }
}
```

## Project Structure

```
src/
├── app.js              # Express app setup
├── index.js            # Server entry point
├── controllers/
│   └── projectController.js
├── middleware/
│   └── auth.js
├── models/
│   └── Project.js
└── routes/
    └── projectRoutes.js
tests/
└── project.test.js
```

## License

MIT
