import { Transfer } from "../entities/transfer.entity";
import { TransferRepository } from "../repositories/transfer.repo";
import { AsyncUseCase } from "./use-case";

export type GetTransferUseCase = AsyncUseCase<
  string,
  {
    result: Transfer | null;
  }
>;

export type GetTransferUseCaseDependencies = {
  transferRepo: TransferRepository;
};

export const getTransferUseCaseFactory: (
  deps: GetTransferUseCaseDependencies,
) => GetTransferUseCase =
  ({ transferRepo }) =>
  async (id) => ({
    result: await transferRepo.get(id),
  });
