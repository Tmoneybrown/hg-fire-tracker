/*
  Renders TRACKER_DATA into the page.
  Update jobs in data.js — this file only controls layout.
*/
(function () {
  "use strict";

  var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  var data = window.TRACKER_DATA;
  var app = document.getElementById("app");

  if (!data || !app) {
    if (app) app.textContent = "Tracker data did not load. Check that data.js is next to index.html.";
    return;
  }

  var stages = data.stages && data.stages.length ? data.stages : ["Field Checks", "Calced", "Listed", "Delivered"];
  var asOf = data.asOf || "";
  var jobs = data.jobs || [];

  var asOfNode = document.getElementById("as-of");
  if (asOfNode) {
    asOfNode.textContent = asOf ? formatLong(asOf) : "";
    if (asOf) asOfNode.setAttribute("datetime", asOf);
  }

  app.appendChild(renderSummary(jobs, stages, asOf));

  var list = el("div", { class: "jobs" });
  jobs.forEach(function (job, index) {
    list.appendChild(renderJob(job, stages, asOf, index));
  });
  app.appendChild(list);

  function renderSummary(jobList, stageNames, reportDate) {
    var floors = 0;
    var done = 0;
    var total = 0;
    var delivered = 0;
    var past = 0;

    jobList.forEach(function (job) {
      var stats = jobStats(job, stageNames, reportDate);
      floors += stats.floors;
      done += stats.done;
      total += stats.total;
      delivered += stats.delivered;
      past += stats.past;
    });

    var strip = el("section", { class: "summary", "aria-label": "Summary" });
    strip.appendChild(metric("Jobs", String(jobList.length)));
    strip.appendChild(metric("Floors / areas", String(floors)));
    strip.appendChild(metric("Stages complete", done + "/" + total));
    strip.appendChild(metric("Floors delivered", String(delivered)));
    strip.appendChild(metric("Past fab check", String(past), past > 0 ? "alert" : ""));
    return strip;
  }

  function renderJob(job, stageNames, reportDate, index) {
    var stats = jobStats(job, stageNames, reportDate);
    var fabRows = fabSchedule(job, reportDate);
    var notes = (job.notes || []).filter(function (note) { return String(note).trim() !== ""; });
    var card = el("article", {
      class: "job" + (stats.past > 0 ? " has-warning" : ""),
      id: "job-" + index + "-" + slug(job.number),
      "data-job": job.number || "",
    });

    var head = el("div", { class: "job-head" });
    var title = el("h2");
    title.appendChild(el("span", { class: "job-number", text: job.number || "" }));
    title.appendChild(document.createTextNode(" " + (job.name || "")));
    head.appendChild(title);
    if (stats.past > 0) {
      head.appendChild(el("p", { class: "alert-chip", text: "Fab check past due" }));
    }
    card.appendChild(head);

    var statRow = el("div", { class: "job-stats" });
    statRow.appendChild(metric("Floors", String(stats.floors)));
    statRow.appendChild(stageMetric(stats));
    statRow.appendChild(metric("Floors delivered", String(stats.delivered)));
    if (stats.nextFab) statRow.appendChild(metric("Next fab date", formatShort(stats.nextFab)));
    card.appendChild(statRow);

    if ((job.areas || []).length) {
      card.appendChild(renderProgress(job, stageNames, index));
    }
    if (fabRows.length) {
      card.appendChild(renderFab(fabRows, index));
    }
    if (notes.length) {
      card.appendChild(renderNotes(notes, index));
    }
    return card;
  }

  function renderProgress(job, stageNames, index) {
    var headingId = "progress-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("h3", { id: headingId, text: "Progress" }));

    var table = el("div", { class: "progress", role: "table", "aria-labelledby": headingId });
    var head = el("div", { class: "progress-head", role: "row" });
    head.appendChild(el("div", { role: "columnheader", text: "Floor / area" }));
    stageNames.forEach(function (name) {
      head.appendChild(el("div", { role: "columnheader", text: name }));
    });
    head.appendChild(el("div", { role: "columnheader", class: "count-head", text: "Done" }));
    table.appendChild(head);

    (job.areas || []).forEach(function (area) {
      var flags = area.stages || [];
      var done = 0;
      var row = el("div", { class: "progress-row", role: "row" });
      row.appendChild(el("div", { role: "rowheader", class: "area-name", text: area.name || "" }));
      stageNames.forEach(function (name, stageIndex) {
        var complete = Boolean(flags[stageIndex]);
        if (complete) done += 1;
        var cell = el("div", {
          role: "cell",
          class: "cell " + (complete ? "done" : "open"),
          "data-label": name,
          "aria-label": name + ": " + (complete ? "done" : "open"),
        });
        cell.appendChild(el("span", { class: "box", "aria-hidden": "true", text: complete ? "\u2713" : "" }));
        row.appendChild(cell);
      });
      var countClass = done === 0 ? "none" : done === stageNames.length ? "full" : "partial";
      row.appendChild(el("div", {
        role: "cell",
        class: "count " + countClass,
        text: done + "/" + stageNames.length,
        "aria-label": done + " of " + stageNames.length + " stages done",
      }));
      table.appendChild(row);
    });

    section.appendChild(table);
    return section;
  }

  function renderFab(rows, index) {
    var headingId = "fab-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("h3", { id: headingId, text: "Fab schedule" }));

    var table = el("table", { class: "schedule" });
    var thead = el("thead");
    var headRow = el("tr");
    ["Floor", "POJ", "Fab check", "To Fab"].forEach(function (label) {
      headRow.appendChild(el("th", { scope: "col", text: label }));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = el("tbody");
    rows.forEach(function (row) {
      var tr = el("tr", { class: row.warn ? "warn" : "" });
      tr.appendChild(el("th", { scope: "row", text: row.floor }));
      tr.appendChild(el("td", { text: row.pojLabel }));
      tr.appendChild(el("td", { class: row.warn ? "warn-text" : "", text: row.checkLabel }));
      tr.appendChild(el("td", { text: row.toFabLabel }));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  function renderNotes(notes, index) {
    var headingId = "notes-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("h3", { id: headingId, text: "Notes" }));
    var list = el("ul", { class: "notes" });
    notes.forEach(function (note) {
      list.appendChild(el("li", { text: note }));
    });
    section.appendChild(list);
    return section;
  }

  function stageMetric(stats) {
    var node = metric("Stages complete", stats.done + "/" + stats.total);
    var pct = stats.total ? Math.round((stats.done / stats.total) * 1000) / 10 : 0;
    var meter = el("div", { class: "meter", "aria-hidden": "true" });
    meter.appendChild(el("span", { style: "width:" + pct + "%" }));
    node.appendChild(meter);
    return node;
  }

  function metric(label, value, extraClass) {
    var node = el("div", { class: "metric" + (extraClass ? " " + extraClass : "") });
    node.appendChild(el("p", { class: "metric-label", text: label }));
    node.appendChild(el("p", { class: "metric-value", text: value }));
    return node;
  }

  function jobStats(job, stageNames, reportDate) {
    var areas = job.areas || [];
    var done = 0;
    var delivered = 0;
    areas.forEach(function (area) {
      var flags = area.stages || [];
      stageNames.forEach(function (_, index) {
        if (flags[index]) done += 1;
      });
      if (flags[stageNames.length - 1]) delivered += 1;
    });
    return {
      floors: areas.length,
      done: done,
      total: areas.length * stageNames.length,
      delivered: delivered,
      nextFab: nextFabDate(job, reportDate),
      past: pastFabCount(job, reportDate),
    };
  }

  function fabSchedule(job, reportDate) {
    return (job.fab || []).filter(function (entry) {
      return entry && entry.poj;
    }).map(function (entry) {
      return fabView(entry, reportDate);
    });
  }

  function fabView(entry, reportDate) {
    var resolved = resolveFab(entry);
    var past = !resolved.sent && reportDate > resolved.fabCheck;
    var outOfOrder = !resolved.sent && resolved.fabCheck >= resolved.toFab;
    var label;
    if (resolved.sent) label = "Sent";
    else if (past) label = "Past " + formatShort(resolved.fabCheck) + ", needs to go soon";
    else label = "Due " + formatShort(resolved.fabCheck);
    return {
      floor: resolved.floor,
      pojLabel: formatShort(resolved.poj),
      toFabLabel: formatShort(resolved.toFab),
      checkLabel: label,
      warn: past || outOfOrder,
    };
  }

  function resolveFab(entry) {
    return {
      floor: entry.floor || "",
      poj: entry.poj,
      toFab: entry.toFab || addDays(entry.poj, -14),
      fabCheck: entry.fabCheck || addDays(entry.poj, -21),
      sent: entry.sent === true,
    };
  }

  function nextFabDate(job, reportDate) {
    var dates = (job.fab || []).filter(function (entry) {
      return entry && entry.poj;
    }).map(function (entry) {
      return resolveFab(entry).toFab;
    }).sort();
    if (!dates.length) return null;
    var upcoming = dates.filter(function (date) { return date >= reportDate; });
    return upcoming.length ? upcoming[0] : dates[dates.length - 1];
  }

  function pastFabCount(job, reportDate) {
    return (job.fab || []).filter(function (entry) {
      if (!entry || !entry.poj) return false;
      var resolved = resolveFab(entry);
      return !resolved.sent && reportDate > resolved.fabCheck;
    }).length;
  }

  function addDays(iso, days) {
    var parts = iso.split("-").map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + days);
    var month = String(date.getUTCMonth() + 1).padStart(2, "0");
    var day = String(date.getUTCDate()).padStart(2, "0");
    return date.getUTCFullYear() + "-" + month + "-" + day;
  }

  function formatShort(iso) {
    var parts = iso.split("-").map(Number);
    return SHORT_MONTHS[parts[1] - 1] + " " + parts[2];
  }

  function formatLong(iso) {
    var parts = iso.split("-").map(Number);
    return LONG_MONTHS[parts[1] - 1] + " " + parts[2] + ", " + parts[0];
  }

  function slug(value) {
    return String(value || "job").replace(/[^a-zA-Z0-9]+/g, "-");
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key === "style") node.setAttribute("style", value);
        else node.setAttribute(key, value);
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }
})();
