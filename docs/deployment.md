# Deployment

**The Viemo Studio Operations Dashboard** · Project UG-S2-28

Vercel for the application, Supabase for the database, GitHub Pages for the
documentation. That combination is not a preference — it is the stack the client
already runs, named in the first requirements meeting.

---

## 1. What goes where, and why

| Piece | Host | Why there |
|---|---|---|
| The application | **Vercel** | Next.js deploys there with no configuration, and the client already uses it. Server Components, server actions and cookie sessions all work. |
| The database | **Supabase** | Postgres, already in the client's stack. See [ADR-0009](adr/0009-postgres-not-sqlite.md). |
| The documentation site | **GitHub Pages** | Pure static, free, rebuilt from the repository's markdown on every push. |

**The application cannot go on GitHub Pages.** Pages serves static files; this
app reads a database in Server Components, writes through server actions, and
holds sessions in cookies — none of which exist on a static host. Pages carries
the documentation only.

**Do not deploy it to a small self-managed VPS.** This was tried on a 1.6 GB
box. `next build` there exhausted memory, the OOM killer stopped the build, and
the machine thrashed so hard that sshd could not complete a handshake for half
an hour — taking unrelated services on the same box down with it. If a VPS is
ever required, build elsewhere and ship only the output.

---

## 2. Deploying the application

### 2.1 One-time setup

Someone with access to the Vercel account runs this once. It is interactive and
involves signing in, so it cannot be scripted for you.

```bash
vercel login
```

```bash
vercel link
```

Then set the environment variables. **Never commit a connection string** —
`.env` is gitignored and `.env.example` is the only one that ships.

```bash
vercel env add DATABASE_URL production
```

Paste the Supabase **pooled** connection string when prompted. Supabase gives it
under *Project Settings → Database → Connection string → URI*; it is the one on
port 6543 with `?pgbouncer=true`. The pooled string matters: Vercel runs
serverless functions that each open their own connection, and the direct
connection on port 5432 runs out of slots under any real traffic.

Repeat for `preview` and `development` if the team wants deploy previews to work
against a separate database — recommended, so a preview branch cannot write to
whatever the client is looking at.

### 2.2 Applying migrations

Migrations do not run automatically. Before the first deploy, and after any
schema change:

```bash
DATABASE_URL="<the supabase direct connection string>" npx prisma migrate deploy
```

Use the **direct** connection (port 5432) for migrations, not the pooled one —
PgBouncer in transaction mode cannot hold the advisory locks Prisma Migrate
takes.

### 2.3 Seeding

Only for a demonstration instance, and only ever with synthetic data.

```bash
DATABASE_URL="<the supabase direct connection string>" npx tsx prisma/seed.ts
```

The seed **deletes everything first**. Never run it against an instance holding
data anyone cares about.

### 2.4 Deploying

```bash
vercel --prod
```

Or connect the GitHub repository in the Vercel dashboard, and every push to
`main` deploys itself.

---

## 3. Before it holds real data

In this order. The first two are the ones that matter.

1. **Delete the `admin` / `admin` account** from `prisma/seed.ts`.
2. **Remove the account list** from the sign-in screen,
   `app/(auth)/login/page.tsx`.
3. **Leave `COOKIE_SECURE` unset.** It defaults to on in production, which is
   correct anywhere with a certificate — and Vercel gives every deployment
   HTTPS. The override exists only for a host reachable by bare IP, which cannot
   hold a certificate.
4. **Decide the APP 5 position** — see
   [compliance-and-standards.md](compliance-and-standards.md) §3.3. The people
   recorded in a BRM are third parties who never visit it, and someone has to
   decide how they are told.
5. **Set a backup schedule.** Supabase takes daily backups on paid plans;
   the free tier does not. Know which one you are on.

---

## 4. The documentation site

Nothing to do. `.github/workflows/pages.yml` rebuilds it on every push that
touches a document, the generator, the README or the handbook.

<https://fangyikunjian.github.io/viemo-ops-dashboard/>

To change a page, edit the markdown in `docs/` and push. There is no second copy
of the content.

---

## 5. If something goes wrong

| Symptom | Cause |
|---|---|
| Sign-in succeeds then bounces straight back to the sign-in screen | The session cookie is `Secure` and the host is serving over HTTP. Use HTTPS, or set `COOKIE_SECURE=false` if the host genuinely cannot have a certificate. |
| `ECONNREFUSED` locally | The local database is not running. `npm run db:up`. |
| `Too many connections` on Vercel | The direct connection string is being used at runtime. Switch `DATABASE_URL` to the pooled one on port 6543. |
| `prisma migrate deploy` hangs or errors on advisory locks | The pooled connection string is being used for migrations. Use the direct one on port 5432. |
| The build runs out of memory | Not on Vercel, which has enough. If you are building on a small VPS, see §1. |
