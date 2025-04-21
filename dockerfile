FROM node:23-slim AS node-base


FROM node-base AS install

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci


FROM node-base AS build

WORKDIR /app

COPY . .

COPY --from=install /app/node_modules node_modules

RUN npm run build


FROM node-base

WORKDIR /app

COPY --from=install /app/node_modules node_modules

COPY --from=build /app/dist dist

CMD ["node", "./dist/index.js"]
