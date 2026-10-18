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

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the root `.env` using the project URL and publishable/anon key from your Supabase API settings. The `.env` file is ignored by Git. Restart Expo after changing these values.

Run [`supabase/profiles.sql`](supabase/profiles.sql) in the Supabase SQL editor after creating the `public.profiles` table. It creates a profile when an auth user signs up, allows authenticated users to read only their own profile, and adds the table to the `supabase_realtime` publication. The profile screen fetches the signed-in user's row and listens for changes to it. Sign-up collects full name and optional phone; email comes from Supabase Auth, and the table defaults supply status and timestamps.

Email/password sign-in uses Supabase Auth. New accounts are created on the OTP API only after the user verifies a six-digit code sent through Nodemailer; Supabase Auth marks that email verified when creating the account. Profile email changes also require a code sent to the new address before the server updates Supabase Auth. AsyncStorage persists the Supabase session so returning users can go straight to Home. The app only sends a password to the OTP API during sign-up; use HTTPS outside local development. Never put SMTP credentials or a Supabase `service_role` key in the Expo app.

### OTP API setup

1. In the Supabase SQL editor, run [`supabase/migrations/001_email_otp_challenges.sql`](supabase/migrations/001_email_otp_challenges.sql).
2. Fill in the root `.env` using [`.env.example`](.env.example). The `EXPO_PUBLIC_` values are for the mobile app; the SMTP credentials and Supabase service-role key are read only by the Node API and must never use the `EXPO_PUBLIC_` prefix. `.env` is ignored by Git.
3. Install and run the Node API from the repository root:

   ```sh
   npm install
   npm run api:dev
   ```

4. Set `EXPO_PUBLIC_API_URL` in the root `.env` to the API URL. For a physical device, use a reachable LAN or deployed HTTPS URL instead of `localhost`. `CORS_ORIGINS` in the server environment must include your Expo web origin when using the web app.
5. Deploy the Node service behind HTTPS before using it outside local development. Keep the service-role key and SMTP password in the host’s private environment settings.

The Expo app and Node API are maintained in this one project and share its root package manifest. They run as separate processes: the app runs with `npx expo start`, and the API runs with `npm run api:dev`. The server-only secrets are not bundled into the mobile app.

The API limits code requests to five per email and purpose per 24 hours, applies a one-minute resend delay, expires codes after 10 minutes, and allows at most five verification attempts per code. Run `npm run test:api` for the OTP utility tests. Profile name and phone edits are synchronized to Supabase Auth metadata and `public.profiles`.

When a signed-in user opens LocalFix, the app requests foreground location access and reads their current coordinates. A service request refreshes that location and carries the coordinates through the technician selection and request review screens. Location access is only used while the app is in use; the operating system controls permission and device location settings.

The Home screen displays the reverse-geocoded current location (or coordinates when an address is unavailable). Users can edit their name, email, and phone on Profile; name and phone are stored in Supabase Auth user metadata and the `profiles` table. Email changes are applied after the new email address is verified with the OTP.

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
