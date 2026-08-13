(function () {
  var S = window.GK.state;
  var PAGE_SIZE = 30;
  var q = {
    year: "all", school: "", major: "", minScore: "", maxScore: "", minRank: "", maxRank: "",
    province: "", tag: "", fit: false, page: 1, sortBy: "rank", sortDir: "asc"
  };
  var lastResult = [];

  function rank() {
    var v = document.getElementById("queryRank").value;
    return parseInt(v, 10) || (S.profile ? S.profile.rank : 0);
  }

  function run() {
    q.school = document.getElementById("fSchool").value.trim();
    q.major = document.getElementById("fMajor").value.trim();
    q.year = document.getElementById("fYear").value;
    q.minScore = document.getElementById("fScoreMin").value;
    q.maxScore = document.getElementById("fScoreMax").value;
    q.minRank = document.getElementById("fRankMin").value;
    q.maxRank = document.getElementById("fRankMax").value;
    q.province = document.getElementById("fProvince").value;
    q.tag = document.getElementById("fTag").value;
    q.fit = document.getElementById("fSubjectFit").classList.contains("is-on");
    q.page = 1;
    render();
  }

  function matches(row) {
    var year = row[0], code = row[1], name = row[2], majorCode = row[3], majorName = row[4], score = row[6], rk = row[7];
    if (q.year !== "all" && String(year) !== q.year) return false;
    if (q.school && name.indexOf(q.school) < 0 && code.indexOf(q.school) < 0) return false;
    if (q.major && majorName.indexOf(q.major) < 0 && majorCode.indexOf(q.major) < 0) return false;
    var lib = window.GK.data.findLib(code, majorCode);
    if (q.province && (!lib || lib[window.GK.data.L.PROV] !== q.province)) return false;
    if (q.tag === "新招专业" || q.tag === "新招院校") {
      if (String(year) !== "2026") return false;
      var lib0 = window.GK.data.libFor(code, name, majorCode, majorName);
      if (!lib0 || lib0[window.GK.data.L.NEWFLAG] !== q.tag) return false;
    } else if (q.tag && window.GK.data.tagsOfSchool(code, name).indexOf(q.tag) < 0) {
      return false;
    }
    if (q.fit) {
      /* 直接用已命中的库行取选科要求；查不到库行（多为旧年数据）的历史行不纳入“我能报” */
      var req = lib ? (lib[window.GK.data.L.SUBJ26] || lib[window.GK.data.L.SUBJ25] || "不限") : null;
      if (!req || !window.GK.data.subjectFit(S.profile ? S.profile.subjects : [], req)) return false;
    }
    if (q.minScore !== "" && (score == null || score < parseFloat(q.minScore))) return false;
    if (q.maxScore !== "" && (score == null || score > parseFloat(q.maxScore))) return false;
    if (q.minRank !== "" && (rk == null || rk < parseFloat(q.minRank))) return false;
    if (q.maxRank !== "" && (rk == null || rk > parseFloat(q.maxRank))) return false;
    return true;
  }

  function render() {
    var years = q.year === "all" ? window.GK.data.ALL_YEARS : [parseInt(q.year, 10)];
    var rows = [];
    years.forEach(function (y) {
      window.GK.data.LINES[y].forEach(function (r) {
        rows.push([y, r[0], r[1], r[2], r[3], r[4], r[5], r[6]]);
      });
    });
    lastResult = rows.filter(matches);
    var sortKey = q.sortBy === "score" ? 6 : 7;
    lastResult.sort(function (a, b) {
      var av = a[sortKey] == null ? 99999999 : a[sortKey];
      var bv = b[sortKey] == null ? 99999999 : b[sortKey];
      return q.sortDir === "asc" ? av - bv : bv - av;
    });

    var total = lastResult.length;
    var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (q.page > pages) q.page = pages;
    var slice = lastResult.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE);

    document.getElementById("queryMeta").textContent = "共 " + total.toLocaleString() + " 条 · 第 " + q.page + " / " + pages + " 页 · 每页 " + PAGE_SIZE + " 条";

    var tbody = document.getElementById("queryBody");
    var myRank = rank();
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state">' + window.GK.emptyIllust("query") + '<div class="es-title">没有找到符合条件的志愿</div><div class="es-desc">换个关键词、放宽分数/位次范围，或者切到别的年份试试。</div></div></td></tr>';
      renderPager(pages, total);
      return;
    }
    var html = "";
    slice.forEach(function (row, i) {
      var idx = lastResult.indexOf(row);
      html += rowHtml(row, myRank, idx);
      html += detailHtml(row, idx);
    });
    tbody.innerHTML = html;
    window.GKIcon.mount(tbody);

    tbody.querySelectorAll(".row-btn[data-fav]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        addToLibrary(lastResult[parseInt(b.getAttribute("data-idx"), 10)]);
      });
    });
    tbody.querySelectorAll(".row-btn[data-add]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        addToPlan(lastResult[parseInt(b.getAttribute("data-idx"), 10)]);
      });
    });
    tbody.querySelectorAll(".school-link").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        if (window.GK.explore) window.GK.explore.openSchool(b.getAttribute("data-school"));
        else window.GK.showSchoolModal(b.getAttribute("data-school"));
      });
    });
    tbody.querySelectorAll(".q-row").forEach(function (tr) {
      tr.addEventListener("click", function () {
        var idx = tr.getAttribute("data-i");
        var detail = tbody.querySelector('.q-detail[data-detail="' + idx + '"]');
        if (detail) detail.hidden = !detail.hidden;
      });
    });
    renderPager(pages, total);
    if (window.GK.applyColResize) window.GK.applyColResize();
  }

  function rowHtml(row, myRank, idx) {
    var g = window.GK.data.grade(myRank, row[7]);
    var gm = window.GK.data.GRADE_META[g];
    var lib = window.GK.data.libFor(row[1], row[2], row[3], row[4]);
    var newFlag = lib ? lib[window.GK.data.L.NEWFLAG] : "";
    return '<tr class="q-row" data-i="' + idx + '" style="cursor:pointer">' +
      '<td class="muted">' + row[0] + "</td>" +
      '<td class="muted">' + row[1] + "</td>" +
      '<td><button class="school-link" data-school="' + window.GK.plan.esc(window.GK.data.cleanSchoolName(row[2])) + '">' + window.GK.plan.esc(window.GK.data.cleanSchoolName(row[2])) + "</button>" + window.GK.schoolPills(row[1], row[2]) + "</td>" +
      '<td class="muted">' + row[3] + "</td>" +
      '<td>' + window.GK.plan.esc(row[4]) + "</td>" +
      '<td class="col-num">' + (row[5] == null ? "-" : row[5]) + "</td>" +
      '<td class="col-num">' + (row[6] == null ? "-" : row[6]) + "</td>" +
      '<td class="col-num">' + (row[7] == null ? "-" : row[7]) + "</td>" +
      '<td class="col-grade"><span class="grade-pill ' + gm.cls + '">' + gm.name + '</span>' +
      (newFlag && String(row[0]) === "2026" ? '<span class="flag-pill flag-new" style="margin-left:5px">' + (newFlag === "新招专业" ? "新专业" : "新院校") + "</span>" : "") +
      "</td>" +
      '<td class="col-act"><span class="row-actions">' +
      '<button class="row-btn" data-fav="1" data-idx="' + idx + '" title="收藏到志愿库"><span data-icon="book"></span></button>' +
      '<button class="row-btn" data-add="1" data-idx="' + idx + '" title="加入当前方案"><span data-icon="plus"></span></button>' +
      "</span></td></tr>";
  }

  function detailHtml(row, idx) {
    var lib = window.GK.data.libFor(row[1], row[2], row[3], row[4]);
    var item = { code: row[1], name: row[2], majorCode: row[3], majorName: row[4] };
    var hist = [];
    window.GK.data.ALL_YEARS.forEach(function (y) {
      var pick = window.GK.data.findYearLine(item, y);
      hist.push([y, pick ? pick[5] : null, pick ? pick[6] : null]);
    });
    var histHtml = hist.map(function (h) {
      return '<span class="dh-year"><b>' + h[0] + "</b> " + (h[1] == null ? "-" : h[1] + "分/" + (h[2] == null ? "-" : h[2]) + "位") + "</span>";
    }).join("");
    if (window.GK.state.theme.exp) {
      var eqV = lib && lib[window.GK.data.L.EQ25] != null ? lib[window.GK.data.L.EQ25] : null;
      var h25 = hist.find(function (h) { return h[0] === 2025; });
      if (eqV == null && h25 && h25[1] != null) eqV = window.GK.data.equivalentScore(2025, h25[1], 2026);
      if (eqV != null) histHtml += '<span class="dh-year">25等位 <b>≈' + eqV + "</b></span>";
    }
    var subj = lib ? (window.GK.data.subjectReqOf(row[1], row[2], row[3], row[4])) : "—";
    var ch2027 = window.GK.data.subject2027For(row[2], row[4]);
    var dur = lib ? (lib[window.GK.data.L.DUR] || "—") : "—";
    var tui = lib ? (lib[window.GK.data.L.TUITION] == null ? "—" : lib[window.GK.data.L.TUITION]) : "—";
    var city = lib ? (lib[window.GK.data.L.CITY] || "") : "";
    var campuses = window.GK.data.campusesOf(row[1], row[3], row[2], row[4]);
    var note = lib ? (lib[4] || "") : "";
    var pd = window.GK.data.planDelta(row[1], row[2], row[3], row[4]);
    var planCell = pd ? "2026 计划 " + (pd.p26 == null ? "-" : pd.p26) + " / 2025 " + (pd.p25 == null ? "-" : pd.p25) + (pd.pct != null ? "（" + (pd.pct > 0 ? "▲" : "▼") + Math.abs(pd.pct) + "%）" : "") : "";
    return '<tr class="q-detail" data-detail="' + idx + '" hidden><td colspan="10"><div class="q-detail-box">' +
      '<div class="dh-grid">' +
      '<div class="dh-cell"><span class="dh-label">选科要求</span><span class="dh-val">' + window.GK.plan.esc(subj) + "</span></div>" +
      (ch2027 ? '<div class="dh-cell dh-2027"><span class="dh-label">2027 选科变化</span><span class="dh-val">' + window.GK.plan.esc(ch2027.o) + " → <b>" + window.GK.plan.esc(ch2027.n) + "</b></span></div>" : "") +
      '<div class="dh-cell"><span class="dh-label">学制</span><span class="dh-val">' + window.GK.plan.esc(dur) + " 年</span></div>" +
      '<div class="dh-cell"><span class="dh-label">学费/年</span><span class="dh-val">' + window.GK.plan.esc(tui) + " 元</span></div>" +
      (city || campuses.length ? '<div class="dh-cell"><span class="dh-label">城市 / 校区</span><span class="dh-val">' + window.GK.plan.esc([city, campuses.join("→")].filter(Boolean).join(" · ")) + "</span></div>" : "") +
      '<div class="dh-cell"><span class="dh-label">计划数</span><span class="dh-val">' + window.GK.plan.esc(planCell || "—") + "</span></div>" +
      '<div class="dh-cell dh-hist"><span class="dh-label">历年投档</span><span class="dh-val">' + histHtml + "</span></div>" +
      "</div>" +
      (note ? '<div class="dh-note"><span class="dh-label">专业简注</span><span>' + window.GK.plan.esc(note) + "</span></div>" : "") +
      "</div></td></tr>";
  }

  function renderPager(pages, total) {
    var pager = document.getElementById("queryPager");
    var html = '<span>共 ' + total.toLocaleString() + " 条</span><span class=\"pages\">";
    html += '<button class="page-btn" data-p="' + (q.page - 1) + '"' + (q.page <= 1 ? " disabled" : "") + ">上一页</button>";
    var start = Math.max(1, Math.min(q.page - 2, pages - 4));
    var end = Math.min(pages, start + 4);
    for (var i = start; i <= end; i++) {
      html += '<button class="page-btn' + (i === q.page ? " is-cur" : "") + '" data-p="' + i + '">' + i + "</button>";
    }
    html += '<button class="page-btn" data-p="' + (q.page + 1) + '"' + (q.page >= pages ? " disabled" : "") + ">下一页</button></span>";
    pager.innerHTML = html;
    pager.querySelectorAll(".page-btn[data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        q.page = parseInt(b.getAttribute("data-p"), 10);
        render();
      });
    });
  }

  function addToPlan(row) {
    var plan = window.GK.plan.activePlan();
    if (!plan) return;
    if (plan.items.length >= window.GK.plan.MAX) { window.GK.toast("方案已达上限 " + window.GK.plan.MAX, "error"); return; }
    var dupe = plan.items.some(function (x) { return x.code === row[1] && x.majorCode === row[3]; });
    if (dupe) { window.GK.toast("该志愿已在方案中", "info"); return; }
    var item = window.GK.plan.attachHistory({
      uid: window.GK.uid(), code: row[1], name: row[2], majorCode: row[3], majorName: row[4],
      duration: "", tuition: "", mark: null, note: ""
    });
    item["s" + String(row[0]).slice(2)] = { score: row[6], rank: row[7], plan: row[5] };
    plan.items.push(item);
    window.GK.save();
    window.GK.plan.renderTable();
    window.GK.plan.updateStats();
    window.GK.toast("已加入「" + plan.name + "」", "success");
  }

  function addToLibrary(row) {
    var dupe = S.library.some(function (x) { return x.code === row[1] && x.majorCode === row[3]; });
    if (dupe) { window.GK.toast("该志愿已在志愿库", "info"); return; }
    S.library.unshift({
      lid: window.GK.uid(), code: row[1], name: row[2], majorCode: row[3], majorName: row[4],
      mark: null, note: "", year: row[0]
    });
    window.GK.save();
    if (window.GK.library) window.GK.library.render();
    window.GK.toast("已收藏到志愿库", "success");
  }

  function refresh() {
    if (S.profile) {
      document.getElementById("queryRank").value = S.profile.rank;
    }
    renderGradeLegend();
    render();
  }

  function renderGradeLegend() {
    var el = document.getElementById("gradeLegend");
    var myRank = rank();
    var items = [
      ["冲", "grade-1", myRank ? "投档位次 ≈ " + Math.round(myRank * 0.65) + "–" + Math.round(myRank * 0.95) + " 名" : "你的位次 × 0.65–0.95"],
      ["稳", "grade-2", myRank ? "≈ " + Math.round(myRank * 0.95) + "–" + Math.round(myRank * 1.15) + " 名" : "你的位次 × 0.95–1.15"],
      ["保", "grade-3", myRank ? "&gt; " + Math.round(myRank * 1.15) + " 名" : "你的位次 × 1.15 以上"],
      ["不建议", "grade-0", myRank ? "&lt; " + Math.round(myRank * 0.65) + " 名" : "你的位次 × 0.65 以下"]
    ];
    el.innerHTML = items.map(function (x) {
      return '<span class="grade-item"><span class="grade-pill ' + x[1] + '">' + x[0] + '</span><span class="desc">' + x[2] + "</span></span>";
    }).join("");
  }

  function init() {
    var yearSel = document.getElementById("fYear");
    yearSel.innerHTML = '<option value="all">全部年份</option>' + window.GK.data.ALL_YEARS.map(function (y) { return '<option value="' + y + '">' + y + "</option>"; }).join("");
    var provSel = document.getElementById("fProvince");
    provSel.innerHTML = '<option value="">全部省份</option>' + window.GK.data.provinces().map(function (p) { return '<option>' + p + "</option>"; }).join("");
    var tagSel = document.getElementById("fTag");
    var tagList = ["985", "211", "双一流", "2011计划", "保研", "公办", "民办", "独立学院", "省重点建设", "中外合作", "新招专业", "新招院校"];
    tagSel.innerHTML = '<option value="">全部</option>' + tagList.map(function (t) { return '<option value="' + t + '">' + t + "</option>"; }).join("");

    document.getElementById("btnQuery").addEventListener("click", run);
    document.getElementById("btnQueryReset").addEventListener("click", function () {
      ["fSchool", "fMajor", "fScoreMin", "fScoreMax", "fRankMin", "fRankMax"].forEach(function (id) {
        document.getElementById(id).value = "";
      });
      document.getElementById("fYear").value = "all";
      document.getElementById("fProvince").value = "";
      document.getElementById("fTag").value = "";
      document.getElementById("fSubjectFit").classList.remove("is-on");
      q = Object.assign(q, { year: "all", school: "", major: "", minScore: "", maxScore: "", minRank: "", maxRank: "", province: "", tag: "", fit: false, page: 1 });
      render();
    });
    document.getElementById("fSubjectFit").addEventListener("click", function () {
      this.classList.toggle("is-on");
      q.fit = this.classList.contains("is-on");
      render();
    });
    document.getElementById("queryRank").addEventListener("change", function () {
      var v = parseInt(this.value, 10);
      if (v > 0 && S.profile) { S.profile.rank = v; window.GK.save(); window.GK.renderUser(); }
      refresh();
    });
    document.getElementById("btnAddAll").addEventListener("click", function () {
      var plan = window.GK.plan.activePlan();
      var added = 0;
      lastResult.forEach(function (row) {
        if (plan.items.length >= window.GK.plan.MAX) return;
        var dupe = plan.items.some(function (x) { return x.code === row[1] && x.majorCode === row[3]; });
        if (dupe) return;
        var it2 = window.GK.plan.attachHistory({ uid: window.GK.uid(), code: row[1], name: row[2], majorCode: row[3], majorName: row[4], duration: "", tuition: "", mark: null, note: "" });
        it2["s" + String(row[0]).slice(2)] = { score: row[6], rank: row[7], plan: row[5] };
        plan.items.push(it2);
        added++;
      });
      if (added) {
        window.GK.save();
        window.GK.plan.renderTable();
        window.GK.plan.updateStats();
        window.GK.toast("已加入 " + added + " 个志愿", "success");
      } else {
        window.GK.toast("没有可添加的志愿（可能已存在或达上限）", "info");
      }
    });
    document.querySelector("#page-query thead").addEventListener("click", function (e) {
      var th = e.target.closest("th");
      if (!th) return;
      var key = th.textContent.trim() === "分数" ? "score" : th.textContent.trim() === "位次" ? "rank" : null;
      if (!key) return;
      if (q.sortBy === key) q.sortDir = q.sortDir === "asc" ? "desc" : "asc";
      else { q.sortBy = key; q.sortDir = "asc"; }
      q.page = 1;
      render();
    });
    refresh();
  }

  window.GK = window.GK || {};
  window.GK.query = { init: init, refresh: refresh, run: run, addToPlan: addToPlan, addToLibrary: addToLibrary };
})();
