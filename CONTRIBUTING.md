# Contributing to CASAtlas

Thank you for your interest in contributing to CASAtlas! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- pnpm 9+

### Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/vihaanvp/casatlas.git
   cd casatlas
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your environment:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database URL and OAuth credentials.

4. Run database migrations:
   ```bash
   pnpm prisma migrate dev
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── modules/          # Feature modules (auth, experiences, admin, etc.)
├── components/       # Shared UI components
│   ├── ui/           # Base UI components (shadcn-style)
│   ├── layout/       # Layout components (sidebar, header)
│   └── shared/       # Shared feature components
├── hooks/            # React hooks
├── lib/              # Utilities and helpers
├── config/           # Configuration files
└── types/            # TypeScript types
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code patterns in the codebase
- Use Tailwind CSS for styling
- Keep components small and focused

### Commits

- Write clear, descriptive commit messages
- Use conventional commits when possible (e.g., `feat:`, `fix:`, `docs:`)

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm lint` and `pnpm type-check` to verify
4. Run `pnpm test` to ensure tests pass
5. Submit a pull request with a clear description

### Testing

- Write tests for new utilities and services
- Run the full test suite before submitting:
  ```bash
  pnpm test
  ```

## Reporting Issues

- Use the GitHub issue templates for bug reports and feature requests
- Include steps to reproduce for bug reports
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
