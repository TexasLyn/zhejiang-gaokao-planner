(function () {
  var S = window.GK.state;
  var st = { search: "", prov: "", tags: [], type: "", sort: "rk", view: "grid", page: 1 };
  var PAGE = 24;
  var schools = [];

  function buildSchools() {
    var byName = {};
    var idx = window.GK.data.schoolIndex;
    Object.keys(idx).forEach(function (code) {
      var s = idx[code];
      byName[s.nameClean] = s;
    });
    var out = [];
    Object.keys(window.GK_SCHOOL_META).forEach(function (name) {
      var m = window.GK_SCHOOL_META[name];
      var si = byName[name] || null;
      out.push({
        name: name,
        code: si ? si.code : (m.code || ""),
        gkId: window.GK.data.schoolId(name),
        intro: window.GK.data.schoolIntro(name),
        meta: m,
        si: si,
        tags: window.GK.data.tagsOfSchool(si ? si.code : "", name),
        prov: (si && si.province) || m.prov || "",
        city: (si && si.city) || m.city || "",
        type: m.type || "",
        nature: (si && si.nature) || m.nature || "",
        rk: m.rk || null,
        rkType: m.rkType || "总榜",
        rkScore: m.rkScore || null,
        founded: m.founded || "",
        sg: m.sg || 0,
        hz: m.hz || 0,
        hua: m.hua || "",
        tuimian: m.tuimian && m.tuimian[0] != null ? m.tuimian[0] : null,
        dept: m.dept || "",
        phone: m.phone || "",
        addr: m.addr || "",
        assess: m.assess || "",
        flCount: m.flCount,
        urlZ: m.urlZ || "", urlX: m.urlX || "", urlBK: m.urlBK || "",
        origin: m.origin || "",
        jh: window.GK_SCHOOL_JIANGHU ? window.GK_SCHOOL_JIANGHU[name] : null,
        lineCount: si ? si.lines.length : 0,
        minRank: si ? si.minRank : null,
        planTotal: si ? si.planTotal : 0
      });
    });
    /* 有 2026 投档线但没有院校资料的学校也纳入 */
    Object.keys(byName).forEach(function (name) {
      if (!out.some(function (x) { return x.name === name; })) {
        var si = byName[name];
        out.push({
          name: name, code: si.code, meta: null, si: si,
          gkId: window.GK.data.schoolId(name),
          intro: window.GK.data.schoolIntro(name),
          tags: window.GK.data.tagsOfSchool(si.code, name),
          prov: si.province, city: si.city, type: "", nature: si.nature,
          rk: null, rkType: "", rkScore: null, founded: "", sg: 0, hz: 0, hua: "",
          tuimian: null, dept: "", phone: "", addr: "", assess: "", flCount: null,
          urlZ: "", urlX: "", urlBK: "", origin: "",
          jh: window.GK_SCHOOL_JIANGHU ? window.GK_SCHOOL_JIANGHU[name] : null,
          lineCount: si.lines.length, minRank: si.minRank, planTotal: si.planTotal
        });
      }
    });
    out.sort(function (a, b) { return (a.rk || 99999) - (b.rk || 99999); });
    return out;
  }

  /* ---------- 生成封面（无照片时的渐变+校园剪影） ---------- */
  function fallbackCover(name, w, h) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
    var hue = hash;
    var c1 = "hsl(" + hue + ", 55%, 45%)";
    var c2 = "hsl(" + ((hue + 45) % 360) + ", 60%, 30%)";
    var short = name.replace(/大学|学院|\(.*\)|（.*）/g, "").slice(0, 4) || name.slice(0, 4);
    var bld = "";
    for (var k = 0; k < 7; k++) {
      var bw = 18 + ((hash + k * 13) % 22);
      var bh = 18 + ((hash + k * 29) % 26);
      var bx = 10 + k * 24;
      bld += '<rect x="' + bx + '" y="' + (h - bh - 18) + '" width="' + bw + '" height="' + bh + '" fill="rgba(255,255,255,.16)"/>';
    }
    return '<svg class="sc-fallback" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
      '<circle cx="' + (w - 30) + '" cy="28" r="26" fill="rgba(255,255,255,.08)"/>' +
      '<circle cx="' + (w - 62) + '" cy="16" r="12" fill="rgba(255,255,255,.07)"/>' +
      bld +
      '<text x="14" y="' + (h - 24) + '" font-size="15" font-weight="700" fill="rgba(255,255,255,.9)" font-family="sans-serif">' + short + "</text>" +
      "</svg>";
  }

  function coverHtml(s) {
    var online = window.GK.state.theme.online !== "off";
    var info = photoInfo(s.name);
    var inner;
    if (online && info.url) {
      inner = '<img data-photo="' + window.GK.plan.esc(s.name) + '" data-local="' + info.local + '" src="' + window.GK.plan.esc(info.url) + '" alt="' + window.GK.plan.esc(s.name) + '" loading="lazy">';
    } else if (info.local) {
      inner = '<img src="assets/schools/' + info.local + '" alt="' + window.GK.plan.esc(s.name) + '" loading="lazy">';
    } else {
      inner = badgeCover(s.name, 480, 216) || ((online && s.gkId) ? brandCover(s, 480, 216) : fallbackCover(s.name, 480, 216));
    }
    return '<div class="sc-cover">' + inner + '<div class="sc-grad"></div><div class="sc-name-overlay">' + window.GK.plan.esc(s.name) + "</div></div>";
  }

  function brandCover(s, w, h) {
    w = w || 480; h = h || 216;
    var hash = 0;
    for (var i = 0; i < s.name.length; i++) hash = (hash * 31 + s.name.charCodeAt(i)) % 360;
    var c1 = "hsl(" + hash + ", 48%, 46%)";
    var c2 = "hsl(" + ((hash + 48) % 360) + ", 55%, 30%)";
    return '<svg class="sc-fallback" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
      '<defs><linearGradient id="g' + (s.gkId || "x") + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#g' + (s.gkId || "x") + ')"/>' +
      '<circle cx="' + (w - 52) + '" cy="40" r="74" fill="rgba(255,255,255,.10)"/>' +
      '<circle cx="' + (w - 96) + '" cy="20" r="30" fill="rgba(255,255,255,.08)"/>' +
      '<image href="https://static-data.gaokao.cn/upload/logo/' + s.gkId + '.png" x="' + (w - 92) + '" y="12" width="56" height="56" preserveAspectRatio="xMidYMid meet"/>' +
      "</svg>";
  }

  function normParen(n) {
    return String(n).replace(/（/g, "(").replace(/）/g, ")");
  }

  function badgeOf(name) {
    var b = window.GK_SCHOOL_BADGES || {};
    return b[name] || b[normParen(name)] || "";
  }

  /* 矢量校徽封面（无实景图时的品牌兜底，优先于网络 logo 与文字渐变） */
  function badgeCover(name, w, h) {
    var slug = badgeOf(name);
    if (!slug) return "";
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
    var big = h >= 300;
    return '<div class="badge-cover" style="background:linear-gradient(135deg,hsl(' + hash + ',48%,46%),hsl(' + ((hash + 48) % 360) + ',55%,30%))">' +
      '<i class="fc-icon fc-icon-' + slug + '"' + (big ? ' style="font-size:118px"' : ' style="font-size:44px"') + '></i>' +
      (big ? '<span class="bc-name">' + window.GK.plan.esc(name) + '</span><span class="bc-sub">暂无实景图 · 先用矢量校徽占位</span>' : "") +
      "</div>";
  }

  /* 在线直链优先（质量更高），本地兜底，再品牌封面 */
  function photoInfo(name) {
    var p = window.GK_SCHOOL_PHOTOS || {};
    var s = window.GK_SCHOOL_PHOTO_SRC || {};
    return {
      local: p[name] || p[normParen(name)] || "",
      url: s[name] || s[normParen(name)] || ""
    };
  }

  function bindPhotoFallback(el) {
    el.querySelectorAll("img[data-photo]").forEach(function (img) {
      img.addEventListener("error", function () {
        var name = img.getAttribute("data-photo");
        var local = img.getAttribute("data-local");
        if (local) {
          img.src = "assets/schools/" + local;
          img.removeAttribute("data-local");
          img.removeAttribute("data-photo");
          return;
        }
        var cover = img.closest(".sc-cover");
        var s = schools.find(function (x) { return x.name === name; });
        if (cover) {
          var rep = badgeCover(name, 480, 216) || ((s && s.gkId && window.GK.state.theme.online !== "off") ? brandCover(s, 480, 216) : fallbackCover(name, 480, 216));
          cover.innerHTML = rep;
          var ov = document.createElement("div");
          ov.className = "sc-name-overlay";
          ov.textContent = name;
          cover.appendChild(ov);
        }
      });
    });
  }

  function cardHtml(s) {
    var reco = s.name === "南京大学" ? '<span class="tag-pill tag-reco">推荐</span>' : "";
    var tags = reco + s.tags.slice(0, 4).map(function (t) { return '<span class="tag-pill">' + t + "</span>"; }).join("");
    var meta = [];
    if (s.prov) meta.push(s.prov + (s.city ? " · " + s.city : ""));
    if (s.rk) meta.push("软科 <b>" + s.rk + "</b>");
    if (s.tuimian != null) meta.push("推免 <b>" + s.tuimian + "%</b>");
    if (s.sg) meta.push("国网 <b>" + s.sg + "</b>");
    return '<div class="school-card" data-school="' + window.GK.plan.esc(s.name) + '">' +
      coverHtml(s) +
      '<div class="sc-body">' +
      '<div class="sc-tags">' + (tags || '<span class="tag-pill">' + (s.type || "院校") + "</span>") + "</div>" +
      '<div class="sc-meta">' + meta.join('<span>·</span>') + "</div>" +
      "</div></div>";
  }

  function filtered() {
    return schools.filter(function (s) {
      if (st.search && s.name.indexOf(st.search) < 0) return false;
      if (st.prov && s.prov !== st.prov) return false;
      if (st.tags.length && !st.tags.every(function (t) { return s.tags.indexOf(t) >= 0; })) return false;
      if (st.type && s.type !== st.type) return false;
      return true;
    });
  }

  function sortSchools(list) {
    if (st.sort === "name") list.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
    else if (st.sort === "schools") list.sort(function (a, b) { return b.lineCount - a.lineCount; });
    else list.sort(function (a, b) {
      if (a.name === "南京大学") return -1;
      if (b.name === "南京大学") return 1;
      return (a.rk || 99999) - (b.rk || 99999);
    });
    return list;
  }

  function renderList() {
    var el = document.getElementById("expList");
    var list = sortSchools(filtered());
    if (st.view === "grid") {
      var pages = Math.max(1, Math.ceil(list.length / PAGE));
      if (st.page > pages) st.page = pages;
      var slice = list.slice((st.page - 1) * PAGE, st.page * PAGE);
      el.innerHTML = '<div class="exp-list-head"><span class="result-title">共 ' + list.length + " 所院校</span><span class=\"result-meta\">第 " + st.page + " / " + pages + " 页</span></div>" +
      '<div class="school-grid">' + slice.map(cardHtml).join("") + "</div>" +
        pagerHtml(pages);
      bindCards(el);
      bindPhotoFallback(el);
      bindPager(el, pages);
    } else {
      renderRank(list);
    }
    window.GKIcon.mount(el);
  }

  function renderRank(list) {
    var isMin = st.view === "rank-min", isArt = st.view === "rank-art";
    var rows = list.filter(function (s) {
      if (isMin) return s.rkType === "民办";
      if (isArt) return s.rkType === "艺术";
      return s.rkType === "总榜" || !s.rkType;
    });
    rows.sort(function (a, b) { return (a.rk || 99999) - (b.rk || 99999); });
    var top = rows.slice(0, 200);
    var el = document.getElementById("expList");
    el.innerHTML = '<div class="exp-list-head"><span class="result-title">' + (isMin ? "软科 2026 民办高校排名" : isArt ? "软科 2026 艺术类高校排名" : "软科 2026 中国大学排名") + "</span><span class=\"result-meta\">共 " + rows.length + " 所</span></div>" +
      '<div class="table-card"><div class="table-scroll"><table class="data-table rank-table" style="min-width:640px"><thead><tr><th>排名</th><th>院校名称</th><th>省份</th><th>类型</th><th class="col-num">总分</th><th class="col-act">详情</th></tr></thead><tbody>' +
      top.map(function (s, i) {
        return '<tr' + (i < 3 ? ' class="top3"' : "") + '><td class="rk-num">' + (s.rk || "-") + '</td><td><button class="school-link" data-school="' + window.GK.plan.esc(s.name) + '">' + window.GK.plan.esc(s.name) + "</button>" + s.tags.slice(0, 3).map(function (t) { return '<span class="rank-tag">' + t + "</span>"; }).join("") + '</td><td class="muted">' + (s.prov || "-") + '</td><td class="muted">' + (s.type || "-") + '</td><td class="col-num">' + (s.rkScore != null ? s.rkScore : "-") + '</td><td class="col-act"><button class="row-btn" data-open="' + window.GK.plan.esc(s.name) + '" title="查看"><span data-icon="next"></span></button></td></tr>';
      }).join("") + "</tbody></table></div></div>";
    el.querySelectorAll("[data-open]").forEach(function (b) {
      b.addEventListener("click", function () { openSchool(b.getAttribute("data-open")); });
    });
    el.querySelectorAll(".school-link").forEach(function (b) {
      b.addEventListener("click", function () { openSchool(b.getAttribute("data-school")); });
    });
    window.GKIcon.mount(el);
  }

  function pagerHtml(pages) {
    var h = '<div class="pager gk-pager"><span class="result-meta">共 ' + filtered().length + ' 所 · 第 ' + st.page + " / " + pages + " 页 · 每页 " + PAGE + " 所</span><span class=\"pages\">";
    h += '<button class="page-btn" data-p="' + (st.page - 1) + '"' + (st.page <= 1 ? " disabled" : "") + ' title="上一页"><span data-icon="back"></span></button>';
    var start = Math.max(1, Math.min(st.page - 2, pages - 4));
    var end = Math.min(pages, start + 4);
    for (var i = start; i <= end; i++) {
      h += '<button class="page-btn' + (i === st.page ? " is-cur" : "") + '" data-p="' + i + '">' + i + "</button>";
    }
    h += '<button class="page-btn" data-p="' + (st.page + 1) + '"' + (st.page >= pages ? " disabled" : "") + ' title="下一页"><span data-icon="next"></span></button>';
    h += '</span><span class="jump">跳至 <input type="number" id="expJump" min="1" max="' + pages + '"> 页</span></div>';
    return h;
  }

  function bindPager(el, pages) {
    el.querySelectorAll(".page-btn[data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.disabled) return;
        st.page = parseInt(b.getAttribute("data-p"), 10);
        renderList();
      });
    });
    var jump = el.querySelector("#expJump");
    if (jump) {
      jump.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          var p = parseInt(jump.value, 10);
          if (p >= 1 && p <= pages) { st.page = p; renderList(); }
          else window.GK.toast("页码范围 1–" + pages, "info");
        }
      });
    }
  }

  function bindCards(el) {
    el.querySelectorAll(".school-card").forEach(function (card) {
      card.addEventListener("click", function () {
        openSchool(card.getAttribute("data-school"));
      });
    });
  }

  /* ---------- 院校详情 ---------- */
  function openSchool(name) {
    var s = schools.find(function (x) { return x.name === name; });
    if (!s) { window.GK.toast("未找到该院校", "info"); return; }
    document.getElementById("exploreView").hidden = true;
    var d = document.getElementById("schoolDetail");
    d.hidden = false;
    var info = photoInfo(name);
    var online = window.GK.state.theme.online !== "off";
    var hero;
    if (online && info.url) hero = '<img data-hero="1" data-photo="' + window.GK.plan.esc(name) + '" data-local="' + info.local + '" src="' + window.GK.plan.esc(info.url) + '" alt="' + window.GK.plan.esc(name) + '">';
    else if (info.local) hero = '<img src="assets/schools/' + info.local + '" alt="' + window.GK.plan.esc(name) + '">';
    else hero = badgeCover(name, 1400, 420) || ((online && s.gkId) ? '<div style="width:100%;height:100%">' + brandCover(s, 1400, 420) + "</div>" : fallbackCover(name, 1400, 420));
    var tags = s.tags.map(function (t) { return '<span class="tag-pill">' + t + "</span>"; }).join("");
    d.innerHTML =
      '<div class="sd-hero">' + hero + '<div class="sd-shade"></div>' +
      '<button class="sd-back" id="sdBack"><span data-icon="back"></span>返回</button>' +
      '<div class="sd-head"><div class="sd-name">' + window.GK.plan.esc(name) + "</div>" +
      '<div class="sd-sub">' + [s.prov, s.city, s.type, s.nature].filter(Boolean).join(" · ") + (s.code ? " · 代码 " + s.code : "") + "</div></div></div>" +
      '<div class="sd-body"><div class="card"><div class="sd-stat-row">' +
      statCell(s.rk ? s.rk : "-", "软科排名") +
      statCell(s.lineCount ? s.lineCount : "-", "2026专业数") +
      statCell(s.minRank ? s.minRank : "-", "投档最低位次") +
      statCell(s.tuimian != null ? s.tuimian + "%" : "-", "25推免率") +
      statCell(s.sg ? s.sg : "-", "国网26一批") +
      statCell(s.hz ? s.hz : "-", "中外合作项目") +
      statCell(s.founded || "-", "建校") +
      statCell(s.flCount != null ? s.flCount : "-", "一流学科") +
      "</div></div>" +
      '<div class="sd-tabs" id="sdTabs"><button class="sd-tab is-active" data-tab="overview">概览</button><button class="sd-tab" data-tab="majors">专业与投档</button><button class="sd-tab" data-tab="links">榜单与链接</button></div>' +
      '<div id="sdOverview" class="card sd-pane"></div>' +
      '<div id="sdMajors" class="card sd-pane" hidden></div>' +
      '<div id="sdLinks" class="card sd-pane" hidden></div></div>';
    window.GKIcon.mount(d);
    var heroImg = d.querySelector("img[data-hero]");
    if (heroImg) {
      heroImg.addEventListener("error", function () {
        var nm = heroImg.getAttribute("data-photo");
        var local = heroImg.getAttribute("data-local");
        if (local) {
          heroImg.src = "assets/schools/" + local;
          heroImg.removeAttribute("data-local");
          heroImg.removeAttribute("data-hero");
          return;
        }
        var holder = d.querySelector(".sd-hero");
        if (holder) {
          holder.insertAdjacentHTML("afterbegin", badgeCover(nm, 1400, 420) || ((s.gkId && online) ? brandCover(s, 1400, 420) : fallbackCover(nm, 1400, 420)));
          heroImg.remove();
        }
      });
    }
    document.getElementById("sdBack").addEventListener("click", closeSchool);
    d.querySelectorAll(".sd-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        d.querySelectorAll(".sd-tab").forEach(function (x) { x.classList.toggle("is-active", x === t); });
        var tab = t.getAttribute("data-tab");
        d.querySelectorAll(".sd-pane").forEach(function (p) { p.hidden = true; });
        document.getElementById("sd" + (tab === "overview" ? "Overview" : tab === "majors" ? "Majors" : "Links")).hidden = false;
      });
    });
    renderOverview(s);
    renderMajors(s);
    renderLinks(s);
    enhanceIntro(s);
    window.GK.goPage("explore");
  }

  /* 未本地收录简介的院校：在线补充（经本地代理或直连） */
  function enhanceIntro(s) {
    if (s.intro || window.GK.state.theme.online === "off") return;
    var url = location.protocol === "http:" || location.protocol === "https:"
      ? "/api/school-intro?name=" + encodeURIComponent(s.name)
      : "https://static-data.gaokao.cn/www/2.0/school/" + (s.gkId || "") + "/info.json";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      var data = d && d.data ? d.data : d;
      if (!data || !data.content) return;
      s.intro = {
        content: (data.content || "").slice(0, 600),
        motto: data.motto || "",
        site: data.school_site || data.site || "",
        num_subject: data.num_subject, num_master: data.num_master, num_doctor: data.num_doctor,
        belong: data.belong || "", phone: data.school_phone || "", addr: data.address || "",
        qs: data.qs_rank || "", us: data.us_rank || "", xueke: data.xueke_rank || ""
      };
      renderOverview(s);
      renderLinks(s);
    }).catch(function () {});
  }

  function closeSchool() {
    document.getElementById("schoolDetail").hidden = true;
    document.getElementById("exploreView").hidden = false;
  }

  function statCell(v, l) {
    return '<div class="school-stat"><div class="v">' + v + '</div><div class="l">' + l + "</div></div>";
  }

  function renderOverview(s) {
    var el = document.getElementById("sdOverview");
    var parts = [];
    var intro = s.intro;
    if (intro && intro.content) {
      var full = intro.content;
      var short = full.length > 240 ? full.slice(0, 240) + "…" : full;
      el.innerHTML = '<div class="sd-section-title">院校简介</div>' +
        '<div class="sd-desc" style="margin-bottom:6px" id="introShort">' + window.GK.plan.esc(short) + "</div>" +
        (full.length > 240 ? '<div class="sd-desc" style="margin-bottom:6px" id="introFull" hidden>' + window.GK.plan.esc(full) + '</div><button class="btn btn-ghost btn-sm" id="introToggle">展开全文</button>' : "");
      var tg = el.querySelector("#introToggle");
      if (tg) {
        tg.addEventListener("click", function () {
          var showFull = !el.querySelector("#introFull").hidden;
          el.querySelector("#introFull").hidden = !showFull;
          el.querySelector("#introShort").hidden = showFull;
          tg.textContent = showFull ? "收起" : "展开全文";
        });
      }
    } else {
      el.innerHTML = '<div class="sd-section-title">院校简介</div><div class="sd-desc" style="margin-bottom:12px">暂无收录简介，可先查看下方档案与链接。</div>';
    }
    if (intro && intro.motto) parts.push("<b>校训：</b>" + window.GK.plan.esc(intro.motto));
    if (s.hua) parts.push("<b>花称：</b>" + window.GK.plan.esc(s.hua));
    if (s.origin) parts.push("<b>院校来历：</b>" + window.GK.plan.esc(s.origin));
    if (s.jh && s.jh.jianghu) parts.push("<b>江湖地位：</b>" + window.GK.plan.esc(s.jh.jianghu));
    if (intro && intro.belong) parts.push("<b>主管部门：</b>" + window.GK.plan.esc(intro.belong));
    else if (s.dept) parts.push("<b>主管部门：</b>" + window.GK.plan.esc(s.dept));
    if (s.founded) parts.push("<b>建校：</b>" + window.GK.plan.esc(s.founded));
    if (intro && intro.phone) parts.push("<b>招生电话：</b>" + window.GK.plan.esc(intro.phone));
    else if (s.phone) parts.push("<b>招生电话：</b>" + window.GK.plan.esc(s.phone));
    if (intro && intro.addr) parts.push("<b>地址：</b>" + window.GK.plan.esc(intro.addr));
    else if (s.addr) parts.push("<b>地址：</b>" + window.GK.plan.esc(s.addr));
    if (s.tuimian != null) parts.push("<b>2025 推免率：</b>" + s.tuimian + "%");
    if (s.sg) parts.push("<b>国家电网 2026 一批录用：</b>" + s.sg + " 人");
    if (s.hz) parts.push("<b>中外合作办学：</b>" + s.hz + " 个项目");
    if (s.jh && s.jh.rk25) parts.push("<b>2025 软科：</b>" + window.GK.plan.esc(s.jh.rk25));
    if (s.jh && s.jh.rk26_vs != null && String(s.jh.rk26_vs).trim() !== "") {
      var vs = parseFloat(s.jh.rk26_vs);
      parts.push("<b>26 年名次变化：</b>" + (isNaN(vs) ? window.GK.plan.esc(String(s.jh.rk26_vs)) : vs === 0 ? "与 25 年持平" : vs > 0 ? "较 25 年上升 " + vs + " 位" : "较 25 年下降 " + Math.abs(vs) + " 位"));
    }
    if (intro && (intro.num_subject || intro.num_master || intro.num_doctor)) {
      var nums = [];
      if (intro.num_subject) nums.push("一级学科博士点 " + intro.num_subject + " 个");
      if (intro.num_master) nums.push("硕士点 " + intro.num_master + " 个");
      if (intro.num_doctor) nums.push("博士点 " + intro.num_doctor + " 个");
      parts.push("<b>学科规模：</b>" + nums.join("，"));
    }
    var html = '<div class="sd-section-title" style="margin-top:14px">院校档案</div><div class="sd-desc">' + (parts.join("<br>") || "暂无档案信息，可后续补充。") + "</div>";
    var feat = (window.GK_SCHOOL_FEATURED || {})[s.name];
    if (feat) {
      html += '<div class="sd-section-title" style="margin-top:14px">王牌专业 <span class="muted" style="font-size:11px;font-weight:400">（整理自特色专业汇总，仅供参考）</span></div><div class="sd-desc">' + window.GK.plan.esc(feat) + "</div>";
    }
    var dorm = (window.GK_DORM || {})[s.name];
    if (dorm) {
      html += '<div class="sd-section-title" style="margin-top:14px">校园生活 <span class="muted" style="font-size:11px;font-weight:400">（网友整理，仅供参考，以学校最新通知为准）</span></div><div class="sd-desc">' + window.GK.plan.esc(dorm) + "</div>";
    }
    var a4 = (window.GK_ASSESS_4TH || {})[s.name] || (window.GK_ASSESS_4TH || {})[normParen(s.name)] || null;
    var a5 = (window.GK_ASSESS_5TH || {})[s.name] || (window.GK_ASSESS_5TH || {})[normParen(s.name)] || null;
    var off5 = (window.GK_ASSESS_5TH_OFFICIAL || {})[s.name] || (window.GK_ASSESS_5TH_OFFICIAL || {})[normParen(s.name)] || [];
    var meta5 = window.GK_ASSESS_5TH_META || {};
    if ((a4 && a4.length) || (a5 && a5.length) || (off5 && off5.length)) {
      var gradeOrder = { "A+": 0, A: 1, "A-": 2, "B+": 3, B: 4, "B-": 5, "C+": 6, C: 7, "C-": 8 };
      var gradeCls = { "A+": "a", A: "b", "A-": "c", "B+": "d", B: "d", "B-": "d", "C+": "e", C: "e", "C-": "e" };
      function assessChips(list, offItems) {
        var offMap = {};
        (offItems || []).forEach(function (o) { if (o[0]) offMap[o[0]] = o; });
        return list.slice().sort(function (x, y) {
          var d = (gradeOrder[x[1]] == null ? 9 : gradeOrder[x[1]]) - (gradeOrder[y[1]] == null ? 9 : gradeOrder[y[1]]);
          return d || (x[0] < y[0] ? -1 : 1);
        }).map(function (x) {
          var badge = offMap[x[0]] ? '<i class="off-badge">官宣</i>' : "";
          return '<span class="assess-chip g' + (gradeCls[x[1]] || "e") + '">' + window.GK.plan.esc(x[0]) + " " + window.GK.plan.esc(x[1]) + badge + "</span>";
        }).join("");
      }
      function offChips(offItems) {
        return (offItems || []).filter(function (o) { return !o[0]; }).map(function (o) {
          return '<span class="assess-chip assess-chip-off">官宣 ' + window.GK.plan.esc(o[2] || "") + "</span>";
        }).join("");
      }
      function offChipsAll(offItems) {
        return (offItems || []).map(function (o) {
          var label = (o[0] ? window.GK.plan.esc(o[0]) + " " + window.GK.plan.esc(o[1] || "") + " " : "") + (o[2] ? window.GK.plan.esc(o[2]) : "");
          return '<span class="assess-chip assess-chip-off">官宣 ' + label + "</span>";
        }).join("");
      }
      var both = a4 && a4.length && a5 && a5.length;
      var note = both
        ? '第五轮为网络整理版（' + (meta5.source || "新东方在线 2026-05 汇总") + '），教育部官方未公示完整名单，仅供参考，个别院校另有「官宣」透出信息，与整理表可能存在出入；第四轮为教育部官方公布。'
        : (a5 && a5.length)
          ? '第五轮为网络整理版（' + (meta5.source || "新东方在线 2026-05 汇总") + '），教育部官方未公示完整名单，仅供参考，个别院校另有「官宣」透出信息。'
          : (off5 && off5.length)
            ? '该校暂无第五轮整理表数据，以下为校方/媒体透出信息，仅供参考。'
            : '第四轮为教育部官方公布（2017），该校暂无第五轮整理版数据。';
      html += '<div class="sd-section-title" style="margin-top:14px">学科评估' +
        (both ? '<span class="assess-switch"><button class="assess-tab active" data-r="5">第五轮</button><button class="assess-tab" data-r="4">第四轮</button></span>' : '') +
        "</div>";
      if (a5 && a5.length) {
        html += '<div class="assess-cloud" id="assessCloud5">' + assessChips(a5, off5) + offChips(off5) + "</div>";
      } else if (off5 && off5.length) {
        html += '<div class="assess-cloud" id="assessCloud5"><span class="assess-caption">校方/媒体官宣透出</span>' + offChipsAll(off5) + "</div>";
      }
      if (a4 && a4.length) {
        html += '<div class="assess-cloud" id="assessCloud4"' + (both ? " hidden" : "") + ">" + assessChips(a4) + "</div>";
      }
      html += '<div class="assess-note">' + window.GK.plan.esc(note) + "</div>";
    } else if (s.assess) {
      html += '<div class="sd-section-title" style="margin-top:14px">学科评估 <span class="muted" style="font-size:11px;font-weight:400">（第四轮 · 教育部 2017 年公布）</span></div><div class="sd-desc">' + window.GK.plan.esc(s.assess.slice(0, 260)) + (s.assess.length > 260 ? "…" : "") + "</div>";
    }
    el.innerHTML += html;
    if (a4 && a4.length && a5 && a5.length) {
      var sw = el.querySelector(".assess-switch");
      if (sw) {
        sw.addEventListener("click", function (ev) {
          var btn = ev.target.closest(".assess-tab");
          if (!btn) return;
          var r = btn.getAttribute("data-r");
          sw.querySelectorAll(".assess-tab").forEach(function (b) { b.classList.toggle("active", b === btn); });
          var c4 = el.querySelector("#assessCloud4");
          var c5 = el.querySelector("#assessCloud5");
          if (c4) c4.hidden = r === "5";
          if (c5) c5.hidden = r === "4";
        });
      }
    }
  }

  function renderMajors(s) {
    var el = document.getElementById("sdMajors");
    if (!s.si || !s.si.lines.length) {
      el.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("query") + '<div class="es-title">暂无 2026 投档数据</div><div class="es-desc">该院校 2026 年普通类一段可能没有投档记录。</div></div>';
      return;
    }
    var rows = s.si.lines.slice().sort(function (a, b) { return (a[6] == null ? 1e9 : a[6]) - (b[6] == null ? 1e9 : b[6]); });
    var html = '<div class="sd-section-title">2026 年专业与投档（' + rows.length + " 个专业）</div>" +
      '<div class="table-scroll" style="max-height:420px"><table class="data-table" style="min-width:640px"><thead><tr><th>专业代码</th><th>专业名称</th><th class="col-num">计划</th><th class="col-num">分数</th><th class="col-num">位次</th><th>选科</th><th class="col-act">详情</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var lib = window.GK.data.libFor(r[0], r[1], r[2], r[3]);
        var subj = lib ? window.GK.data.subjectReqOf(r[0], r[1], r[2], r[3]) : "—";
        var cps = window.GK.data.campusesOf(r[0], r[2], r[1], r[3]);
        var cty = lib ? lib[window.GK.data.L.CITY] : "";
        return '<tr><td class="muted">' + r[2] + '</td><td>' + window.GK.plan.esc(r[3]) +
          ((cty || cps.length) ? '<div class="muted" style="font-size:10.5px">' + window.GK.plan.esc([cty, cps.join("→")].filter(Boolean).join(" · ")) + "</div>" : "") +
          '</td><td class="col-num">' + (r[4] == null ? "-" : r[4]) +
          '</td><td class="col-num">' + (r[5] == null ? "-" : r[5]) +
          '</td><td class="col-num">' + (r[6] == null ? "-" : r[6]) +
          '</td><td class="muted">' + window.GK.plan.esc(subj) +
          '</td><td class="col-act"><button class="row-btn" data-major="' + window.GK.plan.esc(r[3]) + '" title="专业详情"><span data-icon="next"></span></button></td></tr>';
      }).join("") + "</tbody></table></div>";
    el.innerHTML = html;
    window.GKIcon.mount(el);
    el.querySelectorAll("[data-major]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (window.GK.majors) window.GK.majors.showMajor(b.getAttribute("data-major"));
      });
    });
  }

  function renderLinks(s) {
    var el = document.getElementById("sdLinks");
    var links = [];
    if (s.urlZ) links.push('<a href="' + s.urlZ + '" target="_blank" rel="noopener">招生章程</a>');
    if (s.urlX) links.push('<a href="' + s.urlX + '" target="_blank" rel="noopener">学校招生信息</a>');
    if (s.urlBK) links.push('<a href="' + s.urlBK + '" target="_blank" rel="noopener">院校百科</a>');
    var intro = s.intro;
    var rankExtra = [];
    var rankHits = [];
    /* 跨榜查询：大学排名 / 世界排名 / 学科排名 */
    var nm = normParen(s.name);
    (window.GK_RANK_BCUR || []).forEach(function (l) {
      if (l.name === "主榜·备用" || l.name === "主榜-备用") return;
      var hit = l.rows.find(function (r) { return normParen(r[1]) === nm; });
      if (hit) rankHits.push(l.name + " 第" + hit[0] + "名" + (hit[5] != null ? "（" + hit[5] + "分）" : ""));
    });
    (window.GK_RANK_ARWU || []).forEach(function (r) {
      if (r[1] === s.name || r[1] === nm) rankHits.push("ARWU 世界第" + r[0] + "名");
    });
    var bcsrHits = [];
    if (window.GK_RANK_BCSR) {
      Object.keys(window.GK_RANK_BCSR).forEach(function (sub) {
        var hit = window.GK_RANK_BCSR[sub].find(function (r) { return normParen(r[1] || "") === nm; });
        if (hit) bcsrHits.push(sub + " 第" + hit[0] + "名");
      });
    }
    if (intro && intro.qs) rankExtra.push("QS " + intro.qs);
    if (intro && intro.us) rankExtra.push("USNews " + intro.us);
    if (intro && intro.xueke) rankExtra.push("学科评估 " + intro.xueke);
    var html = '<div class="sd-section-title">榜单</div><div class="sd-desc">' +
      (s.rk ? "软科 2026 排名：第 " + s.rk + " 位（" + (s.rkType || "总榜") + "），总分 " + (s.rkScore != null ? s.rkScore : "-") : "暂无软科排名数据") +
      (rankExtra.length ? "；" + rankExtra.join(" · ") : "") +
      (s.flCount != null ? "；一流学科 " + s.flCount + " 个" : "") +
      (s.sg ? "；国家电网 2026 一批录用 " + s.sg + " 人" : "") +
      (s.hz ? "；中外合作项目 " + s.hz + " 个" : "") + "</div>";
    if (rankHits.length || bcsrHits.length) {
      var hitsHtml = '<div class="sd-section-title" style="margin-top:14px">本站榜单收录</div><div class="sd-desc">' +
        rankHits.map(function (h) { return '<span class="rank-tag" style="font-size:11px">' + window.GK.plan.esc(h) + "</span>"; }).join(" ") +
        (bcsrHits.length ? "<br>" + bcsrHits.map(function (h) { return '<span class="rank-tag" style="font-size:11px">' + window.GK.plan.esc(h) + "</span>"; }).join(" ") : "") +
        "</div>";
      html += hitsHtml;
    }
    if (intro && intro.site) links.unshift('<a href="' + intro.site + '" target="_blank" rel="noopener">学校官网</a>');
    html += '<div class="sd-section-title" style="margin-top:14px">官方链接</div><div class="sd-links">' + (links.join("") || '<span class="card-desc">暂无链接</span>') + "</div>";
    el.innerHTML = html;
  }

  function refresh() {
    if (!schools.length) schools = buildSchools();
    renderList();
  }

  var EXP_TAG_LIST = ["985", "211", "双一流", "2011计划", "保研", "公办", "民办", "独立学院", "中外合作", "省重点建设"];

  function renderTagChips() {
    var box = document.getElementById("expTags");
    if (!box) return;
    box.innerHTML = "";
    EXP_TAG_LIST.forEach(function (t) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (st.tags.indexOf(t) >= 0 ? " is-on" : "");
      chip.textContent = t;
      chip.addEventListener("click", function () {
        var i = st.tags.indexOf(t);
        if (i >= 0) st.tags.splice(i, 1);
        else st.tags.push(t);
        renderTagChips();
        st.page = 1;
        renderList();
      });
      box.appendChild(chip);
    });
    var btn = document.getElementById("expTagBtn");
    if (btn) {
      btn.classList.toggle("is-on", st.tags.length > 0);
      var label = document.getElementById("expTagLabel");
      if (label) label.textContent = st.tags.length ? "已选 " + st.tags.length + " 项" : "全部属性";
    }
  }

  function init() {
    var search = document.getElementById("expSearch");
    if (search) {
      var debounce = null;
      search.addEventListener("input", function () {
        clearTimeout(debounce);
        var v = this.value.trim();
        debounce = setTimeout(function () {
          st.search = v;
          st.page = 1;
          renderList();
        }, 260);
      });
      search.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          clearTimeout(debounce);
          st.search = this.value.trim();
          st.page = 1;
          renderList();
        }
      });
    }
    ["expProv", "expType", "expSort"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("change", function () {
        st[id.replace("exp", "").toLowerCase()] = this.value;
        st.page = 1;
        renderList();
      });
    });
    document.getElementById("expReset").addEventListener("click", function () {
      document.getElementById("expSearch").value = "";
      document.getElementById("expProv").value = "";
      document.getElementById("expType").value = "";
      document.getElementById("expSort").value = "rk";
      st.tags = [];
      renderTagChips();
      st = Object.assign(st, { search: "", prov: "", type: "", sort: "rk", page: 1 });
      var pop = document.getElementById("expTagPop");
      if (pop) pop.hidden = true;
      renderList();
    });
    var tagBtn = document.getElementById("expTagBtn");
    var tagPop = document.getElementById("expTagPop");
    if (tagBtn && tagPop) {
      tagBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        tagPop.hidden = !tagPop.hidden;
      });
      document.addEventListener("click", function (e) {
        var t = e.target;
        var isChip = t && t.classList && t.classList.contains("chip");
        if (!tagPop.hidden && !tagPop.contains(t) && !tagBtn.contains(t) && !isChip) tagPop.hidden = true;
      });
      document.getElementById("expTagClear").addEventListener("click", function () {
        st.tags = [];
        renderTagChips();
        st.page = 1;
        renderList();
      });
    }
    document.querySelectorAll("#expTabs .btn").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#expTabs .btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        st.view = b.getAttribute("data-view");
        st.page = 1;
        renderList();
      });
    });
    var provSel = document.getElementById("expProv");
    provSel.innerHTML = '<option value="">全部省份</option>' + window.GK.data.provinces().map(function (p) { return '<option>' + p + "</option>"; }).join("");
    renderTagChips();
    refresh();
  }

  window.GK = window.GK || {};
  window.GK.explore = { init: init, refresh: refresh, openSchool: openSchool, schools: function () { return schools; } };
})();
