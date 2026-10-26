# HG Fire Project Tracker

A static one-page tracker for HG Fire sprinkler design jobs. Open `index.html` in a browser, or publish the repository with GitHub Pages from the `main` branch, folder `/` (root). There is no build step.

## Update the jobs

Edit **`data.js` only**, then reload the page.

1. Set `asOf` to the report date (`YYYY-MM-DD`). Fab warnings use this date, not the clock on the computer.
2. Each job needs a `number`, a `name`, and `areas`.
3. Each area has a `name` and `stages`: four `true` / `false` values, in order:

   **Field Checks, Calced, Listed, Delivered.**

4. Add `fab` only when a floor has fabrication dates. Each entry needs:
   - `floor` — label, usually the same name as the area
   - `poj` — POJ date
   - `fabCheck` — optional. If you leave it out, the page uses 21 days before POJ (about 3 weeks). That is the soft target for sending the stock list to be checked.
   - `toFab` — optional. If you leave it out, the page uses 14 days before POJ.
   - `sent` — set to `true` after the fab check has gone out
5. The fab row turns red when `asOf` is after `fabCheck` and `sent` is not `true`. Fab check is meant to happen before the fab date.
6. `notes` is a list of sentences. Omit `fab`, `notes`, `city`, or `todos` (or leave them as `[]`) and that block is left off the card. Do not add a “no data” line.
7. `city` is a list of city submissions for the job, not one row per floor. Each entry has:
   - `name` — which package this is, such as `Main Building (Levels 1-5)`
   - `submitted` — Submitted to City. `{ status: "pending" }` or `{ status: "done", date: "YYYY-MM-DD" }`. `date` is optional.
   - `approved` — Approved by City, same shape.
   Pending stays neutral. A done submission is cyan. A done approval is a navy check. Add one list entry per package. Moody Center has two; the loading dock has one.
8. `todos` is a list of tasks. Each has `text`, optional `due` (`YYYY-MM-DD`), and `done` (`true` or `false`). The page sorts by due date, with undated tasks last. A task past `asOf` that is not done is red. A task due within 3 days, including today, is cyan. Done tasks are struck through. An empty list hides the To-Do section.

### Example

```javascript
{
  number: "4396",
  name: "Moody Center (Rice University)",
  areas: [
    { name: "Level 1", stages: [true, true, true, true] },
    { name: "Level 2", stages: [true, true, true, false] },
  ],
  fab: [
    { floor: "Level 3", poj: "2026-11-12", fabCheck: "2026-10-22", toFab: "2026-10-29" },
  ],
  notes: [
    "City of Houston submittal for Levels 1 to 4 due Oct 26; Level 4 sheet and calc in progress.",
  ],
  city: [
    {
      name: "Main Building (Levels 1-5)",
      submitted: { status: "pending" },
      approved: { status: "done", date: "2026-11-02" },
    },
  ],
  todos: [
    { text: "Level 4 sheet and calc", due: "2026-10-24", done: false },
    { text: "Send stock list", due: "2026-10-28", done: false },
    { text: "Field check pavilion", done: true },
  ],
}
```

Leave `fabCheck` and `toFab` unset when the usual offsets are right:

```javascript
{ floor: "Level 4", poj: "2026-12-03" }
```

That floor’s fab check is November 12 and its fab date is November 19.

## View it

Open `index.html`, or from this folder:

```bash
python3 -m http.server 8000
```

Then go to `http://localhost:8000`.

## GitHub Pages

In the repository settings, set Pages to deploy from branch `main` and folder `/` (root). `index.html` is at the root of the repo, so that is the whole site.
