import { DatabaseConnection, sql } from "slonik";
import z from "zod";
import { Account } from "../entities/account.entity";
import { Lazy } from "../types/lazy";
import {
  GettableRepository,
  InsertableRepository,
  TransactableRepository,
} from "./repository";

const DEFAULT_PAGE_SIZE = 10;

const rowSchema = z.object({
  id: z.string(),
  iban: z.string(),
  balances: z.object({
    available: z.object({
      value: z.number(),
      currency: z.string(),
    }),
  }),
  country: z.string(),
  created_at: z.coerce.date(),
  name: z.string(),
});

export interface AccountRepository
  extends TransactableRepository,
    InsertableRepository<Account>,
    GettableRepository<Account> {
  changeBalance: (id: string, change: number) => Promise<void>;
  search: (params: {
    IBAN?: string;
    minBalance?: number;
    maxBalance?: number;
    page?: number;
    pageSize?: number;
  }) => Promise<{ count: number; results: Account[] }>;
}

export const accountRepositoryFactory = (
  getConnection: Lazy<DatabaseConnection, true>,
): AccountRepository => ({
  transacting(connection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return accountRepositoryFactory(() => connection) as unknown as any;
  },
  async get(id) {
    const queryResult = await getConnection().query(
      sql.type(rowSchema)`SELECT * FROM accounts WHERE id = ${id}`,
    );

    return queryResult.rows[0] ? rowToAccount(queryResult.rows[0]) : null;
  },
  async changeBalance(id, change) {
    const query = sql.unsafe`
      UPDATE accounts
      SET balances = balances || jsonb_build_object('available', jsonb_build_object('value', (balances->'available'->>'value')::numeric + ${change.toString()}::numeric, 'currency', balances->'available'->>'currency'))
      WHERE id = ${id}
    `;
    await getConnection().query(query);
  },
  async search({
    IBAN,
    minBalance,
    maxBalance,
    page,
    pageSize = DEFAULT_PAGE_SIZE,
  }) {
    const filterQueries = [
      IBAN ? sql.unsafe`iban = ${IBAN}` : null,
      minBalance
        ? sql.unsafe`balances->'available'->>'value' >= ${minBalance}`
        : null,
      maxBalance
        ? sql.unsafe`balances->'available'->>'value' <= ${maxBalance}`
        : null,
    ].filter(notEmpty);

    const { rows } = await getConnection().query(sql.type(
      z.object({
        items: z.array(rowSchema),
        count: z.coerce.number(),
      }),
    )`
      WITH filtered AS (
        SELECT
          id,
          iban,
          balances,
          country,
          created_at,
          name
        FROM accounts
        WHERE ${sql.join(filterQueries, sql.unsafe` AND `)}
      ), counted AS (
        SELECT COUNT(*) FROM filtered
      ), paginated AS (
        SELECT * FROM filtered
        LIMIT ${pageSize} OFFSET ${pageSize * (page ? page - 1 : 0)}
      ), aggregated AS (
        SELECT
          COALESCE(jsonb_agg(paginated), '[]') as items
        FROM paginated
      )
      SELECT
        items,
        count
      FROM aggregated, counted
    `);

    const { items, count } = rows[0]!;

    return {
      count,
      results: items.map(rowToAccount),
    };
  },
  async insert(accounts) {
    await getConnection().query(sql.unsafe`
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

function rowToAccount(row: z.infer<typeof rowSchema>): Account {
  return {
    id: row.id,
    IBAN: row.iban,
    balances: {
      available: {
        value: row.balances.available.value,
        currency: row.balances.available.currency,
      },
    },
    country: row.country,
    createdAt: row.created_at,
    name: row.name,
  };
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
