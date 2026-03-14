# Contributing to the Enterprise Boilerplate

First off, thank you for considering contributing to the Organizer Hub project! This document outlines the process for contributing to the repository and the standards we uphold as an engineering team.

## 🌿 Branching Strategy (GitFlow)
We strictly follow a modified GitFlow branching model:

1. **`main`**: The production-ready state. Commits here trigger direct deployment to the AWS CloudFront/ECS stack.
2. **`develop`**: The integration branch. All feature branches merge here first for automated testing.
3. **`feature/<ticket-id>-<description>`**: New features or enhancements (e.g., `feature/ORG-102-add-redis-caching`).
4. **`hotfix/<ticket-id>-<description>`**: Urgent production fixes branching directly off `main`.

## ✅ Definition of Done (DoD)
Before a Pull Request can be merged, it must meet the following criteria:
- **Code Completeness**: The feature matches acceptance criteria precisely.
- **Type Safety**: No `any` types; all interfaces share the `@ddd/shared` library where applicable.
- **Test Coverage**: 
  - Backend: 100% Unit Test coverage via Jest.
  - Frontend: E2E passing via Playwright UI flows.
- **Linting**: 0 warnings or errors from `eslint`. Run `npm run lint` across the Turbo monorepo.
- **Security**: No sensitive data payload exposure; DTOs rigorously validated via `class-validator`.
- **Review**: Approved by at least one Senior Technical Lead.

## 🛠️ Local Development Setup
1. Run `npm install` from the root directory to bootstrap the Turborepo.
2. Copy `.env.example` to `.env` in the `apps/api` folder.
3. Use `npx turbo run dev` from the root to spin up Next.js and NestJS concurrently.

## 📝 Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
- Example: `feat(api): implemented S3 presigned URL uploads`
- Example: `fix(web): corrected z-index on create festival modal`

Happy Coding!
