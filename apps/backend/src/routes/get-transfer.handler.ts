import { api, APITransfer } from "@repo/api/v1";
import { Transfer } from "../entities/transfer.entity";
import { runInContext } from "../framework/context";
import { Logger } from "../framework/logger";
import { GetTransferUseCase } from "../use-cases/get-transfer.use-case";
import { RouteHandler } from "./route";

export const getTransferRouteHandlerFactory: (deps: {
  getTransferUseCase: GetTransferUseCase;
}) => RouteHandler<typeof api.transfer.get> =
  ({ getTransferUseCase }) =>
  async ({ request, params: { id } }) => {
    const mapEntity = (entity: Transfer): APITransfer.Transfer => ({
      id: entity.id,
      sourceAccount: entity.sourceAccount,
      targetIBAN: entity.targetIBAN,
      targetBIC: entity.targetBIC,
      amount: entity.amount,
      recipientName: entity.recipientName,
      reference: entity.reference,
    });

    const value = await runInContext(
      { logger: request.log as unknown as Logger },
      getTransferUseCase,
    )(id);

    if (value.result === null) {
      return {
        status: 404,
        body: {
          message: "Not Found",
        },
      };
    }

    return {
      status: 200,
      body: {
        data: mapEntity(value.result),
      },
    };
  };
