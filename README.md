# SkillBridge API

Express 5 + MySQL backend. Currently serves authentication for the frontend login.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then edit DB_PASSWORD etc.
npm run db:setup          # creates the schema + demo users
npm run dev               # http://localhost:5000/api
```

`db:setup` runs `db:migrate` (creates the `skillbridge` database and `users` table)
followed by `db:seed` (inserts demo accounts). Both are safe to rerun.

## Demo accounts

| Email                   | Password     | Role    |
| ----------------------- | ------------ | ------- |
| `alex@skillbridge.com`  | `Skill@1234` | student |
| `maria@skillbridge.com` | `Skill@1234` | student |
| `admin@skillbridge.com` | `Admin@1234` | admin   |

## Endpoints

| Method | Path                 | Auth   | Purpose                        |
| ------ | -------------------- | ------ | ------------------------------ |
| GET    | `/api/health`        | –      | Liveness check                 |
| POST   | `/api/auth/register` | –      | Create an account              |
| POST   | `/api/auth/login`    | –      | Exchange credentials for a JWT |
| GET    | `/api/auth/me`       | Bearer | Current user                   |
| POST   | `/api/auth/logout`   | –      | Clear the session cookie       |

Responses are always `{ success, message?, data?, errors? }`. Validation failures
return `errors` as a `{ field: message }` map, which the login form renders inline.

The JWT is returned in the body *and* mirrored into an httpOnly `sb_token` cookie.
The frontend uses the body token (localStorage + `Authorization: Bearer`); the
cookie is there for future server-side rendering.

## Layout

```
server.js              boot: verify DB, then listen
src/app.js             express app (cors, json, routes, error handling)
src/config/env.js      env parsing with defaults
src/config/db.js       mysql2 pool + startup ping
src/db/schema.sql      users table
src/db/migrate.js      creates database + applies schema
src/db/seed.js         demo accounts
src/models/            SQL queries
src/controllers/       request handling
src/middleware/        auth, validation, error handler
src/routes/            route definitions
```

## Notes

- `JWT_SECRET` in `.env` is a development value. Replace it before deploying.
- CORS is limited to `CORS_ORIGIN` (defaults to the frontend on port 2003).
- Login returns the same message for an unknown email and a wrong password, so the
  API does not reveal which addresses are registered.
