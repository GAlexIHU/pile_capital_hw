import { Entity } from "./entity";

export interface Transfer extends Entity {
  sourceAccount: string;
  amount: number;
  recipientName: string;
  targetIBAN: string;
  targetBIC: string;
  reference: string;
}
