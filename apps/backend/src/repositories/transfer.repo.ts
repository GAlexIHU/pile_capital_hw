import { DatabaseConnection, sql } from "slonik";
import z from "zod";
import { Transfer } from "../entities/transfer.entity";
import { Lazy } from "../types/lazy";
import {
  GettableRepository,
  InsertableRepository,
  TransactableRepository,
} from "./repository";

const rowSchema = z.object({
  id: z.string().uuid(),
  source_account_id: z.string().uuid(),
  amount: z.number(),
  recipient_name: z.string(),
  target_iban: z.string(),
  target_bic: z.string(),
  reference: z.string(),
});

export interface TransferRepository
  extends TransactableRepository,
    GettableRepository<Transfer>,
    InsertableRepository<Transfer> {}

export const transferRepositoryFactory = (
  getConnection: Lazy<DatabaseConnection, true>,
): TransferRepository => ({
  transacting(connection) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return transferRepositoryFactory(() => connection) as unknown as any;
  },
  async get(id) {
    const queryResult = await getConnection().query(
      sql.type(rowSchema)`SELECT * FROM transfers WHERE id = ${id}`,
    );

    return queryResult.rows[0] ? mapRowToEntity(queryResult.rows[0]) : null;
  },
  async insert(transfers) {
    await getConnection().query(sql.unsafe`
    INSERT INTO transfers (id, source_account_id, amount, recipient_name, target_iban, target_bic, reference)
    SELECT *
    FROM ${sql.unnest(
      transfers.map((entity): (string | number)[] => [
        entity.id,
        entity.sourceAccount,
        entity.amount,
        entity.recipientName,
        entity.targetIBAN,
        entity.targetBIC,
        entity.reference,
      ]),
      ["uuid", "uuid", "numeric", "text", "text", "text", "text"],
    )}
  `);
  },
});

const mapRowToEntity = (row: z.infer<typeof rowSchema>): Transfer => ({
  id: row.id,
  amount: row.amount,
  recipientName: row.recipient_name,
  sourceAccount: row.source_account_id,
  reference: row.reference,
  targetBIC: row.target_bic,
  targetIBAN: row.target_iban,
});
