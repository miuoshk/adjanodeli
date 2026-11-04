-- A customer saving their name and phone updates profiles.
-- The staff_permissions check runs on that update, and it calls
-- staff_permissions_valid. Execute was revoked from authenticated,
-- so the save ended with "permission denied" (HTTP 403).

grant execute on function public.staff_permissions_valid(text[]) to authenticated;
