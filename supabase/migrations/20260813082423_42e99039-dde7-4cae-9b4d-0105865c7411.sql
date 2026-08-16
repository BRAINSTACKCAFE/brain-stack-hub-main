-- ============ SERVICE PRICES ============
CREATE TABLE public.service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_slug text,
  price integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_prices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_prices TO authenticated;
GRANT ALL ON public.service_prices TO service_role;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active service prices" ON public.service_prices
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins can read all service prices" ON public.service_prices
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage service prices" ON public.service_prices
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON public.service_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.service_prices (slug, name, category_slug, price) VALUES
  ('nerd-project-upload', 'NERD Project Upload', 'nerd', 1100000),
  ('nysc-bio-data', 'NYSC PCM Bio Data', 'nysc', 800000)
ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price;

-- ============ WALLETS ============
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all wallets" ON public.wallets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  amount bigint NOT NULL CHECK (amount > 0),
  balance_after bigint NOT NULL,
  reason text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wallet_transactions_user_idx ON public.wallet_transactions (user_id, created_at DESC);
CREATE UNIQUE INDEX wallet_transactions_reference_idx ON public.wallet_transactions (reference) WHERE reference IS NOT NULL;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own wallet transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all wallet transactions" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- money helpers (service_role only)
CREATE OR REPLACE FUNCTION public.credit_wallet(_user_id uuid, _amount bigint, _reason text, _reference text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal bigint;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _user_id
    RETURNING balance INTO _bal;
  INSERT INTO public.wallet_transactions (user_id, direction, amount, balance_after, reason, reference)
    VALUES (_user_id, 'credit', _amount, _bal, _reason, _reference);
  RETURN _bal;
END; $$;

CREATE OR REPLACE FUNCTION public.debit_wallet(_user_id uuid, _amount bigint, _reason text, _reference text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal bigint;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF _bal < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _user_id
    RETURNING balance INTO _bal;
  INSERT INTO public.wallet_transactions (user_id, direction, amount, balance_after, reason, reference)
    VALUES (_user_id, 'debit', _amount, _bal, _reason, _reference);
  RETURN _bal;
END; $$;

REVOKE ALL ON FUNCTION public.credit_wallet(uuid, bigint, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.debit_wallet(uuid, bigint, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet(uuid, bigint, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_wallet(uuid, bigint, text, text) TO service_role;

-- wallet auto-create for new users + admin bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');

  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  IF lower(NEW.email) = 'brainstackcafe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- backfill wallets + admin role for existing accounts
INSERT INTO public.wallets (user_id, balance)
SELECT id, 0 FROM auth.users ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'brainstackcafe@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;