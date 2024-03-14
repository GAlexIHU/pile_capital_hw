import { Account, AccountBalance } from "../entities/account.entity";
import { AccountRepository } from "../repositories/account.repo";
import { AsyncUseCase } from "./use-case";

export type SearchAccountsUseCase = AsyncUseCase<
  {
    IBAN?: string;
    minBalance?: number;
    maxBalance?: number;
    page?: number;
  },
  {
    count: number;
    page: number;
    totalPages: number;
    totalBalance: AccountBalance;
    results: Account[];
  }
>;

export type SearchAccountsUseCaseDependencies = {
  accountRepo: AccountRepository;
};

export const searchAccountsUseCaseFactory: (
  deps: SearchAccountsUseCaseDependencies,
) => SearchAccountsUseCase =
  ({ accountRepo }) =>
  async ({ IBAN, minBalance, maxBalance, page }) => {
    const { count, results } = await accountRepo.search({
      IBAN,
      minBalance,
      maxBalance,
      page,
      pageSize: PAGE_SIZE,
    });

    const totalPages = Math.ceil(count / PAGE_SIZE);

    // We're going with the presumption that all values are in EUR (as per the dataset)
    // Conversion is not in scope for this exercise
    // Also, for adding this up, we should use a library or do it in SQL to avoid floating point pitfalls
    const totalBalanceValue = results.reduce(
      (acc, account) => acc + account.balances.available.value,
      0,
    );

    return {
      count,
      page: page ?? 1,
      totalPages,
      totalBalance: {
        currency: "EUR",
        value: totalBalanceValue,
      },
      results,
    };
  };

const PAGE_SIZE = 10;
