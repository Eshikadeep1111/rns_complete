# Employee Tracker API

API backend for employee GPS location tracking with session-based check-in/check-out. Built with Next.js 14 (App Router) and @vercel/postgres. No frontend UI — API routes only with a simple status page.

## Setup

```bash
npm install
```

Create `.env.local` with your Postgres connection string:

```
POSTGRES_URL=your_vercel_postgres_connection_string
```

## Local Development

```bash
npm run dev
```

Runs on http://localhost:3000

## Deployment to Vercel

1. Push to GitHub
2. Import the repository in Vercel
3. Go to Vercel Storage and create a Postgres database
4. Link the database to your project (this auto-sets `POSTGRES_URL`)
5. Run the contents of `sql/schema.sql` in the Vercel query console
6. Redeploy

## API Endpoints

### GET /api/health

Health check.

**Response:**
```json
{ "status": "ok", "timestamp": "2026-04-15T10:30:00.000Z" }
```

---

### POST /api/session/check-in

Employee checks in, creates a new active session.

**Request body:**
```json
{ "emp_id": "EMP001" }
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "session_id": 5,
    "emp_id": "EMP001",
    "check_in_time": "2026-04-15T09:00:00.000Z",
    "is_active": true
  }
}
```

**Error — already checked in (409):**
```json
{
  "success": false,
  "error": "Employee EMP001 already has an active session",
  "existing_session_id": 5
}
```

---

### POST /api/session/check-out

Employee checks out, closes the active session.

**Request body:**
```json
{ "session_id": 5, "emp_id": "EMP001" }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session_id": 5,
    "emp_id": "EMP001",
    "check_in_time": "2026-04-15T09:00:00.000Z",
    "check_out_time": "2026-04-15T18:00:00.000Z",
    "is_active": false,
    "total_pings": 108
  }
}
```

**Error — no active session (404):**
```json
{ "success": false, "error": "No active session found" }
```

---

### GET /api/session/status

Check if an employee has an active session (used by mobile app on startup).

**Query parameter:** `?emp_id=EMP001`

**Response — active session exists (200):**
```json
{
  "success": true,
  "has_active_session": true,
  "data": {
    "session_id": 5,
    "emp_id": "EMP001",
    "check_in_time": "2026-04-15T09:00:00.000Z",
    "is_active": true
  }
}
```

**Response — no active session (200):**
```json
{ "success": true, "has_active_session": false, "data": null }
```

---

### POST /api/location

Submit a GPS location ping. Requires an active session.

**Request body:**
```json
{
  "session_id": 5,
  "emp_id": "EMP001",
  "latitude": 17.385044,
  "longitude": 78.486671,
  "logged_at": "2026-04-15T10:30:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "session_id": 5,
    "emp_id": "EMP001",
    "latitude": 17.385044,
    "longitude": 78.486671,
    "logged_at": "2026-04-15T10:30:00.000Z",
    "synced": false,
    "created_at": "2026-04-15T10:30:01.000Z"
  }
}
```

**Errors:**
- 404: `{ "success": false, "error": "Session not found" }`
- 403: `{ "success": false, "error": "Session is no longer active. Employee is checked out." }`
- 403: `{ "success": false, "error": "Employee ID does not match session" }`

---

### GET /api/locations

Fetch location pings with optional filters. Used by Spring Boot sync service.

**Query parameters:**
| Param  | Type   | Default | Description                |
|--------|--------|---------|----------------------------|
| synced | string | (none)  | Filter: "true" or "false"  |
| emp_id | string | (none)  | Filter by employee ID      |
| limit  | number | 500     | Results per page (max 1000)|
| offset | number | 0       | Pagination offset          |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "session_id": 5,
      "emp_id": "EMP001",
      "latitude": 17.385044,
      "longitude": 78.486671,
      "logged_at": "2026-04-15T10:30:00.000Z",
      "synced": false,
      "created_at": "2026-04-15T10:30:01.000Z"
    }
  ],
  "pagination": { "total": 1250, "limit": 500, "offset": 0, "has_more": true }
}
```

---

### GET /api/sessions

Fetch session records with optional filters. Used by Spring Boot sync service.

**Query parameters:**
| Param     | Type   | Default | Description                |
|-----------|--------|---------|----------------------------|
| emp_id    | string | (none)  | Filter by employee ID      |
| is_active | string | (none)  | Filter: "true" or "false"  |
| limit     | number | 100     | Results per page (max 1000)|
| offset    | number | 0       | Pagination offset          |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "session_id": 5,
      "emp_id": "EMP001",
      "check_in_time": "2026-04-15T09:00:00.000Z",
      "check_out_time": "2026-04-15T18:00:00.000Z",
      "is_active": false,
      "created_at": "2026-04-15T09:00:01.000Z"
    }
  ],
  "pagination": { "total": 50, "limit": 100, "offset": 0, "has_more": false }
}
```

---

### PATCH /api/locations/mark-synced

Mark location pings as synced by their IDs.

**Request body:**
```json
{ "ids": [1, 2, 3, 4, 5] }
```

**Response (200):**
```json
{ "success": true, "updated": 5 }
```

## Notes

- All timestamps are ISO 8601 UTC strings
- All field names use snake_case
- Error responses follow the shape: `{ "success": false, "error": "message" }`
- Location pings require an active session — POST /api/location will reject pings for checked-out employees
- Results from GET /api/locations are ordered by `logged_at ASC` (oldest first)
- Results from GET /api/sessions are ordered by `check_in_time DESC` (newest first)
