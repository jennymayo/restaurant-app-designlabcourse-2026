# Night Off

A small web app for collecting the restaurants and cafés you've saved across Instagram, TikTok, Google Maps, and friends' tips, and quickly finding the right one for tonight.

Built with **React + TypeScript + Vite** and styled with **Tailwind CSS**. Data is saved in **Supabase** (a cloud Postgres database). If Supabase isn't configured, the app falls back to saving in your browser (localStorage), so it still runs with no setup. With Supabase, people sign in with an **email and password**, and each account can only see its own places.

## Setup

You need [Node.js](https://nodejs.org) version 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173). To use Supabase, first copy `.env.example` to `.env.local` and fill in your project's address and publishable key, then follow "Backend: Supabase" below. To try it on your phone, run `npm run dev -- --host` and open the "Network" address on a phone on the same Wi-Fi.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run lint` | Checks the code for common mistakes |
| `npm run preview` | Serves the built app locally |

## How to use it

- **Add place** (bottom right): type a name and press Enter. Everything else is optional under "Add details".
- **Filters**: tap chips to narrow the list. Price and Status match *any* chip you pick (`$` or `$$`). Tags must *all* match (cozy **and** reading or working). Tap **Clear all** to reset.
- **Search**: matches the name, neighborhood, note, and tags.
- **Night off pick** (bottom left): picks a random place from whatever is currently showing.
- **Tap a card** to see details, change its status, edit, delete, or open its source link in a new tab.
- **Backup** (top right): export your data as a JSON file, import it back, or clear the sample data.

The app starts with 12 **sample places** (made up, clearly marked "Sample"). Use "Clear sample data" to remove them. Places you edit yourself are kept.

## Project layout

```
src/
  types.ts                  The shape of our data (Place, Tag, Filters). Start here.
  data/                     Preset tags and the sample places
  repository/               ALL saving and loading goes through here
    PlacesRepository.ts       the "contract" (list of functions)
    localStorageRepository.ts the browser-storage implementation
    index.ts                  picks which implementation the app uses
  lib/                      Small, plain functions: filtering, random pick, export/import, links
  hooks/                    usePlaces (data) and useFilters (filter selections)
  components/               The screen pieces (chips, cards, popups, forms)
  App.tsx                   Puts it all together on one screen
```

## Backend: Supabase

Components never touch storage directly. They talk to a `PlacesRepository` (`src/repository/PlacesRepository.ts`), and `src/repository/index.ts` picks which version to use:

- `supabaseRepository.ts` is used when `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in `.env.local`.
- `localStorageRepository.ts` is used otherwise.

**Database:** three tables, `places`, `custom_tags`, and `place_tags` (links a place to its tags). Every row has a `user_id`, and row level security lets a user see and change only their own rows. People who aren't signed in have no access to the tables.

**Sign-in:** email + password through Supabase Auth (`src/hooks/useAuth.ts` and `src/components/AuthScreen.tsx`). The app shows the sign-in screen until you're signed in, and the header has a **Sign out** button. In the Supabase dashboard, **Authentication → Sign In / Providers → Email** must be enabled (it is by default). If **Confirm email** is on, new accounts must click a link in their email before signing in. If it's off, they're signed in right away.

**Good to know:**
- The key in `.env.local` is the *publishable* key, which is meant to be public. Never put a `service_role` or `secret` key in a `VITE_` variable.
- Each new account starts with the 12 sample places, which you can clear.
- There is no "forgot password" screen yet.
- Importing a backup gives every place and custom tag new ids, so a backup from another device can't clash with existing rows.
- Saving a place and its tags is two steps, so a network failure in between could leave a place without its tags. A database function could make it one step later.

## Acceptance checks (walk through these by hand)

1. **Fast add**: tap **Add place**, type `Test Cafe`, press Enter. It appears at the top of the list in under 10 seconds.
2. **Combined filter**: open **Filters** and tap **cozy**, **$**, and **reading or working**. Only *The Quiet Kettle* and *Pinecone Coffee Library* remain. The "Showing 2 of 12" count updates instantly.
3. **Clear all**: tap **Clear all**. All places come back.
4. **Search**: type `oat milk`. Only *Pinecone Coffee Library* shows (it matches the note).
5. **No matches**: type `zzzz`. You see "No matches" with a **Clear all filters** button, and **Night off pick** is disabled.
6. **Night off pick**: with the cozy + $ + reading or working filter on, tap **Night off pick** several times with **Pick another**. You only ever see those two places.
7. **Persistence**: refresh the page. Your places (including `Test Cafe`) are still there.
8. **Export and import**: open **Backup**, tap **Export backup**. Delete a place, then **Import backup** and choose the downloaded file. Everything is restored.
9. **Edit and delete**: tap a card, then **Edit**, change something and save. Tap **Delete**, then **Yes, delete**.
10. **Source link**: edit a place, paste `instagram.com/p/example` into Source link, save. The details view has an **Open on …** button that opens a new tab.
11. **Custom tag**: in the add/edit form under **Add details**, type a tag name and tap **Add tag**. It appears under "My tags" and in the filters.
12. **Phone layout**: in your browser's developer tools, switch to a phone size (about 375px wide). Nothing scrolls sideways, buttons are easy to tap, and the filters fold up.
13. **Keyboard**: press Tab through the page. Every control shows a visible focus ring, and Esc closes popups.

## Not included (on purpose)

Automatic import from Instagram/TikTok/Google Maps, reading links from messages, accounts, sharing, maps, reviews, and AI auto-tagging.
