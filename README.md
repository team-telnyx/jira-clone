# Jira Clone

A React-based project management application inspired by Jira.

## Features

- Create and edit issues with a modal form
- Issue fields: title, description, status, priority, type, assignee
- Form validation
- Accessible UI with keyboard navigation

## Tech Stack

- React 18 with TypeScript
- Vite for development and build
- Axios for API calls
- ESLint for linting
- Bun for testing

## Getting Started

```bash
bun install
bun run dev
```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run ESLint
- `bun test` - Run tests

## Project Structure

```
src/
├── api/            # API service layer
├── components/     # React components
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
├── utils/          # Utility functions
└── test/           # Test setup and mocks
```
