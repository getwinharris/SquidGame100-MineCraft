FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/server/package.json packages/server/package.json
RUN npm install
COPY . .
RUN npm -w @sg100/shared run build && npm -w @sg100/client run build

FROM nginx:1.27-alpine
COPY --from=build /app/packages/client/dist /usr/share/nginx/html
EXPOSE 80
