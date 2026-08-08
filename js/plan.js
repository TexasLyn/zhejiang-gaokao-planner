(function () {
  var MAX = 80;
  var S = window.GK.state;
  var activePlanId = null;

  function activePlan() {
    var p = S.plans.find(function (x) { return x.id === activePlanId; });
    return p || S.plans[0] || null;
  }

  /* ---------- 列显示设置 ---------- */
  var COL_DEFS = [
    { k: "code", label: "院校代码", cls: "col-code" },
    { k: "majorCode", label: "专业代码", cls: "col-code" },
    { k: "trend", label: "趋势", cls: "col-trend" },
    { k: "y26", label: "2026", cls: "col-num" },
    { k: "y25", label: "2025", cls: "col-num" },
    { k: "y24", label: "2024", cls: "col-num" },
    { k: "y23", label: "2023", cls: "col-num" },
    { k: "y22", label: "2022", cls: "col-num" },
    { k: "y21", label: "2021", cls: "col-num" },
    { k: "duration", label: "学制", cls: "col-num" },
    { k: "tuition", label: "学费", cls: "col-num" },
    { k: "mark", label: "标记", cls: "col-mark" }
  ];
  function planCols() {
    if (!S.ui || !S.ui.planCols) S.ui = Object.assign({}, S.ui || {}, { planCols: {} });
    COL_DEFS.forEach(function (c) { if (S.ui.planCols[c.k] == null) S.ui.planCols[c.k] = true; });
    return S.ui.planCols;
  }
  function visibleColCount() {
    var cols = planCols(), n = 0;
    COL_DEFS.forEach(function (c) { if (cols[c.k]) n++; });
    return n;
  }
  function renderHead() {
    var tr = document.getElementById("planHeadRow");
    if (!tr) return;
    var cols = planCols();
    var h = '<th class="col-seq">#</th><th class="col-school">院校名称</th><th class="col-major">专业名称</th>';
    COL_DEFS.forEach(function (c) { if (cols[c.k]) h += '<th class="' + c.cls + '">' + c.label + "</th>"; });
    h += '<th class="col-act">操作</th>';
    tr.innerHTML = h;
  }
  function updateColsBadge() {
    var b = document.getElementById("planColsCount");
    if (b) b.textContent = visibleColCount();
  }
  function renderColsPop() {
    var pop = document.getElementById("planColsPop");
    if (!pop) return;
    var cols = planCols();
    var html = '<div class="pcol-title">表格显示列 <span class="muted">取消勾选即隐藏</span></div>';
    COL_DEFS.forEach(function (c) {
      html += '<label class="pcol-item"><input type="checkbox" data-col="' + c.k + '"' + (cols[c.k] ? " checked" : "") + "><span>" + c.label + "</span></label>";
    });
    html += '<button class="btn btn-ghost btn-sm" id="pcolAll" type="button">全部显示</button>';
    pop.innerHTML = html;
    pop.querySelectorAll("input[data-col]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        cols[this.getAttribute("data-col")] = this.checked;
        window.GK.save();
        renderHead();
        renderTable();
        updateColsBadge();
      });
    });
    var all = pop.querySelector("#pcolAll");
    if (all) all.addEventListener("click", function () {
      COL_DEFS.forEach(function (c) { cols[c.k] = true; });
      window.GK.save();
      renderColsPop();
      renderHead();
      renderTable();
      updateColsBadge();
    });
  }

  /* ---------- 标签页 ---------- */
  function renderTabs() {
    var bar = document.getElementById("planTabs");
    bar.innerHTML = "";
    if (!activePlanId && S.plans.length) activePlanId = S.plans[0].id;
    S.plans.forEach(function (p) {
      var tab = document.createElement("button");
      tab.className = "plan-tab" + (p.id === activePlanId ? " is-active" : "");
      tab.title = "双击重命名";
      var name = document.createElement("span");
      name.textContent = p.name;
      var close = document.createElement("span");
      close.className = "tab-close";
      close.appendChild(window.GKIcon.render("x", 12));
      close.addEventListener("click", function (e) {
        e.stopPropagation();
        if (S.plans.length <= 1) { window.GK.toast("至少保留一个方案", "error"); return; }
        window.GK.confirmDialog("删除方案", "确定删除「" + p.name + "」及其全部志愿？", function () {
          S.plans = S.plans.filter(function (x) { return x.id !== p.id; });
          if (activePlanId === p.id) activePlanId = S.plans[0].id;
          window.GK.save();
          renderAll();
        });
      });
      tab.appendChild(name);
      tab.appendChild(close);
      tab.addEventListener("click", function () {
        if (activePlanId === p.id) return;
        activePlanId = p.id;
        renderAll();
      });
      tab.addEventListener("dblclick", function () {
        var input = document.createElement("input");
        input.value = p.name;
        input.style.cssText = "width:110px;height:26px;font-size:12.5px;border:1px solid var(--accent);border-radius:6px;padding:0 8px;outline:none;background:var(--surface);color:var(--text)";
        name.replaceWith(input);
        input.focus();
        input.select();
        function done(commit) {
          if (commit && input.value.trim()) p.name = input.value.trim();
          window.GK.save();
          renderTabs();
        }
        input.addEventListener("blur", function () { done(true); });
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") done(true);
          if (e.key === "Escape") done(false);
        });
      });
      bar.appendChild(tab);
    });
    var add = document.createElement("button");
    add.className = "plan-tab";
    add.style.color = "var(--text-3)";
    add.innerHTML = "";
    add.appendChild(window.GKIcon.render("plus", 14));
    add.title = "新建方案";
    add.addEventListener("click", function () {
      var p = { id: window.GK.uid(), name: "方案" + (S.plans.length + 1), items: [], deleted: [] };
      S.plans.push(p);
      activePlanId = p.id;
      window.GK.save();
      renderAll();
      window.GK.toast("已新建方案", "success");
    });
    bar.appendChild(add);
    document.getElementById("navPlanCount").textContent = S.plans.length;
  }

  /* ---------- 表格 ---------- */
  function renderTable() {
    var plan = activePlan();
    var tbody = document.getElementById("planBody");
    var count = plan ? plan.items.length : 0;
    renderHead();
    updateColsBadge();
    document.getElementById("navPlanCount").textContent = S.plans.length;
    document.getElementById("planStats").innerHTML = "共 <b>" + count + "</b> 个志愿 · 回收站 <b>" + (plan ? plan.deleted.length : 0) + "</b> · 剩余 <b>" + (MAX - count) + "</b> 个空位（上限 80）";
    var tag = document.getElementById("limitTag");
    if (count >= MAX) { tag.textContent = "已达上限 " + MAX; tag.style.display = ""; }
    else if (count >= MAX - 5) { tag.textContent = "剩余 " + (MAX - count) + " 个空位"; tag.style.display = ""; }
    else tag.style.display = "none";

    if (!plan || !plan.items.length) {
      tbody.innerHTML = '<tr><td colspan="' + (4 + visibleColCount()) + '"><div class="empty-state">' + window.GK.emptyIllust("plan") + '<div class="es-title">还没有志愿</div><div class="es-desc">先去「数据查询」找找，再一键加入方案吧。</div><div class="es-copy">或者从「志愿库」直接添加已收藏的志愿。</div></div></td></tr>';
      return;
    }

    var html = "";
    plan.items.forEach(function (it, i) {
      html += renderRow(it, i);
    });
    tbody.innerHTML = html;
    window.GKIcon.mount(tbody);

    /* 标记点击 */
    tbody.querySelectorAll(".mark-dot").forEach(function (dot) {
      dot.addEventListener("click", function () {
        var it = findItem(dot.getAttribute("data-uid"));
        if (!it) return;
        var m = parseInt(dot.getAttribute("data-mark"), 10);
        it.mark = it.mark === m ? null : m;
        window.GK.save();
        renderTable();
        updateStats();
      });
    });

    tbody.querySelectorAll(".row-btn[data-del]").forEach(function (b) {
      b.addEventListener("click", function () {
        var it = findItem(b.getAttribute("data-del"));
        if (!it) return;
        var plan2 = activePlan();
        plan2.items = plan2.items.filter(function (x) { return x.uid !== it.uid; });
        it.deletedAt = Date.now();
        plan2.deleted.unshift(it);
        window.GK.save();
        renderTable();
        updateStats();
      });
    });

    /* 双击序号改序 */
    tbody.querySelectorAll(".seq-cell").forEach(function (td) {
      td.addEventListener("dblclick", function () {
        var it = findItem(td.getAttribute("data-uid"));
        if (!it) return;
        var plan2 = activePlan();
        var input = document.createElement("input");
        input.type = "number";
        input.value = String(plan2.items.indexOf(it) + 1);
        input.style.cssText = "width:56px;height:26px;font-size:12.5px;border:1px solid var(--accent);border-radius:6px;padding:0 6px;text-align:center;outline:none;background:var(--surface);color:var(--text)";
        td.textContent = "";
        td.appendChild(input);
        input.focus();
        input.select();
        function done(commit) {
          var target = commit ? parseInt(input.value, 10) - 1 : -1;
          if (target >= 0 && target < plan2.items.length) {
            plan2.items.splice(plan2.items.indexOf(it), 1);
            plan2.items.splice(target, 0, it);
          }
          window.GK.save();
          renderTable();
          updateStats();
        }
        input.addEventListener("blur", function () { done(false); });
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") done(true);
          if (e.key === "Escape") done(false);
        });
      });
    });
    tbody.querySelectorAll(".school-link").forEach(function (b) {
      b.addEventListener("click", function () {
        if (window.GK.explore) window.GK.explore.openSchool(b.getAttribute("data-school"));
        else window.GK.showSchoolModal(b.getAttribute("data-school"));
      });
    });
    bindDrag(tbody);
    bindNoteEdit(tbody);
  }

  function findItem(uid) {
    var plan = activePlan();
    if (!plan) return null;
    return plan.items.find(function (x) { return x.uid === uid; });
  }

  function renderRow(it, i) {
    var mark = it.mark;
    var markCls = mark ? ' data-mark="' + mark + '"' : "";
    var label = mark ? S.marks[mark - 1].label : "";
    var labelColor = mark ? "var(--m" + mark + ")" : "";
    var dots = "";
    S.marks.forEach(function (m) {
      dots += '<button class="mark-dot' + (mark === m.id ? " is-on" : "") + '" data-uid="' + it.uid + '" data-mark="' + m.id + '" style="background:var(--m' + m.id + ')" title="' + m.label + '"></button>';
    });
    var score = function (h) { return h && h.score ? '<span class="score-cell">' + h.score + '<span class="muted">/' + (h.rank || "-") + '</span></span>' : '<span class="muted">-</span>'; };
    var cols = planCols();
    var cells = "";
    if (cols.code) cells += '<td class="col-code muted">' + esc(it.code) + "</td>";
    if (cols.majorCode) cells += '<td class="col-code muted">' + esc(it.majorCode) + "</td>";
    if (cols.trend) cells += '<td class="col-trend">' + window.GK.sparkline([{rank:it.s26&&it.s26.rank},{rank:it.s25&&it.s25.rank},{rank:it.s24&&it.s24.rank},{rank:it.s23&&it.s23.rank},{rank:it.s22&&it.s22.rank},{rank:it.s21&&it.s21.rank}]) + "</td>";
    if (cols.y26) cells += '<td class="col-num">' + score(it.s26) + "</td>";
    if (cols.y25) cells += '<td class="col-num">' + score(it.s25) + (window.GK.state.theme.exp && eqOf(it) != null ? '<div class="muted" style="font-size:10px;line-height:1.2">等位≈' + esc(eqOf(it)) + "</div>" : "") + "</td>";
    if (cols.y24) cells += '<td class="col-num">' + score(it.s24) + "</td>";
    if (cols.y23) cells += '<td class="col-num">' + score(it.s23) + "</td>";
    if (cols.y22) cells += '<td class="col-num">' + score(it.s22) + "</td>";
    if (cols.y21) cells += '<td class="col-num">' + score(it.s21) + "</td>";
    if (cols.duration) cells += '<td class="col-num">' + esc(it.duration || "") + "</td>";
    if (cols.tuition) cells += '<td class="col-num">' + esc(it.tuition || "") + "</td>";
    if (cols.mark) {
      cells += '<td class="col-mark"><span class="mark-dots">' + dots + "</span>" + (mark ? '<span class="mark-label" style="color:' + labelColor + '">' + label + "</span>" : "") +
        (it.newFlag === "新招专业" ? '<span class="flag-pill flag-new" title="今年新招专业">新</span>' : it.newFlag === "新招院校" ? '<span class="flag-pill flag-new" title="今年新招院校">新校</span>' : "") +
        (it.planChange && it.planChange.pct != null && it.planChange.pct <= -20 ? '<span class="flag-pill flag-down" title="2026 计划比 2025 缩招 ' + Math.abs(it.planChange.pct) + '%">▼' + Math.abs(it.planChange.pct) + '%</span>' : it.planChange && it.planChange.pct != null && it.planChange.pct >= 20 ? '<span class="flag-pill flag-up" title="2026 计划比 2025 扩招 ' + it.planChange.pct + '%">▲' + it.planChange.pct + '%</span>' : "") +
        (it.subj26 && S.profile && !window.GK.data.subjectFit(S.profile.subjects, it.subj26) ? '<span class="flag-pill flag-subj" title="选科要求：' + esc(it.subj26) + '">选科不符</span>' : "") +
        "</td>";
    }
    return '<tr draggable="true" data-uid="' + it.uid + '"' + markCls + '>' +
      '<td class="col-seq seq-cell" data-uid="' + it.uid + '" style="cursor:pointer"><span class="drag-handle"></span> ' + (i + 1) + '</td>' +
      '<td class="col-school"><button class="school-link" data-school="' + esc(window.GK.data.cleanSchoolName(it.name)) + '">' + esc(window.GK.data.cleanSchoolName(it.name)) + '</button>' + window.GK.schoolPills(it.code, it.name) + '</td>' +
      '<td class="col-major">' + esc(it.majorName) +
      (it.city || (it.campuses && it.campuses.length) ? '<div class="muted" style="font-size:10.5px;margin-top:1px">' + esc([it.city, it.campuses.join("→")].filter(Boolean).join(" · ")) + "</div>" : "") +
      '</td>' +
      cells +
      '<td class="col-act"><span class="row-actions"><button class="row-btn" data-edit="' + it.uid + '" title="备注"><span data-icon="edit"></span></button><button class="row-btn danger" data-del="' + it.uid + '" title="删除"><span data-icon="trash"></span></button></span></td>' +
      '</tr>';
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function eqOf(it) {
    if (it.eq25) return it.eq25;
    if (it.s25 && it.s25.score) return window.GK.data.equivalentScore(2025, it.s25.score, 2026);
    return null;
  }

  /* ---------- 拖拽 ---------- */
  var dragUid = null;
  function bindDrag(tbody) {
    tbody.querySelectorAll("tr[draggable]").forEach(function (tr) {
      tr.addEventListener("dragstart", function () {
        dragUid = tr.getAttribute("data-uid");
        tr.style.opacity = "0.45";
      });
      tr.addEventListener("dragend", function () {
        tr.style.opacity = "";
        tbody.querySelectorAll("tr").forEach(function (r) { r.classList.remove("drag-over"); });
      });
      tr.addEventListener("dragover", function (e) {
        e.preventDefault();
        tbody.querySelectorAll("tr").forEach(function (r) { r.classList.remove("drag-over"); });
        tr.classList.add("drag-over");
      });
      tr.addEventListener("drop", function (e) {
        e.preventDefault();
        var plan = activePlan();
        if (!plan || !dragUid) return;
        var from = plan.items.findIndex(function (x) { return x.uid === dragUid; });
        var to = plan.items.findIndex(function (x) { return x.uid === tr.getAttribute("data-uid"); });
        if (from >= 0 && to >= 0 && from !== to) {
          var moved = plan.items.splice(from, 1)[0];
          plan.items.splice(to, 0, moved);
          window.GK.save();
          renderTable();
        }
      });
    });
  }

  /* ---------- 统计 ---------- */
  function updateStats() {
    var plan = activePlan();
    var items = plan ? plan.items : [];
    var counts = [0, 0, 0, 0, 0, 0, 0];
    items.forEach(function (it) {
      if (it.mark) counts[it.mark]++;
    });
    var marked = items.length - counts[0];
    document.getElementById("statGrid").innerHTML =
      statCell(items.length, "总志愿") + statCell(marked, "已标记") + statCell(items.length - marked, "未标记");

    var bar = document.getElementById("stackBar");
    bar.innerHTML = "";
    S.marks.forEach(function (m, i) {
      var span = document.createElement("span");
      span.style.width = items.length ? (counts[i + 1] * 100 / items.length) + "%" : "0%";
      span.style.background = "var(--m" + (i + 1) + ")";
      span.title = m.label + " " + counts[i + 1];
      bar.appendChild(span);
    });

    var legend = document.getElementById("markLegend");
    legend.innerHTML = "";
    S.marks.forEach(function (m, i) {
      var row = document.createElement("div");
      row.className = "mark-legend-row";
      row.innerHTML = '<span class="dot" style="background:var(--m' + (i + 1) + ')"></span><span>' + m.label + "</span><span class=\"cnt\">" + counts[i + 1] + "</span>";
      legend.appendChild(row);
    });

    /* 梯度建议 */
    var grad = document.getElementById("gradBlock");
    var g = [0, 0, 0, 0];
    items.forEach(function (it) {
      var h = it.s26 || it.s25 || it.s24 || it.s23;
      if (h && h.rank) {
        var r = window.GK.data.grade(S.profile && S.profile.rank, h.rank);
        if (r === 1) g[0]++; else if (r === 2) g[1]++; else if (r === 3) g[2]++; else g[3]++;
      }
    });
    var totalG = g[0] + g[1] + g[2] + g[3];
    var names = [["冲", "var(--m1)"], ["稳", "var(--m2)"], ["保", "var(--m3)"], ["不建议", "var(--text-3)"]];
    grad.innerHTML = "";
    names.forEach(function (n, i) {
      var row = document.createElement("div");
      row.className = "grad-row";
      row.innerHTML = '<span class="gname" style="color:' + n[1] + '">' + n[0] + "</span><span class=\"gbar\"><i style=\"width:" + (totalG ? Math.round(g[i] * 100 / totalG) : 0) + "%;background:" + n[1] + "\"></i></span><span class=\"gval\">" + g[i] + "</span>";
      grad.appendChild(row);
    });
    var note = document.createElement("p");
    note.className = "grad-note";
    note.textContent = S.profile ? "按你的位次 " + S.profile.rank + " 与最近一年投档位次自动判定；建议冲 : 稳 : 保 ≈ 2 : 5 : 3。" : "先在个人中心填写位次，即可自动给出梯度建议。";
    grad.appendChild(note);
  }

  function statCell(v, l) {
    return '<div class="stat-cell"><div class="v">' + v + "</div><div class=\"l\">" + l + "</div></div>";
  }

  /* ---------- 回收站 ---------- */
  function openRecycle() {
    var plan = activePlan();
    var body = document.createElement("div");
    if (!plan.deleted.length) {
      body.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("recycle") + '<div class="es-title">回收站是空的</div><div class="es-desc">删除的志愿会先暂存在这里，反悔了还能恢复。</div></div>';
    } else {
      var list = document.createElement("div");
      list.className = "recycle-list";
      plan.deleted.forEach(function (it, i) {
        var item = document.createElement("div");
        item.className = "recycle-item";
        var name = document.createElement("div");
        name.className = "ri-name";
        name.innerHTML = "<b>" + esc(it.name) + "</b> <span style='color:var(--text-2)'>" + esc(it.majorName) + "</span>";
        var acts = document.createElement("div");
        acts.className = "ri-actions";
        var restore = document.createElement("button");
        restore.className = "row-btn";
        restore.appendChild(window.GKIcon.render("rotate", 14));
        restore.title = "恢复";
        restore.addEventListener("click", function () {
          if (plan.items.length >= MAX) { window.GK.toast("方案已达上限 " + MAX, "error"); return; }
          plan.deleted.splice(i, 1);
          plan.items.push(it);
          window.GK.save();
          renderAll();
          window.GK.toast("已恢复", "success");
        });
        var del = document.createElement("button");
        del.className = "row-btn danger";
        del.appendChild(window.GKIcon.render("x", 14));
        del.title = "彻底删除";
        del.addEventListener("click", function () {
          plan.deleted.splice(i, 1);
          window.GK.save();
          renderAll();
        });
        acts.appendChild(restore);
        acts.appendChild(del);
        item.appendChild(name);
        item.appendChild(acts);
        list.appendChild(item);
      });
      body.appendChild(list);
    }
    window.GK.modal({
      title: "回收站 · " + plan.name,
      body: body,
      width: "520px",
      footer: plan.deleted.length ? [{
        text: "清空回收站",
        kind: "danger",
        onClick: function () {
          plan.deleted = [];
          window.GK.save();
          window.GK.toast("回收站已清空", "info");
        }
      }] : undefined
    });
  }

  /* ---------- 概览 ---------- */
  function openOverview() {
    var plan = activePlan();
    var body = document.createElement("div");
    if (!plan.items.length) {
      body.innerHTML = '<div class="empty-state"><div class="es-title">方案为空</div></div>';
    } else {
      var list = document.createElement("div");
      list.className = "overview-list";
      plan.items.forEach(function (it, i) {
        var row = document.createElement("div");
        row.className = "overview-row";
        row.innerHTML = '<span class="seq">' + (i + 1) + '</span><span class="school">' + esc(it.name) + '</span><span class="major">' + esc(it.majorName) + '</span>';
        if (it.mark) {
          var pill = document.createElement("span");
          pill.className = "mark-pill";
          pill.setAttribute("data-mark", it.mark);
          pill.textContent = S.marks[it.mark - 1].label;
          row.appendChild(pill);
        }
        list.appendChild(row);
      });
      body.appendChild(list);
    }
    window.GK.modal({ title: "方案概览 · " + plan.name, body: body, width: "520px" });
  }

  /* ---------- 从志愿库添加 ---------- */
  function openLibraryPicker() {
    var body = document.createElement("div");
    if (!S.library.length) {
      body.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("library") + '<div class="es-title">志愿库还是空的</div><div class="es-desc">先在「数据查询」里收藏，再回来一键加入方案。</div></div>';
      window.GK.modal({ title: "从志愿库添加", body: body, width: "560px" });
      return;
    }
    var list = document.createElement("div");
    list.className = "lib-list";
    S.library.forEach(function (it) {
      var item = document.createElement("div");
      item.className = "lib-item";
      item.innerHTML = '<div class="li-name"><div class="li-school">' + esc(it.name) + '</div><div class="li-major">' + esc(it.majorName) + "</div></div>";
      if (it.mark) {
        var pill = document.createElement("span");
        pill.className = "mark-pill";
        pill.setAttribute("data-mark", it.mark);
        pill.textContent = S.marks[it.mark - 1].label;
        item.appendChild(pill);
      }
      var btn = document.createElement("button");
      btn.className = "btn btn-soft btn-sm";
      btn.appendChild(window.GKIcon.render("plus", 13));
      btn.appendChild(document.createTextNode("添加"));
      btn.addEventListener("click", function () {
        var plan = activePlan();
        if (plan.items.length >= MAX) { window.GK.toast("方案已达上限 " + MAX, "error"); return; }
        plan.items.push(attachHistory({
          uid: window.GK.uid(), code: it.code, name: it.name, majorCode: it.majorCode, majorName: it.majorName,
          duration: it.duration, tuition: it.tuition, mark: it.mark, note: it.note
        }));
        window.GK.save();
        renderTable();
        updateStats();
        window.GK.toast("已添加到「" + plan.name + "」", "success");
      });
      item.appendChild(btn);
      list.appendChild(item);
    });
    body.appendChild(list);
    window.GK.modal({ title: "从志愿库添加", body: body, width: "600px" });
  }

  /* 附加 4 年投档线 */
  function attachHistory(item) {
    var lib = window.GK.data.libFor(item.code, item.name, item.majorCode, item.majorName);
    item.s26 = null;
    item.s25 = null;
    item.s24 = null;
    item.s23 = null;
    if (lib) {
      item.duration = lib[window.GK.data.L.DUR] || item.duration;
      item.tuition = lib[window.GK.data.L.TUITION] || item.tuition;
      item.subj26 = lib[window.GK.data.L.SUBJ26] || lib[window.GK.data.L.SUBJ25] || "";
      item.eq25 = lib && lib[window.GK.data.L.EQ25] != null ? lib[window.GK.data.L.EQ25] : null;
      item.city = lib[window.GK.data.L.CITY] || "";
      item.campuses = window.GK.data.campusesOf(item.code, item.majorCode, item.name, item.majorName);
      var pd = window.GK.data.planDelta(item.code, item.name, item.majorCode, item.majorName);
      item.planChange = pd ? { p26: pd.p26, p25: pd.p25, delta: pd.delta, pct: pd.pct } : null;
      item.newFlag = lib[window.GK.data.L.NEWFLAG] || "";
    }
    /* 各年官方投档线为准，按 代码 + 专业名称 双重匹配；
       名称不匹配说明该代码当年指向别的专业，宁可留空不误导 */
    [2026, 2025, 2024, 2023, 2022, 2021].forEach(function (year) {
      var pick = window.GK.data.findYearLine(item, year);
      if (pick) item["s" + String(year).slice(2)] = { score: pick[5], rank: pick[6], plan: pick[4] };
    });
    return item;
  }

  /* ---------- 导出当前方案 ---------- */
  function exportPlan() {
    if (!window.XLSX) { window.GK.toast("Excel 组件未加载", "error"); return; }
    var plan = activePlan();
    var rows = [["序号", "院校代码", "院校名称", "专业代码", "专业名称", "2026", "2025", "2024", "2023", "2022", "2021", "学制", "学费", "标记", "备注"]];
    plan.items.forEach(function (it, i) {
      var f = function (h) { return h ? (h.score + "/" + (h.rank || "-")) : ""; };
      rows.push([i + 1, it.code, it.name, it.majorCode, it.majorName, f(it.s26), f(it.s25), f(it.s24), f(it.s23), f(it.s22), f(it.s21), it.duration || "", it.tuition || "", it.mark ? S.marks[it.mark - 1].label : "", it.note || ""]);
    });
    var ws = window.XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 6 }, { wch: 10 }, { wch: 22 }, { wch: 10 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 6 }, { wch: 20 }];
    var wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, (plan.name || "志愿表").slice(0, 31));
    window.XLSX.writeFile(wb, "浙志愿-" + plan.name + ".xlsx");
    window.GK.toast("已导出方案 Excel", "success");
  }

  /* ---------- 梯度体检 ---------- */
  function healthCheck() {
    var plan = activePlan();
    var items = plan.items;
    var findings = [];
    var score = 100;
    var counts = { c: 0, w: 0, b: 0, n: 0, u: 0 };
    items.forEach(function (it) {
      var h = it.s26 || it.s25 || it.s24 || it.s23;
      var g = h && h.rank && S.profile ? window.GK.data.grade(S.profile.rank, h.rank) : -1;
      if (g === 1) counts.c++;
      else if (g === 2) counts.w++;
      else if (g === 3) counts.b++;
      else if (g === 0) counts.n++;
      else counts.u++;
    });
    var gTotal = counts.c + counts.w + counts.b;
    if (items.length === 0) {
      findings.push({ t: "warn", txt: "方案为空，先添加志愿再来体检。" });
      score = 0;
    } else if (gTotal < 3) {
      findings.push({ t: "warn", txt: "可判定的梯度志愿不足 3 个，补足冲 / 稳 / 保后再看结论更可靠。" });
      score -= 10;
    } else {
      if (counts.c === 0) { findings.push({ t: "warn", txt: "没有「冲」档志愿，方案偏保守，可能浪费位次空间。" }); score -= 8; }
      if (counts.b === 0) { findings.push({ t: "danger", txt: "没有「保」档志愿，存在滑档风险！" }); score -= 18; }
      var rw = counts.w / gTotal;
      if (rw < 0.3) { findings.push({ t: "warn", txt: "「稳」档占比偏低（" + Math.round(rw * 100) + "%），建议接近 50%。" }); score -= 6; }
      var rc = counts.c / gTotal;
      if (rc > 0.45) { findings.push({ t: "info", txt: "「冲」档偏多（" + Math.round(rc * 100) + "%），注意冲多不代表稳。" }); score -= 3; }
    }
    /* 顺序倒挂与空档 */
    var ranked = [];
    items.forEach(function (it, i) {
      var h = it.s26 || it.s25 || it.s24 || it.s23;
      if (h && h.rank) ranked.push({ i: i, rank: h.rank, it: it });
    });
    for (var k = 0; k < ranked.length - 1; k++) {
      var a = ranked[k], b = ranked[k + 1];
      if (a.rank > b.rank * 1.02) {
        findings.push({ t: "danger", txt: "第 " + (a.i + 1) + " 志愿（" + a.it.name + " " + a.it.majorName.slice(0, 10) + "…）投档位次比第 " + (b.i + 1) + " 更宽松，顺序疑似倒挂。" });
        score -= 10;
        break;
      }
      if (b.rank > a.rank * 1.8) {
        findings.push({ t: "warn", txt: "第 " + (a.i + 1) + " 与第 " + (b.i + 1) + " 志愿位次跨度较大，中间也许有更值得填的志愿。" });
        score -= 3;
        break;
      }
    }
    /* 重复院校 */
    var schools = {};
    items.forEach(function (it) { schools[it.code] = (schools[it.code] || 0) + 1; });
    var dup = Object.keys(schools).filter(function (c) { return schools[c] > 1; });
    if (dup.length) { findings.push({ t: "info", txt: dup.length + " 所院校出现多次，注意同一院校多个专业之间也要留梯度。" }); score -= 2; }
    /* 未标记 */
    var unmarked = items.filter(function (it) { return !it.mark; }).length;
    if (unmarked) { findings.push({ t: "info", txt: unmarked + " 个志愿未标记，建议标上冲 / 稳 / 保，方便整体看结构。" }); score -= 3; }
    /* 选科不符 */
    var unfit = [];
    items.forEach(function (it) {
      var req = it.subj26 || window.GK.data.subjectReqOf(it.code, it.majorCode);
      if (req && req !== "不限" && S.profile && !window.GK.data.subjectFit(S.profile.subjects, req)) unfit.push(it);
    });
    if (unfit.length) {
      findings.push({ t: "danger", txt: unfit.length + " 个志愿选科不符合：[" + unfit.slice(0, 3).map(function (x) { return x.name + " " + x.majorName.slice(0, 8); }).join("、") + (unfit.length > 3 ? "…" : "") + "]，无法投档，请删除或替换。" });
      score -= 20;
    }
    /* 缩招 */
    var cut = items.filter(function (it) { return it.planChange && it.planChange.pct != null && it.planChange.pct <= -20; });
    if (cut.length) {
      findings.push({ t: "warn", txt: cut.length + " 个志愿今年明显缩招（≥20%）：[" + cut.slice(0, 3).map(function (x) { return x.name.slice(0, 6); }).join("、") + (cut.length > 3 ? "…" : "") + "]，实际位次可能上移。" });
      score -= 6;
    }
    /* 新增 */
    var nnew = items.filter(function (it) { return it.newFlag === "新招专业" || it.newFlag === "新招院校"; });
    if (nnew.length) { findings.push({ t: "info", txt: nnew.length + " 个志愿是今年新增（" + nnew[0].name.slice(0, 6) + (nnew.length > 1 ? " 等" : "") + "），无往年线参考，波动风险自行评估。" }); score -= 2; }
    if (!findings.length) findings.push({ t: "ok", txt: "方案整体健康，梯度合理，继续保持。" });
    score = Math.max(20, Math.min(100, score));
    return { score: score, counts: counts, findings: findings, items: items };
  }

  function showHealth() {
    var r = healthCheck();
    var body = document.createElement("div");
    var gradeColor = r.score >= 85 ? "var(--success)" : r.score >= 65 ? "var(--warning)" : "var(--danger)";
    var ringR = 38, circ = 2 * Math.PI * ringR;
    body.innerHTML =
      '<div class="health-score"><div class="hs-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + ringR + '" fill="none" stroke="var(--surface-3)" stroke-width="8"/><circle cx="50" cy="50" r="' + ringR + '" fill="none" stroke="' + gradeColor + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - r.score / 100)).toFixed(1) + '"/></svg><span class="hs-num">' + r.score + '</span></div><div class="hs-label">方案健康分</div></div>';
    var gNames = [["冲", "var(--m1)"], ["稳", "var(--m2)"], ["保", "var(--m3)"], ["不建议", "var(--text-3)"], ["未定", "var(--border-strong)"]];
    var keys = ["c", "w", "b", "n", "u"];
    var total = r.items.length;
    var bars = '<div class="health-bars">';
    gNames.forEach(function (n, i) {
      var cnt = r.counts[keys[i]];
      bars += '<div class="grad-row"><span class="gname" style="color:' + n[1] + '">' + n[0] + '</span><span class="gbar"><i style="width:' + (total ? Math.round(cnt * 100 / total) : 0) + "%;background:" + n[1] + '"></i></span><span class="gval">' + cnt + "</span></div>";
    });
    bars += "</div>";
    body.insertAdjacentHTML("beforeend", bars);
    var list = document.createElement("div");
    list.className = "health-findings";
    r.findings.forEach(function (f) {
      var item = document.createElement("div");
      item.className = "health-item " + f.t;
      var ic = document.createElement("span");
      ic.className = "hi-ic";
      ic.appendChild(window.GKIcon.render(f.t === "ok" ? "check" : f.t === "danger" ? "alert" : "info", 15));
      var txt = document.createElement("span");
      txt.innerHTML = f.txt;
      item.appendChild(ic);
      item.appendChild(txt);
      list.appendChild(item);
    });
    body.appendChild(list);
    window.GK.modal({ title: "梯度体检 · " + activePlan().name, body: body, width: "600px" });
  }

  /* ---------- 密度切换 ---------- */
  function toggleDensity() {
    var scroll = document.getElementById("planTableScroll");
    scroll.classList.toggle("dense");
    var btn = document.getElementById("btnDensity");
    btn.classList.toggle("is-on", scroll.classList.contains("dense"));
    btn.textContent = scroll.classList.contains("dense") ? "舒适" : "紧凑";
    btn.prepend(window.GKIcon.render("columns", 14));
  }

  /* ---------- 备注编辑 ---------- */
  function bindNoteEdit(tbody) {
    tbody.querySelectorAll(".row-btn[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () {
        var it = findItem(b.getAttribute("data-edit"));
        if (!it) return;
        var body = document.createElement("div");
        var input = document.createElement("input");
        input.value = it.note || "";
        input.placeholder = "备注，如：首选 / 专业组内任选";
        input.style.cssText = "width:100%;height:38px;padding:0 12px;font-size:13px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface);color:var(--text);outline:none";
        body.appendChild(input);
        window.GK.modal({
          title: "备注 · " + it.name,
          body: body,
          width: "440px",
          footer: [{
            text: "保存",
            kind: "primary",
            onClick: function () {
              it.note = input.value.trim();
              window.GK.save();
              window.GK.toast("已保存", "success");
            }
          }]
        });
        setTimeout(function () { input.focus(); }, 50);
      });
    });
  }

  /* ---------- 渲染入口 ---------- */
  function renderAll() {
    renderTabs();
    renderTable();
    updateStats();
    document.getElementById("recycleCount").textContent = activePlan() ? activePlan().deleted.length : 0;
    if (window.GK.library) window.GK.library.renderBadge();
  }

  function init() {
    document.getElementById("btnReset").addEventListener("click", function () {
      var plan = activePlan();
      window.GK.confirmDialog("重置方案", "清空「" + plan.name + "」中的全部志愿？志愿库中的内容不受影响。", function () {
        plan.deleted = plan.deleted.concat(plan.items);
        plan.items = [];
        window.GK.save();
        renderAll();
      });
    });
    document.getElementById("btnRecycle").addEventListener("click", openRecycle);
    document.getElementById("btnOverview").addEventListener("click", openOverview);
    document.getElementById("btnAddFromLibrary").addEventListener("click", openLibraryPicker);
    document.getElementById("btnExport").addEventListener("click", exportPlan);
    document.getElementById("btnHealth").addEventListener("click", showHealth);
    document.getElementById("btnShare").addEventListener("click", function () { window.GK.showShare(activePlan()); });
    document.getElementById("btnDensity").addEventListener("click", toggleDensity);
    var colsBtn = document.getElementById("btnPlanCols");
    var colsPop = document.getElementById("planColsPop");
    if (colsBtn && colsPop) {
      colsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        colsPop.hidden = !colsPop.hidden;
        if (!colsPop.hidden) renderColsPop();
      });
      document.addEventListener("click", function (e) {
        if (!colsPop.hidden && !colsPop.contains(e.target) && !colsBtn.contains(e.target)) colsPop.hidden = true;
      });
    }
    renderColsPop();
    updateColsBadge();
  }

  window.GK = window.GK || {};
  window.GK.plan = {
    init: init,
    renderAll: renderAll,
    renderTable: renderTable,
    updateStats: updateStats,
    activePlan: activePlan,
    attachHistory: attachHistory,
    bindNoteEdit: bindNoteEdit,
    esc: esc,
    MAX: MAX
  };
})();
