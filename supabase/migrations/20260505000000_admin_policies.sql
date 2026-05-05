-- Allow admins to update any profile (required for landlord verification approval)
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert notifications for any recipient (e.g. verification approved)
create policy "notifications_insert_admin"
on public.notifications for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));
