import { Entity } from "./entity";

export type AccountBalance = {
  value: number;
  currency: string;
};

export interface Account extends Entity {
  IBAN: string;
  balances: {
    available: AccountBalance;
  };
  country: string;
  createdAt: Date;
  name: string;
}
