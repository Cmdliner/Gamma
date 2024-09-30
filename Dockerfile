FROM oven/bun

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

EXPOSE 4000

RUN bun i typescript

CMD ["bun", "run", "--env-file .env", "src/app.ts"]
