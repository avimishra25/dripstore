# Disposable portfolio demo: one web service, one temporary local MongoDB.
FROM node:24-bookworm-slim AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build -- --mode demo

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
ENV MONGOMS_DISABLE_POSTINSTALL=1 \
    MONGOMS_DOWNLOAD_DIR=/opt/mongodb-binaries
COPY server/package*.json ./
RUN npm ci --include=dev && node -e "require('mongodb-memory-server-core').MongoBinary.getPath({version:'8.0.17'}).then(console.log)"
COPY server/ ./
COPY --from=client /app/client/build /app/client/build
RUN chown -R node:node /app /opt/mongodb-binaries
ENV NODE_ENV=production PORT=10000
USER node
EXPOSE 10000
CMD ["node", "demo.js", "--hosted"]
