-- Public tracking now goes through a server function instead of direct function calls
REVOKE EXECUTE ON FUNCTION public.track_request_by_reference(text) FROM anon;