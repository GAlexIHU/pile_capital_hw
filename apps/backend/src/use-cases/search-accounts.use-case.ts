import { Account } from "../entities/account.entity";
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
    console.log(typeof count, typeof PAGE_SIZE);
    const totalPages = Math.ceil(count / PAGE_SIZE);

    return {
      count,
      page: page ?? 1,
      totalPages,
      results,
    };
  };

const PAGE_SIZE = 10;
