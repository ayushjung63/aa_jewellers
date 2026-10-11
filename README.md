# AA Jewellers

Mobile-first PWA for inventory, orders, sales dashboard and expenses.
Next.js 16 + Tailwind 4 + Postgres.

## Setup (once)

1. Create a Postgres database (local, or any host: Neon, Railway, Render…).
2. Tables are created/updated from `schema.sql` automatically on `npm run dev` and `npm run build` (or `npm run migrate`).
3. Copy `.env.example` to `.env.local` and fill it in. `AUTH_SECRET`: `openssl rand -hex 32`.
   Set `APP_TIMEZONE` to your timezone, it decides what "today" means on the dashboard.
4. `npm install`, then add up to 3 users: `npm run user -- <username>` (asks for a password; run again to reset it).
5. `npm run dev` → http://localhost:3000

Each user can change their password under **Account** (tap the circle on Home). Every change (orders, stock, expenses, sign-ins) is logged with the username in **Account → Activity log**.
To remove a user: `delete from users where username = '<name>';`

Product photos are stored in the database (`products.photo`) and served from `/photo/<id>`.

## Deploy

Push to GitHub → import on https://vercel.com → add the env vars from `.env.example` → deploy.

## Install on phone

Open the Vercel URL → Android Chrome: menu → **Install app**; iPhone Safari: Share → **Add to Home Screen**.

## How stock works

- Placing an order deducts stock in the database (`create_order`); overselling is refused.
- New orders start as Pending or Delivered. Marking Returned puts stock back; un-returning deducts it again.
- Sales on the dashboard = order totals (after discount), excluding Returned.

`npm test` checks the dashboard date windows.
