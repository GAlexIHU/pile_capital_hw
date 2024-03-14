CREATE TABLE accounts (
  id uuid PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  iban text NOT NULL,
  name text NOT NULL,
  balances jsonb NOT NULL DEFAULT '{}',
  country text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);