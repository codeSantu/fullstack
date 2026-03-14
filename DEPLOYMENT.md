# Deployment Guide 🚀

This project is a Turborepo monorepo designed to be deployed across multiple platforms.

## 🎨 Frontend: Vercel (`apps/web`)

Vercel is the recommended platform for the Next.js frontend.

1.  **Link Repository**: Import the root of this repository into Vercel.
2.  **Framework Preset**: Select **Next.js**.
3.  **Root Directory**: Set this to `apps/web`.
4.  **Environment Variables**:
    - `NEXT_PUBLIC_API_BASE_URL`: The URL of your deployed Railway API (e.g., `https://api-production.up.railway.app/api`).
5.  **Build Settings**: Vercel should automatically detect Turborepo. If not, use:
    - Build Command: `cd ../.. && npx turbo run build --filter=web`
    - Output Directory: `.next`

## ⚙️ Backend: Railway (`apps/api`)

Railway is excellent for the NestJS API.

1.  **New Project**: Select "Deploy from GitHub repo".
2.  **Root Directory**: Select `apps/api`.
3.  **Environment Variables**:
    - `TURSO_DB_URL`: Your Turso connection string.
    - `TURSO_TOKEN`: Your Turso auth token.
    - `PORT`: `3001` (or whatever the app expects, usually Railway provides this).
    - `JWT_SECRET`: A long random string.
    - `AWS_ACCESS_KEY_ID`: (If using S3).
    - `AWS_SECRET_ACCESS_KEY`: (If using S3).
4.  **Build Command**: Railway should detect the `package.json`. Ensure it runs `npm run build`.
5.  **Start Command**: `npm run start:prod` (or `node dist/main`).

## 🗄️ Database: Turso

Ensure your Turso database has the schema applied before the first API deployment.
```bash
cd apps/api
npx ts-node apply_schema.ts
```

## ⚡ Hyper-speed CI (Turborepo Remote Cache)

To enable "Full Turbo" (zero-second builds for unchanged code) in GitHub Actions:

1.  **Get a Turbo Token**:
    *   If using Vercel, run `npx turbo login` then `npx turbo link`.
    *   Alternatively, use a custom Remote Cache server.
2.  **Add GitHub Secrets**:
    *   `TURBO_TOKEN`: Your access token.
    *   `TURBO_TEAM`: Your team/username.
3.  **Check the Workflow**: The `.github/workflows/ci.yml` is already configured to use these secrets. Your builds will now be significantly faster by sharing cache hits across your team and CI.

## 🔐 Automated Secret Management (Doppler)

We use **Doppler** to sync secrets across local, Vercel, and Railway environments. This ensures a single source of truth.

1.  **Install Doppler CLI**: Follow the [official instructions](https://docs.doppler.com/docs/install-cli).
2.  **Authenticate**: `doppler login`.
3.  **Setup Project**: 
    - Go to Doppler Dashboard and create a project named `organizer-hub`.
    - Create three configs: `dev`, `stg`, and `prd`.
4.  **GitHub Actions Integration**:
    - For automated builds, generate **Service Tokens** for `stg` and `prd` configs in the Doppler dashboard.
    - Add them as GitHub Secrets: `DOPPLER_CONFIG_STG_TOKEN` and `DOPPLER_CONFIG_PRD_TOKEN`.

## 🚀 Automated Deployment

The project is configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automates the entire build and deployment process.

### Required GitHub Secrets

| Secret Name | Platform | Where to find it |
| --- | --- | --- |
| `VERCEL_TOKEN` | Vercel | Account Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel | Run `vercel project ls` or check dashboard |
| `VERCEL_PROJECT_ID` | Vercel | Run `vercel project ls` or check dashboard |
| `RAILWAY_STG_TOKEN` | Railway | Project Settings > Tokens (Staging project) |
| `RAILWAY_PRD_TOKEN` | Railway | Project Settings > Tokens (Production project) |
| `DOPPLER_CONFIG_STG_TOKEN`| Doppler | Doppler Project > `stg` config > Service Tokens |
| `DOPPLER_CONFIG_PRD_TOKEN`| Doppler | Doppler Project > `prd` config > Service Tokens |

### Staging
- **Branch**: `develop`
- **Actions**: Builds using Doppler `stg` config and deploys to Railway (service: `api`) and Vercel.

### Production
- **Branch**: `main` or `master`
- **Actions**: Builds using Doppler `prd` config and deploys to Railway (service: `api`) and Vercel.

## 🛠️ Local Development with Doppler

Instead of managing a local `.env` file manually, run your project via Doppler:
```bash
doppler run -- npx turbo run dev
```
This will inject all secrets directly into the environment variables of your workspaces.
