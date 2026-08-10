(function () {
  /* 高校排名：大学排名 / 世界排名 / 学科排名 / 专业排名 / 学科评估 */
  var st = { view: "univ", univList: "主榜", subject: "", worldList: "arwu", cat: "", cls: "", major: "", evalRound: "5", evalGrade: "", chinaOnly: false, search: "", page: 1 };
  var PAGE = 50;

  function bcurLists() {
    return ((window.GK_RANKS || {})["bcur"] || []).filter(function (l) { return l.name !== "主榜·备用" && l.name !== "主榜-备用"; });
  }

  function badgeOf(name) {
    var b = ((window.GK_SCHOOLS || {}).badges || {}) || {};
    var k = String(name).replace(/（/g, "(").replace(/）/g, ")");
    return b[name] || b[k] || "";
  }

  function badgeHtml(name) {
    var s = badgeOf(name);
    return s ? '<i class="school-badge fc-icon fc-icon-' + s + '"></i>' : "";
  }

  function majorRows() {
    return (window.GK_RANKS || {})["ruanke"] || [];
  }

  function categories() {
    var set = {};
    majorRows().forEach(function (r) { set[r[0]] = 1; });
    return Object.keys(set).sort();
  }

  function classesOf(cat) {
    var set = {};
    majorRows().forEach(function (r) { if (r[0] === cat) set[r[1]] = 1; });
    return Object.keys(set).sort();
  }

  function majorsOf(cat, cls) {
    var set = {};
    majorRows().forEach(function (r) { if (r[0] === cat && (!cls || r[1] === cls)) set[r[2]] = 1; });
    return Object.keys(set).sort();
  }

  function rowsFor() {
    var kw = st.search.trim();
    if (st.view === "univ") {
      var l = bcurLists().find(function (x) { return x.name === st.univList; });
      if (!l) return [];
      return kw ? l.rows.filter(function (r) { return r[1].indexOf(kw) >= 0; }) : l.rows;
    }
    if (st.view === "world") {
      var w = st.worldList === "qs" ? ((window.GK_RANKS || {})["qs"] || []) : ((window.GK_RANKS || {})["arwu"] || []);
      return w.filter(function (r) {
        if (kw && r[1].indexOf(kw) < 0) return false;
        if (st.chinaOnly && !(r[2] || "").match(/中国|香港|澳门|台湾/)) return false;
        return true;
      });
    }
    if (st.view === "bcsr") {
      var rows = ((window.GK_RANKS || {})["bcsr"] || {})[st.subject] || [];
      return kw ? rows.filter(function (r) { return (r[1] || "").indexOf(kw) >= 0; }) : rows;
    }
    if (st.view === "assess") {
      var src = st.evalRound === "4" ? ((window.GK_ASSESS || {})["4th"] || {}) : ((window.GK_ASSESS || {})["5th"] || {});
      var rows2 = [];
      Object.keys(src).forEach(function (name) {
        var c = { ap: 0, a: 0, am: 0, other: 0 };
        (src[name] || []).forEach(function (x) {
          var g = x[1];
          if (g === "A+") c.ap++;
          else if (g === "A") c.a++;
          else if (g === "A-") c.am++;
          else c.other++;
        });
        if (!c.ap && !c.a && !c.am && !c.other) return;
        if (st.evalGrade === "A+" && !c.ap) return;
        if (st.evalGrade === "A" && !(c.ap + c.a)) return;
        if (st.evalGrade === "A-" && !(c.ap + c.a + c.am)) return;
        rows2.push([name, c.ap, c.a, c.am, c.other]);
      });
      rows2.sort(function (x, y) {
        return (y[1] - x[1]) || (y[2] - x[2]) || (y[3] - x[3]) || (x[0] < y[0] ? -1 : 1);
      });
      if (kw) rows2 = rows2.filter(function (r) { return r[0].indexOf(kw) >= 0; });
      return rows2;
    }
    /* 专业排名：门类 → 专业类 → 专业 下钻，可搜索覆盖 */
    return majorRows().filter(function (r) {
      if (st.cat && r[0] !== st.cat) return false;
      if (st.cls && r[1] !== st.cls) return false;
      if (st.major && r[2] !== st.major) return false;
      if (kw && r[2].indexOf(kw) < 0 && r[3].indexOf(kw) < 0) return false;
      return true;
    });
  }

  function opt(h, v, sel) {
    return '<option value="' + h + '"' + (v === sel ? " selected" : "") + ">" + h + "</option>";
  }

  function renderSelects() {
    var listSel = document.getElementById("rkList");
    if (listSel) {
      listSel.innerHTML = bcurLists().map(function (l) { return opt(l.name, l.name, st.univList); }).join("");
      if (!bcurLists().some(function (l) { return l.name === st.univList; })) st.univList = bcurLists()[0] ? bcurLists()[0].name : "";
    }
    var subSel = document.getElementById("rkSubject");
    if (subSel) {
      var subs = Object.keys((window.GK_RANKS || {})["bcsr"] || {});
      subSel.innerHTML = subs.map(function (s) { return opt(s, s, st.subject); }).join("");
      if (subs.indexOf(st.subject) < 0) st.subject = subs[0] || "";
    }
    var catSel = document.getElementById("rkCat");
    if (catSel) {
      catSel.innerHTML = opt("", "全部门类", st.cat) + categories().map(function (c) { return opt(c, c, st.cat); }).join("");
    }
    var clsSel = document.getElementById("rkCls");
    if (clsSel) {
      clsSel.innerHTML = opt("", "全部专业类", st.cls) + classesOf(st.cat).map(function (c) { return opt(c, c, st.cls); }).join("");
    }
    var majSel = document.getElementById("rkMajor");
    if (majSel) {
      majSel.innerHTML = opt("", "全部专业", st.major) + majorsOf(st.cat, st.cls).map(function (m) { return opt(m, m, st.major); }).join("");
    }
  }

  function render() {
    var card = document.getElementById("rkTableCard");
    var filters = document.getElementById("rkFilters");
    var majorFilters = document.getElementById("rkMajorFilters");
    var evalFilters = document.getElementById("rkEvalFilters");
    var univField = document.getElementById("rkUnivField");
    var subField = document.getElementById("rkSubjectField");
    var worldField = document.getElementById("rkWorldField");
    filters.hidden = st.view !== "univ" && st.view !== "bcsr" && st.view !== "world";
    if (evalFilters) evalFilters.hidden = st.view !== "assess";
    if (univField) univField.hidden = st.view !== "univ";
    if (subField) subField.hidden = st.view !== "bcsr";
    if (worldField) worldField.hidden = st.view !== "world";
    majorFilters.hidden = st.view !== "major";
    if (st.view === "assess") {
      var seg = document.querySelector("#rkEvalSeg .btn.is-active");
      if (seg) st.evalRound = seg.getAttribute("data-round");
      st.evalGrade = document.getElementById("rkEvalGrade").value;
    }
    if (st.view === "univ") st.univList = document.getElementById("rkList").value;
    if (st.view === "bcsr") st.subject = document.getElementById("rkSubject").value;
    if (st.view === "world") {
      var seg = document.querySelector("#rkWorldSeg .btn.is-active");
      if (seg) st.worldList = seg.getAttribute("data-world");
    }
    if (st.view === "major") {
      st.cat = document.getElementById("rkCat").value;
      st.cls = document.getElementById("rkCls").value;
      st.major = document.getElementById("rkMajor").value;
    }
    renderSelects();

    var rows = rowsFor();
    var pages = Math.max(1, Math.ceil(rows.length / PAGE));
    if (st.page > pages) st.page = pages;
    var slice = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
    var head = "", thead = "", tbody = "";

    if (st.view === "univ") {
      head = st.univList + "（2026）";
      thead = "<tr><th>排名</th><th>院校名称</th><th>省份</th><th>类型</th><th class=\"col-num\">总分</th><th class=\"col-act\">详情</th></tr>";
      slice.forEach(function (r) {
        tbody += "<tr" + (r[0] <= 3 ? ' class="top3"' : "") + '><td class="rk-num">' + r[0] + '</td><td><button class="school-link" data-school="' + window.GK.plan.esc(r[1]) + '">' + badgeHtml(r[1]) + window.GK.plan.esc(r[1]) + "</button>" + (r[2] ? '<span class="rank-tag">' + r[2].replace(/ /g, "</span><span class=\"rank-tag\">") + "</span>" : "") + '</td><td class="muted">' + (r[3] || "-") + '</td><td class="muted">' + (r[4] || "-") + '</td><td class="col-num">' + (r[5] != null ? r[5] : "-") + '</td><td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(r[1]) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
      });
    } else if (st.view === "world") {
      head = st.worldList === "qs" ? "QS 世界大学排名（2026）" : "世界大学学术排名（ARWU 2025）";
      thead = "<tr><th>排名</th><th>院校名称</th><th>国家/地区</th><th class=\"col-num\">综合得分</th><th class=\"col-act\">详情</th></tr>";
      slice.forEach(function (r) {
        tbody += "<tr" + (r[0] <= 10 ? ' class="top3"' : "") + '><td class="rk-num">' + r[0] + '</td><td><button class="school-link" data-school="' + window.GK.plan.esc(r[1]) + '">' + badgeHtml(r[1]) + window.GK.plan.esc(r[1]) + '</button></td><td class="muted">' + (r[2] || "-") + '</td><td class="col-num">' + (r[3] != null ? r[3] : "-") + '</td><td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(r[1]) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
      });
    } else if (st.view === "bcsr") {
      head = "中国最好学科排名 · " + st.subject + "（2025）";
      thead = "<tr><th>排名</th><th>院校名称</th><th class=\"col-num\">得分</th><th class=\"col-act\">详情</th></tr>";
      slice.forEach(function (r) {
        var name = r[1] || "";
        tbody += "<tr" + (r[0] <= 3 ? ' class="top3"' : "") + '><td class="rk-num">' + r[0] + '</td><td><button class="school-link" data-school="' + window.GK.plan.esc(name) + '">' + badgeHtml(name) + window.GK.plan.esc(name) + '</button></td><td class="col-num">' + (r[2] != null ? r[2] : "-") + '</td><td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(name) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
      });
    } else if (st.view === "assess") {
      var roundName = st.evalRound === "4" ? "教育部第四轮学科评估（2017 官方公布）" : "教育部第五轮学科评估（整理版 · 仅供参考）";
      head = roundName + (st.evalGrade ? (st.evalGrade === "A+" ? " · 拥有 A+" : st.evalGrade === "A" ? " · A 及以上" : " · A- 及以上") : "");
      thead = "<tr><th>序</th><th>院校名称</th><th class=\"col-num\">A+</th><th class=\"col-num\">A</th><th class=\"col-num\">A-</th><th class=\"col-num\">B+及以下</th><th class=\"col-num\">学科合计</th><th class=\"col-act\">详情</th></tr>";
      slice.forEach(function (r, i) {
        var total = r[1] + r[2] + r[3] + r[4];
        tbody += "<tr" + (i < 3 ? ' class="top3"' : "") + '><td class="rk-num">' + ((st.page - 1) * PAGE + i + 1) + '</td><td><button class="school-link" data-school="' + window.GK.plan.esc(r[0]) + '">' + badgeHtml(r[0]) + window.GK.plan.esc(r[0]) + "</button></td>" +
          '<td class="col-num">' + r[1] + '</td><td class="col-num">' + r[2] + '</td><td class="col-num">' + r[3] + '</td><td class="col-num muted">' + r[4] + '</td><td class="col-num">' + total + '</td>' +
          '<td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(r[0]) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
      });
    } else {
      head = "中国大学专业排名（软科 2026 · A+ 档）" + (st.major ? " · " + st.major : "");
      thead = "<tr><th>门类</th><th>专业类</th><th>专业</th><th>院校</th><th>层次</th><th class=\"col-num\">排名</th><th class=\"col-num\" title=\"学科支撑\">学科</th><th class=\"col-num\" title=\"专业生源\">生源</th><th class=\"col-num\" title=\"专业就业\">就业</th><th class=\"col-num\" title=\"专业条件\">条件</th><th class=\"col-act\">详情</th></tr>";
      slice.forEach(function (r) {
        tbody += '<tr><td class="muted">' + window.GK.plan.esc(r[0]) + '</td><td class="muted">' + window.GK.plan.esc(r[1]) + '</td><td><button class="school-link" data-major="' + window.GK.plan.esc(r[2]) + '">' + window.GK.plan.esc(r[2]) + '</button></td><td><button class="school-link" data-school="' + window.GK.plan.esc(r[3]) + '">' + badgeHtml(r[3]) + window.GK.plan.esc(r[3]) + '</button></td><td><span class="tier-pill">' + window.GK.plan.esc(r[4]) + '</span></td><td class="col-num rk-num">' + r[5] + '</td><td class="col-num">' + (r[7] || "-") + '</td><td class="col-num">' + (r[8] || "-") + '</td><td class="col-num">' + (r[9] || "-") + '</td><td class="col-num">' + (r[10] || "-") + '</td><td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(r[3]) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
      });
    }
    var empty = slice.length ? "" : '<tr><td colspan="8"><div class="empty-state"><div class="es-title">没有找到相关结果</div><div class="es-desc">换个筛选条件或关键词试试。</div></div></td></tr>';
    card.innerHTML = '<div class="exp-list-head"><span class="result-title">' + head + '</span><span class="result-meta">共 ' + rows.length + " 条</span></div>" +
      '<div class="table-scroll"><table class="data-table rank-table" style="min-width:780px" data-colresize="ranks"><thead>' + thead + "</thead><tbody>" + tbody + empty + "</tbody></table></div>" +
      pagerHtml(pages, rows.length);
    window.GKIcon.mount(card);
    if (window.GK.applyColResize) window.GK.applyColResize();
    card.querySelectorAll("[data-school]").forEach(function (b) {
      b.addEventListener("click", function () { if (window.GK.explore) window.GK.explore.openSchool(b.getAttribute("data-school")); });
    });
    card.querySelectorAll("[data-major]").forEach(function (b) {
      b.addEventListener("click", function () { if (window.GK.majors) window.GK.majors.showMajor(b.getAttribute("data-major")); });
    });
    card.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { if (window.GK.explore) window.GK.explore.openSchool(b.getAttribute("data-go")); });
    });
    bindPager(card, pages);
  }

  function pagerHtml(pages, total) {
    var h = '<div class="pager gk-pager"><span class="result-meta">共 ' + total + ' 条 · 第 ' + st.page + " / " + pages + " 页 · 每页 " + PAGE + " 条</span><span class=\"pages\">";
    h += '<button class="page-btn" data-p="' + (st.page - 1) + '"' + (st.page <= 1 ? " disabled" : "") + ' title="上一页"><span data-icon="back"></span></button>';
    var start = Math.max(1, Math.min(st.page - 2, pages - 4));
    var end = Math.min(pages, start + 4);
    for (var i = start; i <= end; i++) h += '<button class="page-btn' + (i === st.page ? " is-cur" : "") + '" data-p="' + i + '">' + i + "</button>";
    h += '<button class="page-btn" data-p="' + (st.page + 1) + '"' + (st.page >= pages ? " disabled" : "") + ' title="下一页"><span data-icon="next"></span></button>';
    h += '</span><span class="jump">跳至 <input type="number" id="rkJump" min="1" max="' + pages + '"> 页</span></div>';
    return h;
  }

  function bindPager(card, pages) {
    card.querySelectorAll(".pager .page-btn[data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        st.page = parseInt(b.getAttribute("data-p"), 10);
        render();
      });
    });
    var jump = card.querySelector("#rkJump");
    if (jump) {
      jump.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          var p = parseInt(jump.value, 10);
          if (p >= 1 && p <= pages) { st.page = p; render(); }
          else window.GK.toast("页码范围 1–" + pages, "info");
        }
      });
    }
    window.GKIcon.mount(card);
  }

  function init() {
    renderSelects();
    document.getElementById("rkSearch").addEventListener("input", function () {
      st.search = this.value.trim();
      st.page = 1;
      render();
    });
    document.getElementById("rkList").addEventListener("change", function () {
      st.univList = this.value; st.page = 1; render();
    });
    var subSel = document.getElementById("rkSubject");
    if (subSel) subSel.addEventListener("change", function () { st.subject = this.value; st.page = 1; render(); });
    document.querySelectorAll("#rkWorldSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#rkWorldSeg .btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        st.worldList = b.getAttribute("data-world");
        st.page = 1;
        render();
      });
    });
    document.getElementById("rkCat").addEventListener("change", function () {
      st.cat = this.value; st.cls = ""; st.major = ""; st.page = 1; render();
    });
    document.getElementById("rkCls").addEventListener("change", function () {
      st.cls = this.value; st.major = ""; st.page = 1; render();
    });
    document.getElementById("rkMajor").addEventListener("change", function () {
      st.major = this.value; st.page = 1; render();
    });
    document.querySelectorAll("#rkEvalSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#rkEvalSeg .btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        st.evalRound = b.getAttribute("data-round");
        st.page = 1;
        render();
      });
    });
    var gradeSel = document.getElementById("rkEvalGrade");
    if (gradeSel) gradeSel.addEventListener("change", function () {
      st.evalGrade = this.value; st.page = 1; render();
    });
    var chinaBtn = document.getElementById("rkChinaOnly");
    if (chinaBtn) chinaBtn.addEventListener("click", function () {
      st.chinaOnly = !st.chinaOnly;
      chinaBtn.classList.toggle("is-on", st.chinaOnly);
      st.page = 1;
      render();
    });
    document.querySelectorAll("#rkTabs .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#rkTabs .btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        st.view = b.getAttribute("data-view");
        st.page = 1;
        render();
      });
    });
    render();
  }

  window.GK = window.GK || {};
  window.GK.ranks = { init: init, render: render };
})();
