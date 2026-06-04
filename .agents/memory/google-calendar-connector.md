---
name: Google Calendar connector API paths
description: Correct path format for connectors.proxy("google-calendar", path) calls — needs full /calendar/v3/ prefix
---

# Google Calendar connector path format

**Rule:** When calling `connectors.proxy("google-calendar", path)`, always include the full API path starting with `/calendar/v3/`. The connector proxy base URL is `https://www.googleapis.com` — it does NOT strip or prepend the API version.

**Why:** The first implementation used `/freeBusy` which caused the proxy to return an HTML error page (DOCTYPE) instead of JSON. Adding `/calendar/v3/freeBusy` fixed it immediately.

**How to apply:**
- freebusy: `/calendar/v3/freeBusy`
- list events: `/calendar/v3/calendars/{calendarId}/events`
- create event: `POST /calendar/v3/calendars/{calendarId}/events`
- calendar list: `/calendar/v3/users/me/calendarList`

Always call `.text()` first then `JSON.parse()` (not `.json()` directly) so you can log the raw body if the response is not valid JSON.
