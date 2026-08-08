/* 浙志愿 · 数据层：投档线、志愿库、一分一段、位次分级、选科匹配 */
(function () {
  var LINES = {
    2021: window.GK_LINES_2021 || [],
    2022: window.GK_LINES_2022 || [],
    2023: window.GK_LINES_2023 || [],
    2024: window.GK_LINES_2024 || [],
    2025: window.GK_LINES_2025 || [],
    2026: window.GK_LINES_2026 || []
  };
  /* 2026 计划库字段索引 */
  var L = {
    CODE: 0, NAME: 1, MC: 2, MN: 3, NOTE: 4, LEVEL: 5, BG: 6, NATURE: 7, RESTRICT: 8,
    DUR: 9, PROV: 10, CITY: 11, TUITION: 12, SUBJ26: 13, SUBJ25: 14,
    P26: 15, P25: 16, S25: 17, RK25: 18, EQ25: 19,
    S24: 20, RK24: 21, S23: 22, RK23: 23, S22: 24, RK22: 25, S21: 26, RK21: 27,
    NEWFLAG: 28, DEPT: 29, RANKZ: 30, RUANKE: 31, ASSESS: 32, TUIMIAN26: 33, URL: 34
  };
  var LIBRARY = window.GK_LIBRARY_2026 || [];
  var SEGMENTS = window.GK_SEGMENTS || {};
  var SCHOOL_META = window.GK_SCHOOL_META || {};
  var SUBJECT_RANKS = window.GK_SUBJECT_RANKS || {};
  var SPECIAL_CATALOG = window.GK_SPECIAL_CATALOG || {};
  var SCHOOL_IDS = window.GK_SCHOOL_IDS || {};
  var SCHOOL_INTRO = window.GK_SCHOOL_INTRO || {};
  var MAJOR_ALIAS = {
    "人工智能": "智能科学与技术",
    "数据科学与大数据技术": "数据科学与大数据技术",
    "大数据管理与应用": "大数据管理与应用",
    "机器人工程": "机器人工程",
    "智能制造工程": "智能制造工程",
    "物联网工程": "物联网工程",
    "网络空间安全": "网络空间安全",
    "信息安全": "信息安全",
    "数字媒体技术": "数字媒体技术",
    "智能建造": "智能建造",
    "临床医学": "临床医学",
    "口腔医学": "口腔医学",
    "药学": "药学",
    "金融学": "金融学",
    "金融工程": "金融工程",
    "经济统计学": "经济统计学",
    "法学": "法学",
    "知识产权": "知识产权",
    "会计学": "会计学",
    "财务管理": "财务管理",
    "审计学": "审计学",
    "市场营销": "市场营销",
    "国际经济与贸易": "国际经济与贸易",
    "电子商务": "电子商务",
    "物流管理": "物流管理",
    "工商管理": "工商管理",
    "工程管理": "工程管理",
    "软件工程": "软件工程",
    "计算机科学与技术": "计算机科学与技术",
    "电子信息工程": "电子信息工程",
    "通信工程": "通信工程",
    "电子科学与技术": "电子科学与技术",
    "光电信息科学与工程": "光电信息科学与工程",
    "电气工程及其自动化": "电气工程及其自动化",
    "自动化": "自动化",
    "机械工程": "机械工程",
    "机械设计制造及其自动化": "机械设计制造及其自动化",
    "车辆工程": "车辆工程",
    "材料科学与工程": "材料科学与工程",
    "高分子材料与工程": "高分子材料与工程",
    "化学工程与工艺": "化学工程与工艺",
    "土木工程": "土木工程",
    "建筑学": "建筑学",
    "城乡规划": "城乡规划",
    "数学与应用数学": "数学与应用数学",
    "信息与计算科学": "信息与计算科学",
    "物理学": "物理学",
    "应用物理学": "应用物理学",
    "化学": "化学",
    "应用化学": "应用化学",
    "生物科学": "生物科学",
    "生物技术": "生物技术",
    "生物医学工程": "生物医学工程",
    "统计学": "统计学",
    "经济学": "经济学",
    "汉语言文学": "汉语言文学",
    "新闻学": "新闻学",
    "广告学": "广告学",
    "英语": "英语",
    "日语": "日语",
    "德语": "德语",
    "法语": "法语",
    "俄语": "俄语",
    "翻译": "翻译",
    "心理学": "心理学",
    "应用心理学": "应用心理学",
    "教育学": "教育学",
    "学前教育": "学前教育",
    "体育教育": "体育教育",
    "护理学": "护理学",
    "医学影像学": "医学影像学",
    "预防医学": "预防医学",
    "中医学": "中医学",
    "中药学": "中药学",
    "环境工程": "环境工程",
    "环境科学": "环境科学",
    "能源与动力工程": "能源与动力工程",
    "新能源科学与工程": "新能源科学与工程",
    "航空航天工程": "航空航天工程",
    "飞行器设计与工程": "飞行器设计与工程",
    "集成电路设计与集成系统": "集成电路设计与集成系统",
    "微电子科学与工程": "微电子科学与工程",
    "工业设计": "工业设计",
    "产品设计": "产品设计",
    "视觉传达设计": "视觉传达设计",
    "环境设计": "环境设计",
    "动画": "动画",
    "音乐学": "音乐学",
    "美术学": "美术学"
  };
  var L1_MAP = { 3: "哲学", 4: "经济学", 5: "法学", 6: "教育学", 7: "文学", 8: "历史学", 9: "理学", 10: "工学", 11: "农学", 12: "医学", 13: "管理学", 14: "艺术学" };
  var ALL_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];

  /* 行结构: [代码, 院校, 专业代码, 专业名, 计划, 分数, 位次] */
  var lineIndex = {};
  var nameIndex = {};
  Object.keys(LINES).forEach(function (year) {
    lineIndex[year] = {};
    nameIndex[year] = {};
    LINES[year].forEach(function (row) {
      var key = row[0] + "|" + row[2];
      if (!lineIndex[year][key]) lineIndex[year][key] = [];
      lineIndex[year][key].push(row);
      var nk = normName(row[1]);
      if (!nameIndex[year][nk]) nameIndex[year][nk] = [];
      nameIndex[year][nk].push(row);
    });
  });

  function normName(s) {
    return String(s || "").replace(/[\s（）()]/g, "");
  }

  function nameSimilar(a, b) {
    var A = normName(a), B = normName(b);
    if (!A || !B) return false;
    if (A === B) return true;
    /* 包含关系仅当较短一侧 ≥ 7 字，避免「工科试验班」这类大类名误配 */
    var short = A.length <= B.length ? A : B;
    var long = A.length <= B.length ? B : A;
    if (short.length >= 7 && long.indexOf(short) >= 0) return true;
    return false;
  }

  var libIndex = {};
  LIBRARY.forEach(function (row) {
    libIndex[row[0] + "|" + row[2]] = row;
  });

  /* ---------- 院校标签 ---------- */
  var TAG_RULES = [
    [/985/, "985"],
    [/211/, "211"],
    [/双一流大学|一流大学建设高校|一流学科建设高校|“双一流”建设高校|双一流建设高校/, "双一流"],
    [/2011计划/, "2011计划"],
    [/保研资格/, "保研"],
    [/基础学科拔尖/, "拔尖计划"],
    [/卓越工程师/, "卓越工程师"],
    [/卓越医生拔尖创新/, "卓越医生"],
    [/卓越法律复合应用|卓越法律涉外/, "卓越法律"],
    [/卓越农林拔尖创新/, "卓越农林"],
    [/高水平公共卫生学院/, "高水平公卫"],
    [/省重点建设高校/, "省重点建设"],
    [/省市共建重点高校/, "省市共建"],
    [/市重点建设高校/, "市重点建设"],
    [/双高计划/, "双高计划"],
    [/2025年新设院校|新设院校/, "新设"],
    [/民办学校|民办院校|民办/, "民办"],
    [/独立学院/, "独立学院"],
    [/中外合作办学/, "中外合作"]
  ];
  var TAG_PRIORITY = {};
  TAG_RULES.forEach(function (r, i) { TAG_PRIORITY[r[1]] = i; });
  TAG_PRIORITY["C9"] = -1;

  function cleanSchoolName(name) {
    /* 只剥离“标签型”括号（双一流/民办/2011计划等），保留校区/分校等招生实体括号 */
    var s = String(name || "").replace(/["“”]/g, "").trim();
    var TAG_PAT = /[（(](?:[^（）()]*?(?:双一流|一流大学建设|一流学科建设|2011计划|省重点建设|省市共建|市重点建设|高水平大学建设|新设院校|民办|独立学院|中外合作办学|双高计划|国家示范性高等职业院校)[^（）()]*?)[）)]/g;
    var prev;
    do {
      prev = s;
      s = s.replace(TAG_PAT, "");
    } while (s !== prev);
    return s.replace(/[（(]$/, "").replace(/^[）)]/, "").trim();
  }

  /* 从专业简注提取校区（如：鼓楼校区+苏州校区） */
  function campusesOf(code, majorCode, name, majorName) {
    var lib = name || majorName ? libFor(code, name, majorCode, majorName) : findLib(code, majorCode);
    if (!lib || !lib[L.NOTE]) return [];
    var out = [];
    var note = String(lib[L.NOTE]);
    var add = function (x) {
      if (/^[\u4e00-\u9fa5]{1,6}校区$/.test(x) && out.indexOf(x) < 0) out.push(x);
    };
    var addFront = function (x) {
      if (/^[\u4e00-\u9fa5]{1,6}校区$/.test(x) && out.indexOf(x) < 0) out.unshift(x);
    };
    var re = /([\u4e00-\u9fa5A-Za-z0-9·]{1,6})校区/g;
    var PREFIX = /^(?:第[一二三四五六七八九十]+学年|[一二三四五六七八九十]+学年|学年|大一大二|大三大四|本科阶段|研究生阶段|起在|起至|起于|入学后|毕业前|起|在|于|自|从|至|到|前|后|先|初|年)+/;
    var m;
    while ((m = re.exec(note)) !== null) {
      var tok = m[1].replace(PREFIX, "");
      add(tok + "校区");
      /* 压缩式并列：鼓楼+苏州校区 → 补出鼓楼校区 */
      var before = note.slice(Math.max(0, m.index - 14), m.index);
      var sepIdx = Math.max(before.lastIndexOf("+"), before.lastIndexOf("、"), before.lastIndexOf("，"), before.lastIndexOf(","), before.lastIndexOf("&"), before.lastIndexOf("/"));
      if (sepIdx >= 0) {
        var name = before.slice(0, sepIdx).replace(/^[\[（(【：:，,。.!！\s]+|[\]）)】]+$/g, "");
        if (/^[\u4e00-\u9fa5]{1,6}$/.test(name) && !/学年|第|在|于|起|前|后/.test(name)) addFront(name + "校区");
      }
    }
    return out.slice(0, 4);
  }

  function tagsOfSchool(code, name) {
    var tags = [];
    var add = function (t) { if (tags.indexOf(t) < 0) tags.push(t); };
    /* 计划库的院校水平 / 办学性质 */
    var libRow = null;
    for (var i = 0; i < LIBRARY.length; i++) {
      if (LIBRARY[i][0] === code) { libRow = LIBRARY[i]; break; }
    }
    if (libRow) {
      String(libRow[5] || "").split("/").forEach(function (seg) {
        TAG_RULES.forEach(function (r) { if (r[0].test(seg)) add(r[1]); });
      });
      var nature = String(libRow[L.NATURE] || "").trim();
      if (nature === "公办") add("公办");
      if (nature.indexOf("民办") >= 0) add("民办");
      if (nature.indexOf("中外") >= 0) add("中外合作");
    }
    /* 校名括号标签（各年投档线文件名常带） */
    var nameSrc = name || (libRow ? libRow[1] : "");
    if (nameSrc) {
      TAG_RULES.forEach(function (r) { if (r[0].test(String(nameSrc))) add(r[1]); });
    }
    /* 985/211/C9/双一流 恒定清单补充（用户提供） */
    if (window.GK_SCHOOL_FLAGS) {
      var fl = window.GK_SCHOOL_FLAGS[name] || window.GK_SCHOOL_FLAGS[String(name || "").replace(/（/g, "(").replace(/）/g, ")")];
      if (fl) {
        if (fl.c9) add("C9");
        if (fl.p985) add("985");
        if (fl.p211) add("211");
        if (fl.ylx) add("双一流");
      }
    }
    tags.sort(function (a, b) {
      var pa = TAG_PRIORITY[a] == null ? 99 : TAG_PRIORITY[a];
      var pb = TAG_PRIORITY[b] == null ? 99 : TAG_PRIORITY[b];
      return pa - pb;
    });
    return tags.slice(0, 8);
  }

  /* ---------- 院校索引（院校卡片 / 未来院校介绍） ---------- */
  var schoolIndex = {};
  function buildSchoolIndex() {
    var map = {};
    LINES[2026].forEach(function (row) {
      var code = row[0];
      if (!map[code]) map[code] = { code: code, name: row[1], lines: [], libRows: [] };
      map[code].lines.push(row);
    });
    LIBRARY.forEach(function (row) {
      var code = row[0];
      if (!map[code]) map[code] = { code: code, name: row[1], lines: [], libRows: [] };
      map[code].libRows.push(row);
    });
    Object.keys(map).forEach(function (code) {
      var s = map[code];
      var libRow = s.libRows[0] || null;
      s.nameClean = cleanSchoolName(s.name);
      s.tags = tagsOfSchool(code, s.name);
      s.province = libRow ? libRow[L.PROV] : "";
      s.city = libRow ? libRow[L.CITY] : "";
      s.nature = libRow ? libRow[L.NATURE] : "";
      s.url = libRow ? libRow[L.URL] : "";
      var meta = SCHOOL_META[s.nameClean] || SCHOOL_META[s.name] || null;
      s.meta = meta;
      var scores = s.lines.filter(function (r) { return typeof r[5] === "number"; }).map(function (r) { return r[5]; });
      var ranks = s.lines.filter(function (r) { return typeof r[6] === "number"; }).map(function (r) { return r[6]; });
      s.minScore = scores.length ? Math.min.apply(null, scores) : null;
      s.maxScore = scores.length ? Math.max.apply(null, scores) : null;
      s.minRank = ranks.length ? Math.min.apply(null, ranks) : null;
      s.maxRank = ranks.length ? Math.max.apply(null, ranks) : null;
      s.planTotal = s.lines.reduce(function (a, r) { return a + (typeof r[4] === "number" ? r[4] : 0); }, 0);
      schoolIndex[code] = s;
    });
  }
  buildSchoolIndex();

  function findLines(year, code, majorCode) {
    var rows = lineIndex[year] && lineIndex[year][code + "|" + majorCode];
    return rows || [];
  }

  /* 代码优先；代码当年已指向别处时，按 校名+专业名 全表兜底 */
  function findYearLine(item, year) {
    var byCode = findLines(year, item.code, item.majorCode);
    var hit = null;
    if (item.majorName) hit = byCode.find(function (r) { return nameSimilar(r[3], item.majorName); }) || null;
    else hit = byCode[0] || null;
    if (hit) return hit;
    if (!item.name || !item.majorName) return null;
    var rows = nameIndex[year] && nameIndex[year][normName(cleanSchoolName(item.name))];
    return rows ? rows.find(function (r) { return nameSimilar(r[3], item.majorName); }) || null : null;
  }

  function findLib(code, majorCode) {
    return libIndex[code + "|" + majorCode] || null;
  }

  function findLibByName(name, majorName) {
    if (!name || !majorName) return null;
    var cn = cleanSchoolName(name);
    for (var i = 0; i < LIBRARY.length; i++) {
      var r = LIBRARY[i];
      if (cleanSchoolName(r[L.NAME]) === cn && nameSimilar(r[L.MN], majorName)) return r;
    }
    return null;
  }

  /* 统一取计划行：名称优先（跨年代码会变），代码兜底 */
  function libFor(code, name, majorCode, majorName) {
    var byCode = findLib(code, majorCode);
    if (byCode && (!majorName || nameSimilar(byCode[L.MN], majorName))) return byCode;
    var byName = findLibByName(name, majorName);
    return byName || byCode || null;
  }

  /* 4 年线（用于方案表格展示） */
  function history(code, majorCode) {
    var out = {};
    [2026, 2025, 2024, 2023].forEach(function (y) {
      var rows = findLines(y, code, majorCode);
      if (rows.length) {
        var r = rows[0];
        out[y] = { score: r[5], rank: r[6], plan: r[4] };
      }
    });
    return out;
  }

  /* 位次分级：ratio = 投档位次 / 我的位次
     ≤0.65 不建议(0)；0.65–0.95 冲(1)；0.95–1.15 稳(2)；>1.15 保(3)
     放宽口径：志愿有 80 个，头部每年波动数百名、中段数千名很常见 */
  function grade(rank, lineRank) {
    if (!rank || !lineRank) return 0;
    var r = lineRank / rank;
    if (r <= 0.65) return 0;
    if (r <= 0.95) return 1;
    if (r <= 1.15) return 2;
    return 3;
  }

  var GRADE_META = {
    0: { name: "不建议", cls: "grade-0" },
    1: { name: "冲", cls: "grade-1" },
    2: { name: "稳", cls: "grade-2" },
    3: { name: "保", cls: "grade-3" }
  };

  /* 选科要求解析与匹配：要求形如 "物理&化学" / "不限" / "物理" */
  function subjectFit(subjects, req) {
    if (!req || !req.trim() || req.trim() === "不限" || req.trim() === "不限选考科目") return true;
    var parts = req.split(/[&、,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
    if (!parts.length) return true;
    return parts.every(function (p) { return subjects.indexOf(p) >= 0; });
  }

  function subjectReqOf(code, name, majorCode, majorName) {
    var lib = libFor(code, name, majorCode, majorName);
    if (!lib) return "不限";
    return lib[L.SUBJ26] || lib[L.SUBJ25] || "不限";
  }

  /* 计划数变化（2026 vs 2025） */
  function planDelta(code, name, majorCode, majorName) {
    var lib = libFor(code, name, majorCode, majorName);
    if (!lib) return null;
    var p26 = lib[L.P26], p25 = lib[L.P25];
    var delta = null, pct = null;
    if (typeof p26 === "number" && typeof p25 === "number" && p25 > 0) {
      delta = p26 - p25;
      pct = Math.round(delta * 100 / p25);
    }
    return { p26: p26, p25: p25, delta: delta, pct: pct, flag: lib[L.NEWFLAG] };
  }

  /* 选考组合位次（社区收集） */
  var SUBJ_COLS = ["total", "wh", "wl", "hx", "sw", "zz", "ls", "dl", "js", "dw", "dh"];
  function subjectRank(score, year) {
    var map = SUBJECT_RANKS[String(year || 2026)] || {};
    if (!map[score] && map[score] !== 0) return null;
    var arr = map[score];
    var out = {};
    SUBJ_COLS.forEach(function (k, i) { out[k] = arr[i] == null ? null : arr[i]; });
    return out;
  }

  /* 专业目录匹配（掌上高考专业库） */
  function majorCatalog(name) {
    if (!name) return null;
    var hit = null;
    if (SPECIAL_CATALOG[name]) hit = SPECIAL_CATALOG[name];
    else if (MAJOR_ALIAS[name] && SPECIAL_CATALOG[MAJOR_ALIAS[name]]) hit = SPECIAL_CATALOG[MAJOR_ALIAS[name]];
    if (!hit) {
      var base = String(name).replace(/（[^（）]*）/g, "").replace(/\([^()]*\)/g, "").trim();
      if (base && SPECIAL_CATALOG[base]) hit = SPECIAL_CATALOG[base];
    }
    if (!hit) {
      var keys = Object.keys(SPECIAL_CATALOG);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k.length >= 4 && name.indexOf(k) >= 0) { hit = SPECIAL_CATALOG[k]; break; }
        if (name.length >= 4 && k.indexOf(name) >= 0) { hit = SPECIAL_CATALOG[k]; break; }
      }
    }
    if (hit) {
      var mapped = L1_MAP[hit.l2];
      if (mapped) return Object.assign({}, hit, { l1: mapped });
    }
    return hit;
  }

  function schoolId(name) {
    if (!name) return null;
    if (SCHOOL_IDS[name]) return SCHOOL_IDS[name];
    var cn = cleanSchoolName(name);
    return SCHOOL_IDS[cn] || null;
  }

  function schoolIntro(name) {
    return SCHOOL_INTRO[name] || SCHOOL_INTRO[cleanSchoolName(name)] || null;
  }

  function logoUrl(name) {
    var id = schoolId(name);
    return id ? "https://static-data.gaokao.cn/upload/logo/" + id + ".png" : "";
  }

  /* 一分一段查询 */
  function segmentFor(year) {
    return SEGMENTS[String(year)] || [];
  }

  function rankToScore(year, rank) {
    var seg = segmentFor(year);
    for (var i = 0; i < seg.length; i++) {
      if (seg[i][2] >= rank) return seg[i][0];
    }
    return seg.length ? seg[seg.length - 1][0] : null;
  }

  function scoreToRank(year, score) {
    var seg = segmentFor(year);
    for (var i = 0; i < seg.length; i++) {
      if (seg[i][0] <= score) return seg[i][2];
    }
    return seg.length ? seg[seg.length - 1][2] : null;
  }

  /* 同位分换算：把指定年份的分数换算为另一年的等效分数 */
  function equivalentScore(fromYear, score, toYear) {
    var rank = scoreToRank(fromYear, score);
    if (!rank) return null;
    return rankToScore(toYear, rank);
  }

  window.GK = window.GK || {};
  window.GK.data = {
    LINES: LINES,
    LIBRARY: LIBRARY,
    SEGMENTS: SEGMENTS,
    ALL_YEARS: ALL_YEARS,
    L: L,
    findLines: findLines,
    findYearLine: findYearLine,
    nameSimilar: nameSimilar,
    cleanSchoolName: cleanSchoolName,
    tagsOfSchool: tagsOfSchool,
    schoolInfo: function (code) { return schoolIndex[code] || null; },
    schoolIndex: schoolIndex,
    findLib: findLib,
    findLibByName: findLibByName,
    libFor: libFor,
    campusesOf: campusesOf,
    history: history,
    grade: grade,
    GRADE_META: GRADE_META,
    subjectFit: subjectFit,
    subjectReqOf: subjectReqOf,
    planDelta: planDelta,
    subjectRank: subjectRank,
    majorCatalog: majorCatalog,
    schoolId: schoolId,
    schoolIntro: schoolIntro,
    logoUrl: logoUrl,
    segmentFor: segmentFor,
    rankToScore: rankToScore,
    scoreToRank: scoreToRank,
    equivalentScore: equivalentScore,
    provinces: function () {
      var set = {};
      LIBRARY.forEach(function (r) { if (r[L.PROV]) set[r[L.PROV]] = 1; });
      return Object.keys(set).sort();
    }
  };
})();
