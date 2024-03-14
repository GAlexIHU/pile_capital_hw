import z from "zod";

export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  IBAN: z.string(),
  country: z.string(),
  createdAt: z.coerce.date(),
  balances: z.object({
    available: z.object({
      value: z.number(),
      currency: z.string(),
    }),
  }),
});

export type Account = z.infer<typeof AccountSchema>;
