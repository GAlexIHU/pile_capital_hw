export interface MonetaryCodesService {
  getBICFromIBAN(iban: string): string;
  validateIBANandBIC(iban: string, bic: string): Promise<void>;
}

export class MonetaryCodesServiceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// This is a very naive implementation and the initial dataset is corrupt either way
export const monetaryCodesServiceFactory: () => MonetaryCodesService = () => ({
  getBICFromIBAN(iban: string): string {
    return iban.substring(0, 4);
  },
  async validateIBANandBIC(iban: string, bic: string) {
    if (!iban.includes(bic)) {
      throw new MonetaryCodesServiceError("IBAN and BIC are invalid");
    }
  },
});
