<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

### Railway Deployment

This application includes a production-ready Dockerfile optimized for Railway deployment. Railway will automatically detect the Dockerfile and use it for container builds.

#### Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. A Railway project created
3. Your application connected to Railway (via Git repository or Railway CLI)

#### Environment Variables

Configure the following environment variables in your Railway project settings:

**Required:**

- `DISCORD_TOKEN` - Your Discord bot token
- `BOT_API_KEY` - API key for authenticating with the external API

**Optional:**

- `BOT_PORT` - Port for the bot server (default: `3001`)
  - **Note:** Railway assigns a `PORT` environment variable automatically. If you want to use Railway's assigned port, set `BOT_PORT` to match Railway's `PORT` value.
- `API_BASE_URL` - Full URL of the external API (e.g., `https://api.example.com`)
  - Alternative: Use `API_HOST`, `API_PORT`, and `API_PROTOCOL` instead
- `API_HOST` - API hostname (default: `localhost`)
- `API_PORT` - API port (default: `3000` for http, `443` for https)
- `API_PROTOCOL` - API protocol: `http` or `https` (default: `http`)
- `DASHBOARD_URL` - URL of the dashboard (optional)
- `SUPER_USER_ID` - Discord user ID for super user permissions (optional, must be 17-19 digits)
- `NODE_ENV` - Environment: `development`, `production`, or `test` (default: `development`)

#### Deployment Steps

1. **Connect your repository** to Railway (or use Railway CLI to deploy)
2. **Add environment variables** in Railway project settings (Settings → Variables)
3. **Configure port** (if needed):
   - Railway will assign a `PORT` environment variable
   - Either set `BOT_PORT` to match Railway's `PORT`, or configure Railway to use port `3001`
4. **Deploy** - Railway will automatically build and deploy using the Dockerfile

The application will:

- Build using multi-stage Docker build (Node 24-alpine)
- Run as a non-root user for security
- Use production dependencies only in the final image
- Start with `node dist/main`

#### Local Docker Testing

Test the Dockerfile locally before deploying:

**Using pnpm scripts (recommended):**

```bash
# Build and run the container
pnpm docker:start

# Or run individually
pnpm docker:build
pnpm docker:run

# View logs
pnpm docker:logs

# Stop the container
pnpm docker:stop
```

**Manual Docker commands:**

```bash
# Build the image
docker build -t discord-bot .

# Run the container using your .env file
docker run -d --name discord-bot --network league-api_default -p 3001:3001 --env-file .env discord-bot
```

**Important Configuration Differences:**

**Local Docker Setup:**

- The bot container must be on the same Docker network as your API container
- The `docker:run` script automatically connects to `league-api_default` network
- Configure your `.env` file to use the API container name:
  ```bash
  API_BASE_URL=http://league_api:3000
  ```
  Or if your API runs on the host machine (not in Docker):
  ```bash
  API_BASE_URL=http://host.docker.internal:3000
  ```

**Railway Deployment:**

- Use the full Railway service URL for your API:
  ```bash
  API_BASE_URL=https://your-api-service.up.railway.app
  ```
  Or if your API is external:
  ```bash
  API_BASE_URL=https://api.example.com
  ```
- Do not use `localhost` or container names on Railway
- Environment variables are set in Railway's dashboard (Settings → Variables)

**Note:** The `.env` file is excluded from the Docker image (via `.dockerignore`) for security. Use `--env-file .env` to load environment variables from your local `.env` file when testing locally. For Railway deployment, environment variables are provided via Railway's environment variable system.

#### Important Notes

- The application requires the external API to be accessible before it starts (health check on startup)
- Environment variables are read from `process.env` - no `.env` file is needed in the container
- The Dockerfile uses multi-stage builds to minimize final image size
- The application runs as a non-root user (`nodejs`, UID 1001)

### Other Deployment Options

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
