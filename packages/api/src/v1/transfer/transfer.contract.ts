import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { TransferSchema } from "./transfer.schema";

const c = initContract();

export const transferContract = c.router({
  create: {
    method: "POST",
    path: `/transfers`,
    body: z.object({
      data: TransferSchema.omit({ id: true }),
    }),
    responses: {
      201: z.object({
        data: TransferSchema,
      }),
    },
    summary: "Create a new Transfer",
    validateResponseOnClient: true,
  },
  get: {
    method: "GET",
    path: `/transfers/:id`,
    pathParams: z.object({
      id: z.string().uuid(),
    }),
    responses: {
      200: z.object({
        data: TransferSchema,
      }),
    },
    summary: "Get a Transfer",
    validateResponseOnClient: true,
  },
});
