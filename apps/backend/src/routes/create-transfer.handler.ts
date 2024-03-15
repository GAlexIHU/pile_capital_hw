import { api, APITransfer } from "@repo/api/v1";
import { Transfer } from "../entities/transfer.entity";
import { runInContext } from "../framework/context";
import { Logger } from "../framework/logger";
import {
  CreateTransferUseCase,
  CreateTransferUseCaseError,
  CreateTransferUseCaseErrorType,
} from "../use-cases/create-transfer.use-case";
import { RouteHandler } from "./route";

export const createTransferRouteHandlerFactory: (deps: {
  createTransferUseCase: CreateTransferUseCase;
}) => RouteHandler<typeof api.transfer.create> =
  ({ createTransferUseCase }) =>
  async ({ request, body }) => {
    const mapResult = (data: Transfer): APITransfer.Transfer => ({
      id: data.id,
      sourceAccount: data.sourceAccount,
      targetIBAN: data.targetIBAN,
      targetBIC: data.targetBIC,
      amount: data.amount,
      recipientName: data.recipientName,
      reference: data.reference,
    });
    try {
      const { result } = await runInContext(
        { logger: request.log as unknown as Logger },
        createTransferUseCase,
      )(body.data);
      return {
        status: 201,
        body: {
          data: mapResult(result),
        },
      };
    } catch (error) {
      if (error instanceof CreateTransferUseCaseError) {
        return mapKnownErrors(error);
      }
      throw error;
    }
  };

const mapKnownErrors = (
  error: CreateTransferUseCaseError,
): { body: unknown; status: 400 | 404 | 500 } => {
  switch (error.type) {
    case CreateTransferUseCaseErrorType.MISSING_SOURCE_ACCOUNT:
      return {
        status: 404,
        body: {
          message: "Source account not found",
        },
      };
    case CreateTransferUseCaseErrorType.INVALID_TARGET_IBAN_OR_BIC:
      return {
        status: 400,
        body: {
          message: "Invalid target IBAN or BIC",
        },
      };
    case CreateTransferUseCaseErrorType.INSUFFICIENT_FUNDS:
      return {
        status: 400,
        body: {
          message: "Insufficient funds",
        },
      };
    default:
      return {
        status: 500,
        body: {
          message: "Unknown error",
        },
      };
  }
};
