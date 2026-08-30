-- Add INSERT and UPDATE policies for payment_attempts
CREATE POLICY "Users can insert own payment attempts" ON public.payment_attempts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment attempts" ON public.payment_attempts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
