import { v4 } from "uuid";
import { Transfer } from "../entities/transfer.entity";
import { AccountRepository } from "../repositories/account.repo";
import { Transactable } from "../repositories/repository";
import { TransferRepository } from "../repositories/transfer.repo";
import {
  MonetaryCodesService,
  MonetaryCodesServiceError,
} from "../services/monetary-codes.service";
import { Lazy } from "../types/lazy";
import { AsyncUseCase } from "./use-case";

export type CreateTransferUseCase = AsyncUseCase<
  Omit<Transfer, "id">,
  {
    result: Transfer;
  }
>;

export enum CreateTransferUseCaseErrorType {
  MISSING_SOURCE_ACCOUNT,
  INVALID_TARGET_IBAN_OR_BIC,
  INSUFFICIENT_FUNDS,
}

export class CreateTransferUseCaseError extends Error {
  constructor(
    message: string,
    public type: CreateTransferUseCaseErrorType,
  ) {
    super(message);
  }
}

export type CreateTransferUseCaseDependencies = {
  //TODO: This should be cleaned up and moved to an interface
  pool: Lazy<Transactable, true>;
  transferRepo: TransferRepository;
  monetaryCodesService: MonetaryCodesService;
  accountRepo: AccountRepository;
};

export const createTransferUseCaseFactory: (
  deps: CreateTransferUseCaseDependencies,
) => CreateTransferUseCase =
  ({ transferRepo, monetaryCodesService, accountRepo, pool }) =>
  async (transfer) =>
    await pool().transaction(async (connection) => {
      await monetaryCodesService
        .validateIBANandBIC(transfer.targetIBAN, transfer.targetBIC)
        .catch((e) => {
          if (e instanceof MonetaryCodesServiceError) {
            throw new CreateTransferUseCaseError(
              e.message,
              CreateTransferUseCaseErrorType.INVALID_TARGET_IBAN_OR_BIC,
            );
          } else {
            throw e as Error;
          }
        });

      const sourceAccount = await accountRepo
        .transacting(connection)
        .get(transfer.sourceAccount);

      if (!sourceAccount) {
        throw new CreateTransferUseCaseError(
          "Source account not found",
          CreateTransferUseCaseErrorType.MISSING_SOURCE_ACCOUNT,
        );
      }

      if (sourceAccount.balances.available.value < transfer.amount) {
        throw new CreateTransferUseCaseError(
          "Insufficient funds",
          CreateTransferUseCaseErrorType.INSUFFICIENT_FUNDS,
        );
      }

      const matchingTargetAccount = await accountRepo
        .transacting(connection)
        .search({
          IBAN: transfer.targetIBAN,
        });

      const transferWithId = { ...transfer, id: v4() };

      if (matchingTargetAccount.count > 1) {
        // This can be a critical unnamed error, though we're not really guarding against it
        throw new Error("MULTIPLE ACCOUNTS WITH SAME IBAN");
      }

      await accountRepo
        .transacting(connection)
        .changeBalance(transfer.sourceAccount, -transfer.amount);

      await transferRepo.transacting(connection).insert([transferWithId]);

      if (matchingTargetAccount.count === 1) {
        await accountRepo
          .transacting(connection)
          .changeBalance(matchingTargetAccount.results[0]!.id, transfer.amount);
      }

      // Lets ignore the case when the target account is not in our system, we'll just withdraw the money
      // from the source account and not do anything with it

      return { result: transferWithId };
    });
