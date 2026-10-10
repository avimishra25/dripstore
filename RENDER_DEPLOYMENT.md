# Render portfolio demo deployment

This deploys the disposable demo, not the real-payment server.

## Prepared configuration

- Root `Dockerfile`: Node 24, built React frontend, Express API and temporary MongoDB replica set.
- `render.yaml`: Docker web service, free plan, port 10000, readiness check at /api/ready, automatic redeployment disabled.
- Frontend and API share one origin. The build uses /api; no frontend API URL or CORS origin needs to be entered.
- MongoDB binary is downloaded while building the image. Runtime does not require Atlas, Razorpay, Cloudinary, or .env.
- One instance only. Database contents, uploads, accounts and sessions reset on restart/redeploy. Reset demo also affects all visitors.
- Free-plan resource capacity and the Linux container build still need confirmation on Render. No paid plan has been selected.

## Deploy in the signed-in Render browser

1. Commit and push the prepared project to a branch in https://github.com/avimishra25/dripstore.
2. In Render, select **New → Blueprint**, connect that repository, and select the prepared branch.
3. Render reads `render.yaml`. Review that the service is **dripstore-demo**, uses **Docker**, and stays on **Free**.
4. Create the service. No payment/service secrets are needed. Wait for the build and /api/ready health check to pass.
5. Open the HTTPS onrender.com URL provided by Render.

If using **New → Web Service** instead: connect the repository/branch, use repository root, Docker runtime, Dockerfile ./Dockerfile, Free instance, health check /api/ready, PORT=10000 and TRUST_PROXY_HOPS=1. Do not use the ordinary server start command.

## Validate the actual public URL

Run:

```sh
node scripts/check-deployment.js https://YOUR-SERVICE.onrender.com
```

The script is read-only. It verifies HTTPS for non-local targets, readiness, demo flag, direct SPA routes, JS/CSS, product catalog/photos, API 404 and missing-asset 404.

Then check mobile customer checkout, all three simulator outcomes, admin product edit/upload/re-edit, and order Processing → Shipped → Delivered. Refresh a product/admin route directly. Restart the Render service and confirm a fresh catalog and expired old sessions. Do not add a live link to README until these pass.

## Local staging equivalent

```sh
npm run build:demo
npm run start:demo
node scripts/check-deployment.js
```

Open http://localhost:10000. PORT can be changed through the environment.

Docker verification, when Docker Desktop is running:

```sh
docker build -t dripstore-demo .
docker run --rm -p 10000:10000 dripstore-demo
```

Local checks do not confirm Render HTTPS, container resource fit, or a successful cloud deployment.

Sources: [Render web services](https://render.com/docs/web-services), [Blueprint reference](https://render.com/docs/blueprint-spec), [health checks](https://render.com/docs/health-checks).
