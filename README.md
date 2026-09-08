# SkillBridge API

Express 5 + MongoDB (Mongoose) backend. Serves authentication, the role
dashboards, and the public contact form.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then set MONGODB_URI
npm run db:setup          # syncs indexes + inserts demo users
npm run dev               # http://localhost:5000/api
```

`db:setup` runs `db:migrate` followed by `db:seed`. Both are safe to rerun.

MongoDB has no schema-creation step — collections appear on first write. So
`db:migrate` applies the **indexes** declared on the Mongoose schemas via
`syncIndexes()`: it creates what is missing and drops indexes the schemas no
longer declare. Run it after changing an index in `src/models/schemas.js`.

Using Atlas? Add your machine's IP under **Network Access**, or the driver will
fail with a server-selection timeout.

## Demo accounts

| Email                        | Password     | Role          |
| ---------------------------- | ------------ | ------------- |
| `alex@skillbridge.com`       | `Skill@1234` | student       |
| `maria@skillbridge.com`      | `Skill@1234` | student       |
| `admin@skillbridge.com`      | `Admin@1234` | administrator |
| `instructor@skillbridge.com` | `Skill@1234` | instructor    |
| `employer@skillbridge.com`   | `Skill@1234` | employer      |
| `partner@skillbridge.com`    | `Skill@1234` | partner       |
| `superadmin@skillbridge.com` | `Skill@1234` | super_admin   |

## Endpoints

| Method | Path                          | Auth      | Purpose                        |
| ------ | ----------------------------- | --------- | ------------------------------ |
| GET    | `/api/health`                 | –         | Liveness check                 |
| POST   | `/api/auth/register`          | –         | Create an account              |
| POST   | `/api/auth/login`             | –         | Exchange credentials for a JWT |
| GET    | `/api/auth/me`                | Bearer    | Current user                   |
| POST   | `/api/auth/logout`            | –         | Clear the session cookie       |
| GET    | `/api/dashboard/overview`     | Bearer    | Role-shaped metric list        |
| GET    | `/api/dashboard/notifications`| Bearer    | Recent notifications           |
| GET    | `/api/dashboard/activity`     | Bearer    | Activity events for the user   |
| GET    | `/api/dashboard/status`       | Admin     | Platform-wide counts           |
| POST   | `/api/contact`                | –         | Public contact form submission |
| GET    | `/api/contact`                | Admin     | Contact message inbox          |
| POST   | `/api/spanish/assessment/start` | Bearer  | Start a dedicated Spanish diagnostic |
| GET    | `/api/spanish/assessment/:id/section/:skill` | Bearer | One skill bank, no answer keys |
| POST   | `/api/spanish/assessment/:id/answers` | Bearer | Save section answers |
| GET    | `/api/spanish/assessment/:id/review` | Bearer | Completion check |
| POST   | `/api/spanish/assessment/:id/submit` | Bearer | Score six skills and build profile |
| GET    | `/api/spanish/profile`        | Bearer    | Latest Spanish Profile |

Responses are always `{ success, message?, data?, errors? }`. Validation failures
return `errors` as a `{ field: message }` map, which the forms render inline.

Document ids are Mongo ObjectIds, surfaced to clients as strings in an `id`
field (never the raw `_id`).

The JWT is returned in the body *and* mirrored into an httpOnly `sb_token` cookie.
The frontend uses the body token (localStorage + `Authorization: Bearer`); the
cookie is there for future server-side rendering.

## Layout

```
server.js               boot: connect to MongoDB, then listen
src/app.js              express app (cors, json, routes, error handling)
src/config/env.js       env parsing with defaults
src/config/db.js        mongoose connection + startup ping
src/db/migrate.js       syncs schema indexes
src/db/seed.js          demo accounts
src/models/schemas.js   mongoose schemas for every collection
src/models/             query helpers per domain
src/controllers/        request handling
src/middleware/         auth, validation, error handler
src/routes/             route definitions
```

## Notes

- `JWT_SECRET` in `.env` is a development value. Replace it before deploying.
- `MONGODB_URI` contains credentials. `.env` is gitignored — keep it that way.
- CORS is limited to `CORS_ORIGIN` (defaults to the frontend on port 2003).
- Login returns the same message for an unknown email and a wrong password, so the
  API does not reveal which addresses are registered.
- `POST /api/contact` is rate limited to 5 messages per 15 minutes per email or IP.
- The error handler translates Mongoose failures into the standard response
  shape: `ValidationError` → 400 with a field map, duplicate key → 409,
  `CastError` → 400.
