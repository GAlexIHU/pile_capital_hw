import z from "zod";

export const TransferSchema = z.object({
  id: z.string().uuid(),
  sourceAccount: z.string(),
  amount: z.number(),
  recipientName: z.string(),
  targetIBAN: z.string(),
  targetBIC: z.string(),
  reference: z.string(),
});

export type Transfer = z.infer<typeof TransferSchema>;
