-- Tighten grants on security definer helper functions

-- Trigger-only function: no app role should call this directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- Role-check helper used by RLS policies: authenticated users need execute; anon does not
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Public tracking helper: intentionally callable by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.track_request_by_reference(text) FROM public, authenticated;
GRANT EXECUTE ON FUNCTION public.track_request_by_reference(text) TO anon;