# HG Fire Project Tracker

A static one-page tracker for HG Fire sprinkler design jobs. Open `index.html` in a browser, or publish the repository with GitHub Pages from the `main` branch, folder `/` (root). There is no build step.

Job data lives only in `data.js`. The page reads that file and draws the layout. The light/dark choice is a browser preference, not job data.

## Layout

The page is a single column:

- **Header.** HG Fire logo, “Project Tracker”, and the report date from `asOf`.
- **Summary.** Four cards: active jobs, overdue to-dos, the next POJ, and open city reviews.
- **Job cards.** One card per job. Each card starts open. Click the header to collapse or expand it. The ring is the share of stages that are done. A red top border means the job has an overdue to-do, a fab check that is past due, or a city rejection.
- **Progress.** One segmented bar per area. Green is done, blue is the next open stage, gray is still open. Short labels sit under the segments: Field, Calc, Listed, Deliv.
- **Fab schedule.** A timeline of fab check, to fab, and POJ. Omit `fab` and this block is left off.
- **City permits.** Submitted and approved cells for each package, plus any revision rows. A permit number, when set, sits on the right of the package name.
- **To-do.** Open tasks first, then done tasks. Omit `todos` or leave it `[]` and this block is left off.

On a narrow screen the summary becomes two columns, area names stack above the bar, and city cells stack.

## Light and dark

The header has a **Light / Dark** button (sun in light mode, moon in dark mode). Click it to switch. The choice is saved in this browser’s `localStorage` and used on the next visit. The first visit, with nothing saved, follows the operating system (`prefers-color-scheme`). A short script in the page head sets the theme before the first paint, so the page does not flash the wrong colors.

Colors are CSS variables. Dark mode is `[data-theme="dark"]` on the root element. There is one stylesheet.

## Update the jobs

Edit **`data.js` only**, then reload the page.

1. Set `asOf` to the report date (`YYYY-MM-DD`). Fab warnings and to-do status use this date, not the clock on the computer.
2. Each job needs a `number`, a `name`, and `areas`.
3. `stages` is the progress columns, in order. Keep all four:

   **Field Checks, Calced, Listed, Delivered.**

   Each area has a `name` and `stages`: four `true` / `false` values in that same order. `true` is done. The first `false` is drawn as the next stage.
4. Add `fab` only when a floor has fabrication dates. Each entry needs:
   - `floor` — label, usually the same name as the area
   - `poj` — POJ date
   - `fabCheck` — optional. If you leave it out, the page uses 21 days before POJ (about 3 weeks). That is the soft target for sending the stock list to be checked.
   - `toFab` — optional. If you leave it out, the page uses 14 days before POJ.
   - `sent` — set to `true` after the fab check has gone out
5. The fab row is flagged when `asOf` is after `fabCheck` and `sent` is not `true`. The card says “Fab check past due”. Fab check is meant to happen before the fab date.
6. `notes` is an optional list of sentences kept on the job. The page does not draw a notes block. Omit `fab`, `city`, or `todos` (or leave them as `[]`) and that block is left off the card. Do not add a “no data” line.
7. `city` is a list of city submissions for the job, not one row per floor. Each entry has:
   - `name` — which package this is, such as `Main Building (Levels 1-5)`
   - `permit` — optional permit number, such as `#25110060`. Shown beside the package name.
   - `submitted` — Submitted to City. `{ status: "pending" }`, `{ status: "done", date: "YYYY-MM-DD" }`, or `{ status: "rejected" }`. `date` is optional. `failed` is the same as `rejected`.
   - `approved` — Approved by City, same shape.
   - `revisions` — optional extra rows on that same package, in order. Each has `label` (the left cell, such as `Submit Rev 1 to City`), `submitted`, and `approved`. The right cell stays “Approved by City”. Omit `revisions` when there is no resubmittal.

   A done step with a date reads “Done · Oct 28”. A rejected step with a date reads “Rejected · Nov 5”. Without a date those read “Done” and “Rejected”. Pending stays neutral. When a package has been submitted and approval is still pending, the approval cell counts days since the submit date: “In review” through 14 days, then “Running long”.
8. `todos` is a list of tasks. Each has:
   - `text` — the task
   - `due` — optional `YYYY-MM-DD`
   - `done` — `true` or `false`
   - `completed` — optional `YYYY-MM-DD`. When `done` is true and this is set, the row shows a “Done Nov 2” badge.

   Open tasks are listed first, then done tasks. Inside each group the page sorts by due date. Tasks with the same due date, and tasks with no due date, stay in the order listed. Undated tasks come after dated ones in that group. A task past `asOf` that is not done is overdue (red, with how many days late). A task due within 3 days, including today, is highlighted. Done tasks are struck through. An empty list hides the To-Do section.

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
      permit: "#25110060",
      submitted: { status: "done", date: "2026-10-28" },
      approved: { status: "rejected", date: "2026-11-05" },
    },
  ],
  todos: [
    { text: "Level 4 sheet and calc", due: "2026-10-24", done: false },
    { text: "Send stock list", due: "2026-10-28", done: false },
    { text: "Field check pavilion", done: true, completed: "2026-11-02" },
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
