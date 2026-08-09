/* 浙志愿 · 认知白皮书阅读器：整本阅读 + 专业节选 + 双向跳转 */
(function () {
  var WP = window.GK_WHITEPAPER || { book: "", majorMap: {} };
  var BOOK = WP.book || "";
  var MAP = WP.majorMap || {};
  var curCh = 1;
  var MAX_MAJOR_BTNS = 6;
  var io = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function trunc(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  /* ---------- 迷你 Markdown 渲染（白皮书子集：H2/H3、表格、列表、引用、粗体、链接、分割线） ---------- */
  function inline(s) {
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, t, u) {
      if (/^(https?:|mailto:)/.test(u)) {
        return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + t + "</a>";
      }
      return t;
    });
    return s;
  }

  function tableCells(r) {
    return r.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); });
  }
  function renderTable(rows) {
    var head = tableCells(rows[0]);
    var body = rows.slice(2).map(function (r) {
      return "<tr>" + tableCells(r).map(function (c) {
        return "<td>" + (c ? inline(c) : "") + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="book-table-wrap"><table class="book-table"><thead><tr>' +
      head.map(function (c) { return "<th>" + (c ? inline(c) : "") + "</th>"; }).join("") +
      "</tr></thead><tbody>" + body + "</tbody></table></div>";
  }

  function renderLines(lines) {
    var out = "", i = 0;
    while (i < lines.length) {
      var t = (lines[i] || "").trim();
      if (!t) { i++; continue; }
      if (/^\|/.test(t)) {
        var tbl = [];
        while (i < lines.length && /^\|/.test((lines[i] || "").trim())) { tbl.push(lines[i]); i++; }
        out += renderTable(tbl);
        continue;
      }
      if (/^-\s+/.test(t) || /^\d+\.\s+/.test(t)) {
        var ordered = /^\d+\.\s+/.test(t);
        var items = [];
        while (i < lines.length) {
          var l2 = (lines[i] || "").trim();
          var isUl = /^-\s+/.test(l2);
          var isOl = /^\d+\.\s+/.test(l2);
          if (!isUl && !isOl) break;
          items.push("<li>" + inline(l2.replace(/^-\s+/, "").replace(/^\d+\.\s+/, "")) + "</li>");
          i++;
        }
        out += (ordered ? "<ol>" : "<ul>") + items.join("") + (ordered ? "</ol>" : "</ul>");
        continue;
      }
      if (/^>/.test(t)) {
        var q = [];
        while (i < lines.length && /^>/.test((lines[i] || "").trim())) {
          q.push(inline((lines[i] || "").trim().replace(/^>\s?/, "")));
          i++;
        }
        var joined = q.join("<br>");
        var isMap = joined.indexOf("系统映射") >= 0;
        out += isMap
          ? '<div class="book-map"><div class="book-map-head">系统映射 · 产品化</div><div class="book-map-body">' +
            joined.replace(/<b>系统映射<\/b>\s*[：:]?\s*/, "") + "</div></div>"
          : "<blockquote>" + joined + "</blockquote>";
        continue;
      }
      if (/^-{3,}$/.test(t)) { out += "<hr>"; i++; continue; }
      out += "<p>" + inline(t) + "</p>";
      i++;
    }
    return out;
  }

  function splitChapters() {
    var chs = [], cur = null;
    BOOK.split("\n").forEach(function (ln) {
      if (/^##\s/.test(ln)) {
        if (cur) chs.push(cur);
        cur = { title: ln.replace(/^##\s+/, "").trim(), lines: [] };
      } else if (cur) {
        cur.lines.push(ln);
      }
    });
    if (cur) chs.push(cur);
    return chs;
  }

  function secNum(header) {
    var m = String(header).match(/^###\s*([\d.]+)/);
    return m ? m[1] : "";
  }

  function chParts(title) {
    var m = String(title).match(/^([〇一二三四五六七八九十]+)、\s*(.+)$/);
    return m ? { no: m[1], name: m[2] } : { no: "", name: title };
  }

  function majorLinksFor(num) {
    var m = MAP[num];
    if (!m || !m.majors || !m.majors.length) return "";
    var majors = m.majors;
    var btns = majors.slice(0, MAX_MAJOR_BTNS).map(function (n) {
      return '<button class="book-major-btn" data-major="' + esc(n) + '">' + esc(n) + "</button>";
    }).join("");
    var more = majors.length > MAX_MAJOR_BTNS
      ? '<span class="book-major-more">等 ' + majors.length + " 个相关专业</span>" : "";
    return '<div class="book-major-links"><span class="book-major-label">在这本书里学完，去专业探索看看：</span>' +
      btns + more + "</div>";
  }

  function renderChapter(ch, idx) {
    var parts = chParts(ch.title);
    var out = '<section class="book-chapter" id="book-ch' + (idx + 1) + '" data-title="' + esc(ch.title) + '">' +
      "<h2>" +
      (parts.no ? '<span class="book-ch-no">' + esc(parts.no) + "</span>" : "") +
      '<span class="book-ch-name">' + inline(parts.name) + "</span></h2>";
    var isMajorChapter = ch.title.indexOf("专业认知卡") >= 0;
    if (isMajorChapter) {
      var secs = [], cur = null;
      ch.lines.forEach(function (ln) {
        if (/^###\s/.test(ln)) {
          if (cur) secs.push(cur);
          cur = { header: ln.trim(), lines: [] };
        } else if (cur) {
          cur.lines.push(ln);
        }
      });
      if (cur) secs.push(cur);
      secs.forEach(function (s) {
        var num = secNum(s.header);
        var h3name = s.header.replace(/^###\s+/, "");
        var h3body = num ? h3name.replace(new RegExp("^" + num.replace(".", "\\.") + "\\s*"), "") : h3name;
        out += '<h3 id="sec-' + num + '">' +
          (num ? '<span class="book-h3-no">' + num + "</span>" : "") +
          inline(h3body) + "</h3>";
        out += renderLines(s.lines);
        out += majorLinksFor(num);
      });
    } else {
      out += renderLines(ch.lines);
    }
    out += "</section>";
    return out;
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderBook() {
    var body = document.getElementById("cogBody");
    if (!body) return;
    if (!BOOK) {
      body.innerHTML = '<div class="cog-empty">白皮书数据未加载，请刷新重试。</div>';
      return;
    }
    var chapters = splitChapters();
    var chips = chapters.map(function (c, i) {
      return '<button class="book-chip" data-ch="' + (i + 1) + '">' + esc(c.title) + "</button>";
    }).join("");
    var meta = WP.meta || {};
    var guide = [
      { ch: 1, t: "高一高二", s: "每周 10–20 分钟 · 认知播种", e: "行业认知 → 专业认知 → 高校认知", x: "第 1–3 章" },
      { ch: 4, t: "高三", s: "趋势与数据 · 建立位次观", e: "六年五幕 → 选科 → 专业全景 → 高分段", x: "第 4–12 章" },
      { ch: 13, t: "出分前后", s: "决策与行动 · 直接可用", e: "决策框架 → 2027 展望 → 行动清单", x: "第 13–14 章" }
    ].map(function (g) {
      return '<button class="book-guide-card" data-ch="' + g.ch + '" type="button">' +
        "<b>" + g.t + "</b><span>" + g.s + "</span><em>" + g.e + "</em><small>" + g.x + "</small></button>";
    }).join("");
    body.innerHTML =
      '<div class="book-progress" id="bookProgress"></div>' +
      '<div class="book-cover">' +
        '<div class="book-cover-in">' +
          '<div class="book-kicker">认知教材 · 内部研究稿</div>' +
          '<div class="book-title">' + esc(meta.title || "浙江高考认知白皮书") + "</div>" +
          '<div class="book-sub">' + esc(meta.subtitle || "") + "</div>" +
          '<div class="book-meta">' + (meta.updated || "") + " · " + (meta.lines || "") + " 行 · " +
            (meta.chapters || chapters.length) + " 章 · 结论标注年份与来源，网传数据一律注明</div>" +
          '<div class="book-guide">' + guide + "</div>" +
        "</div>" +
      "</div>" +
      '<div class="book-navbar" id="bookNavbar">' +
        '<span class="book-navbar-label">目录</span>' +
        '<div class="book-chips" id="bookChips">' + chips + "</div>" +
        '<button class="book-top-btn" id="bookTop" title="回到顶部">' +
          (window.GKIcon ? '<span data-icon="expand"></span>' : "顶部") +
        "</button>" +
      "</div>" +
      '<div class="book-article" id="bookArticle">' +
        chapters.map(renderChapter).join("") +
      "</div>" +
      '<div class="book-pager"><button class="btn btn-ghost btn-sm" data-bk="prev">← 上一章</button>' +
      '<span class="book-pager-now" id="bookPagerNow">第 1 章 / 共 ' + chapters.length + " 章</span>" +
      '<button class="btn btn-ghost btn-sm" data-bk="next">下一章 →</button></div>';
    curCh = 1;
    if (window.GKIcon) window.GKIcon.mount(body);
    setupScroll(chapters.length);
  }

  function setupScroll(nChapters) {
    if (io) io.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var els = document.querySelectorAll(".book-chapter");
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = parseInt(en.target.id.replace("book-ch", ""), 10);
        setCurCh(n, nChapters);
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  }

  function onScroll() {
    var bar = document.getElementById("bookProgress");
    if (!bar) return;
    var doc = document.documentElement;
    var total = doc.scrollHeight - window.innerHeight;
    var p = total > 0 ? Math.min(100, Math.max(0, (window.pageYOffset || doc.scrollTop) / total * 100)) : 0;
    bar.style.width = p + "%";
  }

  function setCurCh(n, nChapters) {
    curCh = n;
    document.querySelectorAll(".book-chip[data-ch]").forEach(function (c) {
      c.classList.toggle("is-on", parseInt(c.getAttribute("data-ch"), 10) === n);
    });
    var now = document.getElementById("bookPagerNow");
    if (now) now.textContent = "第 " + curCh + " 章 / 共 " + (nChapters || "") + " 章";
  }

  function pagerGo(dir) {
    var chapters = splitChapters();
    var n = Math.max(1, Math.min(chapters.length, curCh + (dir === "next" ? 1 : -1)));
    if (n !== curCh) {
      setCurCh(n, chapters.length);
      scrollToId("book-ch" + n);
    }
  }

  /* ---------- 专业节选 ---------- */
  var KW = {
    "2.1": ["临床", "口腔", "儿科", "麻醉", "精神医学", "医学影像"],
    "2.2": ["中医", "针灸", "中药"],
    "2.3": ["药学", "护理", "预防医学", "基础医学", "助产", "药物"],
    "2.4": ["计算机", "人工智能", "软件", "数据科学", "物联网", "信息安全", "网络工程", "大数据"],
    "2.5": ["电子信息", "电子科学", "微电子", "集成电路", "通信工程", "光电"],
    "2.6": ["电气", "能源", "电力", "智能电网", "储能"],
    "2.7": ["机械", "自动化", "机器人", "机电"],
    "2.8": ["航空", "航天", "飞行器", "武器", "探测制导"],
    "2.9": ["数学", "物理", "统计"],
    "2.10": ["化学", "化工", "材料", "高分子"],
    "2.11": ["生物", "食品", "农学", "动物医学", "植物保护", "动物科学"],
    "2.12": ["土木", "建筑", "城乡规划", "工程管理", "给排水"],
    "2.13": ["师范", "教育", "学前", "小学教育"],
    "2.14": ["心理"],
    "2.15": ["法学", "知识产权", "政治学", "社会工作", "司法"],
    "2.16": ["经济", "金融", "会计", "财务", "审计", "财政", "税收", "国贸"],
    "2.17": ["管理", "工商", "市场营销", "人力资源", "物流", "行政管理", "公共事业"],
    "2.18": ["汉语言", "英语", "外语", "翻译", "新闻", "传播", "网络与新媒体", "文学"],
    "2.19": ["历史", "哲学", "文物", "博物馆", "考古"],
    "2.20": ["设计", "艺术", "音乐", "美术", "动画", "动漫"],
    "2.22": ["公安", "警", "消防", "侦查", "刑侦"]
  };

  function catOf(name) {
    if (!name) return "";
    var hit = "";
    Object.keys(MAP).forEach(function (k) {
      if (!hit && MAP[k].majors.indexOf(name) >= 0) hit = k;
    });
    if (hit) return hit;
    var keys = Object.keys(KW);
    for (var i = 0; i < keys.length; i++) {
      var arr = KW[keys[i]];
      for (var j = 0; j < arr.length; j++) {
        if (name.indexOf(arr[j]) >= 0) return keys[i];
      }
    }
    if (/类$|试验班|实验班/.test(name)) return "2.21";
    return "";
  }

  function catLines(num) {
    var lines = BOOK.split("\n");
    var start = -1, end = lines.length;
    var pat = new RegExp("^###\\s*" + num.replace(".", "\\.") + "\\s");
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if (start < 0) {
        if (pat.test(ln)) start = i;
      } else if (/^(###|##)\s/.test(ln)) {
        end = i;
        break;
      }
    }
    if (start < 0) return [];
    var bullets = [];
    for (var j = start + 1; j < end; j++) {
      var mm = lines[j].match(/^-\s*\*\*([^*]+)\*\*\s*[：:]\s*(.*)$/);
      if (mm) bullets.push({ k: mm[1], v: mm[2] });
    }
    return bullets;
  }

  function excerptFor(name) {
    var num = catOf(name);
    if (!num) return "";
    var m = MAP[num];
    var bullets = catLines(num);
    var want = ["学什么", "毕业去哪", "六年数据", "真实声音", "适合谁"];
    var items = want.map(function (w) {
      var b = null;
      for (var i = 0; i < bullets.length; i++) {
        if (bullets[i].k === w) { b = bullets[i]; break; }
      }
      return b ? "<li><b>" + esc(w) + "</b>" + esc(trunc(b.v, 58)) + "</li>" : "";
    }).filter(Boolean);
    if (!items.length) return "";
    return '<div class="book-excerpt">' +
      '<div class="book-excerpt-head"><span class="book-excerpt-tag">认知白皮书 · 节选</span>' +
      "<b>" + esc(m ? m.t : name) + "</b></div>" +
      '<ul class="book-excerpt-list">' + items.join("") + "</ul>" +
      '<div class="book-excerpt-foot">' +
      '<button class="btn btn-soft btn-sm" data-cat="' + num + '">阅读完整章节</button>' +
      '<button class="btn btn-ghost btn-sm" data-book-open="1">整本白皮书</button>' +
      "</div></div>";
  }

  function open(catKey) {
    if (window.GK.goPage) window.GK.goPage("cognition");
    if (window.GK.cognition && window.GK.cognition.goTab) window.GK.cognition.goTab("book");
    var id = catKey ? "sec-" + catKey : "";
    setTimeout(function () {
      if (id) scrollToId(id);
      else {
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); }
      }
    }, 80);
  }

  function bindExcerpt(root) {
    if (!root) return;
    root.querySelectorAll("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        var mask = root.closest(".modal-mask");
        if (mask) mask.remove();
        open(b.getAttribute("data-cat"));
      });
    });
    root.querySelectorAll("[data-book-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        var mask = root.closest(".modal-mask");
        if (mask) mask.remove();
        open("");
      });
    });
  }

  function bind() {
    var body = document.getElementById("cogBody");
    if (!body) return;
    body.addEventListener("click", function (e) {
      var mb = e.target.closest(".book-major-btn");
      if (mb) {
        var n = mb.getAttribute("data-major");
        if (window.GK.majors && window.GK.majors.showMajor) window.GK.majors.showMajor(n);
        return;
      }
      var chip = e.target.closest(".book-chip[data-ch]");
      if (chip) {
        var chapters = splitChapters();
        setCurCh(parseInt(chip.getAttribute("data-ch"), 10), chapters.length);
        scrollToId("book-ch" + curCh);
        return;
      }
      var g = e.target.closest(".book-guide-card[data-ch]");
      if (g) {
        var chs = splitChapters();
        setCurCh(parseInt(g.getAttribute("data-ch"), 10), chs.length);
        scrollToId("book-ch" + curCh);
        return;
      }
      var pg = e.target.closest("[data-bk]");
      if (pg) { pagerGo(pg.getAttribute("data-bk")); return; }
      var top = e.target.closest("#bookTop");
      if (top) {
        try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (err) { window.scrollTo(0, 0); }
      }
    });
  }

  window.GK = window.GK || {};
  window.GK.whitepaper = {
    renderBook: renderBook,
    open: open,
    excerptFor: excerptFor,
    bindExcerpt: bindExcerpt,
    catOf: catOf,
    bind: bind
  };
})();
