/*
  Renders TRACKER_DATA into the page.
  Update jobs in data.js — this file only controls layout and theme.
*/
(function () {
  "use strict";

  var THEME_KEY = "hg-tracker-theme";
  var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var CITY_REVIEW_DAYS = 14;

  initThemeToggle();

  var data = window.TRACKER_DATA;
  var app = document.getElementById("app");

  if (!data || !app) {
    if (app) app.textContent = "Tracker data did not load. Check that data.js is next to index.html.";
    return;
  }

  var stages = data.stages && data.stages.length
    ? data.stages
    : ["Design", "Field Checks", "Calced", "Listed", "Delivered"];
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

  /* ---------- Summary ---------- */

  function renderSummary(jobList, stageNames, reportDate) {
    var overdueTodos = 0;
    var upcomingPoj = [];
    var cityPending = 0;
    var cityAwaiting = 0;
    var cityRejected = 0;
    var cityLong = 0;

    jobList.forEach(function (job) {
      (job.todos || []).forEach(function (t) {
        if (t && !t.done && isIsoDate(t.due) && reportDate > t.due) overdueTodos += 1;
      });
      (job.fab || []).forEach(function (f) {
        if (!f || !f.poj) return;
        if (f.poj >= reportDate) upcomingPoj.push(f.poj);
      });
      (job.city || []).forEach(function (c) {
        if (!c) return;
        inspectCity(c, reportDate, function (kind) {
          if (kind === "pending") cityPending += 1;
          if (kind === "awaiting") cityAwaiting += 1;
          if (kind === "rejected") cityRejected += 1;
          if (kind === "long") cityLong += 1;
        });
      });
    });

    upcomingPoj.sort();
    var nextPoj = upcomingPoj.length ? upcomingPoj[0] : null;
    var pojHint = nextPoj
      ? formatShort(nextPoj) + " · " + daysUntilLabel(reportDate, nextPoj)
      : "None scheduled";

    var cityOpen = cityPending + cityAwaiting + cityRejected;
    var cityValue = String(cityOpen);
    var cityHintParts = [];
    if (cityRejected) cityHintParts.push(cityRejected + " rejected");
    if (cityPending) cityHintParts.push(cityPending + " in review");
    if (cityAwaiting) cityHintParts.push(cityAwaiting + " to submit");
    if (cityLong) cityHintParts.push(cityLong + " running long");
    var cityHint = cityHintParts.length ? cityHintParts.join(" · ") : "All clear";
    var cityClass = cityRejected ? "alert" : (cityLong || cityPending) ? "warn" : cityAwaiting ? "warn" : "ok";

    var strip = el("section", { class: "summary", "aria-label": "At a glance" });
    strip.appendChild(summaryCard("Active jobs", String(jobList.length), jobList.length + " open cards", ""));
    strip.appendChild(summaryCard(
      "Overdue to-dos",
      String(overdueTodos),
      overdueTodos ? "Need attention" : "None overdue",
      overdueTodos ? "alert" : "ok"
    ));
    strip.appendChild(summaryCard(
      "Next POJ",
      nextPoj ? formatShort(nextPoj) : "—",
      pojHint,
      nextPoj && daysBetween(reportDate, nextPoj) <= 7 ? "warn" : ""
    ));
    strip.appendChild(summaryCard("City reviews", cityValue, cityHint, cityClass));
    return strip;
  }

  function summaryCard(label, value, hint, tone) {
    var card = el("div", { class: "summary-card" + (tone ? " " + tone : "") });
    card.appendChild(el("p", { class: "summary-label", text: label }));
    card.appendChild(el("p", { class: "summary-value", text: value }));
    if (hint) card.appendChild(el("p", { class: "summary-hint", text: hint }));
    return card;
  }

  function inspectCity(submission, reportDate, cb) {
    walkPermitPair(submission.submitted, submission.approved, reportDate, cb);
    (submission.revisions || []).forEach(function (rev) {
      if (!rev) return;
      walkPermitPair(rev.submitted, rev.approved, reportDate, cb);
    });
  }

  function walkPermitPair(submitted, approved, reportDate, cb) {
    var sub = permitStatus(submitted);
    var appv = permitStatus(approved);
    if (appv.status === "rejected") cb("rejected");
    else if (appv.status === "pending" && sub.status === "done") {
      cb("pending");
      if (sub.date && daysBetween(sub.date, reportDate) > CITY_REVIEW_DAYS) cb("long");
    } else if (sub.status === "pending") {
      cb("awaiting");
    }
  }

  /* ---------- Job card ---------- */

  function renderJob(job, stageNames, reportDate, index) {
    var stats = jobStats(job, stageNames, reportDate);
    var alerts = jobAlerts(job, reportDate);
    var pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

    var card = el("article", {
      class: "job open" + (alerts.hasAlert ? " has-alert" : ""),
      id: "job-" + index + "-" + slug(job.number),
      "data-job": job.number || "",
    });

    var toggle = el("button", {
      class: "job-toggle",
      type: "button",
      "aria-expanded": "true",
      "aria-controls": "job-body-" + index,
    });

    var ring = el("div", { class: "job-ring", style: "--pct:" + pct, "aria-hidden": "true" });
    ring.appendChild(el("span", { class: "job-ring-label", text: pct + "%" }));
    toggle.appendChild(ring);

    var titleBlock = el("div", { class: "job-title-block" });
    var title = el("h2", { class: "job-title" });
    title.appendChild(el("span", { class: "job-number", text: job.number || "" }));
    title.appendChild(document.createTextNode(" " + (job.name || "")));
    titleBlock.appendChild(title);

    var meta = el("p", { class: "job-meta" });
    meta.appendChild(document.createTextNode(stats.floors + " area" + (stats.floors === 1 ? "" : "s")));
    meta.appendChild(el("span", { class: "dot", text: "·" }));
    meta.appendChild(document.createTextNode(stats.done + "/" + stats.total + " stages"));
    meta.appendChild(el("span", { class: "dot", text: "·" }));
    meta.appendChild(document.createTextNode(stats.delivered + " delivered"));
    alerts.chips.forEach(function (chip) {
      meta.appendChild(el("span", { class: "chip " + chip.cls, text: chip.text }));
    });
    titleBlock.appendChild(meta);
    toggle.appendChild(titleBlock);

    toggle.appendChild(el("span", { class: "chevron", "aria-hidden": "true", text: "▾" }));
    card.appendChild(toggle);

    var body = el("div", { class: "job-body", id: "job-body-" + index });
    if ((job.areas || []).length) body.appendChild(renderProgress(job, stageNames, index));
    var fabRows = fabSchedule(job, reportDate);
    if (fabRows.length) body.appendChild(renderFab(fabRows, index));
    var city = renderCity(job, reportDate, index);
    if (city) body.appendChild(city);
    var todos = renderTodos(job, reportDate, index);
    if (todos) body.appendChild(todos);
    card.appendChild(body);

    toggle.addEventListener("click", function () {
      var open = card.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    return card;
  }

  function jobAlerts(job, reportDate) {
    var chips = [];
    var hasAlert = false;
    var overdue = (job.todos || []).filter(function (t) {
      return t && !t.done && isIsoDate(t.due) && reportDate > t.due;
    }).length;
    if (overdue) {
      chips.push({ cls: "chip-alert", text: overdue + " overdue" });
      hasAlert = true;
    }
    var pastFab = pastFabCount(job, reportDate);
    if (pastFab) {
      chips.push({ cls: "chip-warn", text: "Fab check past due" });
      hasAlert = true;
    }
    var rejected = false;
    (job.city || []).forEach(function (c) {
      if (!c) return;
      if (permitStatus(c.approved).status === "rejected") rejected = true;
      (c.revisions || []).forEach(function (r) {
        if (r && permitStatus(r.approved).status === "rejected") rejected = true;
      });
    });
    if (rejected) {
      chips.push({ cls: "chip-alert", text: "City rejected" });
      hasAlert = true;
    }
    return { chips: chips, hasAlert: hasAlert };
  }

  /* ---------- Progress ---------- */

  function renderProgress(job, stageNames, index) {
    var headingId = "progress-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    var head = el("div", { class: "section-head" });
    head.appendChild(el("h3", { id: headingId, text: "Progress" }));
    head.appendChild(el("span", { class: "section-note", text: stageNames.length + " stages" }));
    section.appendChild(head);

    var list = el("div", { class: "area-list" });
    (job.areas || []).forEach(function (area) {
      var flags = area.stages || [];
      var done = 0;
      var nextIndex = -1;
      flags.forEach(function (f, i) {
        if (f) done += 1;
        else if (nextIndex < 0) nextIndex = i;
      });

      var row = el("div", { class: "area-row" });
      row.appendChild(el("div", { class: "area-name", text: area.name || "" }));

      var barWrap = el("div", { class: "area-bar" });
      var bar = el("div", {
        class: "seg-bar",
        role: "img",
        "aria-label": (area.name || "Area") + ": " + done + " of " + stageNames.length + " stages done",
      });
      var labels = el("div", { class: "seg-labels", "aria-hidden": "true" });

      stageNames.forEach(function (name, i) {
        var complete = Boolean(flags[i]);
        var isNext = !complete && i === nextIndex;
        var segClass = complete ? "done" : isNext ? "next" : "";
        var seg = el("div", {
          class: "seg" + (segClass ? " " + segClass : ""),
          title: name + ": " + (complete ? "done" : isNext ? "next" : "open"),
        });
        bar.appendChild(seg);
        var short = shortStage(name);
        labels.appendChild(el("div", {
          class: "seg-label" + (complete ? " done" : isNext ? " next" : ""),
          text: short,
        }));
      });
      barWrap.appendChild(bar);
      barWrap.appendChild(labels);
      row.appendChild(barWrap);

      var countClass = done === 0 ? "none" : done === stageNames.length ? "full" : "";
      row.appendChild(el("div", {
        class: "area-count" + (countClass ? " " + countClass : ""),
        text: done + "/" + stageNames.length,
      }));
      list.appendChild(row);
    });
    section.appendChild(list);

    var legend = el("div", { class: "legend", "aria-hidden": "true" });
    legend.appendChild(legendItem("done", "Done"));
    legend.appendChild(legendItem("next", "Next up"));
    legend.appendChild(legendItem("open", "Open"));
    section.appendChild(legend);
    return section;
  }

  function legendItem(tone, label) {
    var node = el("span", { class: "legend-item" });
    node.appendChild(el("span", { class: "swatch " + tone }));
    node.appendChild(document.createTextNode(label));
    return node;
  }

  function shortStage(name) {
    var map = {
      "Design": "Design",
      "Field Checks": "Field",
      "Calced": "Calc",
      "Listed": "Listed",
      "Delivered": "Deliv",
    };
    return map[name] || name;
  }

  /* ---------- Fab ---------- */

  function renderFab(rows, index) {
    var headingId = "fab-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("div", { class: "section-head" }, [
      el("h3", { id: headingId, text: "Fab schedule" }),
    ]));

    var list = el("div", { class: "fab-list" });
    rows.forEach(function (row) {
      var tone = row.sent ? "sent" : row.warn ? "warn" : "upcoming";
      var card = el("div", { class: "fab-card " + tone });
      var top = el("div", { class: "fab-top" });
      top.appendChild(el("p", { class: "fab-floor", text: row.floor }));
      top.appendChild(el("p", { class: "fab-countdown", text: row.countdown }));
      card.appendChild(top);

      var tl = el("div", { class: "timeline" });
      tl.appendChild(tlStep("Fab check", row.checkLabel, row.checkState));
      tl.appendChild(tlStep("To fab", row.toFabLabel, row.toFabState));
      tl.appendChild(tlStep("POJ", row.pojLabel, row.pojState));
      card.appendChild(tl);
      list.appendChild(card);
    });
    section.appendChild(list);
    return section;
  }

  function tlStep(label, dateText, state) {
    var step = el("div", { class: "tl-step " + state });
    step.appendChild(el("div", { class: "tl-dot" }));
    step.appendChild(el("p", { class: "tl-label", text: label }));
    step.appendChild(el("p", { class: "tl-date", text: dateText }));
    return step;
  }

  function fabSchedule(job, reportDate) {
    return (job.fab || []).filter(function (entry) {
      return entry && entry.poj;
    }).map(function (entry) {
      return fabView(entry, reportDate);
    });
  }

  function fabView(entry, reportDate) {
    var r = resolveFab(entry);
    var pastCheck = !r.sent && reportDate > r.fabCheck;
    var outOfOrder = !r.sent && r.fabCheck >= r.toFab;
    var daysToPoj = daysBetween(reportDate, r.poj);

    var countdown;
    if (r.sent) countdown = "Sent to fab";
    else if (pastCheck) countdown = "Fab check past due";
    else if (daysToPoj === 0) countdown = "POJ today";
    else if (daysToPoj > 0) countdown = daysToPoj + " day" + (daysToPoj === 1 ? "" : "s") + " to POJ";
    else countdown = "POJ " + Math.abs(daysToPoj) + "d ago";

    var checkState, toFabState, pojState;
    if (r.sent) {
      checkState = "done";
      toFabState = "done";
      pojState = reportDate >= r.poj ? "done" : "current";
    } else if (pastCheck) {
      checkState = "warn";
      toFabState = reportDate >= r.toFab ? "warn" : "current";
      pojState = "";
    } else {
      checkState = reportDate >= r.fabCheck ? "current" : "";
      toFabState = "";
      pojState = "";
      if (reportDate >= r.fabCheck && reportDate < r.toFab) checkState = "current";
      else if (reportDate >= r.toFab) { checkState = "done"; toFabState = "current"; }
    }

    return {
      floor: r.floor,
      pojLabel: formatShort(r.poj),
      toFabLabel: formatShort(r.toFab),
      checkLabel: formatShort(r.fabCheck),
      countdown: countdown,
      warn: pastCheck || outOfOrder,
      sent: r.sent,
      checkState: checkState,
      toFabState: toFabState,
      pojState: pojState,
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

  /* ---------- City ---------- */

  function renderCity(job, reportDate, index) {
    var submissions = (job.city || []).filter(Boolean);
    if (!submissions.length) return null;

    var headingId = "city-" + index;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("div", { class: "section-head" }, [
      el("h3", { id: headingId, text: "City permits" }),
      el("span", { class: "section-note", text: "Review ≈ " + CITY_REVIEW_DAYS + " days" }),
    ]));

    submissions.forEach(function (submission) {
      var block = el("div", { class: "permit" });
      var head = el("div", { class: "permit-head" });
      var name = String(submission.name || "").trim();
      if (name) head.appendChild(el("h4", { class: "permit-name", text: name }));
      if (submission.permit) {
        head.appendChild(el("p", { class: "permit-num", text: "Permit " + submission.permit }));
      }
      block.appendChild(head);

      var flow = el("div", { class: "permit-flow" });
      flow.appendChild(permitPair("Submitted to City", submission.submitted, "Approved by City", submission.approved, reportDate));
      (submission.revisions || []).forEach(function (rev) {
        if (!rev) return;
        var label = String(rev.label || "Submitted to City").trim() || "Submitted to City";
        flow.appendChild(permitPair(label, rev.submitted, "Approved by City", rev.approved, reportDate));
      });
      block.appendChild(flow);
      section.appendChild(block);
    });
    return section;
  }

  function permitPair(submitLabel, submitted, approveLabel, approved, reportDate) {
    var pair = el("div", { class: "permit-pair" });
    pair.appendChild(renderPermitStep(submitLabel, submitted, reportDate, "submit"));
    pair.appendChild(el("div", { class: "pair-arrow", "aria-hidden": "true", text: "→" }));
    pair.appendChild(renderPermitStep(approveLabel, approved, reportDate, "approve", submitted));
    return pair;
  }

  function renderPermitStep(label, raw, reportDate, role, submittedRaw) {
    var state = permitStatus(raw);
    var tone = "pending";
    var mark = "";
    var stateText = "";
    var daysExtra = null;

    if (state.status === "done") {
      tone = "done";
      mark = "✓";
      stateText = state.date ? "Done · " + formatShort(state.date) : "Done";
    } else if (state.status === "rejected") {
      tone = "rejected";
      mark = "✕";
      stateText = state.date ? "Rejected · " + formatShort(state.date) : "Rejected";
    } else {
      // pending
      if (role === "approve" && submittedRaw) {
        var sub = permitStatus(submittedRaw);
        if (sub.status === "done" && sub.date) {
          var days = daysBetween(sub.date, reportDate);
          if (days > CITY_REVIEW_DAYS) {
            tone = "reviewing";
            mark = "!";
            stateText = "Running long";
            daysExtra = days + " days in review";
          } else {
            tone = "reviewing";
            mark = "…";
            stateText = "In review";
            daysExtra = days + " of " + CITY_REVIEW_DAYS + " days";
          }
        } else {
          stateText = "Pending";
        }
      } else {
        stateText = state.date ? "Pending · " + formatShort(state.date) : "Pending";
      }
    }

    var step = el("div", { class: "pstep " + tone });
    step.appendChild(el("span", { class: "pmark", "aria-hidden": "true", text: mark }));
    var copy = el("div", { class: "pcopy" });
    copy.appendChild(el("p", { class: "plabel", text: label }));
    copy.appendChild(el("p", { class: "pstate", text: stateText }));
    if (daysExtra) copy.appendChild(el("span", { class: "days-badge", text: daysExtra }));
    step.appendChild(copy);
    return step;
  }

  /* ---------- Todos ---------- */

  function renderTodos(job, reportDate, index) {
    var items = sortTodos(job.todos || []);
    if (!items.length) return null;

    var headingId = "todos-" + index;
    var openCount = items.filter(function (t) { return !t.done; }).length;
    var section = el("section", { class: "section", "aria-labelledby": headingId });
    section.appendChild(el("div", { class: "section-head" }, [
      el("h3", { id: headingId, text: "To-Do" }),
      el("span", { class: "section-note", text: openCount + " open" }),
    ]));

    var list = el("ul", { class: "todos" });
    items.forEach(function (item) {
      var view = todoView(item, reportDate);
      var row = el("li", { class: "todo" + (view.className ? " " + view.className : "") });
      row.appendChild(el("span", {
        class: "tmark",
        "aria-hidden": "true",
        text: view.done ? "✓" : "",
      }));

      var body = el("div", { class: "todo-body" });
      body.appendChild(el("p", { class: "todo-text", text: item.text }));
      var meta = el("div", { class: "todo-meta" });
      if (view.badge) meta.appendChild(el("span", { class: "badge " + view.badgeCls, text: view.badge }));
      if (view.dueLabel && !view.done) {
        meta.appendChild(el("time", { class: "due-date", datetime: view.due, text: "Due " + view.dueLabel }));
      }
      if (view.completedLabel) {
        meta.appendChild(el("span", { class: "badge badge-done", text: "Completed " + view.completedLabel }));
      }
      body.appendChild(meta);
      row.appendChild(body);

      if (view.sideLabel) {
        row.appendChild(el("div", { class: "todo-side", text: view.sideLabel }));
      }
      list.appendChild(row);
    });
    section.appendChild(list);
    return section;
  }

  function sortTodos(items) {
    return items.filter(function (item) {
      return item && String(item.text || "").trim() !== "";
    }).map(function (item, index) {
      return { item: item, index: index };
    }).sort(function (a, b) {
      var ad = isIsoDate(a.item.due) ? a.item.due : "";
      var bd = isIsoDate(b.item.due) ? b.item.due : "";
      if (ad && bd && ad !== bd) return ad < bd ? -1 : 1;
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return a.index - b.index;
    }).map(function (entry) { return entry.item; });
  }

  function todoView(item, reportDate) {
    var done = item.done === true;
    var due = isIsoDate(item.due) ? item.due : "";
    var completed = isIsoDate(item.completed) ? item.completed : "";
    var overdue = !done && due && reportDate > due;
    var soon = !done && due && !overdue && due <= addDays(reportDate, 3);
    var className = done ? "done" : overdue ? "overdue" : soon ? "soon" : "";
    var badge = "";
    var badgeCls = "";
    if (overdue) { badge = "Overdue"; badgeCls = "badge-overdue"; }
    else if (soon) { badge = "Due soon"; badgeCls = "badge-soon"; }

    var daysLate = overdue ? daysBetween(due, reportDate) : 0;
    return {
      done: done,
      due: due,
      dueLabel: due ? formatShort(due) : "",
      completedLabel: completed ? formatShort(completed) : "",
      className: className,
      badge: badge,
      badgeCls: badgeCls,
      sideLabel: overdue ? daysLate + "d late" : "",
    };
  }

  /* ---------- Stats / helpers ---------- */

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
      past: pastFabCount(job, reportDate),
    };
  }

  function pastFabCount(job, reportDate) {
    return (job.fab || []).filter(function (entry) {
      if (!entry || !entry.poj) return false;
      var resolved = resolveFab(entry);
      return !resolved.sent && reportDate > resolved.fabCheck;
    }).length;
  }

  function permitStatus(raw) {
    var status = "pending";
    var date = "";
    if (raw && typeof raw === "object") {
      var value = String(raw.status || "").toLowerCase();
      if (value === "done") status = "done";
      else if (value === "rejected" || value === "failed") status = "rejected";
      if (isIsoDate(raw.date)) date = raw.date;
    }
    return { status: status, date: date };
  }

  function isIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  function addDays(iso, days) {
    var parts = iso.split("-").map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    date.setUTCDate(date.getUTCDate() + days);
    var month = String(date.getUTCMonth() + 1).padStart(2, "0");
    var day = String(date.getUTCDate()).padStart(2, "0");
    return date.getUTCFullYear() + "-" + month + "-" + day;
  }

  function daysBetween(fromIso, toIso) {
    var a = fromIso.split("-").map(Number);
    var b = toIso.split("-").map(Number);
    var da = Date.UTC(a[0], a[1] - 1, a[2]);
    var db = Date.UTC(b[0], b[1] - 1, b[2]);
    return Math.round((db - da) / 86400000);
  }

  function daysUntilLabel(fromIso, toIso) {
    var d = daysBetween(fromIso, toIso);
    if (d === 0) return "today";
    if (d === 1) return "tomorrow";
    if (d > 1) return "in " + d + " days";
    if (d === -1) return "yesterday";
    return Math.abs(d) + " days ago";
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

  function initThemeToggle() {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    syncThemeControl(currentTheme());
    button.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {}
    });
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0f1a" : "#0f1535");
    syncThemeControl(theme);
  }

  function syncThemeControl(theme) {
    var button = document.getElementById("theme-toggle");
    if (!button) return;
    var dark = theme === "dark";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
})();
