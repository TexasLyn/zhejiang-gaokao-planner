(function () {
  var S = window.GK.state;
  var st = { search: "", subj: "", sort: "schools", page: 1 };
  var PAGE = 30;
  var ALL = (window.GK_MAJORS || []).slice();

  function filtered() {
    return ALL.filter(function (m) {
      if (st.search && m.name.indexOf(st.search) < 0) return false;
      if (st.subj === "不限" && m.subj["不限"] === 0) return false;
      if (st.subj === "物理&化学" && m.subj["物化"] === 0) return false;
      if (st.subj === "其他" && m.subj["其他"] === 0) return false;
      return true;
    });
  }

  function render() {
    var list = filtered();
    if (st.sort === "plan") list.sort(function (a, b) { return b.plan - a.plan; });
    else if (st.sort === "minRank") list.sort(function (a, b) { return (a.minRank || 1e9) - (b.minRank || 1e9); });
    else list.sort(function (a, b) { return b.schools - a.schools; });
    var pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (st.page > pages) st.page = pages;
    var slice = list.slice((st.page - 1) * PAGE, st.page * PAGE);
    var tbody = document.getElementById("majBody");
    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' + window.GK.emptyIllust("query") + '<div class="es-title">没有找到相关专业</div><div class="es-desc">换个关键词，或看看别的选科要求。</div></div></td></tr>';
      renderPager(pages);
      return;
    }
    tbody.innerHTML = slice.map(function (m) {
      var subj = [];
      if (m.subj["不限"]) subj.push('<span class="tag-pill">不限 ' + m.subj["不限"] + "</span>");
      if (m.subj["物化"]) subj.push('<span class="tag-pill">物化 ' + m.subj["物化"] + "</span>");
      if (m.subj["其他"]) subj.push('<span class="tag-pill">其他 ' + m.subj["其他"] + "</span>");
      return "<tr>" +
        '<td><b>' + window.GK.plan.esc(m.name) + "</b></td>" +
        '<td class="col-num">' + m.schools + "</td>" +
        '<td class="col-num">' + m.plan + "</td>" +
        '<td class="col-num">' + (m.minScore == null ? "-" : m.minScore) + "</td>" +
        '<td class="col-num">' + (m.minRank == null ? "-" : m.minRank) + "</td>" +
        '<td><span class="tag-pills">' + subj.join("") + "</span></td>" +
        '<td class="col-act"><button class="row-btn" data-major="' + window.GK.plan.esc(m.name) + '" title="专业详情"><span data-icon="next"></span></button></td></tr>';
    }).join("");
    window.GKIcon.mount(tbody);
    tbody.querySelectorAll("[data-major]").forEach(function (b) {
      b.addEventListener("click", function () { showMajor(b.getAttribute("data-major")); });
    });
    renderPager(pages);
    if (window.GK.applyColResize) window.GK.applyColResize();
  }

  function renderPager(pages) {
    var pager = document.getElementById("majPager");
    var h = '<span>共 ' + filtered().length + " 个专业</span><span class=\"pages\">";
    var start = Math.max(1, Math.min(st.page - 2, pages - 4));
    var end = Math.min(pages, start + 4);
    for (var i = start; i <= end; i++) {
      h += '<button class="page-btn' + (i === st.page ? " is-cur" : "") + '" data-p="' + i + '">' + i + "</button>";
    }
    h += "</span>";
    pager.innerHTML = h;
    pager.querySelectorAll(".page-btn[data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        st.page = parseInt(b.getAttribute("data-p"), 10);
        render();
      });
    });
  }

  function showMajor(name) {
    var m = ALL.find(function (x) { return x.name === name; });
    if (!m) return;
    var info = (window.GK_MAJOR_INFO || {})[name] || {};
    var cat = window.GK.data.majorCatalog(name) || null;
    var body = document.createElement("div");
    var catLine = "";
    if (cat && (cat.l1 || cat.l2)) {
      catLine = '<div class="sm-tags" style="margin-bottom:10px">' +
        (cat.l1 ? '<span class="tag-pill">' + window.GK.plan.esc(cat.l1) + "</span>" : "") +
        (cat.l2 && !/^\d+$/.test(String(cat.l2)) ? '<span class="tag-pill">' + window.GK.plan.esc(cat.l2) + "</span>" : "") +
        (cat.code ? '<span class="tag-pill">代码 ' + window.GK.plan.esc(cat.code) + "</span>" : "") +
        "</div>";
    }
    body.innerHTML =
      catLine +
      '<div class="sd-stat-row">' +
      statCell(m.schools, "开设院校") + statCell(m.plan, "2026计划") +
      statCell(m.minScore == null ? "-" : m.minScore, "最低分") + statCell(m.minRank == null ? "-" : m.minRank, "最低位次") +
      "</div>";
    var totalS = m.subj["不限"] + m.subj["物化"] + m.subj["其他"];
    if (totalS) {
      var bars = '<div class="health-bars" style="margin-top:12px">' +
        gradBar("不限", m.subj["不限"], totalS, "var(--m3)") +
        gradBar("物理&化学", m.subj["物化"], totalS, "var(--m1)") +
        gradBar("其他要求", m.subj["其他"], totalS, "var(--m6)") +
        "</div>";
      body.insertAdjacentHTML("beforeend", bars);
    }
    /* 权威简介（掌上高考专业库） */
    if (cat && cat.intro) {
      body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:12px">专业简介</div><div class="sd-desc">' + window.GK.plan.esc(cat.intro) + "</div>");
    } else {
      body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:12px">专业简介</div><div class="sd-desc">暂无收录官方简介，可先参考下方课程与就业信息。</div>');
    }
    /* 主要课程：目录优先，计划口径补充 */
    var coursesHtml = [];
    if (cat && cat.courses) coursesHtml.push('<div class="sd-desc">' + window.GK.plan.esc(cat.courses) + "</div>");
    if (info.courses) coursesHtml.push('<div class="sd-desc" style="margin-top:6px;color:var(--text-3)">浙江招生计划口径：' + window.GK.plan.esc(info.courses) + "</div>");
    if (coursesHtml.length) body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:12px">主要课程</div>' + coursesHtml.join(""));
    /* 就业方向 */
    var careerHtml = [];
    if (cat && cat.career) careerHtml.push('<div class="sd-desc">' + window.GK.plan.esc(cat.career) + "</div>");
    if (info.career) careerHtml.push('<div class="sd-desc" style="margin-top:6px;color:var(--text-3)">浙江招生计划口径：' + window.GK.plan.esc(info.career) + "</div>");
    if (careerHtml.length) body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:12px">就业方向</div>' + careerHtml.join(""));
    if (cat && (cat.salary || cat.jobs)) {
      var extra = [];
      if (cat.salary) extra.push("平均薪资 " + window.GK.plan.esc(cat.salary));
      if (cat.jobs) extra.push("热门行业 " + window.GK.plan.esc(cat.jobs));
      body.insertAdjacentHTML("beforeend", '<div class="sd-desc" style="margin-top:10px;color:var(--text-2)">' + window.GK.plan.esc(extra.join(" · ")) + "</div>");
    }
    /* 招生备注（校区/选科/要求说明，不再冒充简介） */
    if (info.note) {
      body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:12px">招生备注</div><div class="sd-desc" style="color:var(--text-3)">' + window.GK.plan.esc(info.note) + "</div>");
    }
    if (cat && cat.degree) {
      body.insertAdjacentHTML("beforeend", '<div class="sd-desc" style="margin-top:10px;color:var(--text-3)">学位：' + window.GK.plan.esc(cat.degree) + "</div>");
    }
    /* 认知白皮书 · 专业节选（双向跳转：整本白皮书 ↔ 专业详情） */
    var ex = window.GK.whitepaper ? window.GK.whitepaper.excerptFor(name) : "";
    if (ex) body.insertAdjacentHTML("beforeend", ex);
    body.insertAdjacentHTML("beforeend", '<div class="sd-section-title" style="margin-top:14px">开设院校（按软科排名前 20）</div>');
    var tableWrap = document.createElement("div");
    tableWrap.className = "table-scroll";
    tableWrap.style.maxHeight = "300px";
    var rows = majorSchools(m);
    var html = '<table class="data-table" style="min-width:520px"><thead><tr><th>院校</th><th class="col-num">26计划</th><th class="col-num">26分</th><th class="col-num">26位次</th><th class="col-act">查看</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr><td><button class="school-link" data-school="' + window.GK.plan.esc(r.name) + '">' + window.GK.plan.esc(r.name) + "</button></td>" +
        '<td class="col-num">' + (r.plan == null ? "-" : r.plan) + '</td><td class="col-num">' + (r.score == null ? "-" : r.score) + '</td><td class="col-num">' + (r.rank == null ? "-" : r.rank) + '</td><td class="col-act"><button class="row-btn" data-go="' + window.GK.plan.esc(r.name) + '" title="院校详情"><span data-icon="next"></span></button></td></tr>';
    });
    html += "</tbody></table>";
    tableWrap.innerHTML = html;
    body.appendChild(tableWrap);
    var mask = window.GK.modal({ title: "专业 · " + name, body: body, width: "680px" });
    window.GKIcon.mount(body);
    if (window.GK.whitepaper) window.GK.whitepaper.bindExcerpt(mask);
    tableWrap.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () {
        var mask = document.querySelector(".modal-mask");
        if (mask) mask.remove();
        window.GK.explore.openSchool(b.getAttribute("data-go"));
      });
    });
    tableWrap.querySelectorAll(".school-link").forEach(function (b) {
      b.addEventListener("click", function () {
        var mask = document.querySelector(".modal-mask");
        if (mask) mask.remove();
        window.GK.explore.openSchool(b.getAttribute("data-school"));
      });
    });
  }

  function gradBar(label, n, total, color) {
    return '<div class="grad-row"><span class="gname" style="color:' + color + '">' + label + '</span><span class="gbar"><i style="width:' + Math.round(n * 100 / total) + "%;background:" + color + '"></i></span><span class="gval">' + n + "</span></div>";
  }

  function statCell(v, l) {
    return '<div class="school-stat"><div class="v">' + v + '</div><div class="l">' + l + "</div></div>";
  }

  function majorSchools(m) {
    var out = [];
    var L = window.GK.data.L;
    window.GK.data.LIBRARY.forEach(function (r) {
      if (r[L.MN] !== m.name) return;
      var ln = window.GK.data.findLines(2026, r[L.CODE], r[L.MC])[0] || null;
      out.push({
        code: r[L.CODE], name: r[L.NAME],
        plan: r[L.P26],
        score: ln ? ln[5] : null,
        rank: ln ? ln[6] : null
      });
    });
    var meta = window.GK_SCHOOL_META || {};
    out.sort(function (a, b) {
      var ra = meta[a.name] ? (meta[a.name].rk || 99999) : 99999;
      var rb = meta[b.name] ? (meta[b.name].rk || 99999) : 99999;
      return ra - rb;
    });
    return out.slice(0, 20);
  }

  function init() {
    document.getElementById("majGo").addEventListener("click", function () {
      st.search = document.getElementById("majSearch").value.trim();
      st.subj = document.getElementById("majSubj").value;
      st.sort = document.getElementById("majSort").value;
      st.page = 1;
      render();
    });
    render();
  }

  window.GK = window.GK || {};
  window.GK.majors = { init: init, render: render, showMajor: showMajor };
})();
