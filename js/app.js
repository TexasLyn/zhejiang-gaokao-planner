/* 浙志愿 · 核心：状态、存储、主题、导航、引导、弹窗、Toast */
(function () {
  var STORE_KEY = "zzy-volunteer-v1";

  var DEFAULT_STATE = {
    profile: null,               // { subjects:[], score, rank }
    theme: { mode: "light", accent: "teal", glass: "auto", wall: "", wallCustom: "", exp: false, online: "auto" },
    ui: { planCols: { code: true, majorCode: true, trend: true, y26: true, y25: true, y24: true, y23: true, y22: true, y21: true, duration: true, tuition: true, mark: true } },
    marks: [
      { id: 1, label: "冲", color: "var(--m1)" },
      { id: 2, label: "稳", color: "var(--m2)" },
      { id: 3, label: "保", color: "var(--m3)" },
      { id: 4, label: "垫", color: "var(--m4)" },
      { id: 5, label: "选", color: "var(--m5)" },
      { id: 6, label: "备", color: "var(--m6)" }
    ],
    plans: [],
    library: []
  };

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      var s = JSON.parse(raw);
      var merged = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_STATE)), s);
      merged.marks = (s.marks && s.marks.length === 6) ? s.marks : merged.marks;
      return merged;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* 空间不足时忽略 */ }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    var root = document.getElementById("toastRoot");
    var el = document.createElement("div");
    el.className = "toast " + (type || "info");
    el.textContent = msg;
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transition = "opacity .25s";
      setTimeout(function () { el.remove(); }, 260);
    }, 2600);
  }

  /* ---------- 弹窗 ---------- */
  function modal(opts) {
    var root = document.getElementById("modalRoot");
    var mask = document.createElement("div");
    mask.className = "modal-mask";
    var box = document.createElement("div");
    box.className = "modal-box";
    if (opts.width) box.style.width = opts.width;

    var head = document.createElement("div");
    head.className = "modal-head";
    var h3 = document.createElement("h3");
    h3.textContent = opts.title || "";
    var close = document.createElement("button");
    close.className = "icon-btn";
    close.setAttribute("aria-label", "关闭");
    close.appendChild(window.GKIcon.render("x", 15));
    close.addEventListener("click", function () { mask.remove(); });
    head.appendChild(h3);
    head.appendChild(close);

    var body = document.createElement("div");
    body.className = "modal-body";
    if (opts.body) {
      if (typeof opts.body === "string") body.innerHTML = opts.body;
      else body.appendChild(opts.body);
    }

    box.appendChild(head);
    box.appendChild(body);

    if (opts.footer) {
      var foot = document.createElement("div");
      foot.className = "modal-foot";
      opts.footer.forEach(function (b) {
        var btn = document.createElement("button");
        btn.className = "btn " + (b.kind === "primary" ? "btn-primary" : b.kind === "danger" ? "btn-danger-ghost" : "");
        btn.textContent = b.text;
        btn.addEventListener("click", function () {
          var r = b.onClick ? b.onClick() : null;
          if (r !== false) mask.remove();
        });
        foot.appendChild(btn);
      });
      box.appendChild(foot);
    }

    mask.appendChild(box);
    mask.addEventListener("mousedown", function (e) {
      if (e.target === mask && opts.closable !== false) mask.remove();
    });
    var onKey = function (e) {
      if (e.key === "Escape" && opts.closable !== false) mask.remove();
    };
    document.addEventListener("keydown", onKey);
    mask.addEventListener("remove", function () {
      document.removeEventListener("keydown", onKey);
    }, { once: true });
    root.appendChild(mask);
    return mask;
  }

  function confirmDialog(title, message, onOk) {
    modal({
      title: title,
      body: "<p style='font-size:13px;color:var(--text-2);line-height:1.6'>" + message + "</p>",
      footer: [
        { text: "取消", onClick: function () {} },
        { text: "确定", kind: "danger", onClick: function () { onOk && onOk(); } }
      ]
    });
  }

  /* ---------- 主题 ---------- */
  var ACCENTS = [
    { id: "teal", name: "青", c: "#0d9488" },
    { id: "blue", name: "蓝", c: "#2f6fed" },
    { id: "indigo", name: "靛", c: "#5656e0" },
    { id: "violet", name: "紫", c: "#8b46e2" },
    { id: "nju", name: "南雍紫", c: "#6a3d9a", nju: true },
    { id: "rose", name: "玫", c: "#d63a5e" },
    { id: "orange", name: "橙", c: "#dc6a10" },
    { id: "green", name: "绿", c: "#178a55" },
    { id: "ink", name: "墨", c: "#46535e" }
  ];

  function applyTheme() {
    var t = state.theme;
    document.documentElement.setAttribute("data-mode", t.mode);
    document.documentElement.setAttribute("data-accent", t.accent);
    var glass = t.glass === "auto" ? detectGlass() : t.glass === "on";
    document.documentElement.setAttribute("data-glass", glass ? "on" : "off");
    var wall = t.wall || "";
    if (wall) {
      document.documentElement.setAttribute("data-wall", wall);
      var img = wall === "custom" ? t.wallCustom : "";
      if (!img) {
        var wm = (window.GK_WALLPAPERS || []).find(function (w) { return w.id === wall; });
        if (wm) {
          try { img = new URL(wm.file, document.baseURI || location.href).href; }
          catch (e) { img = wm.file; }
        }
      }
      document.documentElement.style.setProperty("--wall-img", img ? "url(\"" + img + "\")" : "none");
    } else {
      document.documentElement.removeAttribute("data-wall");
      document.documentElement.style.removeProperty("--wall-img");
    }
    var moon = document.querySelector("#themeToggle");
    if (moon) moon.innerHTML = "";
    if (moon) moon.appendChild(window.GKIcon.render(t.mode === "dark" ? "sun" : "moon", 15));
  }

  function detectGlass() {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-transparency: reduce)").matches) return false;
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
      if (window.screen && window.screen.width < 768) return false;
      var el = document.createElement("div");
      el.style.backdropFilter = "blur(2px)";
      return !!el.style.backdropFilter || !!el.style.webkitBackdropFilter;
    } catch (e) { return false; }
  }

  /* ---------- 导航 ---------- */
  var PAGE_TITLES = {
    plan: "志愿表",
    query: "数据查询",
    library: "志愿库",
    simulate: "录取模拟",
    timeline: "志愿日程",
    explore: "院校探索",
    ranks: "高校排名",
    majors: "专业探索",
    profile: "个人中心"
  };

  function goPage(name) {
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("is-active", n.getAttribute("data-page") === name);
    });
    var MAIN_TABS = ["plan", "query", "explore", "profile"];
    document.querySelectorAll(".m-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-page") === name);
    });
    var moreTab = document.getElementById("mMoreBtn");
    if (moreTab) {
      var inMore = MAIN_TABS.indexOf(name) < 0;
      moreTab.classList.toggle("is-active", inMore);
      var dot = document.getElementById("mMoreDot");
      if (dot) dot.hidden = !inMore;
    }
    document.querySelectorAll(".m-sheet-item").forEach(function (it) {
      it.classList.toggle("is-active", it.getAttribute("data-page") === name);
    });
    closeMore();
    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.toggle("is-active", p.id === "page-" + name);
    });
    var target = document.getElementById("page-" + name);
    if (target) {
      target.classList.remove("page-anim");
      void target.offsetWidth;
      target.classList.add("page-anim");
    }
    document.getElementById("pageTitle").textContent = PAGE_TITLES[name];
    if (name === "plan" && window.GK.plan) window.GK.plan.renderAll();
    if (name === "query" && window.GK.query) window.GK.query.refresh();
    if (name === "library" && window.GK.library) window.GK.library.render();
    if (name === "simulate" && window.GK.simulate) window.GK.simulate.refresh();
    if (name === "timeline" && window.GK.timeline) window.GK.timeline.render();
    if (name === "explore" && window.GK.explore) window.GK.explore.refresh();
    if (name === "ranks" && window.GK.ranks) window.GK.ranks.render();
    if (name === "majors" && window.GK.majors) window.GK.majors.render();
    if (name === "profile" && window.GK.profile) window.GK.profile.render();
  }

  /* ---------- 移动端「更多」抽屉 ---------- */
  function closeMore() {
    var mask = document.getElementById("mMask");
    var sheet = document.getElementById("mSheet");
    if (mask) mask.hidden = true;
    if (sheet) sheet.hidden = true;
  }
  function openMore() {
    var mask = document.getElementById("mMask");
    var sheet = document.getElementById("mSheet");
    if (!mask || !sheet) return;
    var opening = sheet.hidden;
    sheet.hidden = false;
    mask.hidden = false;
    if (!opening) {
      /* 已展开则收起 */
      sheet.hidden = true;
      mask.hidden = true;
    }
  }

  /* ---------- 用户信息 ---------- */
  function renderUser() {
    var p = state.profile;
    var top = document.getElementById("topUserText");
    var side = document.getElementById("sidebarUserText");
    if (p) {
      if (top) top.textContent = p.score + "分 · " + p.rank + "名";
      if (side) side.textContent = p.subjects.join(" · ") + " · " + p.score + "分";
    } else {
      if (top) top.textContent = "未设置档案";
      if (side) side.textContent = "未设置档案";
    }
  }

  /* ---------- 院校标签胶囊 ---------- */
  function schoolPills(code, name) {
    var tags = window.GK.data.tagsOfSchool(code, name);
    if (!tags.length) return "";
    var max = 2;
    var html = '<span class="tag-pills">';
    tags.slice(0, max).forEach(function (t) {
      html += '<span class="tag-pill" title="' + t + '">' + t + "</span>";
    });
    if (tags.length > max) {
      html += '<span class="tag-pill tag-pill-more" title="' + tags.join(" · ") + '">+' + (tags.length - max) + "</span>";
    }
    return html + "</span>";
  }

  /* ---------- 院校卡片（院校介绍的基础） ---------- */
  function showSchoolModal(code) {
    var info = window.GK.data.schoolInfo(code);
    if (!info) { window.GK.toast("未找到该院校信息", "info"); return; }
    var body = document.createElement("div");
    var head = document.createElement("div");
    head.className = "school-modal-head";
    head.innerHTML =
      '<div class="sm-name">' + window.GK.plan.esc(info.nameClean) + "</div>" +
      '<div class="sm-tags">' + info.tags.map(function (t) { return '<span class="tag-pill">' + t + "</span>"; }).join("") + "</div>" +
      '<div class="sm-meta">' +
      [info.province, info.city].filter(Boolean).join(" · ") +
      (info.nature ? " · " + info.nature : "") +
      " · 院校代码 " + info.code +
      "</div>";
    body.appendChild(head);

    var statRow = document.createElement("div");
    statRow.className = "school-stat-row";
    statRow.innerHTML =
      statCell(info.lines.length, "2026 专业数") +
      statCell(info.planTotal, "计划总数") +
      statCell(info.minScore != null ? info.minScore : "-", "最低分") +
      statCell(info.minRank != null ? info.minRank : "-", "最低位次");
    body.appendChild(statRow);

    if (info.url) {
      var link = document.createElement("a");
      link.className = "sm-link";
      link.href = info.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "查看招生章程";
      body.appendChild(link);
    }

    /* 院校元数据（软科排名 / 国网 / 中外合作 / 高校资料） */
    var meta = info.meta;
    if (meta) {
      var mrow = document.createElement("div");
      mrow.className = "school-stat-row";
      var cells = [];
      if (meta.rk) cells.push('<div class="school-stat"><div class="v">' + meta.rk + '</div><div class="l">软科排名</div></div>');
      if (meta.founded) cells.push('<div class="school-stat"><div class="v" style="font-size:13px">' + window.GK.plan.esc(meta.founded) + '</div><div class="l">建校</div></div>');
      if (meta.flCount != null) cells.push('<div class="school-stat"><div class="v">' + meta.flCount + '</div><div class="l">一流学科</div></div>');
      if (meta.tuimian && meta.tuimian[0] != null) cells.push('<div class="school-stat"><div class="v">' + meta.tuimian[0] + '%</div><div class="l">25推免率</div></div>');
      if (meta.sg) cells.push('<div class="school-stat"><div class="v">' + meta.sg + '</div><div class="l">国网26一批录用</div></div>');
      if (meta.hz) cells.push('<div class="school-stat"><div class="v">' + meta.hz + '</div><div class="l">中外合作项目</div></div>');
      if (cells.length) mrow.innerHTML = cells.join("");
      body.appendChild(mrow);
      var metaText = [];
      if (meta.hua) metaText.push("<b>花称：</b>" + window.GK.plan.esc(meta.hua));
      if (meta.dept) metaText.push("<b>主管部门：</b>" + window.GK.plan.esc(meta.dept));
      if (meta.phone) metaText.push("<b>招生电话：</b>" + window.GK.plan.esc(meta.phone));
      if (meta.addr) metaText.push("<b>地址：</b>" + window.GK.plan.esc(meta.addr));
      if (metaText.length) {
        var mbox = document.createElement("div");
        mbox.className = "dh-note";
        mbox.innerHTML = metaText.join("<br>");
        body.appendChild(mbox);
      }
      if (meta.assess) {
        var abox = document.createElement("div");
        abox.className = "dh-note";
        abox.innerHTML = "<b>学科评估：</b>" + window.GK.plan.esc(meta.assess.slice(0, 120)) + (meta.assess.length > 120 ? "…" : "");
        body.appendChild(abox);
      }
    }

    var tableWrap = document.createElement("div");
    tableWrap.className = "school-table-wrap";
    var table = document.createElement("table");
    table.className = "data-table";
    table.style.minWidth = "480px";
    var thead = "<thead><tr><th>专业代码</th><th>专业名称</th><th class=\"col-num\">计划</th><th class=\"col-num\">分数</th><th class=\"col-num\">位次</th></tr></thead>";
    var tbody = "<tbody>";
    info.lines.slice(0, 16).forEach(function (r) {
      tbody += "<tr><td class=\"muted\">" + r[2] + '</td><td>' + window.GK.plan.esc(r[3]) +
        '</td><td class="col-num">' + (r[4] == null ? "-" : r[4]) +
        '</td><td class="col-num">' + (r[5] == null ? "-" : r[5]) +
        '</td><td class="col-num">' + (r[6] == null ? "-" : r[6]) + "</td></tr>";
    });
    tbody += "</tbody>";
    table.innerHTML = thead + tbody;
    tableWrap.appendChild(table);
    body.appendChild(tableWrap);

    window.GK.modal({ title: "院校卡片 · " + info.code, body: body, width: "640px" });
  }

  function statCell(v, l) {
    return '<div class="school-stat"><div class="v">' + v + '</div><div class="l">' + l + "</div></div>";
  }

  /* ---------- 波动火花线 ---------- */
  function sparkline(series, w, h) {
    w = w || 84; h = h || 24;
    var pts = series.filter(function (p) { return p && typeof p.rank === "number"; });
    if (pts.length < 2) return '<span class="spark-empty">—</span>';
    var ranks = pts.map(function (p) { return p.rank; });
    var min = Math.min.apply(null, ranks), max = Math.max.apply(null, ranks);
    var span = (max - min) || 1;
    var pad = 3;
    var iw = w - pad * 2, ih = h - pad * 2;
    var sx = function (i) { return pad + i * iw / (pts.length - 1); };
    var sy = function (r) { return pad + (max - r) / span * ih; };
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + sx(i).toFixed(1) + " " + sy(p.rank).toFixed(1); }).join(" ");
    var last = pts[pts.length - 1];
    return '<span class="spark"><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="近六年位次波动">' +
      '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="' + sx(pts.length - 1).toFixed(1) + '" cy="' + sy(last.rank).toFixed(1) + '" r="2.2" fill="var(--accent)"/>' +
      "</svg></span>";
  }

  /* ---------- 空状态插画 ---------- */
  function emptyIllust(kind) {
    var arts = {
      plan: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><path d="M24 14h72a4 4 0 0 1 4 4v58a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4z" stroke="var(--border-strong)" stroke-width="2"/><path d="M32 30h56M32 42h56M32 54h38" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="94" cy="34" r="9" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/><path d="M98 32l-7 7" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/></svg>',
      query: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><circle cx="48" cy="44" r="24" stroke="var(--border-strong)" stroke-width="2.5"/><circle cx="48" cy="44" r="16" stroke="var(--accent)" stroke-width="2" opacity=".55"/><path d="M66 62l16 16" stroke="var(--accent)" stroke-width="3.5" stroke-linecap="round"/><path d="M34 44h6M42 32v6" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" opacity=".45"/><path d="M84 20h18M84 26h12M84 32h15" stroke="var(--border-strong)" stroke-width="2" stroke-linecap="round"/></svg>',
      library: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><path d="M16 20h88v58a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V20z" stroke="var(--border-strong)" stroke-width="2.5"/><path d="M32 28v46M60 30v44" stroke="var(--accent)" stroke-width="3" opacity=".5"/><path d="M76 34h22M76 44h22M76 54h14" stroke="var(--border-strong)" stroke-width="2.5" stroke-linecap="round"/></svg>',
      recycle: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><path d="M60 18a42 42 0 1 1 0 84 42 42 0 0 1 0-84z" transform="scale(.95) translate(3 0)" stroke="var(--border-strong)" stroke-width="2.5"/><path d="M60 30v18M60 54h.01" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/></svg>',
      simulate: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><path d="M36 68l16-24 10 14 10-18 12 28" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".6"/><path d="M24 20h18M24 26h12M24 32h15" stroke="var(--border-strong)" stroke-width="2" stroke-linecap="round"/><rect x="70" y="20" width="30" height="34" rx="4" stroke="var(--border-strong)" stroke-width="2"/><path d="M78 30h14M78 38h10" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" opacity=".5"/></svg>',
      timeline: '<svg viewBox="0 0 120 90" width="120" height="90" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="6" fill="var(--accent)"/><circle cx="24" cy="46" r="6" fill="var(--accent)" opacity=".55"/><circle cx="24" cy="68" r="6" fill="var(--accent)" opacity=".3"/><path d="M38 24h56M38 46h44M38 68h50" stroke="var(--border-strong)" stroke-width="2.5" stroke-linecap="round"/></svg>'
    };
    return '<span class="es-ill">' + (arts[kind] || arts.plan) + "</span>";
  }

  /* ---------- 方案分享 ---------- */
  function copyText(text, ok) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        window.GK.toast(ok || "已复制", "success");
      }).catch(function () { window.GK.toast("复制失败，请手动复制", "error"); });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); window.GK.toast(ok || "已复制", "success"); } catch (e) { window.GK.toast("复制失败", "error"); }
      ta.remove();
    }
  }

  function planShareText(plan) {
    var lines = ["【浙志愿 · " + plan.name + "】", "共 " + plan.items.length + " 个志愿"];
    var marks = window.GK.state.marks;
    var counts = [0, 0, 0, 0, 0, 0, 0];
    plan.items.forEach(function (it) { if (it.mark) counts[it.mark]++; });
    marks.forEach(function (m, i) {
      if (counts[i + 1]) lines.push(m.label + " " + counts[i + 1]);
    });
    lines.push("");
    plan.items.slice(0, 40).forEach(function (it, i) {
      lines.push((i + 1) + ". " + it.name + " " + it.majorName + (it.mark ? "（" + marks[it.mark - 1].label + "）" : ""));
    });
    return lines.join("\n");
  }

  function planShareImage(plan) {
    var canvas = document.createElement("canvas");
    var scale = 2;
    var W = 720 * scale, H = 900 * scale;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    var isDark = document.documentElement.getAttribute("data-mode") === "dark";
    var bg = isDark ? "#161a1d" : "#ffffff";
    var text = isDark ? "#e8ecee" : "#191d20";
    var text2 = isDark ? "#9aa5ac" : "#5c646b";
    var accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    var markColors = ["", "#e05d13", "#0d9488", "#2f6fed", "#7c3aed", "#178a55", "#b45309"];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 720, 900);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 720, 6);
    ctx.fillStyle = text;
    ctx.font = "700 24px -apple-system, PingFang SC, sans-serif";
    ctx.fillText("浙志愿 · " + plan.name, 36, 64);
    ctx.fillStyle = text2;
    ctx.font = "400 13px -apple-system, PingFang SC, sans-serif";
    var profile = window.GK.state.profile;
    ctx.fillText((profile ? profile.score + "分 · " + profile.rank + "名" : "") + " · 共 " + plan.items.length + " 个志愿 · 生成于 " + new Date().toLocaleDateString("zh-CN"), 36, 92);
    ctx.strokeStyle = "rgba(128,140,150,.25)";
    ctx.beginPath();
    ctx.moveTo(36, 108); ctx.lineTo(684, 108);
    ctx.stroke();
    var y = 142;
    var shown = Math.min(plan.items.length, 34);
    for (var i = 0; i < shown; i++) {
      var it = plan.items[i];
      ctx.fillStyle = markColors[it.mark || 0];
      ctx.beginPath();
      ctx.arc(46, y - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = text;
      ctx.font = "600 14px -apple-system, PingFang SC, sans-serif";
      ctx.fillText(String(i + 1), 62, y);
      ctx.fillStyle = text;
      ctx.font = "600 14px -apple-system, PingFang SC, sans-serif";
      ctx.fillText(it.name.slice(0, 12), 92, y);
      ctx.fillStyle = text2;
      ctx.font = "400 13px -apple-system, PingFang SC, sans-serif";
      ctx.fillText(it.majorName.slice(0, 30), 210, y);
      y += 26;
      if (y > 820) break;
    }
    if (plan.items.length > shown) {
      ctx.fillStyle = text2;
      ctx.font = "400 12px sans-serif";
      ctx.fillText("… 共 " + plan.items.length + " 个志愿", 92, y + 8);
    }
    ctx.fillStyle = text2;
    ctx.font = "400 11px sans-serif";
    ctx.fillText("数据来源：浙江省教育考试院官方投档线 · 浙志愿", 36, 872);
    var a = document.createElement("a");
    a.download = "浙志愿-" + plan.name + ".png";
    a.href = canvas.toDataURL("image/png");
    a.click();
    window.GK.toast("分享图已生成", "success");
  }

  function showShare(plan) {
    var body = document.createElement("div");
    body.className = "share-options";
    var opt1 = document.createElement("div");
    opt1.className = "share-opt";
    opt1.innerHTML = '<span class="so-ic"></span><span><span class="so-title">复制文本摘要</span><br><span class="so-desc">粘贴到微信/QQ，给家长和老师看</span></span>';
    opt1.querySelector(".so-ic").appendChild(window.GKIcon.render("copy", 17));
    opt1.addEventListener("click", function () { window.GK.copyText(window.GK.planShareText(plan)); });
    var opt2 = document.createElement("div");
    opt2.className = "share-opt";
    opt2.innerHTML = '<span class="so-ic"></span><span><span class="so-title">生成分享长图</span><br><span class="so-desc">导出 PNG 图片，适合朋友圈/群内转发</span></span>';
    opt2.querySelector(".so-ic").appendChild(window.GKIcon.render("image", 17));
    opt2.addEventListener("click", function () { window.GK.planShareImage(plan); });
    body.appendChild(opt1);
    body.appendChild(opt2);
    window.GK.modal({ title: "分享 · " + plan.name, body: body, width: "480px" });
  }

  /* ---------- 首次引导 ---------- */
  function initOnboarding() {
    if (state.profile) {
      document.getElementById("app").hidden = false;
      return;
    }
    var ob = document.getElementById("onboarding");
    ob.hidden = false;
    document.getElementById("app").hidden = true;

    var selected = [];
    var step = 0;

    function show(s) {
      step = s;
      document.querySelectorAll(".onboarding-step").forEach(function (el) {
        el.hidden = parseInt(el.getAttribute("data-step"), 10) !== s;
      });
      if (s === 1) updateSubjectHint();
    }

    function updateSubjectHint() {
      var hint = document.getElementById("obSubjectHint");
      var btn = document.getElementById("obSubjectsNext");
      hint.textContent = "已选 " + selected.length + " / 3";
      btn.disabled = selected.length !== 3;
    }

    document.getElementById("obSubjects").addEventListener("click", function (e) {
      var chip = e.target.closest(".subject-chip");
      if (!chip) return;
      var sub = chip.getAttribute("data-subject");
      var i = selected.indexOf(sub);
      if (i >= 0) {
        selected.splice(i, 1);
        chip.classList.remove("is-on");
      } else if (selected.length < 3) {
        selected.push(sub);
        chip.classList.add("is-on");
      } else {
        toast("最多选择 3 门选考科目", "error");
      }
      updateSubjectHint();
    });

    ob.addEventListener("click", function (e) {
      var next = e.target.closest("[data-ob-next]");
      var back = e.target.closest("[data-ob-back]");
      if (next) show(parseInt(next.getAttribute("data-ob-next"), 10));
      if (back) show(parseInt(back.getAttribute("data-ob-back"), 10));
      if (e.target.id === "obSubjectsNext") show(2);
      if (e.target.id === "obFinish") {
        var score = parseInt(document.getElementById("obScore").value, 10);
        var rank = parseInt(document.getElementById("obRank").value, 10);
        if (!score || score <= 0 || score > 750) { toast("请填写有效的高考总分（0–750）", "error"); return; }
        if (!rank || rank <= 0) { toast("请填写有效的全省位次", "error"); return; }
        state.profile = { subjects: selected.slice().sort(), score: score, rank: rank };
        save();
        ob.hidden = true;
        document.getElementById("app").hidden = false;
        renderUser();
        if (window.GK.query) window.GK.query.refresh();
        if (window.GK.profile) window.GK.profile.render();
        if (window.GK.plan) window.GK.plan.renderAll();
        toast("档案已建立，欢迎使用浙志愿", "success");
      }
    });
    show(0);
  }

  /* ---------- 导出 / 导入全部 ---------- */
  function exportAll() {
    if (!window.XLSX) { toast("Excel 组件未加载", "error"); return; }
    var wb = window.XLSX.utils.book_new();
    (state.plans.length ? state.plans : [{ id: 1, name: "志愿表", items: [] }]).forEach(function (plan, i) {
      var rows = [["序号", "院校代码", "院校名称", "专业代码", "专业名称", "2026", "2025", "2024", "2023", "标记", "备注"]];
      plan.items.forEach(function (it, j) {
        rows.push([j + 1, it.code, it.name, it.majorCode, it.majorName,
          it.s26 ? it.s26.score : "", it.s25 ? it.s25.score : "", it.s24 ? it.s24.score : "", it.s23 ? it.s23.score : "",
          it.mark ? state.marks[it.mark - 1].label : "", it.note || ""]);
      });
      var ws = window.XLSX.utils.aoa_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(wb, ws, (plan.name || "方案" + (i + 1)).slice(0, 31));
    });
    var lib = [["序号", "院校代码", "院校名称", "专业代码", "专业名称", "标记", "备注"]];
    state.library.forEach(function (it, j) {
      lib.push([j + 1, it.code, it.name, it.majorCode, it.majorName, it.mark ? state.marks[it.mark - 1].label : "", it.note || ""]);
    });
    var wsLib = window.XLSX.utils.aoa_to_sheet(lib);
    window.XLSX.utils.book_append_sheet(wb, wsLib, "志愿库");
    window.XLSX.writeFile(wb, "浙志愿备份-" + new Date().toISOString().slice(0, 10) + ".xlsx");
  }

  function importAll(file) {
    if (!window.XLSX) { toast("Excel 组件未加载", "error"); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        var imported = [];
        wb.SheetNames.forEach(function (sn) {
          var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: "" });
          var header = rows[0] || [];
          var hasSchool = header.indexOf("院校代码") >= 0 || header.indexOf("学校代号") >= 0;
          var isPlan = hasSchool && (header.indexOf("2026") >= 0 || header.indexOf("学制") >= 0);
          var isLib = hasSchool && header.indexOf("备注") >= 0 && !isPlan;
          if (!hasSchool) return;
          var name = sn;
          var items = [];
          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            if (!r[1] || !r[3]) continue;
            var mark = 0;
            if (r[9]) {
              var label = String(r[9]).trim();
              var found = state.marks.find(function (m) { return m.label === label; });
              if (found) mark = found.id;
            }
            items.push({
              uid: uid(),
              code: String(r[1]).trim(),
              name: String(r[2] || "").trim(),
              majorCode: String(r[3]).trim(),
              majorName: String(r[4] || "").trim(),
              s26: null, s25: null, s24: null, s23: null,
              mark: mark || null,
              note: String(r[10] || "").trim()
            });
          }
          if (isPlan) imported.push({ id: uid(), name: name, items: items, deleted: [] });
          if (isLib) {
            items.forEach(function (it) {
              state.library.push({ lid: uid(), code: it.code, name: it.name, majorCode: it.majorCode, majorName: it.majorName, mark: it.mark, note: it.note });
            });
          }
        });
        if (imported.length) {
          imported.forEach(function (p) { state.plans.push(p); });
        }
        save();
        if (window.GK.plan) window.GK.plan.renderAll();
        if (window.GK.library) window.GK.library.render();
        toast("导入完成", "success");
      } catch (err) {
        toast("导入失败：" + err.message, "error");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* ---------- 初始化 ---------- */
  function init() {
    applyTheme();
    renderUser();
    window.GKIcon.mount(document.body);

    document.getElementById("themeToggle").addEventListener("click", function () {
      state.theme.mode = state.theme.mode === "dark" ? "light" : "dark";
      save();
      applyTheme();
      if (window.GK.profile) window.GK.profile.renderAppearance();
    });

    document.getElementById("profileShortcut").addEventListener("click", function () { goPage("profile"); });
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.addEventListener("click", function () { goPage(n.getAttribute("data-page")); });
    });
    /* 移动端 Tab 栏与「更多」抽屉 */
    document.querySelectorAll(".m-tab").forEach(function (t) {
      if (t.id === "mMoreBtn") return;
      t.addEventListener("click", function () {
        var p = t.getAttribute("data-page");
        if (p) goPage(p); else openMore();
      });
    });
    var moreBtn = document.getElementById("mMoreBtn");
    if (moreBtn) moreBtn.addEventListener("click", openMore);
    var mMask = document.getElementById("mMask");
    if (mMask) mMask.addEventListener("click", closeMore);
    document.querySelectorAll(".m-sheet-item").forEach(function (it) {
      it.addEventListener("click", function () { goPage(it.getAttribute("data-page")); });
    });

    var firstPlan = state.plans.length === 0;
    if (firstPlan) {
      state.plans.push({ id: uid(), name: "第一方案", items: [], deleted: [] });
      save();
    }

    if (window.GK.plan) window.GK.plan.init();
    if (window.GK.query) window.GK.query.init();
    if (window.GK.library) window.GK.library.init();
    if (window.GK.simulate) window.GK.simulate.init();
    if (window.GK.timeline) window.GK.timeline.init();
    if (window.GK.explore) window.GK.explore.init();
    if (window.GK.ranks) window.GK.ranks.init();
    if (window.GK.majors) window.GK.majors.init();
    if (window.GK.profile) window.GK.profile.init();

    if (window.GK.plan) window.GK.plan.renderAll();
    if (window.GK.library) window.GK.library.render();

    initOnboarding();

    document.getElementById("btnExportAll").addEventListener("click", exportAll);
    document.getElementById("btnImportAll").addEventListener("click", function () {
      var inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".xlsx,.xls";
      inp.onchange = function () { if (inp.files[0]) importAll(inp.files[0]); };
      inp.click();
    });
    document.getElementById("btnResetAll").addEventListener("click", function () {
      confirmDialog("清空本地数据", "将删除全部方案、志愿库与档案，且无法恢复。确定继续吗？", function () {
        localStorage.removeItem(STORE_KEY);
        location.reload();
      });
    });
  }

  window.GK = window.GK || {};
  window.GK.state = state;
  window.GK.save = save;
  window.GK.uid = uid;
  window.GK.toast = toast;
  window.GK.modal = modal;
  window.GK.confirmDialog = confirmDialog;
  window.GK.goPage = goPage;
  window.GK.renderUser = renderUser;
  window.GK.schoolPills = schoolPills;
  window.GK.showSchoolModal = showSchoolModal;
  window.GK.applyTheme = applyTheme;
  window.GK.ACCENTS = ACCENTS;
  window.GK.detectGlass = detectGlass;
  window.GK.sparkline = sparkline;
  window.GK.emptyIllust = emptyIllust;
  window.GK.copyText = copyText;
  window.GK.planShareText = planShareText;
  window.GK.planShareImage = planShareImage;
  window.GK.showShare = showShare;
  window.GK.exportAll = exportAll;
  window.GK.importAll = importAll;
  window.GK.init = init;

  document.addEventListener("DOMContentLoaded", init);
})();
