# Juan's wishlist

Production site: [wishlist.juanquenga.com](https://wishlist.juanquenga.com).

A personal birthday and Christmas wishlist to share with family. Works on desktop and mobile. The initial list contains the Waveshare ESP32-S3 Touch AMOLED 1.75C and Seeed Studio's TRMNL 7.5-inch OG DIY Kit, with original store links and product photos.

Family members can browse without an account, reserve a gift so it isn't bought twice, and release their reservation from the same browser. Reservations update in real time across visitors. The list shows whether a gift is reserved, but doesn't collect or display the buyer's name. A reservation doesn't purchase a gift. Use the store link to buy it.

The owner signs in with Clerk to add, edit, or remove gifts. Convex checks the signed-in user's verified email against `WISHLIST_OWNER_EMAIL` before it allows those changes.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS, Bun, Convex, Clerk, and Vercel. The visual design uses Outfit and DM Sans typography, a custom gift illustration, and a lilac, plum, and mint palette.

## Local development

Install the dependencies:

```sh
bun install --frozen-lockfile
```

Create a Clerk development instance in the [Clerk Dashboard](https://dashboard.clerk.com) and copy its publishable and secret keys to `.env.local`. Keep `CLERK_SECRET_KEY` server-side.

In Clerk, enable the Convex integration and copy the instance's Frontend API URL. Create a JWT template named `convex` with these claims:

```json
{
  "aud": "convex",
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.email_verified}}"
}
```

Set the Clerk Frontend API URL on the Convex development deployment. Copy the exact URL from Clerk, including `https://`:

```sh
bunx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-instance.clerk.accounts.dev
bunx convex dev
```

Convex adds `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`. Set the wishlist owner's verified email on the same Convex deployment, then seed the initial gifts:

```sh
bunx convex env set WISHLIST_OWNER_EMAIL your-email@example.com
bunx convex run gifts:seed '{}'
```

Start Next.js in a second terminal:

```sh
bun run dev
```

For local Google sign-in, add Google from Clerk's **SSO connections** page and choose **For all users**. Clerk development instances use shared Google credentials, so you don't need a Google Cloud OAuth client for local development. For production credentials, follow [Clerk's Google social connection guide](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google).

The seed is idempotent. Running it again doesn't duplicate gifts or overwrite edits. Without Convex configuration, the app displays the seed list and lets family share it and visit stores. Reservations stay disabled until Convex is configured. Missing Clerk keys don't block browsing or reservations, but owner sign-in displays a setup notice.

## Google sign-in for production

Production Clerk instances need custom Google OAuth credentials. In Clerk, open **SSO connections**, add Google for all users, enable **Use custom credentials**, and copy the **Authorized Redirect URI** shown for that Clerk instance. Do not guess this URL. It is Google's callback to Clerk, not the wishlist's callback.

In the [Google Cloud Console](https://console.cloud.google.com), open **APIs & Services**, then **Credentials**. Create an OAuth client ID for a **Web application**. Add your production site origin under **Authorized JavaScript origins**. Paste the exact URI from Clerk under **Authorized redirect URIs**. If Google asks you to configure the OAuth consent screen, complete that setup. Copy the Google client ID and secret into the Clerk connection. Keep Google's client secret in Clerk, not in this app's environment.

Google requires an exact redirect URI match, including its scheme and trailing slash. See Google's [OAuth 2.0 web server guide](https://developers.google.com/identity/protocols/oauth2/web-server) for its redirect URI rules.

## Checks

```sh
bun run typecheck
bun run lint
bun run test
```

Tests cover reservation conflicts and retries, release permissions, public and private data, owner authorization, and seeding. GitHub Actions runs the same checks. A production build is separate from these checks.

## Vercel

Production deploys from `main` to [wishlist.juanquenga.com](https://wishlist.juanquenga.com). Connect the repository to Vercel, set its Production Branch to `main`, and add `wishlist.juanquenga.com` as the production domain.

`vercel.json` selects Next.js, installs with `bun install --frozen-lockfile`, and runs this build command:

```sh
bunx convex deploy --cmd 'bun run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

The repository controls the install and build commands. Convex supplies `NEXT_PUBLIC_CONVEX_URL` to the Next.js build and deploys the backend functions. See [Convex's Vercel deployment guide](https://docs.convex.dev/production/hosting/vercel).

Add these Vercel environment variables for Production:

- `CONVEX_DEPLOY_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Use a production Convex deploy key and keys from the Clerk production instance. Keep the secret keys out of Git. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is public.

On the production Convex deployment, set `CLERK_JWT_ISSUER_DOMAIN` to the exact Clerk production Frontend API URL, including `https://`. Set `WISHLIST_OWNER_EMAIL` to the owner's verified email. Enable the Clerk Convex integration and create the `convex` JWT template with the claims shown above in the production Clerk instance too.

Configure Google's custom production credentials in Clerk, using the exact redirect URI that Clerk displays. Use `https://wishlist.juanquenga.com` as the Google OAuth client's authorized JavaScript origin. Follow the production Google sign-in steps above.

Run the seed against production once before sharing the wishlist:

```sh
bunx convex run --prod gifts:seed '{}'
```

If you enable Vercel Preview deployments, give Preview a separate Convex preview deploy key and Clerk development keys. Set Convex's Preview defaults for `CLERK_JWT_ISSUER_DOMAIN` and `WISHLIST_OWNER_EMAIL` to match that development Clerk instance. Production keys belong only to Production.

Use the site's **Share wishlist** button to copy the link or open the native share sheet on mobile.

## Product sources

Product images belong to their respective manufacturers. The exact image sources are in [public/products/SOURCES.md](public/products/SOURCES.md). Prices are snapshots, not live quotes. Check the stores for current pricing, shipping, stock, and product options.
