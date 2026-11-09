/*
  HG Fire Project Tracker — edit this file, then reload the page.
  Instructions: README.md

  asOf    Report date (YYYY-MM-DD). Fab warnings and to-do status are
          judged against this date, not the clock on the computer.
  stages  Progress columns, in order. Keep all four:
          Field Checks, Calced, Listed, Delivered.
  areas   One row on the progress grid.
          stages: [Field Checks, Calced, Listed, Delivered]
          true = done, false = still open. The first open stage is "next".
  fab     Optional fabrication schedule. Omit it, or use [], to hide that section.
          floor     Row label
          poj       POJ date (YYYY-MM-DD)
          fabCheck  Optional. Defaults to 21 days before POJ (about 3 weeks).
          toFab     Optional. Defaults to 14 days before POJ (2 weeks).
          sent      Set true after the stock-list check has gone out.
          The row is flagged once asOf is after fabCheck and sent is not true.
          Fab check should stay before the fab date.
  notes   Optional list of sentences. Omit it, or use [], if there are none.
          The page keeps this field and does not draw a notes block.
  city    Optional list of city submissions for the whole job.
          Omit it, or use [], to hide that section. This is job-level,
          not one row per floor. Add a named entry for each package.
          name       Label, such as "Main Building (Levels 1-5)"
          permit     Optional permit number, such as "#25110060".
                     Shown beside the package name.
          submitted  { status: "pending", "done", or "rejected", date optional }
                     "failed" is the same as "rejected". A date is YYYY-MM-DD.
          approved   Same shape. The cells read "Submitted to City" and
                     "Approved by City". "done" is a check. "rejected" is a red X.
                     A date is shown when present: "Done · Oct 28",
                     "Rejected · Nov 5", or "Pending · Nov 5".
          revisions  Optional extra rows on that same package, in order.
                     label      Left-cell label, such as "Submit Rev 1 to City"
                     submitted  Same shape as submitted above
                     approved   Same shape. The right cell stays "Approved by City".
          When submitted is done and approved is still pending, the approval
          cell counts days since the submit date. It shows "In review" through
          14 days, then "Running long".
  todos   Optional list. Omit it, or use [], to hide that section.
          text       The task
          due        Optional YYYY-MM-DD
          done       true or false
          completed  Optional YYYY-MM-DD. When done is true and this date is
                     set, the row shows "Done Nov 2".
          Open tasks are listed first, then done tasks. Inside each group
          the page sorts by due date. Tasks with no due date stay in the
          order listed, after any dated tasks in that group. A task past
          asOf that is not done is overdue. A task due within 3 days is
          highlighted. Done tasks are struck through.
*/

var TRACKER_DATA = {
  asOf: "2026-11-09",

  stages: ["Field Checks", "Calced", "Listed", "Delivered"],

  jobs: [
    {
      number: "4396",
      name: "Moody Center (Rice University)",
      areas: [
        { name: "Level 1", stages: [true, true, true, true] },
        { name: "Level 2", stages: [true, true, true, true] },
        { name: "Level 3", stages: [true, true, true, true] },
        { name: "Level 4/5", stages: [true, true, true, false] },
        { name: "Pavilion L1", stages: [false, false, false, false] },
        { name: "Pavilion L2", stages: [false, false, false, false] },
      ],
      fab: [
        {
          floor: "Level 3",
          poj: "2026-11-12",
          fabCheck: "2026-10-22",
          toFab: "2026-10-29",
          sent: true,
        },
      ],
      notes: [
        "City of Houston submittal for Levels 1 to 4 due Oct 26; Level 4 sheet and calc in progress.",
        "Level 3 permit calc uses the OH1 mechanical room with the quick-response reduction to 945 sq ft.",
      ],
      city: [
        {
          name: "Main Building (Levels 1-5)",
          permit: "#25110060",
          submitted: { status: "done", date: "2026-10-28" },
          approved: { status: "rejected" },
          revisions: [
            {
              label: "Submit Rev 1 to City",
              submitted: { status: "pending" },
              approved: { status: "pending" },
            },
          ],
        },
        {
          name: "Pavilion (L1-L2)",
          permit: "#25110061",
          submitted: { status: "pending" },
          approved: { status: "pending" },
        },
      ],
      todos: [
        { text: "Go over Standpipe and Pump layouts with Brent", due: "2026-11-02", done: false },
        { text: "Create page layout for Standpipe and Pump", due: "2026-11-02", done: false },
        { text: "Send shop drawings to Clark Construction", due: "2026-11-02", done: true },
        { text: "Put heads under stairwell landings Level 1", done: true },
      ],
    },
    {
      number: "4421",
      name: "811 Louisiana St, PG Loading Dock (Pipe Replacement)",
      areas: [
        { name: "Loading Dock", stages: [false, false, false, false] },
      ],
      city: [
        {
          name: "Loading Dock",
          submitted: { status: "pending" },
          approved: { status: "pending" },
        },
      ],
      todos: [],
    },
  ],
};
