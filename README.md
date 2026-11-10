# Approval Workflow Demo

A small, clickable demo of a role-based approval workflow. It runs entirely in the browser and uses sample data only.

## What it shows

- **Three roles, one record.** A request moves from Intake to Review to Approval. Each role sees its own step and its own actions.
- **Role switcher.** The demo bar at the top lets you view the app as any role, and resets the sample data.
- **List with search and filters.** Search by ID, title or category, filter by status, or show only what is waiting for the current role.
- **Detail page with activity log.** Every action is logged with who did it, what changed and when.
- **Change requests with sign-off.** Fields are locked. One role requests a change, a different role approves or rejects it. Both steps appear in the log.
- **Works on phones.** Tables become stacked rows on small screens, with no sideways scrolling.

## Try it in two minutes

1. Open a request with status *New* and choose **Submit for review**.
2. Use **View as Review**, then **Forward to approval**.
3. Use **View as Approval**, then **Approve**.
4. On any open request choose **Request a change**, then switch role to approve or reject it.
5. **Reset demo** restores the sample data.

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4. No backend. State lives in a reducer and is saved to `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Structure

- `src/reducer.ts`: workflow rules (status transitions, change requests, log entries)
- `src/seed.ts`: sample data, built by replaying actions through the reducer
- `src/store.tsx`: state, current role, persistence
- `src/components/`: demo bar, list, detail page, shared UI

---

Demo · sample data only. Names and requests are illustrative.
