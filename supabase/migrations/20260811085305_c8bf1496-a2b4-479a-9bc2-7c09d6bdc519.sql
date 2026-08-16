-- Add missing policies for shop_order_items
CREATE POLICY "Users can view own order items"
  ON public.shop_order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_orders
      WHERE shop_orders.id = shop_order_items.order_id
        AND shop_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own order items"
  ON public.shop_order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_orders
      WHERE shop_orders.id = shop_order_items.order_id
        AND shop_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage order items"
  ON public.shop_order_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add missing admin management policy for user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));