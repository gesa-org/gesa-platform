-- Profile-view totals are private analytics. The public-safe view remains
-- readable, but anon/authenticated callers receive grants only for the
-- profile fields that are intentionally public. `profile_views` is omitted.
revoke all on table public.therapists_public from anon, authenticated;

grant select (
  id, full_name, slug, bio, credentials, gender, is_verified, languages,
  photo_url, session_lengths, short_summary, specialties, tracks,
  years_experience, diary_link, diary_link_status, country, price_note,
  created_at, updated_at, offers_online, offers_in_person, city,
  support_pathways, session_price_amount, session_price_currency, has_whatsapp, time_zone
) on table public.therapists_public to anon, authenticated;

-- Keep already-published CMS copy aligned with the application fallbacks.
-- This is presentation content only; professional bios remain untouched.
update public.site_content
set value = replace(
  replace(
    replace(
      replace(value::text, 'Therapists', 'Professionals'),
      'therapists', 'professionals'
    ),
    'Therapist', 'Professional'
  ),
  'therapist', 'professional'
)::jsonb
where value::text ~* '\mtherapist';

update public.site_content
set value = replace(value::text, 'Find a Professional', 'Find a Volunteer')::jsonb
where value::text like '%Find a Professional%';

update public.site_content
set value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(value, '{searchPlaceholder}', to_jsonb('Find Volunteers…'::text), true),
      '{definitionLabel}', to_jsonb('Definition of a volunteer'::text), true
    ),
    '{joinAsTherapistLabel}', to_jsonb('Join us as a professional'::text), true
  ),
  '{noResultsMessage}', to_jsonb('No professionals match your search right now. Try clearing a filter, or contact us and we''ll help you find the right person.'::text), true
)
where key = 'component_therapists_directory';
