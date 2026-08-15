/* 潮汐志愿 · 主页：欢迎工作台 */
(function () {
  var S = window.GK.state;

  function esc(s) { return window.GK.plan.esc(s); }
  function go(name) { if (window.GK.goPage) window.GK.goPage(name); }
  function greeting() {
    var h = new Date().getHours();
    var nick = S.profile && S.profile.nickname ? S.profile.nickname : "";
    var base;
    if (h < 5) base = "夜深了";
    else if (h < 9) base = "早上好";
    else if (h < 12) base = "上午好";
    else if (h < 14) base = "中午好";
    else if (h < 18) base = "下午好";
    else base = "晚上好";
    return nick ? base + "，" + nick : base;
  }

  /* 与问候时段对应的插画槽位：清晨路线 / 上午山居 / 午后垂钓 / 傍晚夜行 / 深夜星空 */
  function heroSlot() {
    var h = new Date().getHours();
    if (h < 5) return "night";
    if (h < 9) return "morning";
    if (h < 14) return "midday";
    if (h < 18) return "afternoon";
    return "evening";
  }

  function render() {
    /* 每次进入主页重放入场动画 */
    var home = document.getElementById("page-home");
    if (home) {
      home.classList.remove("home-in");
      void home.offsetWidth;
      home.classList.add("home-in");
    }
    renderHero();
    renderStats();
    renderProfile();
    renderGrad();
    renderMountain();
    renderNext();
  }

  function renderHero() {
    var p = S.profile;
    var greetEl = document.getElementById("homeGreet");
    if (greetEl) {
      var g = greeting();
      var nick = S.profile && S.profile.nickname ? S.profile.nickname : "";
      var html = "";
      if (nick) {
        var idx = g.indexOf("，");
        var base = idx >= 0 ? g.slice(0, idx) : g;
        var isLatin = /^[\x00-\xFF\s·._-]+$/.test(nick);
        html = esc(base) + "，<span class=\"greet-nick" + (isLatin ? " is-en" : "") + "\">" + esc(nick) + "</span>";
      } else {
        html = esc(g);
      }
      greetEl.innerHTML = html;
    }
    var art = document.getElementById("homeHeroArt");
    if (art) art.setAttribute("data-slot", heroSlot());
    var sub = document.getElementById("homeSub");
    var acts = document.getElementById("homeActions");
    if (p) {
      sub.innerHTML = "愿你的每一份志愿，都有回响。<br>" +
        '<span class="home-sub-meta">' + p.score + " 分 · 全省 " + p.rank + " 名 · " + esc(p.subjects.join(" / ")) +
        " · " + (S.plans || []).length + " 个方案</span>";
      acts.innerHTML =
        '<button class="btn btn-primary" data-go="plan">去填志愿表</button>' +
        '<button class="btn btn-ghost" data-go="query">数据查询</button>' +
        '<button class="btn btn-ghost" data-go="explore">院校探索</button>';
    } else {
      sub.innerHTML = "从选科开始，建立你的高考档案。<br><span class=\"home-sub-meta\">七选三 · 自由选科 · 数据仅存本机</span>";
      acts.innerHTML = '<button class="btn btn-primary" data-go="profile">建立高考档案</button>';
    }
  }

  /* 高考档案卡：低调展示，不施压 */
  function renderProfile() {
    var el = document.getElementById("homeProfile");
    if (!el) return;
    var p = S.profile;
    if (!p) {
      el.innerHTML = '<div class="home-card-title">高考档案<span class="home-more" data-go="profile">去设置 ›</span></div>' +
        '<div class="home-empty">还没有档案，点这里建立。</div>';
      return;
    }
    el.innerHTML =
      '<div class="home-card-title">高考档案<span class="home-more" data-go="profile">编辑 ›</span></div>' +
      '<div class="home-profile">' +
      '<div class="hp-main"><b>' + p.score + '</b><span>分</span></div>' +
      '<div class="hp-line">全省位次 <b>' + p.rank + '</b></div>' +
      '<div class="hp-line">' + esc(p.subjects.join(" / ")) + '</div>' +
      '</div>';
  }

  function stats() {
    var plans = S.plans || [];
    var total = 0, marked = 0;
    plans.forEach(function (pl) {
      total += pl.items.length;
      marked += pl.items.filter(function (x) { return x.mark; }).length;
    });
    var health = null;
    if (total && window.GK.plan && window.GK.plan.healthCheck) {
      health = window.GK.plan.healthCheck().score;
    }
    return { plans: plans.length, total: total, marked: marked, health: health };
  }

  function renderStats() {
    var s = stats();
    var cls = s.health == null ? "na" : s.health >= 85 ? "ok" : s.health >= 65 ? "warn" : "bad";
    document.getElementById("homeStats").innerHTML =
      '<div class="home-card-title">方案速览<span class="home-more" data-go="plan">去志愿表 ›</span></div>' +
      '<div class="home-stats">' +
      '<button class="hs-cell" data-go="plan"><div class="hs-v">' + s.plans + '</div><div class="hs-l">方案</div></button>' +
      '<button class="hs-cell" data-go="plan"><div class="hs-v">' + s.total + '</div><div class="hs-l">志愿总数</div></button>' +
      '<button class="hs-cell" data-go="plan"><div class="hs-v">' + s.marked + '</div><div class="hs-l">已标记</div></button>' +
      '<button class="hs-cell" data-go="plan"><div class="hs-v hs-health ' + cls + '">' + (s.health == null ? "—" : s.health) + '</div><div class="hs-l">健康分</div></button>' +
      '</div>';
  }

  function renderGrad() {
    var items = S.plans && S.plans.length ? S.plans[0].items : [];
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
    var total = items.length || 1;
    var names = [["冲", "var(--m1)"], ["稳", "var(--m2)"], ["保", "var(--m3)"], ["不建议", "var(--text-3)"], ["未定", "var(--border-strong)"]];
    var keys = ["c", "w", "b", "n", "u"];
    var html = '<div class="home-card-title">冲稳保分布<span class="home-more" data-go="plan">详情 ›</span></div>';
    if (!items.length) {
      html += '<div class="home-empty">还没有志愿，去「数据查询」里挑几个回来吧。</div>';
    } else {
      html += '<div class="home-stats" style="grid-template-columns:repeat(3,1fr)">' +
        '<div class="hs-cell"><div class="hs-v" style="color:var(--m1)">' + counts.c + '</div><div class="hs-l">冲</div></div>' +
        '<div class="hs-cell"><div class="hs-v" style="color:var(--m2)">' + counts.w + '</div><div class="hs-l">稳</div></div>' +
        '<div class="hs-cell"><div class="hs-v" style="color:var(--m3)">' + counts.b + '</div><div class="hs-l">保</div></div>' +
        '</div>';
      html += '<div class="home-grad-bar">';
      names.forEach(function (n, i) {
        var w = Math.round(counts[keys[i]] * 100 / total);
        if (w) html += '<i style="width:' + w + "%;background:" + n[1] + '"></i>';
      });
      html += '</div><div class="home-grad-legend">';
      names.forEach(function (n, i) {
        html += '<span><i style="background:' + n[1] + '"></i>' + n[0] + " " + counts[keys[i]] + "</span>";
      });
      html += "</div>";
    }
    document.getElementById("homeGrad").innerHTML = html;
  }

  function renderMountain() {
    var el = document.getElementById("homeMountain");
    var seg = window.GK.data.segmentFor ? window.GK.data.segmentFor(2026) : [];
    var p = S.profile;
    var html = '<div class="home-card-title">一分一段 · 2026<span class="home-more" data-go="profile">查看全图 ›</span></div>';
    if (!seg.length || !p) {
      el.innerHTML = html + '<div class="home-empty">建立档案后，这里会标出你在全省的位置。</div>';
      return;
    }
    var lo = Math.max(seg[seg.length - 1][0], p.score - 80);
    var hi = Math.min(seg[0][0], p.score + 80);
    var pts = seg.filter(function (r) { return r[0] >= lo && r[0] <= hi; });
    if (pts.length < 2) pts = seg.slice(0, 6);
    var W = 320, H = 96, PL = 8, PR = 8, PT = 10, PB = 14;
    var maxC = Math.max.apply(null, pts.map(function (r) { return r[1]; })) * 1.05 || 1;
    var iw = W - PL - PR, ih = H - PT - PB;
    function sx(s) { return PL + (pts[0][0] - s) / (pts[0][0] - pts[pts.length - 1][0]) * iw; }
    function sy(c) { return PT + ih - (c / maxC) * ih; }
    var area = "M" + PL + " " + (PT + ih) + " " + pts.map(function (r, i) { return "L" + sx(r[0]).toFixed(1) + " " + sy(r[1]).toFixed(1); }).join(" ") + " L" + (PL + iw) + " " + (PT + ih) + " Z";
    var line = pts.map(function (r, i) { return (i ? "L" : "M") + sx(r[0]).toFixed(1) + " " + sy(r[1]).toFixed(1); }).join(" ");
    var inRange = p.score >= lo && p.score <= hi;
    var nearest = pts.slice().sort(function (a, b) { return Math.abs(a[0] - p.score) - Math.abs(b[0] - p.score); })[0];
    html += '<div class="home-mountain" data-go="profile"><svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" style="width:100%;height:112px" aria-label="一分一段迷你图">' +
      '<path d="' + area + '" fill="var(--accent)" fill-opacity="0.12"/>' +
      '<path d="' + line + '" fill="none" stroke="var(--accent)" stroke-width="1.6"/>' +
      (inRange && nearest ? '<line x1="' + sx(p.score).toFixed(1) + '" y1="' + PT + '" x2="' + sx(p.score).toFixed(1) + '" y2="' + (PT + ih) + '" stroke="var(--m1)" stroke-width="1.6" stroke-dasharray="3 3"/>' + '<circle cx="' + sx(p.score).toFixed(1) + '" cy="' + sy(nearest[1]).toFixed(1) + '" r="3.2" fill="var(--m1)" stroke="var(--surface)" stroke-width="1"/>' : "") +
      '</svg><div class="home-mountain-tip">' + p.score + " 分 · 位次约 " + p.rank + " · 点击查看全局</div></div>";
    el.innerHTML = html;
  }

  function renderNext() {
    var el = document.getElementById("homeNext");
    var html = '<div class="home-card-title">志愿日程</div>';
    var tl = (window.GK.timeline && window.GK.timeline.items) ? window.GK.timeline.items() : (S.timeline || []);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var sorted = tl.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var upcoming = sorted.filter(function (t) { return !t.done && t.date >= todayStr; });
    var show = upcoming.slice(0, 3);
    if (!show.length) {
      var allDone = tl.length && sorted.every(function (t) { return t.done; });
      html += '<div class="home-tl-sub">' + (allDone ? "全程日程 · 所有节点已完成，等待录取通知 🎉" : "近期没有待办，以下为全程日程一览") + "</div>";
      sorted.forEach(function (t) {
        var done = !!t.done;
        html += '<div class="home-tl' + (done ? " done" : "") + '" data-tl="' + esc(t.id) + '" title="点击切换完成状态"><div class="htl-date">' +
          esc((t.date || "").slice(5).replace("-", "/")) + '</div><div class="htl-body"><div class="htl-name">' + esc(t.name) +
          (t.desc ? '<span class="htl-desc">' + esc(t.desc.length > 30 ? t.desc.slice(0, 30) + "…" : t.desc) + "</span>" : "") +
          '</div></div><div class="htl-count">' + (done ? "已完成" : "待办") + "</div></div>";
      });
    } else {
      show.forEach(function (t) {
        var diff = Math.round((new Date(t.date + "T00:00:00") - today) / 86400000);
        var label = diff === 0 ? "就是今天" : "还有 " + diff + " 天";
        html += '<div class="home-tl" data-tl="' + esc(t.id) + '" title="点击标记完成"><div class="htl-date">' +
          esc((t.date || "").slice(5).replace("-", "/")) + '</div><div class="htl-body"><div class="htl-name">' + esc(t.name) +
          (t.desc ? '<span class="htl-desc">' + esc(t.desc.length > 34 ? t.desc.slice(0, 34) + "…" : t.desc) + "</span>" : "") +
          '</div></div><div class="htl-count">' + label + "</div></div>";
      });
      if (upcoming.length > 3) html += '<div class="home-tl-more">还有 ' + (upcoming.length - 3) + " 个节点待办，点击条目可标记完成</div>";
    }
    var items = S.plans && S.plans.length ? S.plans[0].items : [];
    var unmarked = items.filter(function (x) { return !x.mark; }).length;
    if (unmarked) html += '<div class="home-todo" data-go="plan">还有 <b>' + unmarked + '</b> 个志愿未标记，点这里一键推荐冲稳保。</div>';
    else if (items.length) html += '<div class="home-todo ok" data-go="plan">志愿标记齐全，方案看起来不错。</div>';
    if (!items.length) html += '<div class="home-empty">先添加志愿，主页会有更丰富的内容。</div>';
    el.innerHTML = html;
  }

  function init() {
    var home = document.getElementById("page-home");
    if (home) {
      home.addEventListener("click", function (e) {
        var row = e.target && e.target.closest ? e.target.closest("[data-tl]") : null;
        if (row) {
          var id = row.getAttribute("data-tl");
          var tl = window.GK.timeline.items();
          var t = tl.filter(function (x) { return x.id === id; })[0];
          if (t) { t.done = !t.done; window.GK.save(); render(); }
          return;
        }
        var b = e.target && e.target.closest ? e.target.closest("[data-go]") : null;
        if (b) go(b.getAttribute("data-go"));
      });
    }
    render();
  }

  window.GK = window.GK || {};
  window.GK.home = { init: init, render: render };
})();
