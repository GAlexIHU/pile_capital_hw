import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { api } from "@repo/api/v1";
import { initServer } from "@ts-rest/fastify";
import { generateOpenApi } from "@ts-rest/open-api";
import fastify, { FastifyInstance } from "fastify";
import path from "path";
import { createClient, RedisClientType } from "redis";
import { createPool } from "slonik";
import packageJson from "../package.json";
import { redisServiceFactory } from "./adapters/cache.adapter";
import { Config } from "./config";
import { cacherFactory } from "./framework/cached";
import { getFromContext } from "./framework/context";
import { layzInit } from "./framework/lazy-init";
import { rootLogger } from "./framework/logger";
import { createResultParserInterceptor } from "./framework/slonik-runtime-validator";
import { accountRepositoryFactory } from "./repositories/account.repo";
import { exampleEntityRepositoryFactory } from "./repositories/example-entity.repo";
import { transferRepositoryFactory } from "./repositories/transfer.repo";
import { createTransferRouteHandlerFactory } from "./routes/create-transfer.handler";
import { getExampleEntityRouteHandlerFactory } from "./routes/get-example-entity.handler";
import { getTransferRouteHandlerFactory } from "./routes/get-transfer.handler";
import { searchAccountsRouteHandlerFactory } from "./routes/search-accounts.handler";
import { monetaryCodesServiceFactory } from "./services/monetary-codes.service";
import { createTransferUseCaseFactory } from "./use-cases/create-transfer.use-case";
import { getExampleEntityUseCaseFactory } from "./use-cases/get-example-entity.use-case";
import { getTransferUseCaseFactory } from "./use-cases/get-transfer.use-case";
import { searchAccountsUseCaseFactory } from "./use-cases/search-accounts.use-case";

const s = initServer();

interface App {
  run: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: FastifyInstance<any, any, any, any, any>["server"];
}

export const createApp = (config: Config): App => {
  const redisClient = createClient({
    url: config.redis.url,
  }) as RedisClientType;

  const openapi = generateOpenApi(api, {
    info: {
      title: "API",
      version: packageJson.version,
    },
  });

  const server = fastify({
    logger: rootLogger.child({ module: packageJson.name }),
  });

  const { value: pool, init: initPool } = layzInit(createPool);

  const exampleEntityRepository = exampleEntityRepositoryFactory(pool);

  const transferRepository = transferRepositoryFactory(pool);

  const accountRepository = accountRepositoryFactory(pool);

  const redisService = redisServiceFactory(
    {
      redisClient: redisClient,
    },
    {
      getLogger: () => getFromContext("logger"),
    },
  );

  const monetaryCodesService = monetaryCodesServiceFactory();

  const cache = cacherFactory({
    cacheAdapter: redisService,
    config: {
      ttlSeconds: config.cacheSeconds,
    },
  });

  const router = s.router(api, {
    example: s.router(api.example, {
      get: getExampleEntityRouteHandlerFactory({
        getExampleEntityUseCase: getExampleEntityUseCaseFactory({
          exampleEntityRepo: exampleEntityRepository,
        }),
        cache,
      }),
    }),
    account: s.router(api.account, {
      search: searchAccountsRouteHandlerFactory({
        searchAccountsUseCase: searchAccountsUseCaseFactory({
          accountRepo: accountRepository,
        }),
      }),
    }),
    transfer: s.router(api.transfer, {
      create: createTransferRouteHandlerFactory({
        createTransferUseCase: createTransferUseCaseFactory({
          accountRepo: accountRepository,
          monetaryCodesService: monetaryCodesService,
          pool,
          transferRepo: transferRepository,
        }),
      }),
      get: getTransferRouteHandlerFactory({
        getTransferUseCase: getTransferUseCaseFactory({
          transferRepo: transferRepository,
        }),
      }),
    }),
  });

  async function registerDocumentation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fastifyInstance: FastifyInstance<any, any, any, any, any>,
  ) {
    await fastifyInstance.register(swagger, {
      mode: "static",
      specification: {
        path: "",
        postProcessor: function () {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return openapi as any;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        document: openapi as any,
        baseDir: __dirname,
      },
    });
    await fastifyInstance.register(swaggerUI, {
      routePrefix: "/documentation",
      baseDir: path.resolve(__dirname, "static"),
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: () => openapi,
      transformSpecificationClone: true,
    });
  }

  function setErrorHandler(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fastifyInstance: FastifyInstance<any, any, any, any, any>,
  ) {
    fastifyInstance.setErrorHandler((error, request, reply) => {
      request.log.error(error);
      reply.status(500).send({
        message: "Internal Server Error",
      });
    });
  }

  return {
    run: async () => {
      try {
        await initPool(config.postgres.url, {
          typeParsers: [
            { name: "date", parse: (value) => new Date(value) },
            { name: "int8", parse: (value) => new Number(value).valueOf() },
            { name: "numeric", parse: (value) => new Number(value).valueOf() },
            { name: "timestamp", parse: (value) => new Date(value) },
            { name: "timestamptz", parse: (value) => new Date(value) },
          ],
          interceptors: [createResultParserInterceptor()],
        });
        await redisClient.connect();
        setErrorHandler(server);
        await server.register(cors, {});
        await server.register(s.plugin(router));
        await registerDocumentation(server);
        await server.ready();
        server.listen({ port: config.port, host: "0.0.0.0" });
      } catch (error) {
        server.log.error(error);
        throw error;
      }
    },
    server: server.server,
  };
};
