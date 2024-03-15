import { initContract } from "@ts-rest/core";
import { accountContract } from "./account";
import { exampleEntityContract } from "./example-entity";
import { transferContract } from "./transfer";

const c = initContract();

export type * as APIAccount from "./account";
export type * as APIExampleEntity from "./example-entity";
export type * as APITransfer from "./transfer";

export const api = c.router({
  example: exampleEntityContract,
  account: accountContract,
  transfer: transferContract,
});
