FROM oven/bun

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install

COPY . .

EXPOSE 4000

RUN bun add -g pm2

RUN bun i typescript

CMD ["pm2", "runtime", "ecosystem.config.js"]
