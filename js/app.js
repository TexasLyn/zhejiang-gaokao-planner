/* 浙志愿 · 核心：状态、存储、主题、导航、引导、弹窗、Toast */
(function () {
  var BUILD = window.GK_BUILD || null;
  var STORE_KEY = (BUILD && BUILD.kind === "snapshot") ? "zzy-volunteer-beta-" + (BUILD.tag || "dev") : "zzy-volunteer-v1";

  var EXP_KEYS = ["equalScore", "probBand", "riskMap", "strategy", "snapshot", "compare", "city", "careerTag", "honor", "askAI"];
  function defaultExps() {
    var o = {};
    EXP_KEYS.forEach(function (k) { o[k] = true; }); /* 2.0 转正：所有功能默认开启 */
    return o;
  }

  var DEFAULT_STATE = {
    profile: null,               // { subjects:[], score, rank }
    theme: { mode: "light", accent: "teal", glass: "auto", wall: "", wallCustom: "", exp: false, online: "auto" },
    sponsor: { wechat: "", alipay: "", open: false },
    experiments: defaultExps(),
    snapshots: { a: null, b: null },
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

  /* ---------- 默认头像（2.0） ---------- */
  var AVATARS = [
    { id: "a1", emoji: "🎓", bg: "linear-gradient(135deg,#667eea,#764ba2)" },
    { id: "a2", emoji: "📚", bg: "linear-gradient(135deg,#f093fb,#f5576c)" },
    { id: "a3", emoji: "🦉", bg: "linear-gradient(135deg,#4facfe,#00f2fe)" },
    { id: "a4", emoji: "✈️", bg: "linear-gradient(135deg,#43e97b,#38f9d7)" },
    { id: "a5", emoji: "🎯", bg: "linear-gradient(135deg,#fa709a,#fee140)" },
    { id: "a6", emoji: "🧪", bg: "linear-gradient(135deg,#30cfd0,#330867)" },
    { id: "a7", emoji: "⚖️", bg: "linear-gradient(135deg,#ff9a9e,#fecfef)" },
    { id: "a8", emoji: "🩺", bg: "linear-gradient(135deg,#a18cd1,#fbc2eb)" },
    { id: "a9", emoji: "💰", bg: "linear-gradient(135deg,#f6d365,#fda085)" },
    { id: "a10", emoji: "🎨", bg: "linear-gradient(135deg,#89f7fe,#66a6ff)" },
    { id: "a11", emoji: "🎵", bg: "linear-gradient(135deg,#d299c2,#fef9d7)" },
    { id: "a12", emoji: "🏀", bg: "linear-gradient(135deg,#e0c3fc,#8ec5fc)" }
  ];
  function avatarOf(p) {
    if (p && p.avatar === "custom" && p.avatarSrc) {
      return { id: "custom", src: p.avatarSrc };
    }
    var key = p && p.avatar ? p.avatar : "a1";
    return AVATARS.find(function (a) { return a.id === key; }) || AVATARS[0];
  }
  function escAttr(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function avatarHtml(p, size) {
    var a = avatarOf(p);
    size = size || 40;
    if (a.id === "custom" && a.src) {
      return '<span class="avatar avatar-img" style="width:' + size + "px;height:" + size + 'px"><img src="' + escAttr(a.src) + '" alt="头像"></span>';
    }
    return '<span class="avatar" style="background:' + a.bg + ";width:" + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.5) + 'px">' + a.emoji + "</span>";
  }
  function renderAvatarPicker(el, current) {
    if (!el) return;
    var cur = current || (state.profile && state.profile.avatar) || "a1";
    var html = AVATARS.map(function (a) {
      return '<button type="button" class="avatar-opt' + (a.id === cur ? " is-on" : "") + '" data-avatar="' + a.id + '" style="background:' + a.bg + '">' + a.emoji + "</button>";
    }).join("");
    /* 2.0 转正：自定义头像入口全版本开放 */
    html += '<button type="button" class="avatar-opt avatar-custom' + (cur === "custom" ? " is-on" : "") + '" data-avatar="custom" title="上传自定义头像">' +
      '<span data-icon="upload"></span></button>';
    el.innerHTML = html;
    if (window.GKIcon) window.GKIcon.mount(el);
  }

  /* 自定义头像：圆形裁切面板（缩放 + 拖拽 + 实时预览，输出 256px PNG） */
  function openAvatarCustom(onDone) {
    document.querySelectorAll(".avatar-crop-mask").forEach(function (m) { m.remove(); });
    var SIZE = 320, R = 148;
    var st = { img: null, zoom: 1, ox: 0, oy: 0 };
    var mask = document.createElement("div");
    mask.className = "avatar-crop-mask";
    mask.innerHTML =
      '<div class="avatar-crop-box">' +
        '<div class="acrop-head">自定义头像<span class="acrop-sub">圆形裁切 · 预览实时更新 · 数据仅存本机</span></div>' +
        '<div class="acrop-stage">' +
          '<div class="acrop-canvas-wrap" id="acropWrap">' +
            '<canvas id="acropCanvas" width="' + SIZE + '" height="' + SIZE + '"></canvas>' +
            '<span class="acrop-hint" id="acropHint">先选择一张图片，再拖动调整位置</span>' +
          "</div>" +
          '<div class="acrop-preview"><canvas id="acropPreview" width="96" height="96"></canvas><span>效果预览</span></div>' +
        "</div>" +
        '<div class="acrop-zoom"><span>缩放</span><input type="range" id="acropZoom" min="50" max="300" value="100"><b id="acropZoomVal">100%</b></div>' +
        '<div class="acrop-actions">' +
          '<label class="btn btn-soft btn-sm" style="cursor:pointer">选择图片<input type="file" id="acropFile" accept="image/*" hidden></label>' +
          '<input class="acrop-url" id="acropUrl" type="text" placeholder="或粘贴图片链接，回车加载">' +
          '<button class="btn btn-primary btn-sm" id="acropUse" disabled>使用此头像</button>' +
          '<button class="btn btn-ghost btn-sm" id="acropCancel">取消</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(mask);
    var canvas = mask.querySelector("#acropCanvas");
    var ctx = canvas.getContext("2d");
    var pv = mask.querySelector("#acropPreview");
    var pctx = pv.getContext("2d");

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      pctx.clearRect(0, 0, 96, 96);
      if (!st.img) return;
      var iw = st.img.width, ih = st.img.height;
      var base = Math.min(SIZE / iw, SIZE / ih);
      var w = iw * base * st.zoom, h = ih * base * st.zoom;
      ctx.save();
      ctx.beginPath();
      ctx.arc(SIZE / 2, SIZE / 2, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(st.img, SIZE / 2 - w / 2 + st.ox, SIZE / 2 - h / 2 + st.oy, w, h);
      ctx.restore();
      pctx.drawImage(canvas, 0, 0, 96, 96);
    }

    function loadImg(url) {
      var img = new Image();
      img.onload = function () {
        st.img = img; st.zoom = 1; st.ox = 0; st.oy = 0;
        var hint = mask.querySelector("#acropHint");
        if (hint) hint.style.display = "none";
        var use = mask.querySelector("#acropUse");
        if (use) use.disabled = false;
        var z = mask.querySelector("#acropZoom");
        if (z) z.value = 100;
        var zv = mask.querySelector("#acropZoomVal");
        if (zv) zv.textContent = "100%";
        draw();
      };
      img.onerror = function () { toast("图片加载失败，请换一张试试", "error"); };
      img.src = url;
    }

    mask.querySelector("#acropFile").addEventListener("change", function () {
      var f = mask.querySelector("#acropFile");
      if (!f.files || !f.files[0]) return;
      var r = new FileReader();
      r.onload = function (ev) { loadImg(ev.target.result); };
      r.onerror = function () { toast("图片读取失败，请换一张试试", "error"); };
      r.readAsDataURL(f.files[0]);
    });

    var urlInput = mask.querySelector("#acropUrl");
    urlInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var u = urlInput.value.trim();
      if (!/^https?:\/\//i.test(u)) { toast("链接需以 http:// 或 https:// 开头", "error"); return; }
      loadImg(u);
    });

    mask.querySelector("#acropZoom").addEventListener("input", function () {
      st.zoom = parseInt(this.value, 10) / 100;
      var zv = mask.querySelector("#acropZoomVal");
      if (zv) zv.textContent = this.value + "%";
      draw();
    });

    var wrap = mask.querySelector("#acropWrap");
    var dragging = false, lastX = 0, lastY = 0;
    wrap.addEventListener("pointerdown", function (e) {
      if (!st.img) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      st.ox += e.clientX - lastX;
      st.oy += e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      draw();
    });
    wrap.addEventListener("pointerup", function () { dragging = false; });

    mask.querySelector("#acropUse").addEventListener("click", function () {
      if (!st.img) return;
      var out = document.createElement("canvas");
      out.width = 160; out.height = 160;
      out.getContext("2d").drawImage(canvas, 0, 0, 160, 160);
      var data = out.toDataURL("image/png");
      mask.remove();
      if (onDone) onDone(data);
    });
    mask.querySelector("#acropCancel").addEventListener("click", function () { mask.remove(); });
    mask.addEventListener("mousedown", function (e) { if (e.target === mask) mask.remove(); });
    var onKey = function (e) { if (e.key === "Escape") mask.remove(); };
    document.addEventListener("keydown", onKey);
    mask.addEventListener("remove", function () {
      document.removeEventListener("keydown", onKey);
    }, { once: true });
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      var s = JSON.parse(raw);
      var merged = Object.assign({}, JSON.parse(JSON.stringify(DEFAULT_STATE)), s);
      merged.marks = (s.marks && s.marks.length === 6) ? s.marks : merged.marks;
      merged.experiments = defaultExps(); /* 2.0 转正：忽略旧开关存档，全部开启 */
      /* 老存档：等位分实验开关沿用 theme.exp */
      if (merged.theme.exp) merged.experiments.equalScore = true;
      merged.theme.exp = true; /* 等位分换算器转正 */
      return merged;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  var saveWarned = false;
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      saveWarned = false;
    } catch (e) {
      if (!saveWarned) {
        saveWarned = true;
        toast("本机存储空间不足，本次修改可能无法保存；建议到个人中心导出备份。", "error");
      }
    }
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
    document.documentElement.classList.add("theme-anim");
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
    setTimeout(function () { document.documentElement.classList.remove("theme-anim"); }, 480);
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
  var DISCOVERY_PAGES = ["query", "library", "simulate", "timeline", "explore", "ranks", "majors"];
  var PAGE_TITLES = {
    home: "工作台",
    plan: "志愿表",
    discovery: "探索",
    query: "数据查询",
    library: "志愿库",
    simulate: "录取模拟",
    timeline: "志愿日程",
    explore: "院校探索",
    ranks: "高校排名",
    majors: "专业探索",
    cognition: "认知 · 打开未来",
    profile: "个人中心"
  };

  function goPage(name, opts) {
    var group = DISCOVERY_PAGES.indexOf(name) >= 0 ? "discovery" : name;
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("is-active", n.getAttribute("data-page") === group);
    });
    /* 侧边栏二级导航激活 + 自动展开所属分组 */
    document.querySelectorAll(".nav-sub-item").forEach(function (it) {
      var p = it.getAttribute("data-page");
      var cog = it.getAttribute("data-cog");
      var on = false;
      if (p) on = p === name;
      else if (cog) on = name === "cognition" && window.GK.cognition && window.GK.cognition.getTab() === cog;
      it.classList.toggle("is-active", on);
    });
    if (!(opts && opts.skipExpand)) {
      if (group === "discovery") setNavGroup("navSubDiscovery", true);
      if (name === "cognition") setNavGroup("navSubCognition", true);
    }
    var MAIN_TABS = ["home", "plan", "discovery", "cognition", "profile"];
    document.querySelectorAll(".m-tab").forEach(function (t) {
      t.classList.toggle("is-active", t.getAttribute("data-page") === group);
    });
    /* 探索二级导航：数据查询/志愿库/录取模拟/志愿日程/院校探索/高校排名/专业探索 */
    var sn = document.getElementById("sectionNav");
    if (sn) {
      var inDisc = DISCOVERY_PAGES.indexOf(name) >= 0;
      sn.hidden = !inDisc;
      sn.classList.toggle("is-on", inDisc);
      sn.querySelectorAll(".sn-item").forEach(function (it) {
        it.classList.toggle("is-active", it.getAttribute("data-page") === name);
      });
    }
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
    if (name === "home" && window.GK.home) window.GK.home.render();
    if (name === "discovery") {
      /* 枢纽页为静态内容，无需渲染 */
      window.setTimeout(updateNavInd, 30);
    }
    if (name === "plan" && window.GK.plan) window.GK.plan.renderAll();
    if (name === "query" && window.GK.query) window.GK.query.refresh();
    if (name === "library" && window.GK.library) window.GK.library.render();
    if (name === "simulate" && window.GK.simulate) window.GK.simulate.refresh();
    if (name === "timeline" && window.GK.timeline) window.GK.timeline.render();
    if (name === "explore" && window.GK.explore) window.GK.explore.refresh();
    if (name === "ranks" && window.GK.ranks) window.GK.ranks.render();
    if (name === "majors" && window.GK.majors) window.GK.majors.render();
    if (name === "cognition" && window.GK.cognition) window.GK.cognition.render();
    if (name === "profile" && window.GK.profile) window.GK.profile.render();
    updateNavInd();
  }

  function setNavGroup(id, open) {
    var sub = document.getElementById(id);
    if (!sub) return;
    sub.classList.toggle("is-open", open);
    var head = document.querySelector('.nav-has-sub[data-target="' + id + '"]');
    if (head) head.classList.toggle("is-open", open);
  }

  /* ---------- 侧边栏指示条（Office 式滑动） ---------- */
  function updateNavInd() {
    var nav = document.querySelector(".sidebar-nav");
    var ind = document.getElementById("navInd");
    var active = nav ? nav.querySelector(".nav-item.is-active") : null;
    if (!nav || !ind || !active) return;
    var h = active.offsetHeight - 18;
    if (!(h > 0)) h = 20;
    ind.style.top = (active.offsetTop + 9) + "px";
    ind.style.height = h + "px";
  }

  /* ---------- 表格列宽拖拽调节（双击还原，宽度本地保存） ---------- */
  function applyColResize() {
    document.querySelectorAll("table[data-colresize]").forEach(function (tbl) {
      var key = tbl.getAttribute("data-colresize");
      var ths = tbl.querySelectorAll("thead th");
      if (!ths.length) return;
      /* 隐藏中的表格量不出宽度，等页面可见后再初始化 */
      if (ths[0].getBoundingClientRect().width <= 0) return;
      if (!state.ui.colW) state.ui.colW = {};
      var w = state.ui.colW[key];
      if (!w || w.length !== ths.length || w.every(function (v) { return !v; })) {
        w = [];
        state.ui.colW[key] = w;
      }
      /* 首次：按自动布局量出各列宽度，再切换固定布局（列宽才能真正双向调节） */
      if (tbl.style.tableLayout !== "fixed") {
        if (!w.length) {
          Array.prototype.forEach.call(ths, function (th) {
            var mw = Math.max(44, Math.round(th.getBoundingClientRect().width));
            /* 文字列设上限：过长名称自动换行并限高，避免单行无限拉宽 */
            if (th.classList.contains("col-school")) mw = Math.min(mw, 280);
            else if (th.classList.contains("col-major")) mw = Math.min(mw, 400);
            else if (th.classList.contains("col-seq")) mw = Math.max(mw, 56);
            w.push(mw);
          });
          save();
        }
        tbl.style.tableLayout = "fixed";
        tbl.classList.add("colresize-fixed");
      }
      var old = tbl.querySelector("colgroup");
      if (old) old.remove();
      var cg = document.createElement("colgroup");
      for (var i = 0; i < ths.length; i++) cg.appendChild(document.createElement("col"));
      tbl.insertBefore(cg, tbl.firstChild);
      Array.prototype.forEach.call(cg.children, function (col, i) {
        var nw = w[i] || 88;
        if (ths[i] && ths[i].classList.contains("col-seq")) nw = Math.max(nw, 56);
        col.style.width = nw + "px";
      });
      Array.prototype.forEach.call(ths, function (th, i) {
        var old = th.querySelector(".col-resizer");
        if (old) old.remove();
        var rz = document.createElement("span");
        rz.className = "col-resizer";
        rz.title = "拖拽调整列宽 · 双击还原";
        th.appendChild(rz);
        rz.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var startX = ev.clientX;
          var startW = w[i] || th.getBoundingClientRect().width;
          document.body.classList.add("col-resizing");
          function move(e2) {
            var nw = Math.max(48, Math.min(720, startW + e2.clientX - startX));
            cg.children[i].style.width = nw + "px";
          }
          function up() {
            document.body.classList.remove("col-resizing");
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            w[i] = parseInt(cg.children[i].style.width, 10) || null;
            save();
          }
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        });
        rz.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          cg.children[i].style.width = "";
          w[i] = null;
          save();
        });
      });
    });
  }

  /* 重新按当前内容量列宽（导入新方案后调用，控制行高） */
  function resetColWidths(key) {
    document.querySelectorAll("table[data-colresize]").forEach(function (tbl) {
      if (tbl.getAttribute("data-colresize") !== key) return;
      tbl.style.tableLayout = "";
      tbl.classList.remove("colresize-fixed");
      var cg = tbl.querySelector("colgroup");
      if (cg) cg.remove();
    });
    if (state.ui.colW) delete state.ui.colW[key];
  }

  /* ---------- 弹性拖拽排序（间隙让位 + 弹簧动画 + 插入线） ---------- */
  function elasticDrag(opts) {
    opts.container.querySelectorAll(opts.gripSel).forEach(function (grip) {
      grip.addEventListener("pointerdown", function (e) {
        var el = grip.closest(opts.itemSel);
        if (!el) return;
        e.preventDefault();
        var uid = opts.uidOf(el);
        var items = opts.items();
        var from = opts.indexOf(uid);
        if (from < 0) return;
        var GAP = Math.max(24, Math.round(el.getBoundingClientRect().height));
        var H = from;
        var item = items[from];
        var els = function () { return Array.prototype.slice.call(opts.container.querySelectorAll(opts.itemSel)); };
        var red = function () { return els().filter(function (r) { return r !== el; }); };

        document.body.classList.add("row-dragging");
        opts.container.classList.add("drag-sorting");
        el.classList.add("dragging");
        /* 被拖行移出文档流（由浮层代替），空位/高亮线/落点共用同一套坐标 */
        el.style.display = "none";

        var ghost = document.createElement("div");
        ghost.className = "drag-ghost";
        if (opts.ghostHTML) ghost.innerHTML = opts.ghostHTML(item, from + 1);
        ghost.style.left = (e.clientX + 10) + "px";
        ghost.style.top = (e.clientY + 14) + "px";
        document.body.appendChild(ghost);

        /* 空位槽：带底色的高亮空位，与高亮线严格绑定 */
        var slot = document.createElement("div");
        slot.className = "drag-gap-slot";
        slot.style.height = GAP + "px";
        opts.container.appendChild(slot);

        var line = document.createElement("div");
        line.className = "drag-gap-line";
        opts.container.appendChild(line);

        function slotTop() {
          var list = red();
          var anchor = list[H];
          var last = list[list.length - 1];
          return anchor ? anchor.offsetTop - GAP : (last ? last.offsetTop + last.offsetHeight : 0);
        }
        /* 槽位边界（容器坐标）：插入位 H 与 H+1 之间的中线 */
        function boundary(i) {
          var list = red();
          if (i <= 0) return -1e9;
          if (i >= list.length) return 1e9;
          var a = list[i - 1], b = list[i];
          return (a.offsetTop + a.offsetHeight + b.offsetTop) / 2;
        }
        function applyPreview() {
          var list = els();
          var vi = 0;
          list.forEach(function (r) {
            if (r === el) return;
            r.style.transform = vi >= H ? "translateY(" + GAP + "px)" : "";
            vi++;
          });
          var st = slotTop();
          slot.style.top = st + "px";
          line.style.top = (st + GAP - 2) + "px";
          if (ghost && opts.ghostSeq) {
            var sq = ghost.querySelector(opts.ghostSeq);
            if (sq) sq.textContent = H + 1;
          }
        }
        applyPreview();

        var scrollEl = opts.scrollEl || null;
        function move(ev) {
          ghost.style.left = (ev.clientX + 10) + "px";
          ghost.style.top = (ev.clientY + 14) + "px";
          /* 接近上下边缘自动滚动 */
          if (scrollEl) {
            var sc = scrollEl.getBoundingClientRect();
            if (ev.clientY < sc.top + 42) scrollEl.scrollTop -= 8;
            else if (ev.clientY > sc.bottom - 42) scrollEl.scrollTop += 8;
          } else {
            if (ev.clientY < 90) window.scrollBy(0, -8);
            else if (ev.clientY > innerHeight - 90) window.scrollBy(0, 8);
          }
          /* 滞回换位：指针越过槽位边界 ±6px 才移动槽位，慢速拖动不再抖动错位 */
          var crect = opts.container.getBoundingClientRect();
          var cy = ev.clientY - crect.top;
          var h = H;
          if (cy < boundary(h) - 6) h--;
          else if (cy > boundary(h + 1) + 6) h++;
          h = Math.max(0, Math.min(items.length - 1, h));
          if (h !== H) { H = h; applyPreview(); }
        }

        var settling = false;
        function up() {
          if (settling) return;
          settling = true;
          document.body.classList.remove("row-dragging");
          el.classList.remove("dragging");
          el.style.display = "";
          els().forEach(function (r) { r.style.transform = ""; });
          /* 落位：空位回弹、幽灵滑进空位中心并放大淡出，行在空位原位放大弹出 */
          var crect = opts.container.getBoundingClientRect();
          var st = slotTop();
          slot.style.top = st + "px";
          line.style.top = (st + GAP - 2) + "px";
          ghost.classList.add("settle");
          ghost.style.left = (crect.left + crect.width / 2 - ghost.offsetWidth / 2) + "px";
          ghost.style.top = (crect.top + st + GAP / 2 - ghost.offsetHeight / 2) + "px";
          setTimeout(function () { ghost.classList.add("land"); }, 200);
          setTimeout(function () {
            if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
            if (slot.parentNode) slot.parentNode.removeChild(slot);
            if (line.parentNode) line.parentNode.removeChild(line);
            opts.container.classList.remove("drag-sorting");
            if (opts.onDrop) opts.onDrop(from, H, uid);
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          }, 360);
        }

        function upCancel() {
          if (settling) return;
          settling = true;
          document.body.classList.remove("row-dragging");
          opts.container.classList.remove("drag-sorting");
          el.classList.remove("dragging");
          el.style.display = "";
          els().forEach(function (r) { r.style.transform = ""; });
          if (slot.parentNode) slot.parentNode.removeChild(slot);
          if (line.parentNode) line.parentNode.removeChild(line);
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", upCancel);
        window.addEventListener("blur", upCancel);
      });
    });
  }

  /* ---------- 用户信息 ---------- */
  function renderUser() {
    var p = state.profile;
    var top = document.getElementById("topUserText");
    var av = document.getElementById("sidebarUserAvatar");
    var nm = document.getElementById("sidebarUserName");
    var sub = document.getElementById("sidebarUserSub");
    var chip = document.getElementById("profileShortcut");
    var ic = chip ? chip.querySelector(".btn-ic") : null;
    if (p) {
      if (ic) ic.innerHTML = avatarHtml(p, 15);
      if (top) top.textContent = (p.nickname ? p.nickname + " · " : "") + p.score + "分 · " + p.rank + "名";
      if (av) av.innerHTML = avatarHtml(p, 26);
      if (nm) nm.textContent = p.nickname || "考生";
      if (sub) sub.textContent = p.score + "分 · " + p.rank + "名";
    } else {
      if (ic) ic.innerHTML = window.GKIcon.render("user", 14);
      if (top) top.textContent = "未设置档案";
      if (av) av.innerHTML = window.GKIcon.render("user", 14);
      if (nm) nm.textContent = "未设置";
      if (sub) sub.textContent = "点击完善档案";
    }
  }

  /* ---------- 院校标签胶囊 ---------- */
  function schoolPills(code, name) {
    var tags = window.GK.data.tagsOfSchool(code, name);
    if (!tags.length) return "";
    var max = 2;
    var html = '<span class="tag-pills">';
    tags.slice(0, max).forEach(function (t) {
      html += '<span class="tag-pill" title="' + escAttr(t) + '">' + escAttr(t) + "</span>";
    });
    if (tags.length > max) {
      html += '<button type="button" class="tag-pill tag-pill-more" data-code="' + escAttr(code) + '" data-name="' + escAttr(name) + '" title="点击展开全部属性">+' + (tags.length - max) + "</button>";
    }
    return html + "</span>";
  }

  function escAttr(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /* ---------- 属性胶囊展开（点击 +N 弹出全部，再点/点外部收起） ---------- */
  function bindPillExpand() {
    document.addEventListener("click", function (e) {
      var pop = document.getElementById("tagPop");
      var more = e.target.closest ? e.target.closest(".tag-pill-more") : null;
      if (pop && (!more || pop.getAttribute("data-owner") !== (more.getAttribute("data-code") + "|" + more.getAttribute("data-name")))) {
        closeTagPop();
      }
      if (!more) return;
      e.stopPropagation();
      if (pop) closeTagPop();
      var tags = window.GK.data.tagsOfSchool(more.getAttribute("data-code"), more.getAttribute("data-name"));
      if (!tags.length) return;
      var el = document.createElement("div");
      el.className = "tag-pop";
      el.id = "tagPop";
      el.setAttribute("data-owner", more.getAttribute("data-code") + "|" + more.getAttribute("data-name"));
      tags.forEach(function (t) {
        var s = document.createElement("span");
        s.className = "tag-pill";
        s.textContent = t;
        el.appendChild(s);
      });
      document.body.appendChild(el);
      var r = more.getBoundingClientRect();
      var left = Math.max(8, Math.min(innerWidth - 250, r.left));
      var top = r.bottom + 6;
      if (top + el.offsetHeight + 8 > innerHeight) top = Math.max(8, r.top - el.offsetHeight - 6);
      el.style.top = top + "px";
      el.style.left = left + "px";
      requestAnimationFrame(function () { el.classList.add("show"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeTagPop();
    });
    window.addEventListener("scroll", function () { closeTagPop(); }, true);
  }

  function closeTagPop() {
    var pop = document.getElementById("tagPop");
    if (!pop) return;
    pop.classList.add("hide");
    setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 180);
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
    w = w || 90; h = h || 28;
    var pts = series.filter(function (p) { return p && typeof p.rank === "number"; }).map(function (p) {
      return { rank: p.rank, score: p.score || null, year: p.year || null };
    });
    if (pts.length < 2) return '<span class="spark-empty">—</span>';
    var ranks = pts.map(function (p) { return p.rank; });
    var min = Math.min.apply(null, ranks), max = Math.max.apply(null, ranks);
    var span = (max - min) || 1;
    var pad = 4;
    var iw = w - pad * 2, ih = h - pad * 2;
    var sx = function (i) { return pad + i * iw / (pts.length - 1); };
    /* 位次轴：数字越小越好，画在图表上方 */
    var sy = function (r) { return pad + (r - min) / span * ih; };
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + sx(i).toFixed(1) + " " + sy(p.rank).toFixed(1); }).join(" ");
    var last = pts[pts.length - 1];
    var data = JSON.stringify(pts.map(function (p) { return { y: p.year, s: p.score, r: p.rank }; }));
    var band = "";
    if (state.experiments.probBand && span > 1) {
      var bTop = sy(max), bH = Math.max(1, sy(min) - bTop);
      band = '<rect x="' + pad + '" y="' + bTop.toFixed(1) + '" width="' + iw + '" height="' + bH.toFixed(1) + '" fill="var(--accent)" opacity="0.1" rx="1.5"/>';
    }
    return '<span class="spark" data-pts="' + escAttr(data) + '"><svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="历年位次波动">' +
      band +
      '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="' + sx(pts.length - 1).toFixed(1) + '" cy="' + sy(last.rank).toFixed(1) + '" r="2.2" fill="var(--accent)"/>' +
      "</svg></span>";
  }

  /* 趋势图悬停明细（年份 · 分数 · 位次） */
  function bindSparkTip() {
    var tip = null;
    function remove() { if (tip && tip.parentNode) tip.parentNode.removeChild(tip); tip = null; }
    document.addEventListener("mousemove", function (e) {
      var sp = e.target && e.target.closest ? e.target.closest(".spark") : null;
      if (!sp) { remove(); return; }
      var pts = null;
      try { pts = JSON.parse(sp.getAttribute("data-pts")); } catch (err) {}
      if (!pts || !pts.length) return;
      var svg = sp.querySelector("svg");
      if (!svg) return;
      var r = svg.getBoundingClientRect();
      if (!r.width) return;
      var idx = Math.round((e.clientX - r.left) / r.width * (pts.length - 1));
      idx = Math.max(0, Math.min(pts.length - 1, idx));
      var p = pts[idx];
      if (!tip) { tip = document.createElement("div"); tip.className = "spark-tip"; document.body.appendChild(tip); }
      tip.innerHTML = (p.y ? "<b>" + p.y + " 年</b> " : "") + (p.s ? p.s + " 分 · " : "") + p.r + " 名";
      tip.style.left = Math.min(innerWidth - 160, e.clientX + 12) + "px";
      tip.style.top = (e.clientY + 14) + "px";
    });
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
    var obScore = 0, obRank = 0, obAvatar = "a1", obAvatarSrc = "";
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

    var obAv = document.getElementById("obAvatars");
    if (obAv) {
      obAv.addEventListener("click", function (e) {
        var b = e.target.closest(".avatar-opt");
        if (!b) return;
        var av = b.getAttribute("data-avatar");
        if (av === "custom") {
          openAvatarCustom(function (src) {
            if (src) {
              obAvatar = "custom";
              obAvatarSrc = src;
              renderAvatarPicker(obAv, "custom");
            }
            /* 引导尚未完成 → obAvatar 变量生效；若已跳过/完成 → 直接应用到当前档案 */
            if (state.profile) {
              state.profile.avatar = src ? "custom" : "a1";
              state.profile.avatarSrc = src || "";
              save();
              renderUser();
            }
          });
          return;
        }
        obAvatar = av;
        obAvatarSrc = "";
        obAv.querySelectorAll(".avatar-opt").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      });
    }

    ob.addEventListener("click", function (e) {
      var next = e.target.closest("[data-ob-next]");
      var back = e.target.closest("[data-ob-back]");
      if (next) show(parseInt(next.getAttribute("data-ob-next"), 10));
      if (back) show(parseInt(back.getAttribute("data-ob-back"), 10));
      if (e.target.id === "obSubjectsNext") show(2);
      if (e.target.id === "obScoreNext") {
        var sc = parseInt(document.getElementById("obScore").value, 10);
        var rk = parseInt(document.getElementById("obRank").value, 10);
        if (!sc || sc <= 0 || sc > 750) { toast("请填写有效的高考总分（0–750）", "error"); return; }
        if (!rk || rk <= 0) { toast("请填写有效的全省位次", "error"); return; }
        obScore = sc; obRank = rk;
        renderAvatarPicker(document.getElementById("obAvatars"), "a1");
        show(3);
      }
      var finish = function () {
        var nick = (document.getElementById("obNickname").value || "").trim();
        state.profile = { subjects: selected.slice().sort(), score: obScore, rank: obRank, nickname: nick || "", avatar: obAvatar, avatarSrc: obAvatarSrc };
        save();
        ob.hidden = true;
        document.getElementById("app").hidden = false;
        renderUser();
        if (window.GK.query) window.GK.query.refresh();
        if (window.GK.profile) window.GK.profile.render();
        if (window.GK.plan) window.GK.plan.renderAll();
        if (window.GK.home && window.GK.home.render) window.GK.home.render();
        toast(nick ? "欢迎你，" + nick + "！" : "档案已建立，欢迎使用浙志愿", "success");
      };
      if (e.target.id === "obFinish") finish();
      if (e.target.id === "obSkip") finish();
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

  /* ---------- 赞助支持（收款码） ---------- */
  function sponsorSrc(kind) {
    return kind === "wechat" ? (state.sponsor.wechat || "assets/qr/wechat.png") : (state.sponsor.alipay || "assets/qr/alipay.png");
  }

  function setQr(el, src) {
    var img = new Image();
    var label = el.id === "qrWechat" ? "微信收款码" : "支付宝收款码";
    img.onload = function () {
      el.innerHTML = "";
      img.alt = "";
      el.appendChild(img);
    };
    img.onerror = function () {
      el.innerHTML = '<span class="sqr-empty">' + label + "<br>点击上传</span>";
    };
    img.src = src;
  }

  function renderSponsor() {
    var w = document.getElementById("qrWechat");
    var a = document.getElementById("qrAlipay");
    if (w) setQr(w, sponsorSrc("wechat"));
    if (a) setQr(a, sponsorSrc("alipay"));
  }

  function openQr(kind) {
    var src = sponsorSrc(kind);
    var name = kind === "wechat" ? "微信" : "支付宝";
    modal({
      title: name + " · 赞助支持",
      body: '<div class="qr-modal"><img src="' + escAttr(src) + '" alt="' + name + '收款码"><p class="card-desc" style="text-align:center;margin-top:10px">长按识别 · 感谢回血</p></div>',
      width: "340px"
    });
  }

  function bindSponsor() {
    var toggle = document.getElementById("sponsorToggle");
    var body = document.getElementById("sponsorBody");
    var chev = document.getElementById("sponsorChev");
    if (!toggle || !body || !chev) return;
    function applyOpen(open) {
      body.hidden = !open;
      chev.textContent = open ? "▴" : "▾";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    applyOpen(!!state.sponsor.open);
    toggle.addEventListener("click", function () {
      var open = body.hidden;
      state.sponsor.open = !!open;
      save();
      applyOpen(!!open);
    });
    toggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle.click();
      }
    });

    var file = document.getElementById("sponsorFile");
    if (!file) {
      file = document.createElement("input");
      file.type = "file";
      file.accept = "image/*";
      file.id = "sponsorFile";
      file.style.display = "none";
      document.body.appendChild(file);
    }
    var pendingKind = "wechat";
    function pick(kind) {
      pendingKind = kind;
      file.click();
    }
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        if (pendingKind === "wechat") state.sponsor.wechat = e.target.result;
        else state.sponsor.alipay = e.target.result;
        save();
        renderSponsor();
        toast("收款码已保存到本机", "success");
      };
      reader.readAsDataURL(f);
      file.value = "";
    });

    document.querySelectorAll(".sqr-img").forEach(function (el) {
      el.addEventListener("click", function () {
        var kind = el.getAttribute("data-kind");
        if (state.sponsor[kind]) openQr(kind);
        else pick(kind);
      });
    });
    document.querySelectorAll(".sqr-edit").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        pick(el.getAttribute("data-kind"));
      });
    });
  }

  /* ---------- 实验功能开关 ---------- */
  var EXP_META = {
    equalScore: { label: "等位分换算", desc: "历年分数换算为 2026 等效分（沿用原实验开关）", todo: false },
    probBand: { label: "录取概率区间", desc: "趋势图叠加历年位次区间带，一眼看波动幅度", todo: false },
    riskMap: { label: "风险地图", desc: "志愿表新增整体梯度曲线与兜底参考线", todo: false },
    strategy: { label: "策略助手", desc: "体检增加兜底安全线与冲稳保比例建议", todo: false },
    snapshot: { label: "方案快照对比", desc: "冻结 A/B 方案并排对比健康分", todo: false },
    compare: { label: "院校对比", desc: "多所院校并排对比分数/学科/就业", todo: true },
    city: { label: "城市探索", desc: "按城市浏览院校集群与专业供给", todo: true },
    careerTag: { label: "毕业去向标签", desc: "院校卡片增加深造率/国网/考公等标签", todo: true },
    honor: { label: "录取纪念卡", desc: "录取结果一键生成分享卡片", todo: true },
    askAI: { label: "智问助手", desc: "政策、数据与方案解读问答", todo: true }
  };

  function renderExperiments() {
    var el = document.getElementById("expPanel");
    if (!el) return;
    var html = "";
    EXP_KEYS.forEach(function (k) {
      var m = EXP_META[k];
      var on = !!state.experiments[k];
      html += '<div class="exp-row' + (m.todo ? " exp-todo" : "") + '">' +
        '<div class="exp-info"><div class="exp-name">' + m.label + (m.todo ? ' <span class="flag-pill">规划中</span>' : "") + "</div>" +
        '<div class="exp-desc">' + m.desc + "</div></div>" +
        '<label class="switch' + (on ? " on" : "") + (m.todo ? " disabled" : "") + '"><input type="checkbox" data-exp="' + k + '"' + (on ? " checked" : "") + (m.todo ? " disabled" : "") + '><span class="sw-knob"></span></label>' +
        "</div>";
    });
    el.innerHTML = html;
  }

  function applyExperiments() {
    var show = function (id, on) {
      var el = document.getElementById(id);
      if (el) el.style.display = on ? "" : "none";
    };
    show("btnRiskMap", !!state.experiments.riskMap);
    show("btnSnapA", !!state.experiments.snapshot);
    show("btnSnapB", !!state.experiments.snapshot);
    show("btnSnapCmp", !!state.experiments.snapshot);
    if (window.GK.plan && window.GK.plan.refreshTable) window.GK.plan.refreshTable();
  }

  function renderBuildBadge() {
    var el = document.getElementById("buildBadge");
    if (!el) return;
    if (BUILD && BUILD.kind === "snapshot") {
      el.className = "build-badge is-beta";
      el.innerHTML = "测试版 · " + BUILD.label + '<span class="bb-dot"></span>';
    } else {
      el.className = "build-badge";
      el.textContent = "稳定版";
    }
  }

  /* ---------- 智问助手（2.0 实验 · 规则问答） ---------- */
  var ASK_FAQS = [
    { k: ["位次", "分数和位次"], a: "位次是你在全省同分考生中的排序。浙江按位次先后检索投档，同分时位次靠前先投档；对比往年数据时位次比分数更可靠（分数随试卷难度浮动）。" },
    { k: ["一段", "二段"], a: "浙江普通类分两段：一段（约前 20%）与二段，每段可填 80 个平行志愿。一段投档未录取可参加二段填报，一段线上考生二段仍可填剩余计划。" },
    { k: ["冲稳保", "80 个", "怎么分配"], a: "建议约 2:5:3：前 1/4 冲（往年位次高于你 5%–35%），中间 1/2 稳（±15% 内），末尾 1/4 保（低于你 20% 以上）。大小年明显的专业留出更宽余量。" },
    { k: ["退档"], a: "投档后因选科不符、单科成绩、体检受限等原因被退回。浙江平行志愿按专业投档、一般无调剂风险；核心是填报前核对选科、单科与体检要求。" },
    { k: ["三位一体", "强基"], a: "三位一体=高考+学考+校测按比例折算，多在提前批；强基计划面向基础学科、高考后校测、录取在提前批之前，两者都需提前报名。" },
    { k: ["选科"], a: "浙江七选三自由选。2024 年起理工农医多数要求物理+化学，医学普遍物化，法学/经管多不限。建议倒推：先想专业方向，再看限科。" },
    { k: ["滑档"], a: "滑档=所有志愿都没投进去。避免方式：末尾留足「保」档（位次低于你 20%–40%），且保底志愿要选招生计划稳定、历年波动小的。" },
    { k: ["征求志愿"], a: "一段/二段投档后未录满的计划会进入征求志愿，考生可补报。关注考试院公告与时间节点，本工具「志愿日程」中有整理。" }
  ];
  function openAsk() {
    var chips = ASK_FAQS.map(function (f) { return '<button class="ask-chip" data-k="' + escAttr(f.k[0]) + '">' + escAttr(f.k[0]) + "</button>"; }).join("");
    var body = '<div class="ask-box"><div class="ask-faqs">' + chips + "</div>" +
      '<div class="ask-input-row"><input id="askInput" placeholder="问我：如「浙江大学 计算机 多少分」「临床医学 就业」「什么是位次」…"><button class="btn btn-primary btn-sm" id="askGo">问</button></div>' +
      '<div class="ask-answer" id="askAnswer"><p class="card-desc">智问助手目前为本地规则问答（实验功能），答案客观整理、仅供参考，关键信息以官方公告为准。</p></div></div>';
    var mask = modal({ title: "智问助手", body: body, width: "640px" });
    setTimeout(function () {
      var inp = document.getElementById("askInput");
      if (inp) inp.focus();
    }, 60);
    function answer(q) {
      var out = document.getElementById("askAnswer");
      if (!out) return;
      var text = (q || "").trim();
      if (!text) { out.innerHTML = '<p class="card-desc">输入问题试试，或点击上方常见问题。</p>'; return; }
      var hit = ASK_FAQS.find(function (f) { return f.k.some(function (k) { return text.indexOf(k) >= 0; }); });
      if (hit) { out.innerHTML = '<p class="ask-a">' + escAttr(hit.a) + "</p>"; return; }
      /* 数据查询：院校 + 专业 + 分数/位次 */
      var schoolName = null, majorName = null;
      if (((window.GK_MAJOR_DB || {}).catalog || {})) {
        var mk = Object.keys(((window.GK_MAJOR_DB || {}).catalog || {})).find(function (k) { return text.indexOf(k) >= 0 && k.length >= 3; });
        if (mk) majorName = mk;
      }
      var sk = Object.keys(((window.GK_SCHOOLS || {}).meta || {}) || {}).find(function (k) { return text.indexOf(k) >= 0 && k.length >= 3; });
      if (sk) schoolName = sk;
      if (schoolName && /分|位次|线/.test(text)) {
        var L = window.GK.data.L;
        var lib = window.GK.data.LIBRARY.filter(function (r) { return r[L.NAME].indexOf(schoolName) >= 0 && (!majorName || r[L.MN].indexOf(majorName) >= 0); });
        if (lib.length) {
          var r = lib[0];
          out.innerHTML = '<p class="ask-a">' + escAttr(r[L.NAME]) + " · " + escAttr(r[L.MN]) + "：2025 投档 " + (r[L.S25] || "—") + " 分 / " + (r[L.RK25] || "—") + " 名（选科要求 " + escAttr(r[L.SUBJ26] || "不限") + "）。</p>";
          return;
        }
      }
      if (schoolName) {
        var m = ((window.GK_SCHOOLS || {}).meta || {})[schoolName];
        var tm = m && m.tuimian ? m.tuimian.filter(Boolean).pop() : null;
        out.innerHTML = '<p class="ask-a">' + escAttr(schoolName) + "：" + escAttr((m && m.city) || "") + " · " + escAttr((m && m.nature) || "") + (tm ? " · 推免率约 " + tm + "%" : "") + "。" + (((window.GK_SCHOOLS || {}).intro || {}) && ((window.GK_SCHOOLS || {}).intro || {})[schoolName] ? " 简介已收录，可在「认知 → 高校认知」查看。" : "") + "</p>";
        return;
      }
      if (majorName) {
        var cat = ((window.GK_MAJOR_DB || {}).catalog || {})[majorName];
        out.innerHTML = '<p class="ask-a">' + escAttr(majorName) + "：" + escAttr((cat && cat.career) ? cat.career.slice(0, 120) : "暂无就业信息") + "（详情见「认知 → 专业认知」）。</p>";
        return;
      }
      out.innerHTML = '<p class="card-desc">暂未理解这个问题。可以试试：① 点击上方常见问题；② 问「XX大学 XX专业 多少分」；③ 问「XX专业 就业」；④ 问「什么是位次 / 退档 / 滑档」。</p>';
    }
    mask.addEventListener("click", function (e) {
      var chip = e.target.closest(".ask-chip");
      if (chip) answer(chip.getAttribute("data-k"));
      if (e.target.id === "askGo") answer(document.getElementById("askInput").value);
    });
    mask.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.id === "askInput") answer(document.getElementById("askInput").value);
    });
  }

  /* ---------- 录取纪念卡（2.0 实验） ---------- */
  function honorCard() {
    var school = document.getElementById("honorSchool").value.trim();
    var major = document.getElementById("honorMajor").value.trim();
    if (!school) { toast("请填写录取院校", "error"); return; }
    var c = document.createElement("canvas");
    c.width = 900; c.height = 560;
    var x = c.getContext("2d");
    var g = x.createLinearGradient(0, 0, 900, 560);
    g.addColorStop(0, "#6a3d9a");
    g.addColorStop(1, "#2f2a6e");
    x.fillStyle = g; x.fillRect(0, 0, 900, 560);
    x.globalAlpha = 0.13; x.fillStyle = "#fff";
    x.beginPath(); x.arc(780, 110, 190, 0, 7); x.fill();
    x.beginPath(); x.arc(110, 520, 130, 0, 7); x.fill();
    x.globalAlpha = 1;
    var av = avatarOf(state.profile);
    x.font = "46px sans-serif"; x.textAlign = "center";
    x.fillText(av.emoji, 450, 150);
    x.fillStyle = "#fff";
    x.font = "700 22px 'PingFang SC','Microsoft YaHei',sans-serif";
    x.fillText("录 取 纪 念", 450, 210);
    x.font = "800 50px 'Songti SC','STZhongsong','SimSun',serif";
    x.fillText(school, 450, 300);
    if (major) {
      x.font = "400 26px 'PingFang SC','Microsoft YaHei',sans-serif";
      x.fillText(major, 450, 356);
    }
    x.font = "400 16px 'PingFang SC','Microsoft YaHei',sans-serif";
    x.fillText("2026 年 · " + (state.profile && state.profile.nickname ? state.profile.nickname : "考生") + " · 由浙志愿记录", 450, 440);
    x.fillText("浙志愿 2.0 生成", 450, 480);
    var url = c.toDataURL("image/png");
    document.getElementById("honorResult").innerHTML =
      '<img src="' + url + '" style="width:100%;max-width:420px;border-radius:12px;display:block;box-shadow:0 8px 24px rgba(0,0,0,.2)" alt="录取纪念卡">' +
      '<button class="btn btn-primary btn-sm" id="honorDl" style="margin-top:10px">下载图片</button>';
    var dl = document.getElementById("honorDl");
    if (dl) dl.addEventListener("click", function () {
      var aEl = document.createElement("a");
      aEl.href = url;
      aEl.download = "录取纪念-" + school + ".png";
      aEl.click();
      toast("已开始下载", "success");
    });
  }

  /* ---------- 初始化 ---------- */
  function init() {
    /* 南雍紫壁纸绑定迁移：老存档切到南雍紫但未设壁纸时补绑 */
    if (state.theme.accent === "nju" && !state.theme.wall) {
      state.theme.wall = "nju";
      save();
    }
    bindSponsor();
    renderSponsor();
    renderBuildBadge();
    applyExperiments();
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
    var askBtn = document.getElementById("askBtn");
    if (askBtn) askBtn.addEventListener("click", openAsk);
    var honorGo = document.getElementById("honorGo");
    if (honorGo) honorGo.addEventListener("click", honorCard);
    if (window.GK.cognition) window.GK.cognition.bind();
    if (window.GK.whitepaper) window.GK.whitepaper.bind();
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.addEventListener("click", function () {
        if (n.classList.contains("nav-has-sub")) {
          var id = n.getAttribute("data-target");
          var sub = document.getElementById(id);
          var open = !n.classList.contains("is-open");
          n.classList.toggle("is-open", open);
          if (sub) sub.classList.toggle("is-open", open);
        }
        goPage(n.getAttribute("data-page"), { skipExpand: true });
      });
    });
    /* 侧边栏二级导航（探索子页 / 认知子 tab） */
    document.querySelectorAll(".nav-sub-item").forEach(function (it) {
      it.addEventListener("click", function () {
        var p = it.getAttribute("data-page");
        var cog = it.getAttribute("data-cog");
        if (p) goPage(p);
        else if (cog) {
          goPage("cognition");
          if (window.GK.cognition && window.GK.cognition.goTab) window.GK.cognition.goTab(cog);
        }
      });
    });
    var sideUser = document.getElementById("sidebarUser");
    if (sideUser) sideUser.addEventListener("click", function () { goPage("profile"); });
    /* 移动端 Tab 栏 */
    document.querySelectorAll(".m-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        var p = t.getAttribute("data-page");
        if (p) goPage(p);
      });
    });
    /* 探索二级导航 */
    var sn = document.getElementById("sectionNav");
    if (sn) sn.addEventListener("click", function (e) {
      var it = e.target.closest(".sn-item");
      if (it) goPage(it.getAttribute("data-page"));
    });
    /* 探索枢纽卡片 */
    document.querySelectorAll(".disc-card").forEach(function (c) {
      c.addEventListener("click", function () {
        goPage(c.getAttribute("data-go"));
        var cog = c.getAttribute("data-cog-go");
        if (cog && window.GK.cognition && window.GK.cognition.goTab) {
          window.GK.cognition.goTab(cog);
        }
      });
    });

    var firstPlan = state.plans.length === 0;
    if (firstPlan) {
      state.plans.push({ id: uid(), name: "第一方案", items: [], deleted: [] });
      save();
    }

    if (window.GK.plan) window.GK.plan.init();
    if (window.GK.home) window.GK.home.init();
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

    bindPillExpand();
    bindSparkTip();
    updateNavInd();
    window.addEventListener("resize", function () { updateNavInd(); });

    initOnboarding();
    goPage("home");
    applyColResize();
    updateNavInd();
    requestAnimationFrame(updateNavInd);
    window.addEventListener("load", function () {
      updateNavInd();
      applyColResize();
    });

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
  window.GK.build = BUILD;
  window.GK.expMeta = EXP_META;
  window.GK.avatars = AVATARS;
  window.GK.avatarHtml = avatarHtml;
  window.GK.avatarOf = avatarOf;
  window.GK.renderAvatarPicker = renderAvatarPicker;
  window.GK.openAvatarCustom = openAvatarCustom;
  window.GK.emptyIllust = emptyIllust;
  window.GK.copyText = copyText;
  window.GK.planShareText = planShareText;
  window.GK.planShareImage = planShareImage;
  window.GK.showShare = showShare;
  window.GK.exportAll = exportAll;
  window.GK.importAll = importAll;
  window.GK.applyColResize = applyColResize;
  window.GK.resetColWidths = resetColWidths;
  window.GK.elasticDrag = elasticDrag;
  window.GK.init = init;

  document.addEventListener("DOMContentLoaded", init);
})();
