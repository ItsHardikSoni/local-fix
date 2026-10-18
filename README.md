# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Supabase Authentication

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the root `.env` using the project URL and publishable/anon key from your Supabase API settings. Use the project base URL (for example, `https://<project-ref>.supabase.co`), without `/rest/v1/`. The `.env` file is ignored by Git. Restart Expo after changing these values.

Run [`supabase/profiles.sql`](supabase/profiles.sql) in the Supabase SQL editor after creating the `public.profiles` table. It creates a profile when an auth user signs up, allows authenticated users to read only their own profile, and adds the table to the `supabase_realtime` publication. The profile screen fetches the signed-in user's row and listens for changes to it. Sign-up collects full name and optional phone; email comes from Supabase Auth, and the table defaults supply status and timestamps.

Run [`supabase/service-categories.sql`](supabase/service-categories.sql) in the Supabase SQL editor to create and seed `public.service_categories`, enable authenticated read-only row-level security, and add the table to the `supabase_realtime` publication. Active categories and their descriptions appear on Home and in the service request form; updates to the table are fetched live while the app is open. Manage availability by changing `is_active` in Supabase.

Run [`supabase/worker-profiles.sql`](supabase/worker-profiles.sql) after the profiles, districts, and service-categories tables exist. It creates worker profiles, service links, and a minimal job table; enables row-level security; and subscribes these records to Supabase Realtime. Only verified workers appear in the directory. When a customer submits a service report, its selected district ID and service-category ID are passed to the directory; results are matched to that exact district and service, rather than relying only on the device's GPS district. Workers can create pending profiles and edit their own profile details; only trusted administrators can set verification status, ratings, and initial completed-job counts. Availability is changed through database functions: a worker can go online or offline when they have no active job, accepting a pending job atomically marks them busy, and completing the job increments their completed count and returns them to available. The app currently displays workers and job details but does not yet provide worker onboarding, job-request, acceptance, or completion screens. No fake worker records are seeded; add workers only for real `profiles.id` accounts, select valid district and service-category IDs, and have an administrator verify them.

To add a real worker from the Supabase SQL editor, replace the profile UUID, district/state names, experience, and rates below with verified real data. New profiles default to pending verification and offline. Then link the services and have an administrator verify the profile only after checking the worker:

```sql
insert into public.worker_profiles (
  id, worker_name, district_id, experience_years, hourly_rate, daily_rate, rates_negotiable
)
select
  profile.id,
  profile.full_name,
  district.id,
  'REPLACE_EXPERIENCE_YEARS'::numeric,
  'REPLACE_HOURLY_RATE'::numeric,
  'REPLACE_DAILY_RATE'::numeric,
  true
from public.profiles profile
join public.districts district
  on district.state_name = 'Replace with state'
  and district.district_name = 'Replace with district'
where profile.id = 'Replace with existing profiles.id UUID'::uuid;

insert into public.worker_service_categories (worker_id, service_category_id)
select
  'Replace with the same profiles.id UUID'::uuid,
  category.id
from public.service_categories category
where category.is_active
  and category.name in ('Plumbing', 'Electrical')
on conflict do nothing;

update public.worker_profiles
set verification_status = 'verified', availability_status = 'available'
where id = 'Replace with the same profiles.id UUID'::uuid;
```

Use `public.accept_worker_job(p_job_id)` from the assigned worker's authenticated session to atomically accept one pending job, and `public.complete_worker_job(p_job_id)` to complete it and release availability. Use `public.set_my_worker_availability('available')` or `('offline')` for verified workers with no active job.

Email/password sign-in and account creation use Supabase Auth directly. Account confirmation and email-change confirmation are controlled by the Supabase project's Authentication settings and use its configured email templates. If email confirmation is enabled, users follow Supabase's confirmation link; no separate email-verification server is required. AsyncStorage persists the Supabase session so returning users can go straight to Home. Profile name and phone edits are synchronized to Supabase Auth metadata and `public.profiles`.

When a signed-in user opens LocalFix, the app requests foreground location access and reads their current coordinates. The displayed area and technician list are based on the location reverse-geocoded from the device, not a hard-coded default district. The technician directory displays verified worker profiles from Supabase and contains no invented sample providers. The app refreshes the current location when opened or resumed, and a service request refreshes it again before carrying coordinates through technician selection and request review. Location access is only used while the app is in use; the operating system controls permission and device location settings.

Before searching for technicians, users enter a service address with a state and a district filtered by that state, and may add a society/apartment and flat/house number. The app derives state choices from the distinct `state_name` values in active `public.districts` rows and saves the selected district ID to `public.customer_addresses`. Users can edit their latest saved address from Profile or during a service request. The app stores current GPS coordinates when available; the table's `is_verified` default remains false. Address and active district changes are fetched again through Supabase Realtime while the app is open. Enable Realtime for `public.customer_addresses` and `public.districts` in the Supabase dashboard, and grant authenticated users read access to active districts and customer-scoped select, insert, and update permissions on addresses (with `auth.uid() = customer_id` enforced by row-level security).

The Home screen displays the reverse-geocoded current location (or coordinates when an address is unavailable). Users can edit their name, email, and phone on Profile; name and phone are stored in Supabase Auth user metadata and the `profiles` table. Supabase Auth handles any email confirmation required for email changes.

Profile also links to app information, a usage guide, FAQs, current usage terms, and an app-issue report form. Issue reports are prepared in the user's email app; because a support recipient is not configured, users must enter the destination email address before sending. The in-app terms describe current functionality and should be reviewed before production use.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
