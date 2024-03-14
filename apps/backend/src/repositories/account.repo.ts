import { DatabasePool, sql } from "slonik";
// import z from "zod";
import { Account } from "../entities/account.entity";
import { Lazy } from "../types/lazy";
import { InsertableRepository } from "./repository";

// const rowSchema = z.object({
//   id: z.string(),
//   iban: z.string(),
//   balances: z.object({
//     available: z.object({
//       value: z.number(),
//       currency: z.string(),
//     }),
//   }),
//   country: z.string(),
//   createdAt: z.date(),
//   name: z.string(),
// });

export interface AccountRepository extends InsertableRepository<Account> {}

export const accountRepositoryFactory = (
  getPool: Lazy<DatabasePool, true>,
): AccountRepository => ({
  async insert(accounts) {
    await getPool().query(sql.unsafe`
      INSERT INTO accounts (id, iban, balances, country, created_at, name)
      SELECT *
      FROM ${sql.unnest(
        accounts.map((account): string[] => [
          account.id,
          account.IBAN,
          JSON.stringify(account.balances),
          account.country,
          account.createdAt.toISOString(),
          account.name,
        ]),
        ["uuid", "text", "jsonb", "text", "timestamptz", "text"],
      )}
    `);
  },
});
