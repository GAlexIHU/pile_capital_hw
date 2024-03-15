# Pile Capital HW Assignment

The original assignment can be found in `/docs`.

## First Time Setup

> The development environment is abstracted away using [Nix](https://nixos.org/manual/nix/stable/command-ref/nix-shell), but it is completely optional to use. In case you want to use Nix for your local environment, first install Nix, (in case of VSCode also the recommended extensions), and then run `nix-shell` from the terminal.

Alternatively, the list of dependencies:

- Node 20
- Docker (not part of the Nix environment, needs to live on host)

The project uses `pnpm` as its package manager. PnPm is intalled using `corepack`.

> When using the Nix environment, `corepack enable` requires sudo privileges as `/nix/store` is group readonly.

When setting up for the first time:

- Run `pnpm i` to install the dependencies
- Copy `.env.example` to `.env`, `.env.local.example` to `.env.local` and `docker.env.example` to `docker.env` and fill in the required values.
- Set up dependency service with docker compose, run `docker compose --profile dev up -d`
- Migrate the BE database with `docker run -v $(pwd)/apps/backend/migrations:/migrations --network host migrate/migrate -path=/migrations/ -database postgres://user:password@localhost:5432/db?sslmode=disable up` (check backend README for more info)
- Seed the BE database with the initial dataset of `accounts.json` with `pnpm --filter @repo/backend seed`. Seeding is not a resilient operation, it will fail if you run it again.
- To start the apps in development mode with intelligent hot-reloading run `pnpm watch` and `pnpm dev` in separate terminals. Rebuilding is managed via turbotree.
- You can check the API documentation at `http://localhost:3000/documentation`

> NOTE: the FE app is part of the repo wireframe but has no relevant functionality, so please ignore.

## Build and Run

The two apps are dockerised, you can build and run them with the following commands:

```
pnpm i
docker compose --profile localstack up --build -d
```
