/*
  HG Fire Project Tracker — edit this file, then reload the page.
  Instructions: README.md

  asOf    Report date (YYYY-MM-DD). Fab warnings are judged against this date.
  stages  Progress columns, in order. Keep all four.
  areas   One row on the progress grid.
          stages: [Field Checks, Calced, Listed, Delivered]
          true = done, false = still open.
  fab     Optional fabrication schedule. Omit it, or use [], to hide that section.
          floor     Row label
          poj       POJ date (YYYY-MM-DD)
          fabCheck  Optional. Defaults to 21 days before POJ (about 3 weeks).
          toFab     Optional. Defaults to 14 days before POJ (2 weeks).
          sent      Set true after the stock-list check has gone out.
          The row is flagged once asOf is after fabCheck and sent is not true.
          Fab check should stay before the fab date.
  notes   Optional. Omit it, or use [], to hide that section.
*/

var TRACKER_DATA = {
  asOf: "2026-10-26",

  stages: ["Field Checks", "Calced", "Listed", "Delivered"],

  jobs: [
    {
      number: "4396",
      name: "Moody Center (Rice University)",
      areas: [
        { name: "Level 1", stages: [true, true, true, true] },
        { name: "Level 2", stages: [true, true, true, false] },
        { name: "Level 3", stages: [true, true, false, false] },
        { name: "Level 4", stages: [false, false, false, false] },
        { name: "Level 5", stages: [false, false, false, false] },
        { name: "Pavilion L1", stages: [false, false, false, false] },
        { name: "Pavilion L2", stages: [false, false, false, false] },
      ],
      fab: [
        {
          floor: "Level 3",
          poj: "2026-11-12",
          fabCheck: "2026-10-22",
          toFab: "2026-10-29",
        },
      ],
      notes: [
        "City of Houston submittal for Levels 1 to 4 due Oct 26; Level 4 sheet and calc in progress.",
        "Level 3 permit calc uses the OH1 mechanical room with the quick-response reduction to 945 sq ft.",
      ],
    },
    {
      number: "4421",
      name: "811 Louisiana St, PG Loading Dock (Pipe Replacement)",
      areas: [
        { name: "Loading Dock", stages: [false, false, false, false] },
      ],
    },
  ],
};
