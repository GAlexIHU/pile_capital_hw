CREATE TABLE transfers (
  id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  source_account_id uuid NOT NULL REFERENCES accounts(id),
  amount numeric(20, 2) NOT NULL,
  recipient_name text NOT NULL,
  target_iban text NOT NULL,
  target_bic text NOT NULL,
  reference text NOT NULL
);