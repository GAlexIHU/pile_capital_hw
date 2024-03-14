import { initContract } from "@ts-rest/core";
import { exampleEntityContract } from "./example-entity";
import { accountContract } from "./account";

const c = initContract();

export type * as APIExampleEntity from "./example-entity";
export type * as APIAccount from "./account";

export const api = c.router({
  example: exampleEntityContract,
  account: accountContract,
});
