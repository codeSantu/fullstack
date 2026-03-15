# Fullstack Turborepo - Tips & Best Practices

This document outlines **best practices** for developing, building, and deploying a fullstack Turborepo project with Doppler, Turso, Railway, and Netlify.

---

## 1️⃣ Environment Management

- Use **Doppler** for all secrets (API keys, DB credentials, tokens).
- Avoid storing secrets in `.env` or Git.
- Load Doppler secrets for **all scripts** with:
```bash
doppler run -- <command>



For production deployments, wrap all steps in a single Doppler session:

doppler run -- bash -c "npx turbo run build && turso db push && railway up --environment production && netlify deploy --prod --dir=apps/web/out"
2️⃣ Turborepo Best Practices

Use pipelines and caching:

Cache outputs like dist/** and .next/** for faster builds.

Example in turbo.json:

"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**", ".next/**"]
}

Selective builds:

npx turbo run build --filter=web
npx turbo run build --filter=api

Always keep dev, lint, and test pipelines separate and cached where possible.

3️⃣ Database (Turso) Best Practices

Push schema changes after building:

turso db diff
turso db push

Test migrations locally before pushing to production.

Store DB credentials in Doppler.

For large projects, consider versioning migration scripts.

4️⃣ Backend (Railway) Deployment Best Practices

Deploy explicitly to the correct environment:

railway up --environment production

Use Doppler for all environment variables.

Build and push before deploying to avoid runtime errors.

For CI/CD, deploy only after successful tests.

5️⃣ Frontend (Netlify) Deployment Best Practices

Build frontend with Turbo or next build first.

Deploy only the output folder:

netlify deploy --prod --dir=apps/web/out

Use Doppler for any API URLs or keys required in the frontend.

For staging vs production, deploy to different branches/environments:

netlify deploy --dir=apps/web/out --branch=staging
6️⃣ Force Redeploy

Sometimes you need to redeploy without changes:

git commit --allow-empty -m "force redeploy"
npm run redeploy:all

Useful for hotfixes, secret updates, or CI/CD triggers.

7️⃣ Clean Environment

Remove cache and node_modules safely:

npm run clean

Helps avoid inconsistent builds, especially after package upgrades or failed builds.

8️⃣ CI/CD Recommendations

Use GitHub Actions or Railway/Netlify pipelines.

Run redeploy:all automatically on main/master push.

Stop deployment if any step fails (set -e).

Optional: Notify team via Slack/Email on deployment success/failure.

9️⃣ Logging & Debugging

Use echo statements in scripts for clear progress logs.

Check Turbo cache hits/misses for optimization.

Capture output from Turso, Railway, and Netlify for auditing.

🔟 General Tips

Keep package.json scripts clean and descriptive.

Use node engine constraints (>=20.19) for consistent environments.

Pin critical dependencies for production stability.

Separate frontend and backend deployments for faster iteration.

Test everything locally before pushing to production.


---

If you want, I can also make a **version 2** of this Markdown file with a **visual flow diagram** showing:

- Turborepo build → Turso → Railway → Netlify  
- Doppler injecting secrets  
- CI/CD trigger points  

This makes it **very easy for a team to follow production-grade deployment steps**.  

Do you want me to create that visual version?