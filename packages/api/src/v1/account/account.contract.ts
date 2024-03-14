import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { AccountSchema } from "./account.schema";

const c = initContract();

export const accountContract = c.router({
  search: {
    method: "GET",
    path: `/accounts`,
    query: z.object({
      IBAN: AccountSchema.shape.IBAN.optional(),
      minBalance: z.coerce.number().optional(),
      maxBalance: z.coerce.number().optional(),
      page: z.coerce.number().optional(),
    }),
    responses: {
      200: z.object({
        count: z.number(),
        page: z.number(),
        totalPages: z.number(),
        totalBalance: AccountSchema.shape.balances.shape.available,
        results: z.array(AccountSchema),
      }),
    },
    summary: "Get a specific Account by id or IBAN",
    validateResponseOnClient: true,
  },
});
