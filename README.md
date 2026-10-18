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

Email/password sign-in and account creation use Supabase Auth directly. Account confirmation and email-change confirmation are controlled by the Supabase project's Authentication settings and use its configured email templates. If email confirmation is enabled, users follow Supabase's confirmation link; no separate email-verification server is required. AsyncStorage persists the Supabase session so returning users can go straight to Home. Profile name and phone edits are synchronized to Supabase Auth metadata and `public.profiles`.

When a signed-in user opens LocalFix, the app requests foreground location access and reads their current coordinates. The displayed area and technician list are based on the location reverse-geocoded from the device, not a hard-coded default district. The technician directory currently contains no sample providers; it stays empty until a real technician data source is connected. The app refreshes the current location when opened or resumed, and a service request refreshes it again before carrying coordinates through technician selection and request review. Location access is only used while the app is in use; the operating system controls permission and device location settings.

Before searching for technicians, users enter a service address with a district, and may add a society/apartment and flat/house number. The app saves it to `public.customer_addresses`, reusing the latest saved address unless the user chooses to add another. It loads district options from `public.districts(id, district_name)` and stores current GPS coordinates when available; the table's `is_verified` default remains false. Authenticated users need read access to `districts` and customer-scoped select, insert, and update permissions on `customer_addresses` (with `auth.uid() = customer_id` enforced by row-level security).

The Home screen displays the reverse-geocoded current location (or coordinates when an address is unavailable). Users can edit their name, email, and phone on Profile; name and phone are stored in Supabase Auth user metadata and the `profiles` table. Supabase Auth handles any email confirmation required for email changes.

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
