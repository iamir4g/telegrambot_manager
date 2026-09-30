FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm@9 && pnpm install
COPY . .
RUN pnpm prisma:generate && pnpm build

FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm@9
COPY --from=build /app /app
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]
