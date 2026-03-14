# Pull Request & Code Review Standards

Every Pull Request submitted to either `develop` or `main` requires a thorough peer review. This document serves as the Technical Lead's baseline checklist to govern review procedures and guarantee product stability.

## 🔍 Code Review Expectations (Reviewers)
When assigned to a PR, evaluate the payload using the following lenses:

### 1. Architecture & DDD Compliance
- [ ] Are Domain and Application layers strictly separated?
- [ ] Is Domain logic (Entities/Value Objects) free from Infrastructure details (e.g., Prisma syntax, Redis)?
- [ ] Do DTO interfaces reside exclusively in the `@ddd/shared` monorepo library?
- [ ] Are Controllers purely delegating to the `CommandBus` or `QueryBus` with zero raw business logic?

### 2. Security & Performance
- [ ] Are new Endpoints wrapped via `ThrottlerGuard` to prevent abuse?
- [ ] Are Database operations executing paginated where applicable?
- [ ] Are Redis Caching TTL constraints correctly scoped via `CacheInterceptor` on read-heavy routes?
- [ ] Are S3 Upload operations utilizing Presigned URLs vs routing base64 through the NestJS process?
- [ ] Are there raw SQL injections or ORM `queryRaw` misuses?

### 3. Stability & Observability
- [ ] Has Winston Logging been applied to new controllers/handlers?
- [ ] Does the `catch` block correctly bubble errors to the `AllExceptionsFilter` for uniform CloudWatch extraction?
- [ ] Are Jest coverage markers maintained? Run `npm run test:cov` locally.
- [ ] Are unused imports, variables, and console.logs scrubbed?

## 📝 Pull Request Template (Authors)
*Authors must prepend this template to their PR description.*

```markdown
## 🎫 Ticket
[Link to Jira/Linear Ticket]

## 🛠 Description
Briefly explain the intent of the branch.

## 🧪 Testing Performed
- [ ] Local API Unit Tests Pass.
- [ ] UI Headless tests verified.
- [ ] Built via `npx turbo run build` with no TS errors.

## 🚨 Breaking Changes?
- [ ] No
- [ ] Yes (Describe impact and migration strategy below).
```

### Review Resolution
- Reviewers use GitHub "Draft" mode for initial sweeps.
- Use "Request Changes" to block merges with mandatory criteria listed.
- Once criteria are met, "Approve" and the PR Author executes the squash-and-merge.
