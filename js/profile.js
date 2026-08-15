(function () {
  var S = window.GK.state;
  var chartYear = 2026;
  var chartView = "near";
  var ALL_SUBJECTS = ["物理", "化学", "生物", "政治", "历史", "地理", "技术"];
  var mtPts = [];
  var mtMerged = null;
  var MOBILE = window.matchMedia ? window.matchMedia("(max-width: 720px)") : null;

  function render() {
    renderSubjects();
    renderFields();
    renderMarks();
    renderAppearance();
    renderMountain();
    renderOverview();
    renderProfileMode();
  }

  function renderOverview() {
    var p = S.profile || {};
    var av = document.getElementById("poAvatar");
    if (av && window.GK.avatarHtml) av.innerHTML = window.GK.avatarHtml(p, 82);
    var nm = document.getElementById("poName");
    if (nm) nm.textContent = p.nickname || "考生";
    var mt = document.getElementById("poMeta");
    if (mt) mt.textContent = (p.score ? p.score + " 分 · " : "") + (p.rank ? "全省位次 " + p.rank : "未设置分数位次");
    var sb = document.getElementById("poSubjects");
    if (sb) sb.innerHTML = (p.subjects && p.subjects.length ? p.subjects.map(function (x) { return "<span>" + x + "</span>"; }).join("") : '<span class="muted">未设置选科</span>');
  }

  function renderProfileMode() {
    var layout = document.getElementById("profileLayout");
    if (window.GKIcon && window.GKIcon.mount) window.GKIcon.mount(document.querySelector(".profile-sidebar"));
    if (MOBILE && MOBILE.matches) {
      /* 移动端：默认回到列表首页，详情作为二级全屏面板 */
      if (layout) layout.classList.remove("m-open");
      showPane("welcome", true);
    } else {
      showPane((S.ui && S.ui.profilePane) || "welcome", true);
    }
  }

  function showPane(key, force) {
    var target = document.querySelector('.pp-sec[data-pane="' + key + '"]');
    if (!target) return;
    var active = document.querySelector(".pp-sec.is-active");
    if (active && active !== target) active.classList.remove("is-active");
    target.classList.add("is-active");
    document.querySelectorAll(".profile-sidebar .ps-item").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-pane") === key && key !== "welcome");
    });
    var layout = document.getElementById("profileLayout");
    if (MOBILE && MOBILE.matches && layout) layout.classList.toggle("m-open", key !== "welcome");
    S.ui = S.ui || {};
    S.ui.profilePane = key;
  }

  function renderSubjects() {
    var el = document.getElementById("profileSubjects");
    el.innerHTML = "";
    ALL_SUBJECTS.forEach(function (s) {
      var chip = document.createElement("button");
      chip.className = "subject-chip" + (S.profile && S.profile.subjects.indexOf(s) >= 0 ? " is-on" : "");
      chip.textContent = s;
      chip.addEventListener("click", function () {
        if (!S.profile) return;
        var i = S.profile.subjects.indexOf(s);
        if (i >= 0) S.profile.subjects.splice(i, 1);
        else if (S.profile.subjects.length < 3) S.profile.subjects.push(s);
        else { window.GK.toast("最多选择 3 门选考科目", "error"); return; }
        S.profile.subjects.sort();
        window.GK.save();
        renderSubjects();
        window.GK.renderUser();
      });
      el.appendChild(chip);
    });
  }

  function renderFields() {
    if (!S.profile) return;
    document.getElementById("profileScore").value = S.profile.score;
    document.getElementById("profileRank").value = S.profile.rank;
    var nick = document.getElementById("profileNickname");
    if (nick) nick.value = S.profile.nickname || "";
    window.GK.renderAvatarPicker(document.getElementById("profileAvatarPicker"), S.profile.avatar);
    var picker = document.getElementById("profileAvatarPicker");
    if (picker && !picker.__bound) {
      picker.__bound = true;
      picker.addEventListener("click", function (e) {
        var b = e.target.closest(".avatar-opt");
        if (!b || !S.profile) return;
        var av = b.getAttribute("data-avatar");
        if (av === "custom") {
          window.GK.openAvatarCustom(function (src) {
            S.profile.avatar = src ? "custom" : "a1";
            S.profile.avatarSrc = src || "";
            window.GK.save();
            window.GK.renderAvatarPicker(picker, S.profile.avatar);
            window.GK.renderUser();
          });
          return;
        }
        S.profile.avatar = av;
        S.profile.avatarSrc = "";
        window.GK.save();
        window.GK.renderAvatarPicker(picker, S.profile.avatar);
        window.GK.renderUser();
      });
    }
  }

  function renderMarks() {
    var el = document.getElementById("markNameGrid");
    el.innerHTML = "";
    S.marks.forEach(function (m) {
      var item = document.createElement("div");
      item.className = "mark-name-item";
      var dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = "var(--m" + m.id + ")";
      var input = document.createElement("input");
      input.value = m.label;
      input.maxLength = 4;
      input.addEventListener("change", function () {
        m.label = input.value.trim() || m.label;
        input.value = m.label;
        window.GK.save();
        if (window.GK.plan) window.GK.plan.renderAll();
        if (window.GK.library) window.GK.library.render();
      });
      item.appendChild(dot);
      item.appendChild(input);
      el.appendChild(item);
    });
  }

  function renderAppearance() {
    document.querySelectorAll("#modeSeg .btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-mode") === S.theme.mode);
    });
    var palette = document.getElementById("accentPalette");
    palette.innerHTML = "";
    window.GK.ACCENTS.forEach(function (a) {
      var sw = document.createElement("button");
      sw.className = "accent-swatch" + (S.theme.accent === a.id ? " is-on" : "");
      sw.style.background = a.c;
      sw.title = a.name;
      sw.setAttribute("aria-label", a.name);
      if (a.nju) {
        var lab = document.createElement("i");
        lab.className = "accent-tag";
        lab.textContent = "NJU";
        sw.appendChild(lab);
      }
      sw.addEventListener("click", function () {
        S.theme.accent = a.id;
        /* 南雍紫绑定专属壁纸；切走自动解除 */
        if (a.id === "nju") S.theme.wall = "nju";
        else if (S.theme.wall === "nju") S.theme.wall = "";
        window.GK.save();
        window.GK.applyTheme();
        renderAppearance();
      });
      palette.appendChild(sw);
    });
    document.querySelectorAll("#glassSeg .btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-glass") === S.theme.glass);
    });
    renderWall();
    document.querySelectorAll("#expSeg .btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-exp") === (S.theme.exp ? "on" : "off"));
    });
    document.querySelectorAll("#onlineSeg .btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-online") === (S.theme.online || "auto"));
    });
    var eqCard = document.getElementById("equalScoreCard");
    if (eqCard) eqCard.hidden = !S.theme.exp;
    var njuAbout = document.getElementById("njuAbout");
    if (njuAbout) njuAbout.hidden = S.theme.accent !== "nju";
  }

  function renderWall() {
    var el = document.getElementById("wallPicker");
    if (!el) return;
    var walls = window.GK_WALLPAPERS || [];
    var html = '<button class="wall-thumb' + (!S.theme.wall ? " is-on" : "") + '" data-wall="" title="不使用背景"><span>无</span></button>';
    walls.forEach(function (w) {
      html += '<button class="wall-thumb' + (S.theme.wall === w.id ? " is-on" : "") + '" data-wall="' + w.id + '" style="background-image:url(' + w.file + ')" title="' + (w.title || w.copyright || w.id) + '"><span class="wt-check"></span></button>';
    });
    html += '<button class="wall-thumb' + (S.theme.wall === "custom" ? " is-on" : "") + '" data-wall="custom" title="选择本地图片作为背景"><span>自定义</span>' + (S.theme.wall === "custom" ? '<span class="wt-check"></span>' : "") + "</button>";
    el.innerHTML = html;
    el.querySelectorAll("[data-wall]").forEach(function (b) {
      b.addEventListener("click", function () {
        var wall = b.getAttribute("data-wall");
        if (wall === "custom") {
          var inp = document.createElement("input");
          inp.type = "file";
          inp.accept = "image/*";
          inp.onchange = function () {
            var f = inp.files[0];
            if (!f) return;
            if (f.size > 1.8 * 1024 * 1024) { window.GK.toast("图片超过 1.8MB，请压缩后重试（本地存储空间有限）", "error"); return; }
            var rd = new FileReader();
            rd.onload = function () {
              S.theme.wall = "custom";
              S.theme.wallCustom = String(rd.result);
              window.GK.save();
              window.GK.applyTheme();
              renderWall();
            };
            rd.readAsDataURL(f);
          };
          inp.click();
          return;
        }
        S.theme.wall = wall;
        window.GK.save();
        window.GK.applyTheme();
        renderWall();
      });
    });
  }

  /* ---------- 一分一段山峰图 ---------- */
  function renderMountain() {
    var seg = window.GK.data.segmentFor(chartYear);
    if (!seg.length) return;
    var userScore = S.profile ? S.profile.score : null;
    var box = document.getElementById("mountain");
    var prev = box.querySelector("svg");
    if (prev) prev.classList.add("mt-out");

    /* 范围：附近（±30）/ 全局 */
    var lo, hi;
    if (chartView === "global" || !userScore) {
      lo = seg[seg.length - 1][0];
      hi = seg[0][0];
    } else {
      lo = Math.max(seg[seg.length - 1][0], userScore - 30);
      hi = Math.min(seg[0][0], userScore + 30);
    }
    var data = seg.filter(function (r) { return r[0] >= lo && r[0] <= hi; });
    if (data.length < 2) data = seg.slice(0, 4);

    /* 顶部合并段（官方只给“X及以上”合计）：拆成衰减估算尾，避免突兀尖峰 */
    var merged = null;
    var pts = [];
    if (data.length && data[0][1] === data[0][2]) {
      var T = data[0][0], C = data[0][1];
      merged = { score: T, count: C };
      var w = [0.45, 0.28, 0.17, 0.10];
      for (var j = 3; j >= 0; j--) {
        pts.push([T + j, Math.max(1, Math.round(C * w[j])), 1]);
      }
      for (var i = 1; i < data.length; i++) pts.push([data[i][0], data[i][1], 0]);
    } else {
      data.forEach(function (r) { pts.push([r[0], r[1], 0]); });
    }

    var W = 720, H = 280, PL = 44, PR = 14, PT = 26, PB = 34;
    var maxCount = Math.max.apply(null, pts.map(function (r) { return r[1]; })) * 1.08;
    var iw = W - PL - PR, ih = H - PT - PB;
    function sx(score) { return PL + (pts[0][0] - score) / (pts[0][0] - pts[pts.length - 1][0]) * iw; }
    function sy(c) { return PT + ih - (c / maxCount) * ih; }

    var solidIdx = merged ? 4 : 0; /* 真实数据起点 */
    var mergedX = merged ? sx(merged.score) : 0;

    /* 面积：完整曲线（含估算尾） */
    var path = "M " + PL + " " + (PT + ih) + " ";
    pts.forEach(function (r, i) {
      path += "L " + sx(r[0]).toFixed(1) + " " + sy(r[1]).toFixed(1) + " ";
    });
    path += "L " + (PL + iw) + " " + (PT + ih) + " Z";

    /* 实线：真实数据 */
    var linePath = pts.slice(solidIdx).map(function (r, i) {
      return (i ? "L " : "M ") + sx(r[0]).toFixed(1) + " " + sy(r[1]).toFixed(1);
    }).join(" ");
    /* 虚线：估算尾（T-1 → T → T+1 → T+2 → T+3） */
    var tailPath = "";
    if (merged) {
      tailPath = "M " + sx(pts[4][0]).toFixed(1) + " " + sy(pts[4][1]).toFixed(1);
      for (var k = 3; k >= 0; k--) {
        tailPath += " L " + sx(pts[k][0]).toFixed(1) + " " + sy(pts[k][1]).toFixed(1);
      }
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", chartYear + " 年浙江一分一段山峰图");

    var area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.setAttribute("d", path);
    area.setAttribute("fill", "var(--accent)");
    area.setAttribute("fill-opacity", "0.12");
    var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", linePath);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "var(--accent)");
    line.setAttribute("stroke-width", "2");
    svg.appendChild(area);
    svg.appendChild(line);
    if (tailPath) {
      var tline = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tline.setAttribute("d", tailPath);
      tline.setAttribute("fill", "none");
      tline.setAttribute("stroke", "var(--accent)");
      tline.setAttribute("stroke-width", "1.6");
      tline.setAttribute("stroke-dasharray", "5 4");
      tline.setAttribute("opacity", "0.65");
      svg.appendChild(tline);
    }
    if (merged) {
      var mv = document.createElementNS("http://www.w3.org/2000/svg", "line");
      mv.setAttribute("x1", mergedX); mv.setAttribute("x2", mergedX);
      mv.setAttribute("y1", PT); mv.setAttribute("y2", PT + ih);
      mv.setAttribute("stroke", "var(--text-3)");
      mv.setAttribute("stroke-width", "1");
      mv.setAttribute("stroke-dasharray", "3 3");
      mv.setAttribute("opacity", "0.5");
      var mt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      mt.setAttribute("x", mergedX + 5); mt.setAttribute("y", PT + 13);
      mt.setAttribute("font-size", "10.5");
      mt.setAttribute("fill", "var(--text-3)");
      mt.textContent = "≥" + merged.score + " 合并 " + merged.count + " 人";
      svg.appendChild(mv); svg.appendChild(mt);
    }

    /* 网格与轴 */
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (var gy = 0; gy <= 4; gy++) {
      var y = PT + ih * gy / 4;
      var gline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gline.setAttribute("x1", PL); gline.setAttribute("x2", W - PR);
      gline.setAttribute("y1", y); gline.setAttribute("y2", y);
      gline.setAttribute("stroke", "var(--border)");
      gline.setAttribute("stroke-width", "1");
      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", PL - 8); label.setAttribute("y", y + 3);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("font-size", "10");
      label.setAttribute("fill", "var(--text-3)");
      label.textContent = Math.round(maxCount * (4 - gy) / 4);
      g.appendChild(gline); g.appendChild(label);
    }
    var xCount = Math.min(8, pts.length);
    for (var xi = 0; xi < xCount; xi++) {
      var idx = Math.round(xi * (pts.length - 1) / (xCount - 1));
      var xl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xl.setAttribute("x", sx(pts[idx][0]));
      xl.setAttribute("y", H - 12);
      xl.setAttribute("text-anchor", "middle");
      xl.setAttribute("font-size", "10");
      xl.setAttribute("fill", "var(--text-3)");
      xl.textContent = pts[idx][0];
      svg.appendChild(xl);
    }
    svg.appendChild(g);

    /* 用户位置 */
    if (userScore && userScore >= lo && userScore <= hi) {
      var ux = sx(userScore);
      var vline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      vline.setAttribute("x1", ux); vline.setAttribute("x2", ux);
      vline.setAttribute("y1", PT); vline.setAttribute("y2", PT + ih);
      vline.setAttribute("stroke", "var(--m1)");
      vline.setAttribute("stroke-width", "1.5");
      vline.setAttribute("stroke-dasharray", "4 3");
      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", ux);
      var uy = PT + ih - 4;
      dot.setAttribute("cy", uy);
      dot.setAttribute("r", "4");
      dot.setAttribute("fill", "var(--m1)");
      var ut = document.createElementNS("http://www.w3.org/2000/svg", "text");
      ut.setAttribute("x", ux); ut.setAttribute("y", PT + 6);
      ut.setAttribute("text-anchor", "middle");
      ut.setAttribute("font-size", "11");
      ut.setAttribute("font-weight", "600");
      ut.setAttribute("fill", "var(--m1)");
      ut.textContent = "你 · " + userScore + "分/" + S.profile.rank + "名";
      svg.appendChild(vline); svg.appendChild(dot); svg.appendChild(ut);
    }
    mtPts = pts;
    mtMerged = merged;
    box.appendChild(svg);
    svg.classList.add("mt-in");
    if (prev) setTimeout(function () { if (prev.parentNode === box) box.removeChild(prev); }, 220);

    /* tooltip */
    var tip = box.querySelector(".mt-tooltip");
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "mt-tooltip";
      box.appendChild(tip);
      box.addEventListener("mousemove", function (e) {
        var p = mtPts, mg = mtMerged;
        if (!p.length) return;
        var rect = box.getBoundingClientRect();
        var px = e.clientX - rect.left;
        var sc = p[0][0] - (px - PL) / iw * (p[0][0] - p[p.length - 1][0]);
        var best = p[0];
        p.forEach(function (r) { if (Math.abs(r[0] - sc) < Math.abs(best[0] - sc)) best = r; });
        tip.style.display = "block";
        if (mg && best[0] >= mg.score) {
          tip.innerHTML = "<b>≥" + mg.score + " 分</b> · 合并段 · 官方合计 " + mg.count + " 人<br><span style='font-size:11px;color:var(--text-3)'>按合计估算分布，非官方细分</span>";
        } else {
          tip.innerHTML = "<b>" + (best[0] >= mg.score && mg ? "≥" + mg.score : best[0]) + " 分</b> · 人数 " + best[1] + (best[2] ? " · 累计 " + best[2] : "");
        }
        var tx = sx(best[0]);
        tip.style.left = Math.max(8, Math.min(box.clientWidth - 150, tx - 60)) + "px";
        tip.style.top = Math.max(8, sy(best[1]) - 38) + "px";
      });
      box.addEventListener("mouseleave", function () { tip.style.display = "none"; });
    }
  }

  function init() {
    /* 关于面板：版本日志折叠（默认展示最新 3 条） */
    (function collapseVersionLog() {
      var items = document.querySelectorAll(".version-log .ver-item");
      if (items.length <= 3) return;
      var log = document.querySelector(".version-log");
      if (!log) return;
      var SHOW = 3;
      var all = Array.prototype.slice.call(items);
      all.slice(SHOW).forEach(function (it) { it.hidden = true; });
      var btn = document.createElement("button");
      btn.className = "btn btn-ghost btn-sm";
      btn.type = "button";
      btn.textContent = "展开全部（" + all.length + " 条）";
      btn.style.marginTop = "6px";
      var open = false;
      btn.addEventListener("click", function () {
        open = !open;
        all.slice(SHOW).forEach(function (it) { it.hidden = !open; });
        btn.textContent = open ? "收起" : "展开全部（" + all.length + " 条）";
      });
      log.appendChild(btn);
    })();

    document.getElementById("btnSaveProfile").addEventListener("click", function () {
      var score = parseInt(document.getElementById("profileScore").value, 10);
      var rank = parseInt(document.getElementById("profileRank").value, 10);
      if (!score || score <= 0 || score > 750) { window.GK.toast("请填写有效总分（0–750）", "error"); return; }
      if (!rank || rank <= 0) { window.GK.toast("请填写有效位次", "error"); return; }
      S.profile.score = score;
      S.profile.rank = rank;
      var nick = document.getElementById("profileNickname");
      if (nick) S.profile.nickname = nick.value.trim() || "";
      window.GK.save();
      window.GK.renderUser();
      if (window.GK.home && window.GK.home.render) window.GK.home.render();
      renderMountain();
      if (window.GK.query) window.GK.query.refresh();
      if (window.GK.plan) window.GK.plan.renderAll();
      window.GK.toast("档案已更新", "success");
    });

    document.getElementById("btnSaveNickname").addEventListener("click", function () {
      var nick = document.getElementById("profileNickname");
      if (!nick) return;
      S.profile.nickname = nick.value.trim() || "";
      window.GK.save();
      window.GK.renderUser();
      if (window.GK.home && window.GK.home.render) window.GK.home.render();
      if (window.GK.plan) window.GK.plan.renderAll();
      window.GK.toast("昵称已更新", "success");
    });

    document.querySelectorAll(".profile-sidebar [data-pane]").forEach(function (b) {
      b.addEventListener("click", function () {
        showPane(b.getAttribute("data-pane"));
        window.GK.save();
      });
    });

    var ppBack = document.getElementById("ppBack");
    if (ppBack) ppBack.addEventListener("click", function () {
      var layout = document.getElementById("profileLayout");
      if (layout) layout.classList.remove("m-open");
      showPane("welcome", true);
      window.GK.save();
    });

    document.querySelectorAll("#modeSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        S.theme.mode = b.getAttribute("data-mode");
        window.GK.save();
        window.GK.applyTheme();
        renderAppearance();
      });
    });

    document.querySelectorAll("#glassSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        S.theme.glass = b.getAttribute("data-glass");
        window.GK.save();
        window.GK.applyTheme();
        renderAppearance();
      });
    });

    document.querySelectorAll("#expSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        S.theme.exp = b.getAttribute("data-exp") === "on";
        window.GK.save();
        renderAppearance();
        if (window.GK.plan) window.GK.plan.renderTable();
        if (window.GK.query) window.GK.query.refresh();
      });
    });

    document.querySelectorAll("#onlineSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        S.theme.online = b.getAttribute("data-online");
        window.GK.save();
        renderAppearance();
      });
    });

    document.getElementById("eqGo").addEventListener("click", function () {
      var year = parseInt(document.getElementById("eqYear").value, 10);
      var score = parseInt(document.getElementById("eqScore").value, 10);
      var out = document.getElementById("eqResult");
      if (!score || score <= 0) { out.textContent = "请填写分数"; return; }
      var eq = window.GK.data.equivalentScore(year, score, 2026);
      var rank = window.GK.data.scoreToRank(year, score);
      if (eq == null) { out.textContent = "该分数超出换算范围"; return; }
      out.innerHTML = year + " 年 " + score + " 分（位次约 " + rank + "）≈ <b>2026 年 " + eq + " 分</b>";
    });

    document.querySelectorAll("#segmentYearSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        chartYear = parseInt(b.getAttribute("data-year"), 10);
        document.querySelectorAll("#segmentYearSeg .btn").forEach(function (x) {
          x.classList.toggle("is-active", x === b);
        });
        renderMountain();
      });
    });

    document.querySelectorAll("#viewSeg .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        chartView = b.getAttribute("data-view");
        document.querySelectorAll("#viewSeg .btn").forEach(function (x) {
          x.classList.toggle("is-active", x === b);
        });
        renderMountain();
      });
    });

    render();
  }

  window.GK = window.GK || {};
  window.GK.profile = { init: init, render: render, renderAppearance: renderAppearance };
})();
