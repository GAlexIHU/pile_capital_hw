import { api, APIAccount } from "@repo/api/v1";
import { Account } from "../entities/account.entity";
import { Cacher } from "../framework/cached";
import { runInContext } from "../framework/context";
import { Logger } from "../framework/logger";
import { SearchAccountsUseCase } from "../use-cases/search-accounts.use-case";
import { AsyncUseCaseInput, AsyncUseCaseOutput } from "../use-cases/use-case";
import { RouteHandler } from "./route";

export const searchAccountsRouteHandlerFactory: (deps: {
  searchAccountsUseCase: SearchAccountsUseCase;
  cache: Cacher;
}) => RouteHandler<typeof api.account.search> =
  ({ searchAccountsUseCase, cache }) =>
  async ({ request, query: { IBAN, maxBalance, minBalance, page } }) => {
    const mapAccount = (e: Account): APIAccount.Account => ({
      id: e.id,
      IBAN: e.IBAN,
      balances: e.balances,
      country: e.country,
      createdAt: e.createdAt,
      name: e.name,
    });

    const { value } = await runInContext(
      { logger: request.log as unknown as Logger },
      cache<
        AsyncUseCaseInput<SearchAccountsUseCase>,
        AsyncUseCaseOutput<SearchAccountsUseCase>
      >(searchAccountsUseCase),
    )({ IBAN, maxBalance, minBalance, page });

    return {
      status: 200,
      body: {
        count: value.count,
        page: value.page,
        totalPages: value.totalPages,
        results: value.results.map(mapAccount),
      },
    };
  };
