import { createPool } from "slonik";
import z from "zod";
import accounts from "../seeds/accounts.json";
import { Config, getConfig } from "./config";
import { rootLogger } from "./framework/logger";
import { accountRepositoryFactory } from "./repositories/account.repo";

const rootConfig = getConfig();
const logger = rootLogger.child({ module: "seed" });

async function seed(config: Config) {
  logger.info("Configuring dependencies...");
  const pool = await createPool(config.postgres.url);
  const accountRepo = accountRepositoryFactory(() => pool);

  const accountJsonSchema = z.object({
    id: z.string(),
    IBAN: z.string(),
    balances: z.object({
      available: z.object({
        value: z.number(),
        currency: z.string(),
      }),
    }),
    country: z.string(),
    createdAt: z.coerce.date(),
    name: z.string(),
  });
  logger.info("Seeding database...");
  await accountRepo.insert(
    accounts.data.map((v) => accountJsonSchema.parse(v)),
  );

  logger.info("Database seeded.");
}

seed(rootConfig).catch((error) => {
  logger.error("Failed to seed database.");
  logger.error(error);
  process.exit(1);
});
