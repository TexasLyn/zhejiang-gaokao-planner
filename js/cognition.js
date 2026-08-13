/* 潮汐志愿 2.0 · 认知板块：专业 / 高校 / 职业 / 大学生活 / 城市 */
(function () {
  var S = window.GK.state;
  var esc = function (s) { return window.GK.plan ? window.GK.plan.esc(s) : String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var CAT = ((window.GK_MAJOR_DB || {}).catalog || {}) || {};
  var META = ((window.GK_SCHOOLS || {}).meta || {}) || {};
  var FEATURED = ((window.GK_SCHOOLS || {}).featured || {}) || {};
  var DORM = ((window.GK_SCHOOLS || {}).dorm || {}) || {};
  var INTRO = ((window.GK_SCHOOLS || {}).intro || {}) || {};
  var JIANGHU = ((window.GK_SCHOOLS || {}).jianghu || {}) || {};
  var ASSESS = (window.GK_ASSESS || {})["4th"] || {};
  var RUANKE = (window.GK_RANKS || {})["ruanke"] || [];
  var L1 = { 3: "哲学", 4: "经济学", 5: "法学", 6: "教育学", 7: "文学", 8: "历史学", 9: "理学", 10: "工学", 11: "农学", 12: "医学", 13: "管理学", 14: "艺术学" };

  var curTab = "major";
  var majorQ = "", majorL1 = "";
  var schoolQ = "", schoolTag = "";
  var compare = [];
  var citySel = null;

  function money(n) {
    if (!n) return "";
    var v = Number(n);
    if (!v) return "";
    return v >= 10000 ? "平均年薪约 " + (v / 10000).toFixed(1).replace(/\.0$/, "") + " 万" : "平均月薪约 " + v + " 元";
  }
  function strOf(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.text || v.desc || v.intro || v.brief || v.content || "";
    return String(v);
  }

  /* ---------- 专业认知 ---------- */
  function majorList() {
    return Object.keys(CAT).map(function (k) { return CAT[k]; }).filter(function (e) { return e && e.l1 === "本科(普通)" && e.intro && e.intro.length > 20; });
  }
  function l1Name(e) { return L1[e.l2] || "其他"; }
  function renderMajor() {
    var body = document.getElementById("cogBody");
    var all = majorList();
    var chips = Object.keys(L1).map(function (k) {
      var on = majorL1 === L1[k];
      return '<button class="cog-chip' + (on ? " is-on" : "") + '" data-l1="' + L1[k] + '">' + L1[k] + "</button>";
    }).join("");
    body.innerHTML =
      '<div class="cog-toolbar"><input class="cog-search" id="cogMajorSearch" placeholder="搜索专业、课程、就业关键词…" value="' + esc(majorQ) + '">' +
      '<button class="btn btn-ghost btn-sm" id="cogMajorClear">清除</button></div>' +
      '<div class="cog-chips">' + chips + '<button class="cog-chip' + (!majorL1 ? " is-on" : "") + '" data-l1="">全部</button></div>' +
      '<p class="cog-count" id="cogMajorCount"></p>' +
      '<div class="cog-grid" id="cogMajorGrid"></div>';
    renderMajorList();
  }

  function renderMajorList() {
    var all = majorList();
    var kw = majorQ.trim();
    var list = all.filter(function (e) {
      var hitKw = !kw || e.name.indexOf(kw) >= 0 || (e.intro || "").indexOf(kw) >= 0 || (e.career || "").indexOf(kw) >= 0;
      if (!hitKw) return false;
      if (kw) return true; /* 有关键词时全局搜索，不受大类胶囊限制 */
      return !majorL1 || l1Name(e) === majorL1;
    });
    if (kw) {
      list = list.sort(function (a, b) {
        var sa = majorScore(a, kw), sb = majorScore(b, kw);
        if (sa !== sb) return sa - sb;
        return (b.schools || 0) - (a.schools || 0);
      });
    }
    var grid = document.getElementById("cogMajorGrid");
    var count = document.getElementById("cogMajorCount");
    if (!grid) return;
    var cards = list.slice(0, 48).map(function (e) {
      var courses = (e.courses || "").split(/[、；;，,\n]/).map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 4);
      return '<div class="cog-card cog-major" data-name="' + esc(e.name) + '">' +
        '<div class="cog-card-head"><b>' + esc(e.name) + '</b><span class="cog-badge">' + l1Name(e) + "</span></div>" +
        '<p class="cog-desc">' + esc(e.intro.slice(0, 90)) + (e.intro.length > 90 ? "…" : "") + "</p>" +
        (courses.length ? '<div class="cog-tags">' + courses.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("") + "</div>" : "") +
        '<div class="cog-card-foot">' +
        (e.career ? "<span>就业方向</span>" : "") +
        (money(e.salary) ? '<span class="cog-salary">' + money(e.salary) + "</span>" : "") +
        "</div></div>";
    }).join("");
    if (count) count.textContent = "共 " + list.length + " 个本科专业" + (kw ? "（含关键词全局搜索）" : " · 数据来自掌上高考专业库（预抓本地化）");
    grid.innerHTML = cards || '<div class="cog-empty">没有匹配的专业，换个关键词试试。</div>';
  }

  function majorScore(e, kw) {
    if (e.name.indexOf(kw) === 0) return 0;      /* 名字前缀 */
    if (e.name.indexOf(kw) >= 0) return 1;       /* 名字包含 */
    if ((e.intro || "").indexOf(kw) >= 0) return 2;
    if ((e.career || "").indexOf(kw) >= 0) return 3;
    return 4;
  }

  /* ---------- 高校认知（软科 2026 主榜前 200 + 行业特色校） ---------- */
  var KEY_SCHOOLS = ["清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学", "中国科学技术大学", "南京大学", "西安交通大学", "哈尔滨工业大学", "中国人民大学", "北京航空航天大学", "北京理工大学", "同济大学", "武汉大学", "华中科技大学", "中山大学", "四川大学", "东南大学", "南开大学", "天津大学", "山东大学", "厦门大学", "中南大学", "湖南大学", "吉林大学", "大连理工大学", "重庆大学", "电子科技大学", "西北工业大学", "华南理工大学", "北京师范大学", "华东师范大学", "国防科技大学", "兰州大学", "中国农业大学", "中央民族大学", "东北大学", "北京邮电大学", "南京航空航天大学", "南京理工大学", "华东理工大学", "上海财经大学", "中央财经大学", "对外经济贸易大学", "中国政法大学", "北京外国语大学", "上海外国语大学", "中国传媒大学", "北京交通大学", "北京科技大学", "华中师范大学", "南京师范大学", "华南师范大学", "苏州大学", "郑州大学", "云南大学", "新疆大学", "浙江工业大学", "浙江师范大学", "杭州电子科技大学", "浙江理工大学", "宁波大学", "温州医科大学"];
  function keySchools() {
    var out = [], seen = {};
    var push = function (n) {
      if (!n || seen[n]) return;
      seen[n] = 1;
      out.push(n);
    };
    ((window.GK_RANKS || {})["bcur"] || []).forEach(function (b) {
      if (b.id !== "bcur-main") return;
      (b.rows || []).slice(0, 200).forEach(function (r) { push(r[1]); });
    });
    KEY_SCHOOLS.forEach(push);
    return out;
  }
  function aCount(name) {
    var arr = ASSESS[name];
    if (!arr) return 0;
    return arr.filter(function (x) { return /^A\+?$/.test(x[1]); }).length;
  }
  function lvlOf(name) {
    var m = META[name];
    if (!m) return [];
    var y = m.ylsp || "";
    var out = [];
    if (y.indexOf("985") >= 0) out.push("985");
    if (y.indexOf("211") >= 0) out.push("211");
    if (y.indexOf("双一流") >= 0) out.push("双一流");
    return out;
  }
  function tuimianOf(name) {
    var m = META[name];
    if (!m || !m.tuimian) return null;
    var arr = m.tuimian.filter(function (x) { return x; });
    return arr.length ? arr[arr.length - 1] : null;
  }
  /* 软科 2026 A+ 档优势院校 */
  function topSchoolsOf(majorName) {
    var ORDER = { "A+": 0, A: 1, "A-": 2, "B+": 3, B: 4, "B-": 5, "C+": 6, C: 7 };
    var out = [];
    RUANKE.forEach(function (r) {
      if (r[2] !== majorName) return;
      out.push({ school: r[3], grade: r[4], rank: r[5] });
    });
    out.sort(function (a, b) {
      var ga = ORDER[a.grade] != null ? ORDER[a.grade] : 9;
      var gb = ORDER[b.grade] != null ? ORDER[b.grade] : 9;
      if (ga !== gb) return ga - gb;
      return a.rank - b.rank;
    });
    var seen = {}, uniq = [];
    out.forEach(function (x) {
      if (seen[x.school]) return;
      seen[x.school] = 1;
      uniq.push(x);
    });
    return uniq.slice(0, 8);
  }
  function topSchoolsHtml(majorName) {
    var tops = topSchoolsOf(majorName);
    if (!tops.length) return "";
    return '<div class="sd-section-title" style="margin-top:12px">优势院校（软科 2026 · 评级）<span class="cog-src-inline">点击查看学校介绍</span></div>' +
      '<div class="cog-top-schools">' + tops.map(function (t, i) {
        return '<button class="cog-top-school" data-school-top="' + esc(t.school) + '">' +
          '<span class="cog-top-no">' + (i + 1) + "</span>" +
          "<b>" + esc(t.school) + "</b><em><span class=\"cog-top-grade\">" + esc(t.grade) + "</span> · 第 " + t.rank + " 名</em></button>";
      }).join("") + "</div>";
  }
  function renderSchool() {
    var body = document.getElementById("cogBody");
    var chips = ["全部", "985", "211", "双一流", "C9"];
    var sel = schoolTag || "全部";
    body.innerHTML =
      '<div class="cog-toolbar"><input class="cog-search" id="cogSchoolSearch" placeholder="搜索高校…" value="' + esc(schoolQ) + '">' +
      '<button class="btn btn-ghost btn-sm" id="cogSchoolClear">清除</button></div>' +
      '<div class="cog-chips">' + chips.map(function (c) { return '<button class="cog-chip' + (sel === c ? " is-on" : "") + '" data-tag="' + c + '">' + c + "</button>"; }).join("") + "</div>" +
      (compare.length ? '<div class="cog-compare-bar">已选 ' + compare.length + "/3 所：<b>" + compare.map(esc).join("、") + '</b><button class="btn btn-primary btn-sm" id="cogCompareGo">开始对比</button><button class="btn btn-ghost btn-sm" id="cogCompareClear">清空</button></div>' : "") +
      '<p class="cog-count" id="cogSchoolCount"></p>' +
      '<div class="cog-grid" id="cogSchoolGrid"></div>';
    renderSchoolList();
  }

  function renderSchoolList() {
    var kw = schoolQ.trim();
    var names = keySchools().filter(function (n) { return !kw || n.indexOf(kw) >= 0 || (INTRO[n] || "").indexOf(kw) >= 0 || (FEATURED[n] || "").indexOf(kw) >= 0; });
    var sel = schoolTag || "全部";
    var list = names.filter(function (n) {
      if (sel === "全部") return true;
      var tags = window.GK.data.tagsOfSchool("", n);
      if (sel === "C9") return /清华|北大|复旦|上海交大|浙江|中科大|南京|西安交大|哈工大/.test(n);
      return tags.indexOf(sel) >= 0;
    });
    var eliteMap = {};
    var grid = document.getElementById("cogSchoolGrid");
    var count = document.getElementById("cogSchoolCount");
    if (!grid) return;
    var cards = list.map(function (n) {
      var tags = window.GK.data.tagsOfSchool("", n).slice(0, 4);
      var feat = FEATURED[n] || "";
      var intro = strOf(JIANGHU[n] || INTRO[n] || "").slice(0, 60);
      var tm = tuimianOf(n);
      var ac = aCount(n);
      var dorm = DORM[n];
      var inCmp = compare.indexOf(n) >= 0;
      var el = eliteMap[n] !== undefined ? eliteMap[n] : (eliteMap[n] = window.GK.data.eliteSchoolOf(n) ? 1 : 0);
      return '<div class="cog-card cog-school" data-name="' + esc(n) + '">' +
        '<div class="cog-card-head"><b>' + esc(n) + '</b>' + (inCmp ? '<span class="cog-badge is-cmp">已加入对比</span>' : "") + "</div>" +
        (tags.length ? '<div class="cog-tags">' + tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" : "") +
        (intro ? '<p class="cog-desc">' + esc(intro) + (intro.length >= 60 ? "…" : "") + "</p>" : "") +
        (feat ? '<p class="cog-minor">王牌：' + esc(feat.replace(/^本科：/, "").slice(0, 46)) + (feat.length > 46 ? "…" : "") + "</p>" : "") +
        '<div class="cog-card-foot">' +
        (tm ? '<span class="cog-pill">推免 ' + tm + "%</span>" : "") +
        (el === 1 ? '<span class="cog-pill cog-pill-elite">重点档案</span>' : "") +
        (ac ? '<span class="cog-pill">A类学科 ' + ac + "</span>" : "") +
        (dorm ? '<span class="cog-pill">宿舍已收录</span>' : "") +
        "</div>" +
        '<div class="cog-acts"><button class="btn btn-ghost btn-sm" data-cmp="' + esc(n) + '">' + (inCmp ? "取消对比" : "加入对比") + '</button><button class="btn btn-ghost btn-sm" data-detail="' + esc(n) + '">详情</button></div>' +
        "</div>";
    }).join("");
    if (count) count.textContent = "重点高校 " + list.length + " 所" + (kw ? "（含关键词全局搜索）" : " · 数据：院校资料 / 学科评估 / 宿舍 / 王牌专业（网友整理，仅供参考）");
    grid.innerHTML = cards || '<div class="cog-empty">没有匹配的高校。</div>';
  }

  function compareModal() {
    if (compare.length < 2) { window.GK.toast("请至少选择 2 所院校对比", "error"); return; }
    var rows = [
      ["城市", compare.map(function (n) { return (META[n] && META[n].city) || "—"; })],
      ["类型", compare.map(function (n) { var t = window.GK.data.tagsOfSchool("", n); return t.length ? t.slice(0, 2).join("/") : "—"; })],
      ["推免率", compare.map(function (n) { var t = tuimianOf(n); return t ? t + "%" : "—"; })],
      ["A类学科", compare.map(function (n) { return aCount(n) ? aCount(n) + " 个" : "—"; })],
      ["王牌专业", compare.map(function (n) { return (FEATURED[n] || "—").replace(/^本科：/, "").slice(0, 14); })],
      ["宿舍收录", compare.map(function (n) { return DORM[n] ? "已收录" : "—"; })]
    ];
    var head = "<tr><th>指标</th>" + compare.map(function (n) { return "<th>" + esc(n) + "</th>"; }).join("") + "</tr>";
    var body = rows.map(function (r) { return "<tr><td>" + r[0] + "</td>" + r[1].map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>"; }).join("");
    window.GK.modal({ title: "院校对比（2.0 实验）", body: '<table class="data-table"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>", width: "640px" });
  }

  function schoolDetail(name) {
    var meta = META[name] || {};
    var intro = strOf(INTRO[name] || JIANGHU[name] || "");
    var feat = FEATURED[name] || "";
    var dorm = DORM[name] || "";
    var tm = tuimianOf(name);
    var elite = window.GK.data.eliteSchoolOf(name);
    if (elite && elite.tui && elite.tui[0] != null && elite.tui[0] !== "") tm = String(elite.tui[0]).replace("%", "");
    var ac = aCount(name);
    var html = '<p class="card-desc" style="margin-bottom:8px">' + esc(meta.city || "") + " · " + esc(meta.nature || "") + " · " + esc(meta.dept || "") + "</p>" +
      '<div class="cog-detail-tags">' + window.GK.data.tagsOfSchool("", name).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
      (tm || ac || elite ? '<div class="cog-detail-meta"><span>推免率 ' + (tm || "—") + "</span><span>A类学科 " + (ac || 0) + " 个</span>" + (elite ? '<span>重点院校档案已收录</span>' : "") + "</div>" : "") +
      (intro ? '<div class="sd-section-title" style="margin-top:12px">院校简介</div><div class="sd-desc">' + esc(intro) + "</div>" : "") +
      (feat ? '<div class="sd-section-title" style="margin-top:12px">王牌 / 特色专业</div><div class="sd-desc">' + esc(feat) + "</div>" : "") +
      (dorm ? '<div class="sd-section-title" style="margin-top:12px">宿舍 / 校园生活（网友整理，仅供参考）</div>' + dormCard(name, dorm) : "");
    html += '<div style="margin-top:14px;text-align:center"><button class="btn btn-primary" id="cogToExplore">在院校探索中查看完整档案</button></div>';
    window.GK.modal({ title: name, body: html, width: "620px" });
    var xb = document.getElementById("cogToExplore");
    if (xb) xb.addEventListener("click", function () {
      window.GK.goPage("explore");
      setTimeout(function () { if (window.GK.explore && window.GK.explore.openSchool) window.GK.explore.openSchool(name); }, 80);
    });
  }

  /* ---------- 职业认知 ---------- */
  var CAREER_STATS = window.GK_CAREER_STATS || null;
  var CAREERS = [
    { t: "公务员 / 体制内", majors: "法学、汉语言文学、行政管理、财政学、会计学、计算机", d: "多数岗位对专业有要求（法学/财会/计算机岗位多）；国考与省考竞争比例高，一般需提前 1–2 年准备行测申论。", p: "专业匹配度决定可报岗位数量，法学、财会、计算机、汉语言覆盖面较广。", deep: { jobs: "综合管理、行政执法、公检法司、税务财政、基层乡镇；选调生是名校专属快车道。", pay: "到手收入因地区差异大（浙江约 10–20 万/年），公积金与福利是隐形优势；薪资上限低但抗周期。", path: "应届/择业期报名 → 笔试（行测+申论）→ 面试 → 体检政审；选调生需党员+学生干部经历。", trend: "国考过审 2026 年 371.8 万，竞争稳定在高位；法学/财会/计算机可报岗位最多（2023 国考口径）。", fit: "求稳、能接受按部就班、想留省内发展的人；不适合追求高薪与自由节奏的人。" } },
    { t: "教师", majors: "汉语言文学、数学与应用数学、英语、物理、化学、教育学", d: "师范类专业对口；非师范需考教师资格证并参加教师招聘考试（各地要求不同）。", p: "部属公费师范生、地方公费师范生是主要通道；浙江对师范生需求较稳定。", deep: { jobs: "中小学学科教师（编制）、教研员、高校辅导员、培训机构（萎缩中）、教育行政。", pay: "发达地区/一线城市 15–30 万/年+寒暑假；欠发达地区 6–12 万；编制是主要红利。", path: "师范生→考编（校招/统考）；非师范→考教资→考编；公费师范生毕业即带编但服务期长。", trend: "人口下行传导：湖北 2026 教师招聘 -52.8%、江苏教资报名三年降三成；师范分数线回落（浙师大汉语言师范六年位次近翻倍）。", fit: "真心喜欢教书、表达能力强、能接受忙碌与稳定；「图稳定才来」的人要三思。" } },
    { t: "医生 / 医疗", majors: "临床医学、口腔医学、预防医学、中医学、药学、护理学", d: "临床培养周期长（5 年本科 + 规培 3 年），对分数与选科要求高（多数要求物化）。", p: "2024 年起多数医学专业要求物理+化学；选科不符将无法投档。", deep: { jobs: "三甲/市县医院临床、口腔/眼科等消费医疗、疾控与卫健委、药企医学事务、CRO。", pay: "前期（规培/住院医）月薪 3–8k 是常态；主治以上 15–40 万+；口腔/眼科细分回报更快。", path: "5 年本科+3 年规培起步，好医院普遍要硕博；读研读博是主流路径。", trend: "2026 临床分数线六年新低（全样本中位 71,532），「劝退潮」与「长期价值」并存；口腔仍坚挺。", fit: "能接受 8–10 年长投入、家庭可兜底、真有救人热情；想赚快钱勿入。" } },
    { t: "法律 / 律师", majors: "法学、知识产权、国际经贸规则", d: "通过法考是执业前提；法学就业分化大，院校层次与实习经历影响明显。", p: "五院四系之外，法考通过率与实习资源更值得关注。", deep: { jobs: "律所（诉讼/非诉）、公检法司、企业法务/合规、法律科技、法考培训。", pay: "头部红圈所 30 万+但强度极高；普通律所实习期 2–3k、执业后 8–20 万；考公岗位稳定。", path: "法考（通过率约 10–15%）→ 律所实习 → 执业；或考公检法；院校出身影响极大。", trend: "2025 届法学毕业生约 25 万；律所 15–20%、考公 20–25%、企业法务 30%；AI 冲击初级文书岗。", fit: "记忆力好、逻辑强、能说会写、想走体制或长期主义路线；法学是「前五年最难、后三十年最稳」。" } },
    { t: "计算机 / 互联网", majors: "计算机科学与技术、软件工程、人工智能、数据科学与大数据技术", d: "岗位需求量大但竞争分层明显；大厂校招偏好院校层次 + 项目/竞赛经历。", p: "数学与编程基础是关键；人工智能方向通常要求高分数段。", deep: { jobs: "算法/研发/前端后端、测试运维、数据科学、产品经理、国企数字化部门。", pay: "头部算法 30–80 万+；2026 麦可思计算机/软件首次跌出月收入前十；普通院校起薪 6–12k。", path: "本科+项目/竞赛/实习 → 秋招；AI 方向普遍要硕博；持续学习是行业刚需。", trend: "前一万名计算机 2026 登顶（148 行）但全样本降温；AI 岗位暴涨 12 倍但招聘集中硕博；程序员近 40% 任务可被 AI 覆盖（Anthropic）。", fit: "真喜欢写代码、数学不差、能终身学习；「听说工资高」是最大误区。" } },
    { t: "金融 / 经济", majors: "金融学、经济学、会计学、财务管理、统计学", d: "银行/证券/保险岗位多；头部机构偏好名校与硕士学历，实习很重要。", p: "数理能力强的学生可考虑金融工程、精算学等交叉方向。", deep: { jobs: "银行（柜员→客户经理→分行）、券商/基金、投行、四大审计、企业财务、金融科技。", pay: "头部投行/基金 30–100 万+；腰部银行 6k–1.5 万/月+指标压力；2026 投行新人起薪缩水至约 1.5 万。", path: "名校+实习+考证（CPA/CFA）；本科毕业直接进头部越来越难，读研是主流。", trend: "上财金融 914→3,806 位、央财六年连降；券商一年少近 8000 人；「金融信仰」回归均值。", fit: "数学好、能卷实习、家境能支持；普通家庭慎选万金油财经。" } },
    { t: "电气 / 能源", majors: "电气工程及其自动化、能源与动力工程、自动化", d: "国家电网、南方电网校招人数多（电气类为主力），行业稳定性高。", p: "国网一批招聘对院校与专业有明确清单，电气工程是核心对口专业。", deep: { jobs: "国网/南网（市局/县局/变电站）、发电集团、电力设计院、新能源企业、轨道交通供电。", pay: "国网市局 15–25 万/年（地区差异大）；县局与变电站环境艰苦；新能源研发硕士 25–50 万。", path: "本科可进（电网一批 2026 录用 2.09 万），好岗位硕士起步；电气工程是最强对口。", trend: "电气连续多年绿牌、热搜登顶；华电六年 35,747→30,742 位；2026 领军班 3,777 位。", fit: "求稳、物理好、能接受偏远站点与地域绑定；「稳定」的代价是自由度。" } },
    { t: "建筑 / 土木", majors: "建筑学、土木工程、城乡规划、工程管理", d: "行业周期影响明显；建筑学五年制，需要作品集与审美积累。", p: "近年基建放缓，读研深造或转向数字化是常见路径。", deep: { jobs: "设计院、施工单位、地产（萎缩中）、基建/城投、智能建造、考公（住建/交通）。", pay: "设计院新人 6–12k/月但加班多；施工驻场辛苦；行业整体薪资增速放缓。", path: "实习+作品集（建筑）→ 校招；读研转向结构/智能建造/城市更新是加分。", trend: "土木中位六年 86,301→109,333 位、供给收缩；2026 回温被指「水涨船高」；同济土木河南暴跌 103 分是标志事件。", fit: "真爱设计/基建的人；普通家庭按「性价比」逻辑应谨慎。" } },
    { t: "生化环材", majors: "生物科学、化学、环境工程、材料科学与工程", d: "常被称为「四大天坑」，本质是本科直接就业面窄、深造回报周期长；读研后出路分化明显。", p: "选择前建议评估是否愿意长期科研深造，而非只看兴趣。", deep: { jobs: "药企/电池/半导体材料研发（需硕博）、质检环保、考公（应急/环保/海关）、教职。", pay: "本科 5–8k 常见；硕士研发 15–30 万（电池/材料绑定新能源后回温）；博士进院所更稳。", path: "本科→保研/考研→细分赛道（半导体材料、储能、合成生物）；纯本科就业面窄。", trend: "「四大天坑」叙事 2026 松动：微电子连续 5 年绿牌、材料/化学随新能源回温；但纯化工仍苦。", fit: "真喜欢科研、能接受 6–8 年长期投入；想本科就业的人慎重。" } },
    { t: "军工 / 航空航天", majors: "航空航天工程、飞行器设计与工程、武器系统与工程、探测制导与控制", d: "对口研究所与央企（航天科技/科工等）需求稳定，多数要求硕士以上。", p: "政审、体检与背景审查是特殊要求，报考前需了解。", deep: { jobs: "航天院所、商飞/C919、军工央企、民航、低空经济企业。", pay: "军工央企硕士起薪 15–25 万/年，稳定性强、福利好；涉密岗位自由度低。", path: "硕士/博士为主（院校对口：北航/北理工/西工大/哈工大等）；政审严格。", trend: "2024 军工门槛不降反升（-8,075 位）；哈工大六年 18,102→14,741；低空经济成新增长点。", fit: "有家国情怀、物理极好、能接受低自由度和相对低薪资。" } },
    { t: "新闻 / 传媒", majors: "新闻学、传播学、网络与新媒体、广播电视学", d: "传统媒体岗位收缩，新媒体运营/内容/品牌岗需求大；作品与实践比学历更重要。", p: "建议尽早建立作品集与实习经历。", deep: { jobs: "传统媒体记者编辑、新媒体运营/内容策划、品牌公关、MCN、游戏/影视策划。", pay: "传统媒体 6–12k 常见；新媒体头部年入百万+、长尾 3–5k；AI 大厂内容岗 15–25k 起。", path: "作品集+实习（大学期间大量实践）→ 校招；复合背景（AI+内容/法律+内容）加分。", trend: "「张雪峰效应」使新传位次平均降 15%；2026 AI 大厂抢文科生；行业从「记者」转向「内容运营」。", fit: "内容敏感度高、会讲故事、抗压；「喜欢刷手机」≠「适合做传媒」。" } },
    { t: "艺术 / 设计", majors: "视觉传达、环境设计、产品设计、数字媒体艺术、音乐表演、美术学", d: "就业与个人作品/风格强相关；艺考路径对文化与专业双线要求。", p: "选择艺术院校时关注学科评估与行业口碑。", deep: { jobs: "UI/UX、视觉/品牌设计、游戏美术、影视后期、音乐教育/演出、AI 内容创作。", pay: "互联网设计 10–20k/月；游戏美术 15–30k；自由职业波动大；AI 冲击初级岗位。", path: "作品集是敲门砖（比学历更硬）；艺考投入大（集训+材料）；实习与接单积累经验。", trend: "数字媒体/交互设计需求增长；「AI 工具+审美」复合人才吃香，纯执行岗被压缩。", fit: "有真天赋+热爱、家庭能支撑艺考投入；纯为低分上大学慎选。" } }
  ];
  function statTile(label, value, sub) {
    return '<div class="cog-stat-tile"><div class="cog-stat-v">' + value + '</div><div class="cog-stat-l">' + label + '</div>' + (sub ? '<div class="cog-stat-s">' + sub + "</div>" : "") + "</div>";
  }
  function renderCareerStats() {
    if (!CAREER_STATS) return "";
    var s = CAREER_STATS;
    var tiles = statTile("本科平均月收入", "¥" + (s.avg && s.avg.monthly), (s.avg && s.avg.year) + "届 · 毕业半年后");
    tiles += statTile("应届读研比例", s.degree ? s.degree.avg + "%" : "—", "境内读研 · 全国本科均值");
    tiles += statTile("2025 考研报名", (s.exam ? s.exam.kaoyan2025 : "—") + " 万", "连续两年下降");
    tiles += statTile("2025 国考报录比", s.exam ? s.exam.guokaoRatio : "—", "通过资格审查 341.6 万");
    var green = (s.green && s.green.majors || []).map(function (m) {
      var n = s.greenCount && s.greenCount[m];
      return '<div class="cog-rank-major"><b>' + esc(m) + "</b>" + (n ? "<span>连续 " + n + " 年上榜</span>" : "") + "</div>";
    }).join("");
    var red = (s.red && s.red.majors || []).map(function (m) {
      return '<div class="cog-rank-major"><b>' + esc(m) + "</b></div>";
    }).join("");
    var pays = (s.highJob || []).slice(0, 3).map(function (j) {
      return '<div class="cog-pay-row"><span>' + esc(j.job) + "</span><b>¥" + j.v + "</b></div>";
    }).join("");
    var deg = s.degree && s.degree.byField || {};
    var degMax = 45;
    var degRows = Object.keys(deg).slice(0, 6).map(function (k) {
      var v = deg[k];
      var num = parseFloat(v);
      var w = isNaN(num) ? 30 : Math.max(6, Math.min(100, num / degMax * 100));
      return '<div class="cog-bar-row"><span class="cog-bar-name">' + esc(k) + '</span><div class="cog-bar"><i style="width:' + w + '%"></i></div><b>' + esc(v) + "</b></div>";
    }).join("");
    return '<div class="cog-sec">' +
      '<div class="cog-sec-head"><h3>就业 · 全景</h3><span class="cog-sec-src">来源：' + esc(CAREER_STATS.meta || "麦可思就业蓝皮书") + "（仅供参考）</span></div>" +
      '<div class="cog-stat-tiles">' + tiles + "</div>" +
      '<div class="cog-split">' +
        '<div class="cog-split-card cog-split-good"><div class="cog-split-title"><span class="cog-split-dot"></span>绿牌专业 · 需求上升</div>' +
        '<p class="cog-split-note">' + esc(s.green && s.green.note || "") + "</p>" + green + "</div>" +
        '<div class="cog-split-card cog-split-warn"><div class="cog-split-title"><span class="cog-split-dot"></span>红牌专业 · 需谨慎</div>' +
        '<p class="cog-split-note">' + esc(s.red && s.red.note || "") + "</p>" + red + "</div>" +
      "</div>" +
      (pays ? '<div class="cog-sec-sub"><h4>高薪岗位 · 月收入</h4>' + pays + "</div>" : "") +
      (degRows ? '<div class="cog-sec-sub"><h4>应届境内读研比例 · 分学科</h4>' + degRows + '<p class="cog-sec-foot">医学、农学、理学连续三届达到或超过 25%</p></div>' : "") +
      "</div>";
  }
  function renderCareerExtras() {
    var h = "";
    /* 考公 · 专业视角（基于 2023 年国考岗位统计） */
    var kg = [
      ["财政学类", "可报岗位最多；财政学、税收学并不算热门，却是考公覆盖面最广的专业。", 1],
      ["经济学 / 金融学类", "经济学、经济统计学、国民经济管理；金融学、金融工程、保险学、投资学等。", 2],
      ["计算机 / 统计学 / 经贸类", "计算机科学与技术、软件工程、网络工程、信息安全；统计学、应用统计学；国际经济与贸易等。", 3],
      ["法学 / 中文 / 工商管理 / 财会审计类", "法学、知识产权、汉语言、秘书学；工商管理、财务管理、会计学等。", 4]
    ];
    h += '<div class="cog-sec-sub"><h4>考公 · 专业视角</h4>' +
      '<p class="cog-sec-note">按 2023 年国考 1.7 万余个职位的可报岗位数量统计，专业对口决定可报岗位的多寡——岗位越多，选择越多，也越容易「捡漏」。以下按可报岗位数量排序。</p>' +
      kg.map(function (g) {
        return '<div class="cog-kg-row"><span class="cog-kg-rank">' + g[2] + '</span><div><b>' + esc(g[0]) + "</b><p>" + esc(g[1]) + "</p></div></div>";
      }).join("") +
      '<p class="cog-sec-foot">来源：金榜如愿内部资料（2023 年国考岗位统计口径，仅供参考）。</p></div>';
    /* 行业 · 选科与专业（电力 / 铁路 / 烟草 / 军工） */
    var IND = window.GK_INDUSTRY_SUBJECTS || {};
    if (Object.keys(IND).length) {
      h += '<div class="cog-sec"><div class="cog-sec-head"><h3>行业 · 选科与专业</h3><span class="cog-sec-src">网友整理表 · 以当年招生计划为准</span></div>' +
        '<div class="cog-ind-grid">' + Object.keys(IND).map(function (ind) {
          var rows = IND[ind].slice(0, 5).map(function (r) {
            return '<div class="cog-ind-row"><span class="cog-ind-cat">' + esc(r[0]) + "</span><span class='cog-ind-m'>" + esc(r[1].slice(0, 42)) + "</span>" +
              (r[2] ? '<em class="cog-ind-subj">' + esc(r[2]) + (r[3] ? " + " + esc(r[3]) : "") + "</em>" : "") + "</div>";
          }).join("");
          return '<div class="cog-ind-card"><div class="cog-ind-head">' + esc(ind) + "</div>" + rows + "</div>";
        }).join("") + "</div></div>";
    }
    return h;
  }
  /* 就业 · 检索限定：按专业 / 按院校查看具体数据（不再只有全国平均） */
  var empMode = "major", empQ = "", empPick = null;
  var EMP_LEVELS = [
    { id: "c9", t: "C9", desc: "清北 + 华东五校 + 哈工大 + 西交" },
    { id: "985", t: "985", desc: "39 所重点大学" },
    { id: "211", t: "211", desc: "约 116 所重点大学" },
    { id: "double", t: "双一流", desc: "一流大学 / 一流学科建设" },
    { id: "strong", t: "双非强校", desc: "非 985/211 但学科突出的院校（深大/华政/首医/杭电等）" },
    { id: "zhw", t: "中外合作", desc: "宁诺 / 西浦 / 港中深等" },
    { id: "minban", t: "民办", desc: "独立学院 / 民办本科" }
  ];
  function empCandidates(q) {
    q = (q || "").trim();
    if (!q) return [];
    var out = [];
    if (empMode === "major") {
      var all = (((window.GK_MAJOR_DB || {}).agg || []) || []).concat(majorList().map(function (e) { return { name: e.name }; }));
      var seen = {};
      for (var i = 0; i < all.length && out.length < 8; i++) {
        var nm = all[i].name;
        if (!nm || seen[nm] || nm.indexOf(q) < 0) continue;
        seen[nm] = 1;
        out.push({ t: "major", n: nm });
      }
    } else {
      var keys = Object.keys(META);
      for (var j = 0; j < keys.length && out.length < 8; j++) {
        if (keys[j].indexOf(q) >= 0) out.push({ t: "school", n: keys[j] });
      }
    }
    return out;
  }
  function empExact(q) {
    q = (q || "").trim();
    if (!q) return null;
    if (empMode === "major") {
      var all = (((window.GK_MAJOR_DB || {}).agg || []) || []).concat(majorList().map(function (e) { return { name: e.name }; }));
      for (var i = 0; i < all.length; i++) {
        if (all[i].name === q) return { t: "major", n: q };
      }
      return null;
    }
    return META[q] ? { t: "school", n: q } : null;
  }
  function empLevelHtml(id) {
    var L = window.GK.data.L;
    var LIB = window.GK.data.LIBRARY || [];
    var names = {}, ranks = [], tmSum = 0, tmN = 0, acSum = 0, rankSum = 0, rankN = 0;
    LIB.forEach(function (r) {
      var n = r[L.NAME];
      if (!n || names[n]) return;
      var m = META[n];
      if (!m) return;
      var tags = window.GK.data.tagsOfSchool("", n);
      var ok = false;
      if (id === "c9") ok = /清华|北大|复旦|上海交大|浙江|中科大|南京|西安交大|哈工大/.test(n);
      else if (id === "985") ok = tags.indexOf("985") >= 0;
      else if (id === "211") ok = tags.indexOf("211") >= 0;
      else if (id === "double") ok = tags.indexOf("双一流") >= 0;
      else if (id === "strong") ok = tags.indexOf("双一流") < 0 && tags.indexOf("985") < 0 && tags.indexOf("211") < 0 && (m.ruanke || "").indexOf("主榜") >= 0 && m.ruanke && parseInt(m.ruanke.replace(/\D/g, ""), 10) <= 120;
      else if (id === "zhw") ok = /中外|诺丁汉|西交利物浦|香港中文|北理莫斯科|昆山杜克|广东以色列/.test(n + (m.dept || ""));
      else if (id === "minban") ok = m.nature === "民办" || tags.indexOf("民办") >= 0;
      if (!ok) return;
      names[n] = 1;
      var t = tuimianOf(n);
      if (t) { tmSum += parseFloat(t) || 0; tmN++; }
      acSum += aCount(n);
      var ln = window.GK.data.findLines(2026, r[L.CODE], r[L.MC])[0];
      var rk = ln ? ln[6] : null;
      if (rk) { rankSum += rk; rankN++; ranks.push(rk); }
    });
    var nms = Object.keys(names);
    var avgTm = tmN ? (tmSum / tmN).toFixed(1) : "—";
    var avgRk = rankN ? Math.round(rankSum / rankN) : null;
    var best = ranks.length ? Math.min.apply(null, ranks) : null;
    var level = EMP_LEVELS.find(function (x) { return x.id === id; });
    var tiles = statTile("院校数", nms.length + " 所", level ? level.desc : "");
    tiles += statTile("平均推免率", avgTm + "%", tmN ? "可统计 " + tmN + " 所" : "暂无");
    tiles += statTile("A 类学科合计", acSum + " 个", "教育部评估口径");
    tiles += statTile("浙江最低位次", avgRk ? "约 " + avgRk : "—", best ? "最佳约 " + best : "");
    var top = nms.slice(0, 8);
    var chips = top.length ? '<div class="emp-level-schools">' + top.map(function (n) {
      var t = tuimianOf(n);
      var ac = aCount(n);
      return '<span><b>' + esc(n) + "</b>" + (t ? "<em>推免 " + t + "%</em>" : "") + (ac ? "<em>A类 " + ac + "</em>" : "") + "</span>";
    }).join("") + "</div>" : '<div class="cog-empty">该层次暂无浙江招生数据。</div>';
    return '<div class="cog-stat-tiles">' + tiles + "</div>" + chips +
      '<p class="cog-sec-foot">层次画像由院校元数据 + 2026 浙江招生计划实时聚合（仅供参考）。</p>';
  }
  function empResultHtml() {
    if (empMode === "level") {
      if (!empPick) return '<div class="cog-empty">先选一个院校层次，看该层次的整体深造与录取画像。</div>';
      return empLevelHtml(empPick.n);
    }
    if (!empPick) return '<div class="cog-empty">在上方选择专业或院校，查看针对性的就业/深造数据。</div>';
    if (empPick.t === "major") {
      var e2 = CAT[empPick.n];
      var code = e2 ? e2.code : "";
      var jobs = (((window.GK_MAJOR_DB || {}).jobs || {}) || {})[code] || [];
      var tiles = statTile("覆盖方向", jobs.length ? jobs.length + " 个" : "—", "学职平台历史映射");
      var topJob = jobs.length ? jobs[0] : null;
      tiles += statTile("主要去向", topJob ? topJob[0] : "—", topJob ? "占比 " + topJob[1] + "%" : "");
      tiles += statTile("就业方向", e2 && e2.career ? "已收录" : "—", "专业库");
      tiles += statTile("参考待遇", money(e2 && e2.salary) || "—", "专业库口径");
      var bars = jobs.length ? '<div class="cog-sec-sub"><h4>' + esc(empPick.n) + " · 毕业去向分布</h4>" +
        '<div class="cog-job-list">' + jobs.map(function (j) {
          var jobsTxt = (j[2] || []).length ? j[2].join("、") : "";
          var w = Math.max(8, Math.min(100, (j[1] || 0) * 1.5));
          return '<div class="cog-job-row"><div class="cog-job-line"><span class="cog-job-d">' + esc(j[0]) + "</span><b>" + j[1] + "%</b></div>" +
            '<div class="cog-bar cog-job-bar"><i style="width:' + w + '%"></i></div>' +
            (jobsTxt ? '<div class="cog-job-j">如：' + esc(jobsTxt) + "</div>" : "") + "</div>";
        }).join("") + "</div></div>" : "";
      return '<div class="cog-stat-tiles">' + tiles + "</div>" +
        (e2 && e2.intro ? '<div class="cog-emp-note"><b>' + esc(empPick.n) + '</b><p>' + esc(e2.intro.slice(0, 120)) + "</p></div>" : "") +
        bars +
        '<p class="cog-sec-foot">来源：专业库 + 学职平台去向映射（历史口径，仅供参考）</p>';
    }
    var m = META[empPick.n] || {};
    var tm = tuimianOf(empPick.n);
    var ac = aCount(empPick.n);
    var feat = FEATURED[empPick.n] || "";
    var tiles = statTile("推免率", tm ? tm + "%" : "—", "校方/整理口径");
    tiles += statTile("A 类学科", ac ? ac + " 个" : "0", "教育部评估");
    tiles += statTile("院校层次", m.level || m.nature || "—", m.prov ? m.prov + " · " + (m.city || "") : "");
    tiles += statTile("王牌专业", feat ? "已收录" : "—", "特色/王牌整理");
    return '<div class="cog-stat-tiles">' + tiles + "</div>" +
      (feat ? '<div class="cog-emp-note"><b>' + esc(empPick.n) + '</b><p>' + esc(feat.slice(0, 120)) + "</p></div>" : "") +
      '<p class="cog-sec-foot">院校级就业报告暂未全量收录，先用推免率/学科/王牌做「深造与实力」画像（仅供参考）。</p>';
  }
  function renderEmpSearch() {
    var cands = empCandidates(empQ);
    var candHtml = cands.map(function (c) {
      return '<button class="emp-cand" data-type="' + c.t + '" data-name="' + esc(c.n) + '">' + esc(c.n) + "</button>";
    }).join("");
    return '<div class="cog-sec"><div class="cog-sec-head"><h3>就业 · 按专业 / 院校检索</h3><span class="cog-sec-src">不再只看全国平均，限定范围看个体</span></div>' +
      '<div class="emp-mode-seg">' +
      '<button class="emp-mode' + (empMode === "major" ? " is-on" : "") + '" data-mode="major">按专业</button>' +
      '<button class="emp-mode' + (empMode === "school" ? " is-on" : "") + '" data-mode="school">按院校</button>' +
      '<button class="emp-mode' + (empMode === "level" ? " is-on" : "") + '" data-mode="level">按层次</button>' +
      "</div>" +
      (empMode === "level"
        ? '<div class="emp-level-chips">' + EMP_LEVELS.map(function (l) {
            return '<button class="emp-level-chip' + (empPick && empPick.n === l.id ? " is-on" : "") + '" data-level="' + l.id + '">' + l.t + "</button>";
          }).join("") + "</div>"
        : '<div class="cog-toolbar"><input class="cog-search" id="empSearch" placeholder="' + (empMode === "major" ? "输入专业名（支持全量专业），如：计算机科学与技术 / 智能科学与技术" : "输入院校名，如：浙江大学 / 杭电") + '" value="' + esc(empQ) + '">' +
      '<button class="btn btn-ghost btn-sm" id="empClear">清除</button></div>' +
      (candHtml ? '<div class="emp-cands">' + candHtml + "</div>" : "")) +
      '<div class="emp-pick">' + (empPick ? "当前限定：<b>" + esc(empPick.n) + "</b>" : "未选择") + "</div>" +
      '<div class="cog-sec-sub" style="margin-top:8px">' + empResultHtml() + "</div>" +
      "</div>";
  }
  function renderCareer() {
    var body = document.getElementById("cogBody");
    var cards = CAREERS.map(function (c, i) {
      return '<div class="cog-card cog-career" data-i="' + i + '"><div class="cog-card-head"><b>' + esc(c.t) + '</b><span class="cog-link">深入了解 ›</span></div>' +
        '<p class="cog-minor">对口专业：' + esc(c.majors) + "</p>" +
        '<p class="cog-desc">' + esc(c.d) + "</p>" +
      '<p class="cog-tip">提示：' + esc(c.p) + "</p></div>";
    }).join("");
    body.innerHTML =
      renderCareerStats() +
      renderEmpSearch() +
      '<div class="cog-toolbar"><input class="cog-search" id="cogCareerSearch" placeholder="搜索职业或行业，如「电网」「教师」…"></div>' +
      '<div class="cog-sec"><div class="cog-sec-head"><h3>行业 · 认知</h3><span class="cog-sec-src">客观科普整理 · 具体政策以当年公告为准</span></div>' +
      '<div class="cog-grid">' + cards + "</div></div>" +
      renderCareerExtras();
    var el = document.getElementById("cogCareerSearch");
    if (el) el.addEventListener("input", function () {
      var kw = el.value.trim();
      document.querySelectorAll(".cog-career").forEach(function (c) {
        c.style.display = (!kw || c.textContent.indexOf(kw) >= 0) ? "" : "none";
      });
    });
  }

  function careerDetail(i) {
    var c = CAREERS[i];
    if (!c) return;
    var dp = c.deep || {};
    var rows = [
      ["岗位地图", dp.jobs],
      ["收入参考（2026，仅供参考）", dp.pay],
      ["入行路径", dp.path],
      ["行业趋势", dp.trend],
      ["适合谁", dp.fit]
    ];
    var html = '<p class="cog-minor" style="margin-bottom:6px">对口专业：' + esc(c.majors) + "</p>" +
      '<div class="sd-desc" style="margin-bottom:10px">' + esc(c.d) + "</div>" +
      rows.map(function (r) {
        return '<div class="cog-career-row"><b>' + esc(r[0]) + "</b><p>" + esc(r[1] || "暂无") + "</p></div>";
      }).join("") +
      '<p class="cog-sec-foot" style="margin-top:10px">内容为公开信息整理（知乎/媒体/行业报告），收入与趋势随年份变化，仅供参考。</p>';
    window.GK.modal({ title: c.t, body: html, width: "600px" });
  }

  /* ---------- 大学生活 ---------- */
  var LIFE = [
    { t: "绩点（GPA）", what: "大学成绩的「分数版本」：每门课按百分制或等级折算成 4 分制/5 分制的分数，把所有课平均后就是你的绩点（GPA）。比如一门课考 92 分，可能折算成 4.0。", why: "保研资格、奖学金、出国申请、评优评先几乎都看绩点排名——它是大学里最通用的「硬通货」。不用追求每科满分，保持稳定中上排名更重要。", now: "高中阶段不用管；进大学第一学期就要搞懂本校绩点算法（有的学校 60 分就算 1.0，有的挂科直接 0），别把「60 分万岁」当真。" },
    { t: "学分", what: "大学的「课时计量单位」：每门课都有学分（一般 1–6 分），修满培养方案要求的学分才能毕业。学分不只看上课，实验、实习、毕业论文都算。", why: "学分是毕业的「进度条」，也是选课权的「货币」——学分绩点高的人通常能优先选到热门课。", now: "高中不用管；入学后第一件事是读一遍自己专业的培养方案，知道四年要修多少学分、每学期大概修多少。" },
    { t: "转专业与大类分流", what: "「大类招生」是大一先按大类（如工科试验班）入学，学一年基础课后按绩点/面试分流到具体专业；「转专业」是入学后申请换到别的专业。", why: "它是高考没选到心仪专业的「第二次机会」，但热门专业名额极少、竞争激烈（常见绩点前 10%–30% 才有资格）。", now: "如果你有转专业想法，入学前就去学校官网查转专业细则；大一上保持高绩点是硬前提——转专业窗口不止一次，但越早越容易。" },
    { t: "双学位 / 辅修 / 第二学士学位", what: "三者是不同概念：双学位和第二学士学位能拿第二个学位证书（学分要求高、须国家承认）；辅修只发结业证明，含金量低一些。", why: "跨学科组合（如法学+计算机、英语+金融）能拓宽就业面，但会占用大量周末和假期，还可能挤占本专业绩点。", now: "大一先别急着报，读一个学期摸清自己的学习节奏再说；确认学校政策与用人单位认可度，避免「学了但用不上」。" },
    { t: "推免（保研）", what: "本科毕业后不用参加全国统考、直接读研的通道：学校按前三学年成绩排名（加科研/竞赛加分）把名额发给学生，拿到名额后参加目标院校的接收考核（夏令营/预推免/九推）。", why: "2026 年推免名额扩到约 18–19 万，但竞争反而更卷——名校保研率可达 60%–76%，双非只有 2%–3%；保研是「用三年努力换一次确定上岸」。", now: "想保研：从大一第一学期就盯住绩点排名，尽早联系导师进实验室；高中有余力可以多参加学科竞赛练手，但大学才是主战场。" },
    { t: "考研", what: "本科毕业后参加的全国统一研究生入学考试：先笔试（政治、外语、数学、专业课），过国家线后再复试。和保研二选一，考研是「一年冲刺换一次机会」。", why: "2026 年报名 343 万（连续三年下降），但统考录取率约 14%、985 约 5%–8%，国家线还不降反升——「人数降了不等于难度降了」。", now: "高中不用准备；大学里最忌讳「大一就躺平、大三才决定考研」——早决定早积累，绩点高的人往往最后两条路都能走。" },
    { t: "考公与编制", what: "考公务员（国考/省考/选调生）和事业单位编制：通过笔试面试进入体制内工作，稳定、福利全、抗周期。", why: "多数岗位限当年应届或择业期，选调生对院校层次、党员身份、学生干部经历有要求；法学、财会、计算机、汉语言等专业可报岗位更多。", now: "想走这条路：大学期间保持绩点中上、争取入党、积累学生工作经历；专业选择上优先「考公友好专业」。" },
    { t: "实习与秋招春招", what: "实习是提前去公司/单位干活体验真实工作；秋招（大四上 9–11 月）和春招（大四下 3–5 月）是应届生找工作的两个招聘季。", why: "暑期实习转正常常是进大厂/好单位的主通道；没有实习经历，简历在招聘季很难有竞争力。", now: "大学规划：大二暑假开始第一段正式实习，大三暑期实习争取转正；高中阶段先不用管，但要知道「大学不是只上课」。" },
    { t: "奖学金与竞赛", what: "奖学金分国家奖学金（8000 元/年）、励志奖学金、校级奖学金；竞赛有 ACM、挑战杯、互联网+、数学建模等学科竞赛。", why: "奖学金看绩点排名，竞赛是保研加分和简历亮点，但别为了竞赛牺牲绩点这个「基本盘」。", now: "高中可以提前了解竞赛（数学建模/信息学），锻炼的不只是奖项，还有团队协作和解决问题的能力。" }
  ];
  var HANDBOOK = [
    { cat: "防骗 · 第一课", items: [
      "保护个人信息：录取号、学号、手机号、身份证号在任何社交平台发布前打码，快递单同样处理。",
      "校园推销：假冒学长学姐的高价推销（笔、洗衣液、床上用品等）直接拒绝；宿舍敲门推销立即联系宿管或保卫处。",
      "电话诈骗：开学季自称「学校工作人员」主动联系、索要钱财/验证码的一律警惕；官方电话可到学校官网核实。",
      "远离校园贷与套路贷：急用钱先找家人或辅导员；理性消费，花呗、白条等超前消费要量力而行。",
      "兼职诈骗：无技能高薪兼职（打字员、刷单、点赞员、快递单号员）都是经典骗局；正规兼职不会要求先交押金。"
    ] },
    { cat: "学术 · 底线", items: [
      "学术不端包括抄袭、自我剽窃、一稿多投、伪造数据与信息——即使只是一次作业，也可能影响毕业与学术生涯。",
      "引用他人观点必须标注来源，转述、翻译同样需要注明；连续引用多个词句必须加引号。",
      "课程作业普遍接入查重系统（横向比对数据库、纵向比对历年作业、校内互测），不要心存侥幸。"
    ] },
    { cat: "AI · 判断力", items: [
      "来源追踪：先看答案引用的来源是否权威、是否真实存在，复制链接实地检查。",
      "逻辑与交叉验证：AI 答案看似合理实则可能漏洞百出，与知网等可靠资料对照，多家一致才可信。",
      "常识与时效：明显违背常识的答案要警惕；AI 知识库可能过时，涉及政策、数据时务必核对最新信息。"
    ] },
    { cat: "学习 · 方法", items: [
      "电子教材便携、易归档；纸质教材适合深度阅读。二手书通常是最划算的选择——上完课多数教材不会再翻开。",
      "找书渠道：学长学姐赠送/转让、校园闲置群、图书馆数据库、正规电子教材平台；注意尊重著作权，不商用。",
      "开学第一个月开支往往高于日常（生活用品 + 学习用品），提前和家人沟通预算，避免开学季冲动消费。"
    ] }
  ];
  var LIFE_CATS = [
    { k: "study", t: "学习", ids: [0, 1, 2] },
    { k: "grad", t: "升学", ids: [3, 4, 5] },
    { k: "career", t: "职业", ids: [6, 7] },
    { k: "dev", t: "发展", ids: [8] }
  ];
  var lifeCat = "study";
  function lifeConceptHtml(ids) {
    return ids.map(function (i) {
      var x = LIFE[i];
      return '<details class="cog-details"><summary>' + esc(x.t) + "</summary>" +
        '<div class="cog-dl"><b>是什么</b><p>' + esc(x.what) + "</p></div>" +
        '<div class="cog-dl"><b>为什么重要</b><p>' + esc(x.why) + "</p></div>" +
        '<div class="cog-dl cog-dl-now"><b>现在能做什么</b><p>' + esc(x.now) + "</p></div>" +
        "</details>";
    }).join("");
  }
  var TL = [
    { y: "大一", d: "适应大学节奏，稳住绩点；了解转专业政策；参加 1–2 个社团；尽早规划英语（四六级）。" },
    { y: "大二", d: "确定方向：科研/竞赛/学生工作/实习；考虑辅修或双学位；寒暑假开始第一段实习或实验室经历。" },
    { y: "大三", d: "关键年：保研看前三学年成绩；考研党开始系统复习；就业党在暑期拿到实习转正机会。" },
    { y: "大四", d: "秋招/考研初试/保研复试并行；毕业论文；春招补录；毕业后考研复试或入职。" }
  ];
  function renderLife() {
    var body = document.getElementById("cogBody");
    var tl = TL.map(function (x) {
      return '<div class="cog-tl"><b>' + x.y + "</b><p>" + x.d + "</p></div>";
    }).join("");
    var curCat = LIFE_CATS.filter(function (c) { return c.k === lifeCat; })[0] || LIFE_CATS[0];
    var concepts = lifeConceptHtml(curCat.ids);
    var checklist = ["证件与档案：录取通知书、身份证、户口迁移（可选）、党团组织关系", "宿舍物品：床上用品、洗漱用品、常用药品（多数可到校后购置）", "财务：银行卡激活、学费缴纳渠道确认、助学贷款/助学金申请时间", "学习：专业培养方案提前看、选课系统熟悉、四六级报名", "生活：校园地图、食堂/快递/医务室位置、安全须知"];
    var hb = HANDBOOK.map(function (g) {
      return '<div class="cog-hb"><div class="cog-hb-cat">' + esc(g.cat) + "</div>" +
        g.items.map(function (x) { return '<div class="cog-hb-item">· ' + esc(x) + "</div>"; }).join("") + "</div>";
    }).join("");
    body.innerHTML =
      '<div class="sd-section-title" style="margin-top:2px">大学四年时间线</div><div class="cog-tl-row">' + tl + "</div>" +
      '<div class="sd-section-title" style="margin-top:18px">考研与保研 · 2026 全景<span class="cog-src-inline">数据来源：教育部/新东方/保研人/启航考研（2026，仅供参考）</span></div>' +
      '<div class="cog-grad-grid">' +
        '<div class="cog-grad-card"><div class="cog-grad-head">保研（推免）</div>' +
          '<p><b>是什么：</b>本科毕业免统考直接读研，按前三学年成绩排名+科研竞赛表现选拔。</p>' +
          '<p><b>怎么拿：</b>大一到大三稳绩点 → 夏令营/预推免/九推拿目标院校接收资格。</p>' +
          '<p><b>2026 数据：</b>名额约 18–19 万（三年 +5 万）；清华保研率约 76%、北大本部约 69%；双非普遍 2%–3%。</p>' +
          '<p class="cog-grad-tip">提示：保研是「三年努力换确定上岸」，性价比最高，但要从大一就开始。</p></div>' +
        '<div class="cog-grad-card"><div class="cog-grad-head">考研（统考）</div>' +
          '<p><b>是什么：</b>本科毕业后参加全国统一初试（政治/外语/数学/专业课）+ 复试，过线录取。</p>' +
          '<p><b>怎么走：</b>大三下开始系统复习，大四上初试、大四下复试；也可跨专业考研。</p>' +
          '<p><b>2026 数据：</b>报名 343 万（连续 3 年下降，峰值 474 万）；统考录取约 48 万、录取率约 14%，985 约 5%–8%。</p>' +
          '<p class="cog-grad-tip">提示：报名人数降了，但国家线不降反升、往届生占比超 55%——难度没有变低。</p></div>' +
      "</div>" +
      '<div class="cog-grad-shift"><b>2026 正在发生的变化（27 届要留意）</b>' +
        '<span>① 多校学硕停招/缩招、推免占比抬高，统考名额被「结构性压缩」；② 夏令营与招生脱钩（清华带头取消，人大/中传跟进）；③ 推免资格高校扩容 67 所（西湖大学、宁诺、港中深等入选）；④ 结论：读研越来越看「本科绩点 + 院校层次」，高中阶段就要把「能上好学校」当作重要战略。</span></div>' +
      '<div class="sd-section-title" style="margin-top:18px">大学关键概念（客观科普）</div>' +
      '<div class="cog-life-cats" id="cogLifeCats">' + LIFE_CATS.map(function (c) {
        return '<button class="cog-life-cat' + (c.k === lifeCat ? " is-active" : "") + '" data-cat="' + c.k + '" type="button">' + esc(c.t) + "</button>";
      }).join("") + "</div>" +
      '<div class="cog-details-wrap gk-fade" id="cogLifeWrap">' + concepts + "</div>" +
      '<div class="sd-section-title" style="margin-top:18px">宿舍速览<span class="cog-src-inline">网友整理，仅供参考，以学校最新通知为准</span></div>' +
      '<div class="cog-dorm-quick"><span>快速查看：</span>' + ["浙江大学", "杭州电子科技大学", "浙江工业大学", "宁波大学", "浙江师范大学", "温州医科大学"].map(function (n) {
        return '<button class="cog-dorm-chip" data-school="' + esc(n) + '">' + esc(n) + "</button>";
      }).join("") + "</div>" +
      '<div class="cog-dorm-search-box"><div class="cog-toolbar"><input class="cog-search" id="cogDormSearch" placeholder="如：浙江大学 / 南京大学…" autocomplete="off"><button class="btn btn-ghost btn-sm" id="cogDormGo">查询</button></div>' +
      '<div class="cog-dorm-hints" id="cogDormHints"></div>' +
      "</div>" +
      '<div class="cog-dorm-result" id="cogDormResult"></div>' +
      '<div class="sd-section-title" style="margin-top:18px">大学第一课 · 过来人提醒<span class="cog-src-inline">整理自公开新生指南（通用部分），仅供参考</span></div>' +
      '<div class="cog-hb-wrap">' + hb + "</div>" +
      '<div class="sd-section-title" style="margin-top:18px">入学准备清单</div><div class="cog-checklist">' + checklist.map(function (c) { return "<div>· " + esc(c) + "</div>"; }).join("") + "</div>";
    setTimeout(function () { dormQuery("南京大学"); }, 0);
  }

  function dormCandidates(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return [];
    var keys = Object.keys(DORM);
    var out = [];
    for (var i = 0; i < keys.length && out.length < 8; i++) {
      if (keys[i].toLowerCase().indexOf(q) >= 0) out.push(keys[i]);
    }
    return out;
  }
  function renderDormHints(q) {
    var el = document.getElementById("cogDormHints");
    if (!el) return;
    var cands = dormCandidates(q);
    if (!q || !cands.length) { el.innerHTML = ""; return; }
    el.innerHTML = cands.map(function (n) {
      return '<button class="cog-dorm-hit" data-school="' + esc(n) + '">' + esc(n) + "</button>";
    }).join("");
  }
  function dormQuery(q) {
    var res = document.getElementById("cogDormResult");
    if (!res) return;
    var cands = dormCandidates(q);
    var hit = q && DORM[q];
    var name = hit ? q : (cands.length ? cands[0] : "");
    res.innerHTML = name ? dormCard(name, DORM[name]) : '<div class="cog-empty">未收录该校宿舍信息（或名称不完整），试试输入完整校名。</div>';
    return name;
  }
  /* 宿舍文本 → 结构化卡片：按「；」拆字段、识别「键校区: 值」、合并同键 */
  function dormCard(name, text) {
    function normKey(k) {
      if (k.indexOf("上床下桌") >= 0 || k.indexOf("上下床") >= 0) return "床位";
      if (k.indexOf("断电") >= 0) return "断电规则";
      if (k.indexOf("限电") >= 0) return "限电功率";
      if (k.indexOf("门禁") >= 0) return "门禁时间";
      if (k.indexOf("查寝") >= 0) return "查寝频率";
      if (k.indexOf("自习") >= 0) return "自习安排";
      if (k.indexOf("晨跑") >= 0) return "晨跑";
      if (k.indexOf("独卫") >= 0) return "独卫";
      if (k.indexOf("空调") >= 0) return "空调";
      if (k.indexOf("通宵自习室") >= 0) return "通宵自习室";
      if (k.indexOf("洗衣机") >= 0) return "洗衣机";
      if (k.indexOf("地铁") >= 0) return "地铁";
      if (k.indexOf("交通") >= 0) return "交通";
      if (k.indexOf("食堂") >= 0) return "食堂";
      if (k.indexOf("市区") >= 0) return "距市区";
      return k;
    }
    var map = {}, order = [];
    (text || "").split(/[；;]/).forEach(function (s) {
      s = s.trim();
      if (!s) return;
      var ci = s.search(/[：:]/);
      if (ci <= 0) {
        var head = s.match(/^(限电|断电|门禁|查寝|自习|晨跑|独卫|空调|上床下桌|上下床|非上床下桌|通宵自习室|洗衣机|地铁|距离市区|在市区|交通|食堂)/);
        if (head) {
          var bk = normKey(head[1]);
          if (!map[bk]) { map[bk] = []; order.push(bk); }
          map[bk].push(s);
          return;
        }
        if (!map["生活要点"]) { map["生活要点"] = []; order.push("生活要点"); }
        map["生活要点"].push(s);
        return;
      }
      var k = s.slice(0, ci).trim(), v = s.slice(ci + 1).trim();
      var campus = "", key = k;
      var CAMPUS = ["紫金港", "玉泉", "海宁", "之江", "西溪", "华家池", "江湾", "张江", "闵行", "嘉定", "仙林", "鼓楼", "九龙湖", "津南", "八里台", "下沙", "仓前", "屏峰", "朝晖", "莫干山", "东湖", "滨江", "临安", "四平路", "邯郸", "大学城", "本部", "新校区", "老校区", "东区", "西区", "南区", "北区", "东校区", "西校区", "南校区", "北校区"];
      for (var i = 0; i < CAMPUS.length; i++) {
        var tag = CAMPUS[i] + "校区";
        var idx = k.indexOf(tag);
        if (idx > 0) {
          key = k.slice(0, idx);
          campus = tag;
          break;
        }
      }
      var nk = normKey(key);
      if (!map[nk]) { map[nk] = []; order.push(nk); }
      map[nk].push(campus ? campus + "：" + v : v);
    });
    var keys = order.filter(function (k) { return k !== "生活要点"; });
    var cards = keys.map(function (k) {
      return '<div class="cog-dorm-card"><div class="cog-dorm-k">' + esc(k) + "</div>" +
        map[k].map(function (v) { return '<span class="cog-dorm-v">' + esc(v) + "</span>"; }).join("") + "</div>";
    }).join("");
    var tips = (map["生活要点"] || []).map(function (v) {
      return '<span class="cog-dorm-tip">' + esc(v) + "</span>";
    }).join("");
    return '<div class="cog-dorm-box">' +
      '<div class="cog-dorm-head"><b>' + esc(name) + '</b><em>宿舍 · 校园生活（网友整理，仅供参考）</em></div>' +
      '<div class="cog-dorm-grid">' + cards + "</div>" +
      (tips ? '<div class="cog-dorm-tips">' + tips + "</div>" : "") +
      "</div>";
  }

  /* ---------- 城市探索 ---------- */
  /* 城市认知卡：是什么 → 产业 → 与大学的关系 → 就业半径（人工整理，仅供参考，2026） */
  /* 产教融合指数：来源《全国产教融合地方发展指数（2025）》蓝皮书（2025-12 深圳首发，36 座主要城市样本，截至 2024 年底） */
  var PROD_EDU = {
    "北京": "产教融合指数全国第 1",
    "上海": "产教融合指数全国第 2",
    "杭州": "产教融合指数全国第 3",
    "重庆": "产教融合指数全国第 4",
    "武汉": "产教融合指数全国第 5",
    "天津": "产教融合指数全国第 6",
    "广州": "产教融合指数全国第 7",
    "南京": "产教融合指数全国第 8",
    "西安": "产教融合指数全国第 9",
    "成都": "产教融合指数全国第 10",
    "深圳": "「产业需求对接」维度全国第 1（综合第 13）"
  };
  var CITY_INFO = {
    "杭州": { p: "浙江", tag: "数字经济之城", intro: "阿里巴巴、网易、海康威视总部所在地；「296X」先进制造业集群规划下，人工智能与视觉智能冲击双万亿级，网络通信、生物医药、智能网联汽车、集成电路九大千亿集群。", ind: "互联网/电商、人工智能、安防视觉、云计算、生物医药、集成电路、智能网联汽车。", rel: "浙大、杭电、浙工大、浙工商等与本地产业深度绑定——学计算机、电商、设计来杭州，实习机会就像在学校隔壁；具身智能等未来产业正密集落地。", grad: "省内首选，互联网岗位密集；房价与生活成本省内最高。" },
    "宁波": { p: "浙江", tag: "港口制造之城", intro: "宁波舟山港货物吞吐量全球前列，制造业与外贸基因深厚；绿色石化、汽车零部件、新材料是支柱，跨境电商与中东欧经贸特色明显。", ind: "港口物流、汽车零部件、石化、家电、外贸与跨境电商、新材料。", rel: "宁波大学、宁波诺丁汉本地就业认可度高；宁诺国际化路线与宁波外贸生态互补，温商/甬商网络对经商家庭友好。", grad: "制造业与外贸岗位多，稳定；适合恋家、想留浙江中北部的人。" },
    "温州": { p: "浙江", tag: "民营经济之城", intro: "民营经济最活跃的城市之一，温商遍布全国；电气、鞋服、泵阀等传统制造扎实，眼视光产业全国独步。", ind: "鞋服、电气、泵阀、汽摩配、眼视光（温医大全国第一）、商贸。", rel: "温州医科大学眼视光全国第一，温大、温理工服务本地产业；想学医又恋家，温州是强选项。", grad: "本地民营企业和医疗系统吸纳力强；出省认可度看具体行业。" },
    "嘉兴": { p: "浙江", tag: "红船旁的长三角接轨区", intro: "紧邻上海，承接沪上产业外溢，新能源、化工新材料、装备制造发展快；城乡均衡、生活成本低。", ind: "新能源（光伏）、化工新材料、装备制造、现代纺织、接沪产业配套。", rel: "嘉兴学院、南湖学院等本地校与沪杭通勤圈互补；「工作在上海、生活在嘉兴」成为现实选项。", grad: "生活成本低、通勤上海；适合求稳与制造业岗位。" },
    "绍兴": { p: "浙江", tag: "越文化·轻纺之城", intro: "中国轻纺城所在地，纺织印染全国知名；黄酒、医药化工、高端装备同步转型，文旅资源深厚。", ind: "轻纺印染、黄酒食品、医药化工、高端装备、文旅。", rel: "绍兴文理学院、越秀外国语学院等本地校与轻纺/外贸产业匹配；鲁迅故里带来浓厚人文氛围。", grad: "本地制造业与商贸岗位多；城市规模适中、宜居。" },
    "金华": { p: "浙江", tag: "电商物流之都", intro: "中国小商品之都（义乌）与五金之都（永康）所在地，快递物流量全国前列；跨境电商、直播电商爆发。", ind: "小商品制造、快递物流、跨境电商、直播电商、五金工具。", rel: "浙江师范大学、金华职业技术大学等；职教与电商实战结合紧密，技能型岗位机会多。", grad: "电商/物流岗位密度高；适合实战型选手与创业。" },
    "台州": { p: "浙江", tag: "制造之都", intro: "民营制造强市，模具、医药化工（头门港）、汽车零部件（吉利发源地）发达，制造业占比高。", ind: "汽车零部件、模具、医药化工、缝制设备、智能马桶等细分冠军。", rel: "台州学院等本地校服务本地制造；温台模式适合想进制造业实干的家庭。", grad: "制造业岗位扎实；城市节奏适中。" },
    "北京": { p: "北京", tag: "政治文化科技中心", intro: "全国高校资源最密集的城市（90 多所高校），清北、人大、北航、北理工所在；央企总部、金融监管、文化传媒与 AI 双高地。", ind: "互联网大厂总部、人工智能、金融监管、央企总部、文化传媒、教育、科研院所。", rel: "「在北京读书」本身就是资源：讲座、实习、校友、选调全中国密度最高；清北华五人才竞争全国最烈。", grad: "想进体制、互联网头部、文化行业的人首选；竞争与生活成本也最高。" },
    "上海": { p: "上海", tag: "国际化金融中心", intro: "中国的金融与商业中心，外企、金融、高端制造聚集地；张江科学城集中集成电路与生物医药国家级产业集群。", ind: "金融、集成电路（张江）、生物医药（张江）、汽车、外企总部、人工智能。", rel: "复旦、上交、同济与产业无缝衔接——上交密西根、复旦金融等毕业生本地消化率极高，实习生态全国顶级。", grad: "金融/外企/芯片首选；对普通家庭，生活成本高、竞争烈。" },
    "广州": { p: "广东", tag: "商贸门户", intro: "千年商都、华南门户；汽车（广汽）、快消（宝洁/欧莱雅华南）、跨境电商、生物医药并重，粤港澳大湾区一体化红利明显。", ind: "汽车、快消、跨境电商、生物医药、商贸、游戏（网易/三七互娱）。", rel: "中大、华工在华南有统治力；大湾区实习通勤圈（广州↔深圳）带来双城机会。", grad: "华南就业首选；粤语环境友好，生活成本低于北上深。" },
    "深圳": { p: "广东", tag: "硬科技之都", intro: "从「世界工厂」升级为「中国硅谷」：华为、腾讯、比亚迪、大疆总部之城，电子信息与新能源汽车产业全球领先。", ind: "电子信息、通信设备、互联网、新能源汽车、半导体设计、金融科技。", rel: "本地高校少但深大、南科大、哈工大（深圳）崛起快；企业多、实习机会全国顶尖，芯片/软件岗位密度最高。", grad: "电子信息/计算机方向最强选择之一；房价高、节奏快。" },
    "珠海": { p: "广东", tag: "南海之滨·大学城", intro: "经济特区，宜居宜业；格力、金山软件等总部，生物医药与打印耗材特色，北师大珠海、北理珠、UIC 等高校密集。", ind: "家电制造、生物医药、打印耗材、软件信息、文旅会展。", rel: "珠海高校密度高（大学城模式）；距澳门近，中外合作与国际交流机会多。", grad: "宜居+外企/制造岗位；产业规模小于广深。" },
    "东莞": { p: "广东", tag: "世界工厂升级中", intro: "制造业名城，电子信息（华为终端、OPPO/vivo）全球重要基地；近年向智能制造、新能源转型。", ind: "电子信息制造、智能装备、新能源（电池）、纺织服装。", rel: "东莞理工学院等与本地制造深度联动；制造业岗位量大，工程师文化浓厚。", grad: "制造岗位多、生活成本适中；适合想进实业的理工生。" },
    "佛山": { p: "广东", tag: "制造业大市", intro: "万亿 GDP 地级市，家电（美的、格兰仕）、陶瓷、装备制造全国闻名，制造业占比极高。", ind: "家电、陶瓷建材、装备制造、新能源（氢能）、工业设计。", rel: "佛山科学技术学院等本地校与制造产业匹配；紧邻广州，通勤实习方便。", grad: "制造业岗位扎实、房价友好；「实业感」强。" },
    "南京": { p: "江苏", tag: "科教文脉之城", intro: "六朝古都，大学密度全国前列；软件业务收入破万亿（全国第五座软件名城），智能电网产业超 5000 亿。", ind: "软件与信息服务（万亿级）、智能电网、生物医药、电子信息、汽车、军工。", rel: "南大/东南校友网覆盖长三角；紫金山实验室等科研载体密集，工科与软件方向实习资源优。", grad: "长三角通勤圈（南京→上海/杭州/苏州近）；性价比高的读书城市。" },
    "苏州": { p: "江苏", tag: "制造业隐形冠军", intro: "GDP 长期全国前十的普通地级市；电子信息、高端装备、先进材料三个万亿级产业集群，工业园区外资密集。", ind: "电子信息、高端装备、先进材料、生物医药、纳米材料、外企制造基地。", rel: "本地高校少（苏大强），但紧邻上海；「实习去上海、就业留苏州」是经典规划，工业园区工程师岗位多。", grad: "制造业工程师岗位多、生活舒适；适合求稳的理工生。" },
    "无锡": { p: "江苏", tag: "太湖明珠·物联网之都", intro: "集成电路（华虹/海力士）、物联网、生物医药三大产业并重，制造业含金量高；生活宜居。", ind: "集成电路、物联网、生物医药、新能源（光伏）、纺织服装。", rel: "江南大学（食品/设计全国强）、无锡学院等；物联网与芯片岗位密度在长三角前列。", grad: "芯片/物联网方向的好去处；城市小、生活舒服。" },
    "常州": { p: "江苏", tag: "新能源之都", intro: "新能源产业（理想汽车、中创新航）已迈过万亿门槛，「新能源之都」名片响亮；智能制造基础扎实。", ind: "新能源（整车/电池）、智能制造、轨道交通、光伏。", rel: "常州大学、江苏理工等本地校与新能源产业对接；产业新城招工需求旺盛。", grad: "新能源方向就业红利期；城市节奏适中。" },
    "武汉": { p: "湖北", tag: "九省通衢科教重镇", intro: "全国大学生人数最多城市之一；「中国光谷」光电子信息产业规模超 6600 亿（1.6 万家企业），全球约 25% 光纤光缆产自光谷。", ind: "光电子信息、生物医药、汽车、北斗、存储芯片（长江存储）、钢铁。", rel: "武大、华科双强，本地产业与高校互动强；「读在武汉、就业全国」的性价比路线，芯片/光通信岗位崛起。", grad: "中部首选；光电子/生医方向机会多，生活成本低。" },
    "长沙": { p: "湖南", tag: "工程机械与文娱之城", intro: "三一、中联、铁建重工等工程机械巨头家乡（全球市场份额 9.5%），芒果台文娱产业全国闻名；工程机械、新材料、汽车占工业总产值约 50%。", ind: "工程机械、新材料、汽车、文化传媒（芒果）、音视频装备、金融。", rel: "中南大学、湖大工科强；「造机械」和「做内容」两条路都有本地出口，房价友好。", grad: "本地产业强但总量有限；生活成本低、幸福度高。" },
    "合肥": { p: "安徽", tag: "风投之城·科创黑马", intro: "从「小县城」逆袭为「科创之城」：中科大坐镇，京东方、蔚来、长鑫存储落地；「芯屏汽合」四大主导产业。", ind: "显示面板（全国首位）、存储芯片（长鑫）、新能源汽车、人工智能、量子科技。", rel: "中科大校友与科研生态带动整座城市；合工大、安大等本地消化，半导体/显示岗位增长快。", grad: "半导体/显示/新能源方向岗位多；城市发展势头强、房价温和。" },
    "郑州": { p: "河南", tag: "中原枢纽", intro: "国家中心城市，交通枢纽与人口大省省会；装备制造、食品加工（双汇/三全）、跨境电商（中欧班列）特色。", ind: "装备制造、食品加工、跨境电商、电子信息（富士康链）、物流。", rel: "郑州大学是省内独一档；本地产业吸纳力强，但高端岗位密度低于东部。", grad: "河南就业首选；城市大、产业全、生活成本低。" },
    "西安": { p: "陕西", tag: "硬科技军工城", intro: "西部科教第三极（西交、西工大、西电），军工与硬科技基地；三星西安工厂带动半导体产业。", ind: "航空航天、军工、半导体（三星）、电子信息、装备制造、文旅。", rel: "西工大、西电在军工/电子领域全国闻名；涉密岗位多、稳定性强，军民融合带来机会。", grad: "军工/半导体方向强；一般行业岗位密度低于东部。" },
    "成都": { p: "四川", tag: "西南安逸科创城", intro: "西南经济与科教中心；电子信息、装备制造两个万亿级集群，数字文创产业规模突破 4100 亿（全国第一方阵）。", ind: "电子信息、装备制造、数字文创（游戏/动漫）、集成电路、航空、消费。", rel: "川大、电子科大在西南有统治力；游戏/文创岗位是特色（腾讯天美、数字文创园区），生活安逸。", grad: "西南首选；生活成本低，适合想平衡工作与生活的人。" },
    "重庆": { p: "重庆", tag: "山城智造基地", intro: "西部工业重镇，汽车（长安）与笔电代工双轮驱动，智能制造与材料产业升级中。", ind: "汽车、笔电代工、装备制造、材料、数字经济、火锅食品。", rel: "重大、西南大学本地认可度高；制造业岗位量大，职教与产业结合紧密。", grad: "本地制造业吸纳强；出省认可度集中在工科。" },
    "天津": { p: "天津", tag: "北方港口工业城", intro: "北方重要的工业与港口城市，石化、装备制造、生物医药并重；与北京构成一小时圈。", ind: "石化、汽车、装备制造、生物医药、港口物流、集成电路。", rel: "南开、天大所在；「在北京实习、在天津读书」是经典省钱组合，京津冀圈内通勤。", grad: "京津冀圈内通勤；高考性价比城市之一。" },
    "青岛": { p: "山东", tag: "海滨制造名城", intro: "海尔、海信、青啤家乡，海洋科技特色（中国海洋大学），中车四方轨道装备全国领先。", ind: "家电、海洋科技、轨道交通、啤酒食品、港口航运。", rel: "中国海洋大学、青岛大学本地认可度高；海洋科学与家电制造岗位稳定。", grad: "山东就业首选之一；宜居、节奏适中。" },
    "济南": { p: "山东", tag: "泉城·软件名城", intro: "山东省会，软件信息产业（浪潮）与装备制造并重；新旧动能转换起步区带来增量。", ind: "软件信息、装备制造、生物医药、大数据（浪潮）、轨道交通。", rel: "山东大学、山东师大等本地认可度高；省属国企与事业单位岗位多。", grad: "山东体制内就业友好；生活成本低于沿海城市。" },
    "厦门": { p: "福建", tag: "海上花园·外企窗口", intro: "经济特区宜居城市；外贸、金融（两岸金融中心）、软件信息与旅游会展并重。", ind: "外贸、金融、软件信息、旅游会展、生物医药。", rel: "厦大是福建独一档；厦门理工等本地校与产业配套，台资/外企岗位多。", grad: "宜居+外贸岗位多；制造业机会少于长三角/珠三角。" },
    "福州": { p: "福建", tag: "闽都数字之城", intro: "福建省会，数字经济（网龙等）与纺织服装并重，福耀玻璃等民企总部。", ind: "数字经济、纺织服装、汽车玻璃、化工新材料、港口。", rel: "福大是省内工科龙头；本地产业吸纳力稳定，离台湾近、闽商网络强。", grad: "福建本地就业友好；出省认可度一般。" },
    "哈尔滨": { p: "黑龙江", tag: "老工业基地·军工重镇", intro: "哈工大、哈工程所在地，共和国工业长子；航空航天、焊接、机器人领域全国领先。", ind: "航空航天、机器人、核电装备、重型装备、乳业（飞鹤）。", rel: "哈工大全国闻名——「在哈尔滨读书，去全国就业」是常见路线；本地产业总量有限。", grad: "军工/航天系统就业全国通；一般行业建议往外走。" },
    "沈阳": { p: "辽宁", tag: "共和国装备部", intro: "东北装备制造中心，机床、航空、机器人产业基础雄厚；沈阳飞机工业等军工企业。", ind: "装备制造、航空航天、机器人、汽车、生物医药。", rel: "东北大学、辽宁大学本地认可度高；军工与装备岗位稳定，但总量有限。", grad: "东北就业首选；军工/制造岗位稳定，新兴产业机会少。" },
    "大连": { p: "辽宁", tag: "北方明珠·软件外包", intro: "东北最宜居城市之一；软件外包（对日）曾是名片，现向智能制造、船舶海工转型。", ind: "软件外包、船舶海工、装备制造、石化、文旅。", rel: "大连理工是东北工科重镇；软件园生态仍在，日企岗位多。", grad: "软件/海工岗位有特色；新兴产业规模小于南方。" },
    "长春": { p: "吉林", tag: "汽车城·电影城", intro: "一汽总部所在地，汽车产业支柱（红旗/解放）；长影与文旅记忆。", ind: "汽车整车与零部件、轨道客车（长客）、影视文旅、农产品加工。", rel: "吉林大学是东北综合最强；本地就业高度依赖一汽生态。", grad: "汽车产业链岗位稳定；适合想进车企的工科生。" },
    "石家庄": { p: "河北", tag: "京津冀南部门户", intro: "河北政治经济中心，医药（石药、以岭）与装备制造并重，承接京津产业转移。", ind: "医药、装备制造、纺织、商贸、京津冀配套。", rel: "河北医大（临床强）、河北师大等本地认可度高；距离北京近。", grad: "医疗/医药方向在省内就业友好；高端岗位看京津。" },
    "太原": { p: "山西", tag: "转型中的能源省会", intro: "煤炭经济转型中，装备制造、新材料、信创产业在培育；太原重工等重工业基础。", ind: "能源化工、装备制造（太重）、新材料、信创、文旅。", rel: "山西大学、太原理工是省内双雄；产业转型期就业市场在重构。", grad: "本地就业与能源/制造绑定；想进东部需往外走。" },
    "南昌": { p: "江西", tag: "红色省会·VR之都", intro: "江西政治经济中心，电子信息（南昌 VR 产业基地）、航空制造（C919 部件）特色。", ind: "电子信息、VR/AR、航空制造、中医药（江中药谷）、光伏。", rel: "南昌大学是省内独一档；航空与 VR 产业带来特色岗位。", grad: "省内就业首选；特色产业岗位有增量。" },
    "昆明": { p: "云南", tag: "春城·面向南亚", intro: "四季如春，旅游与生物医药（疫苗、植物药）并重；面向南亚东南亚的开放门户。", ind: "旅游、生物医药（疫苗）、烟草、花卉、跨境贸易。", rel: "云南大学、昆明理工本地认可度高；生物与旅游岗位有特色。", grad: "宜居、节奏慢；产业规模有限，适合求稳。" },
    "贵阳": { p: "贵州", tag: "大数据之都", intro: "大数据产业全国名片（中国数谷），华为/苹果数据中心落地；生态旅游与酱酒产业强劲。", ind: "大数据/数据中心、白酒（茅台）、生态旅游、磷化工。", rel: "贵州大学本地龙头；大数据岗位有特色但总量有限。", grad: "大数据/酒业岗位有特色；一般行业机会少于东部。" },
    "兰州": { p: "甘肃", tag: "黄河穿城的西北枢纽", intro: "西北交通枢纽，重化工与新材料（镍钴）基础，兰州大学是西北文理重镇。", ind: "石油化工、有色冶金、新材料、生物制药（佛慈）、西北物流。", rel: "兰州大学全国有名——「在兰州读书，去全国就业」常见；本地产业传统。", grad: "西部就业友好；建议把兰大当跳板。" },
    "南宁": { p: "广西", tag: "面向东盟的门户", intro: "广西首府，面向东盟的开放前沿（东博会）；铝加工、食品与跨境贸易。", ind: "铝业、食品加工、跨境贸易、电子信息、文旅。", rel: "广西大学本地龙头；东盟经贸岗位有特色。", grad: "本地就业为主；面向东盟的外贸岗位有增量。" },
    "海口": { p: "海南", tag: "自贸港省会", intro: "海南自贸港核心城市，免税购物、旅游康养、南繁种业（三亚）特色；政策红利期。", ind: "免税零售、旅游康养、热带农业（南繁）、海洋经济、数字经济。", rel: "海南大学是省内独一档；自贸港政策带来新兴岗位，但总量有限。", grad: "适合向往温暖气候与政策红利的人；产业成熟度尚低。" },
    "乌鲁木齐": { p: "新疆", tag: "亚欧大陆桥枢纽", intro: "新疆首府，面向中亚的开放枢纽；能源化工、棉花纺织与文旅（天山）特色。", ind: "能源化工、纺织、商贸物流、文旅、跨境贸易。", rel: "新疆大学、石河子大学本地龙头；定向/基层岗位机会多。", grad: "本地就业为主；能源与跨境贸易岗位有特色。" },
    "湖州": { p: "浙江", tag: "绿水青山·长三角后花园", intro: "「两山」理念发源地，绿色家居（木业）、新能源汽车配套（电池）、童装（织里）与乡村旅游特色鲜明。", ind: "绿色家居、新能源电池、童装、装备制造、乡村旅游。", rel: "湖州师范、湖州学院本地认可度适中，紧邻杭州/上海通勤圈；适合求稳、恋家。", grad: "生活成本低、环境好；制造业与文旅岗位为主。" },
    "衢州": { p: "浙江", tag: "四省通衢·生态之城", intro: "浙江西部生态屏障，化工新材料（巨化）、特种纸与生态旅游并重，四省边际中心城市。", ind: "化工新材料、特种纸、生态旅游、数字经济发展飞地。", rel: "衢州学院等本地校规模小；人才政策补贴力度大。", grad: "本地岗位以产业园区为主；想留浙西的人适合。" },
    "丽水": { p: "浙江", tag: "浙江绿谷", intro: "森林覆盖率全省第一，生态工业（合成革、竹木）与农文旅（山耕品牌）特色，青田华侨经济。", ind: "生态工业、农文旅、跨境电商（青田侨贸）、竹木制品。", rel: "丽水学院本地校；公务员/事业编竞争相对温和。", grad: "生态环境极佳、节奏慢；产业体量小。" },
    "舟山": { p: "浙江", tag: "群岛之城·海洋经济", intro: "中国最大群岛城市，舟山港大宗商品吞吐量全球领先，海洋渔业、临港石化与船舶修造核心。", ind: "港口航运、临港石化（绿色石化基地）、船舶修造、海洋渔业、海洋旅游。", rel: "浙江海洋大学（水产全国前列）、浙大舟山校区；海洋类岗位有特色。", grad: "海洋/港口/石化岗位为主；适合相关专业。" },
    "徐州": { p: "江苏", tag: "淮海经济区中心", intro: "江苏北部门户，工程机械（徐工全球前列）、光伏（协鑫）与医疗资源（淮海经济区医疗中心）突出。", ind: "工程机械、光伏新能源、医疗健康、装备制造、物流。", rel: "中国矿业大学（能源特色）、徐州医科大（麻醉全国闻名）；淮海区域就业中心。", grad: "医疗/机械/能源岗位多；生活成本低。" },
    "南通": { p: "江苏", tag: "江海交汇·建筑之乡", intro: "近代第一城，建筑产业全国闻名，船舶海工与家纺（叠石桥）特色，上海一小时圈。", ind: "船舶海工、建筑、家纺、电子信息（通富微电）、港口。", rel: "南通大学等本地校；「建筑之乡」工程类岗位多，通勤上海方便。", grad: "建筑/海工岗位多；适合工程类。" },
    "扬州": { p: "江苏", tag: "运河之都·精致生活", intro: "世界运河之都，光伏（晶澳）、汽车零部件（仪征）与文旅并重，生活节奏舒适。", ind: "光伏新能源、汽车零部件、高端装备、文旅、食品。", rel: "扬州大学（兽医/农学全国有名）；城市精致宜居。", grad: "宜居、产业中等；适合求稳。" },
    "镇江": { p: "江苏", tag: "醋都·生态山水", intro: "香醋之都，高端装备、新材料与航空航天配套（C919 部件）特色，紧邻南京。", ind: "香醋食品、高端装备、新材料、航空航天配套、文旅。", rel: "江苏大学（农机/车辆全国有名）、江苏科技大学（船舶）；通勤南京方便。", grad: "装备制造岗位为主；生活成本低。" },
    "盐城": { p: "江苏", tag: "沿海新能源之城", intro: "沿海湿地之城，海上风电与光伏产业全国领先，汽车（起亚/华人运通）与新能源电池布局。", ind: "海上风电、光伏、新能源汽车、电池（SK/比亚迪）、生态旅游。", rel: "盐城工学院等本地校；新能源产业带来大量工程师岗位。", grad: "新能源方向岗位增量大；城市生活成本低。" },
    "泉州": { p: "福建", tag: "民营经济强市", intro: "GDP 全省第一的地级市，民营经济发达（安踏/恒安/九牧王），纺织鞋服与石油化工双支柱。", ind: "纺织鞋服、石油化工、机械装备、食品饮料、建材。", rel: "华侨大学（华文/材料）、泉州师院；民营岗位多、经商氛围浓。", grad: "民企岗位多、经商氛围浓；适合务实型。" },
    "烟台": { p: "山东", tag: "仙境海岸·工业强市", intro: "GDP 山东前列，葡萄酒（张裕）、核电装备、汽车（上汽通用东岳）与生物医药（绿叶）并重。", ind: "葡萄酒食品、核电装备、汽车、生物医药、海洋渔业。", rel: "烟台大学、鲁东大学本地认可度高；临海宜居。", grad: "制造业岗位扎实、宜居；适合求稳理工生。" },
    "威海": { p: "山东", tag: "最干净的海滨城市", intro: "以「最干净城市」闻名，医疗器械（威高）与渔具（全球最大生产基地）特色，对韩贸易传统。", ind: "医疗器械、渔具、海洋食品、电子信息、对韩贸易。", rel: "山东大学威海校区、哈工大威海（计算机强）；双 985 分校性价比高。", grad: "宜居、节奏慢；医疗器械岗位有特色。" },
    "保定": { p: "河北", tag: "京畿门户·长城汽车", intro: "雄安新区旁，长城汽车总部所在地，汽车与新能源（电池/氢能）产业强劲，京津冀一体化受益。", ind: "汽车整车与零部件、新能源电池、氢能、电力装备、京津冀配套。", rel: "河北大学、华北电力（保定校区，电力行业黄埔）；进京方便。", grad: "电力/汽车岗位多；「华电保定」是进电网的重要跳板。" },
    "芜湖": { p: "安徽", tag: "皖江明珠·奇瑞之城", intro: "奇瑞汽车总部、三只松鼠发源地；机器人产业集聚（埃夫特），安徽第二城。", ind: "汽车、机器人、家电（美的芜湖）、电商食品、材料。", rel: "安徽师范大学、安徽工程大学本地认可度高；产业与职教结合好。", grad: "汽车/机器人岗位增量大；生活成本低。" },
    "赣州": { p: "江西", tag: "稀土王国·湾区后花园", intro: "世界稀土之都（南方稀土集团），家具（南康）与赣深高铁融入大湾区 2 小时圈。", ind: "稀土新材料、家具、电子信息（承接大湾区转移）、脐橙农业。", rel: "江西理工（稀土/冶金全国有名）、赣南师大；大湾区产业转移带来岗位。", grad: "稀土/材料岗位特色强；距大湾区近。" },
    "九江": { p: "江西", tag: "江西北大门·江湖交汇", intro: "长江与鄱阳湖交汇处，石化（九江石化）、纺织与港口物流并重，庐山文旅名片。", ind: "石油化工、纺织服装、港口物流、文旅（庐山）、新材料。", rel: "九江学院等本地校；区位是最大优势。", grad: "本地岗位以产业园区为主；环境好。" },
    "柳州": { p: "广西", tag: "工业重镇·螺蛳粉之都", intro: "广西工业第一城，五菱（新能源 mini 销量神话）、柳工（装载机）与螺蛳粉百亿产业。", ind: "汽车（五菱）、工程机械（柳工）、钢铁、螺蛳粉食品、新能源。", rel: "广西科技大学等本地校与五菱/柳工深度绑定；制造业岗位扎实。", grad: "汽车/机械岗位多、生活成本低；螺蛳粉产业是特色增量。" },
    "桂林": { p: "广西", tag: "山水甲天下·文旅之都", intro: "世界级山水旅游城市，文旅康养为核心，电子信息（华为桂林）与生物医药布局。", ind: "文旅康养、电子信息、生物医药、食品、会展。", rel: "广西师范大学（文理强）、桂林电子科大（电子信息全国有名）；旅居体验好。", grad: "文旅/电子岗位为主；适合喜欢山水的人。" },
    "宜昌": { p: "湖北", tag: "三峡门户·水电之都", intro: "三峡工程所在地，水电（葛洲坝/三峡）、磷化工与生物医药（人福）并重，宜昌蜜橘。", ind: "水电能源、磷化工、生物医药、装备制造、文旅（三峡）。", rel: "三峡大学（水利水电全国有名）；电力系统就业对口。", grad: "水电/电力岗位特色强；城市宜居。" },
    "株洲": { p: "湖南", tag: "中国动力之都", intro: "中车株机（高铁/地铁车辆全球领先）所在地，航空发动机（中国航发株洲）与硬质合金全国名片。", ind: "轨道交通装备、航空发动机、硬质合金、新材料、新能源汽车。", rel: "湖南工业大学（包装设计全国有名）；轨道交通产业岗位多。", grad: "轨道交通/材料岗位特色强；离长沙近。" },
    "绵阳": { p: "四川", tag: "中国科技城", intro: "中国唯一科技城，中国工程物理研究院（两弹一星）所在地，电子信息（长虹/九洲）与军民融合。", ind: "电子信息、军民融合、核技术、装备制造、新材料。", rel: "西南科技大学等本地校；军工科研岗位稳定。", grad: "军工/电子岗位稳定；城市安静宜居。" },
    "三亚": { p: "海南", tag: "热带滨海度假之都", intro: "海南自贸港旅游核心，免税购物、高端酒店与会展经济，南繁育种（种业硅谷）总部。", ind: "旅游康养、免税零售、南繁育种、海洋经济、会展。", rel: "海南热带海洋学院、三亚学院（民办）；生活节奏慢。", grad: "旅游/免税岗位多；适合向往热带生活的人。" },
  };
  var PROV_CACHE = {};
  function provinceOf(city) {
    if (PROV_CACHE[city]) return PROV_CACHE[city];
    var prov = (CITY_INFO[city] && CITY_INFO[city].p) || "";
    if (!prov) {
      var LIB = window.GK.data.LIBRARY || [];
      var L = window.GK.data.L;
      for (var i = 0; i < LIB.length; i++) {
        if (LIB[i][L.CITY] === city && LIB[i][L.PROV]) { prov = LIB[i][L.PROV]; break; }
      }
    }
    PROV_CACHE[city] = prov || "其他";
    return PROV_CACHE[city];
  }
  /* 未收录城市 → 数据驱动的动态简介，保证每个城市都有内容 */
  var CITY_CACHE = {};
  function cityInfoOf(city) {
    if (CITY_CACHE[city]) return CITY_CACHE[city];
    var base = CITY_INFO[city] || null;
    var LIB = window.GK.data.LIBRARY || [];
    var L = window.GK.data.L;
    var schools = {}, schoolMin = {}, total = 0, best = null, ind = {}, level = { "985": 0, "211": 0, "双一流": 0 };
    var IND_MAP = [
      { k: "数字经济/互联网", kw: ["计算机", "人工智能", "软件", "数据科学", "物联网", "信息安全", "电子商务", "大数据", "区块链"] },
      { k: "集成电路/通信", kw: ["电子信息", "微电子", "集成电路", "通信", "光电"] },
      { k: "电力能源", kw: ["电气", "能源", "电力", "智能电网", "储能"] },
      { k: "装备制造", kw: ["机械", "自动化", "机器人", "智能制造", "机电", "车辆"] },
      { k: "航空航天/军工", kw: ["航空", "飞行器", "武器", "航天", "探测"] },
      { k: "医疗健康", kw: ["临床", "医学", "药学", "护理", "口腔", "中医", "预防", "康复"] },
      { k: "金融商贸", kw: ["金融", "经济", "会计", "财务", "国际经贸", "税收", "财政", "审计"] },
      { k: "教育", kw: ["师范", "教育", "学前", "小学教育"] },
      { k: "法律/公共服务", kw: ["法学", "政治", "社会", "公安", "侦查", "司法"] },
      { k: "文创设计", kw: ["设计", "艺术", "音乐", "新闻", "传播", "数字媒体", "动画"] },
      { k: "材料/化工", kw: ["化学", "化工", "材料", "高分子"] },
      { k: "生物/农业/食品", kw: ["生物", "食品", "农学", "动物医学", "植物"] },
      { k: "土木/基建", kw: ["土木", "建筑", "城乡规划", "工程管理"] }
    ];
    LIB.forEach(function (r) {
      if (r[L.CITY] !== city) return;
      total++;
      var n = r[L.NAME];
      if (!schools[n]) {
        schools[n] = 0;
        var lv = lvlOf(n);
        if (lv.indexOf("985") >= 0) level["985"]++;
        if (lv.indexOf("211") >= 0) level["211"]++;
        if (lv.indexOf("双一流") >= 0) level["双一流"]++;
      }
      schools[n]++;
      var rk = r[L.RK25] || null;
      if (rk) {
        if (!schoolMin[n] || rk < schoolMin[n]) schoolMin[n] = rk;
        if (!best || rk < best) best = rk;
      }
      var mn = r[L.MN] || "";
      for (var ii = 0; ii < IND_MAP.length; ii++) {
        var hit = false;
        for (var jj = 0; jj < IND_MAP[ii].kw.length; jj++) {
          if (mn.indexOf(IND_MAP[ii].kw[jj]) >= 0) { hit = true; break; }
        }
        if (hit) ind[IND_MAP[ii].k] = (ind[IND_MAP[ii].k] || 0) + 1;
      }
    });
    var names = Object.keys(schools).sort(function (a, b) { return schools[b] - schools[a]; });
    var top = names.slice(0, 3).join("、");
    var inds = Object.keys(ind).sort(function (a, b) { return ind[b] - ind[a]; }).slice(0, 3);
    var topSchools = names.slice(0, 4).map(function (n) {
      var m = META[n] || {};
      return {
        name: n,
        tags: lvlOf(n),
        tuimian: tuimianOf(n),
        ac: aCount(n),
        feat: FEATURED[n] || "",
        rank: schoolMin[n] || null,
        city: m.city || ""
      };
    });
    var result = base ? {
      p: base.p,
      tag: base.tag,
      intro: base.intro + "（数据画像：" + names.length + " 所院校 / " + total + " 个志愿" +
        (level["985"] ? "，985×" + level["985"] : "") +
        (level["211"] ? "，211×" + level["211"] : "") +
        (best ? "，最优位次约 " + best : "") + "）",
      ind: base.ind + (inds.length ? "；按专业结构推断产业侧重：" + inds.join("、") : ""),
      rel: base.rel + (top ? "；本地代表院校：" + top : ""),
      grad: base.grad
    } : {
      p: provinceOf(city),
      tag: "招生城市 · 自动画像",
      intro: "2026 年浙江考生可报城市：共有 " + names.length + " 所院校在本市投放 " + total + " 个志愿" +
        (level["985"] ? "，其中 985 院校 " + level["985"] + " 所" : "") +
        (level["211"] ? "、211 院校 " + level["211"] + " 所" : "") +
        (level["双一流"] ? "、双一流 " + level["双一流"] + " 所" : "") + "。" +
        (best ? "浙江考生进入本市院校的近年最低位次约 " + best + "（位次号越小越难考）。" : ""),
      ind: inds.length ? inds.map(function (k) { return k + "（" + ind[k] + " 个专业类）"; }).join("、") : "产业画像暂未人工收录，可点开下方院校介绍，从其王牌专业推断本地产业侧重。",
      rel: "代表院校：" + (top || "—") + "——在城市读书的实习机会与就业半径，主要取决于院校层次与本地产业密度，建议结合院校详情与决策框架综合判断。",
      grad: "就业半径：建议优先看代表院校的层次与王牌专业（下方可点开）；城市能级越高，实习与信息密度通常越好。"
    };
    result.topSchools = topSchools;
    result.nSchools = names.length;
    result.total = total;
    result.best = best;
    CITY_CACHE[city] = result;
    return result;
  }
  function cityData() {
    var LIB = window.GK.data.LIBRARY || [];
    var L = window.GK.data.L;
    var map = {};
    LIB.forEach(function (r) {
      var c = r[L.CITY];
      if (!c) return;
      if (!map[c]) map[c] = { schools: {}, count: 0, minRank: 1e9 };
      var o = map[c];
      o.count++;
      var sc = r[1], rk = r[L.RANK26] || r[L.RANK25];
      if (rk) o.minRank = Math.min(o.minRank, rk);
      o.schools[sc] = (o.schools[sc] || 0) + 1;
    });
    var arr = Object.keys(map).map(function (c) {
      var o = map[c];
      return { city: c, count: o.count, nSchools: Object.keys(o.schools).length, minRank: o.minRank === 1e9 ? null : o.minRank };
    }).sort(function (a, b) { return b.count - a.count; });
    return { arr: arr, map: map };
  }
  var cityProvs = {};
  function renderCity() {
    var body = document.getElementById("cogBody");
    try {
      renderCityInner(body);
    } catch (err) {
      if (window.console) console.error("城市板块渲染出错：", err);
      citySel = null;
      body.innerHTML = '<div class="cog-empty">城市数据加载失败（' + esc(err && err.message ? err.message : "未知错误") + "），已返回城市列表。</div>";
    }
  }
  function renderCityInner(body) {
    if (citySel) return renderCityDetail(body);
    var d = cityData();
    var provs = {};
    d.arr.forEach(function (c) { provs[provinceOf(c.city)] = 1; });
    var hasSel = Object.keys(cityProvs).length > 0;
    var provKeys = Object.keys(provs).sort(function (a, b) {
      if (a === "其他") return 1;
      if (b === "其他") return -1;
      return a.localeCompare(b);
    });
    var chips = '<button class="cog-chip' + (!hasSel ? " is-on" : "") + '" data-cprov="">全部</button>' +
      provKeys.map(function (p) {
        return '<button class="cog-chip' + (cityProvs[p] ? " is-on" : "") + '" data-cprov="' + esc(p) + '">' + esc(p) + "</button>";
      }).join("");
    var list = d.arr.filter(function (c) { return !hasSel || cityProvs[provinceOf(c.city)]; });
    var cards = list.map(function (c) {
      var info = CITY_INFO[c.city];
      var tag = info ? info.tag : "招生城市 · 数据画像";
      return '<div class="cog-city-card" data-city="' + esc(c.city) + '">' +
        '<div class="cog-city-cover" style="background:' + cityCover(c.city) + '">' +
          '<span class="ccc-name">' + esc(c.city.slice(0, 2)) + "</span>" +
          '<span class="ccc-prov">' + esc(provinceOf(c.city)) + "</span>" +
          '<span class="ccc-arrow" data-icon="next"></span>' +
        "</div>" +
        '<div class="cog-city-info">' +
          '<div class="cci-tag">' + esc(tag) + "</div>" +
          '<div class="cci-stats"><span>' + c.nSchools + " 所院校</span><span>" + c.count + " 个志愿</span>" + (c.minRank ? "<span>最优位次 " + c.minRank + "</span>" : "") + "</div>" +
        "</div></div>";
    }).join("");
    var total = d.arr.reduce(function (s, c) { return s + c.count; }, 0);
    body.innerHTML =
      '<div class="cog-city-headbar"><div><b>城市探索</b><span>' + d.arr.length + " 座城市 · 覆盖 " + total + " 个志愿</span></div></div>" +
      '<div class="cog-chips cog-city-chips">' + chips + "</div>" +
      '<div class="cog-city-grid">' + (cards || '<div class="cog-empty">该省份暂无可展示城市。</div>') + "</div>";
    if (window.GKIcon) window.GKIcon.mount(body);
  }
  function renderCityDetail(body) {
    var d = cityData();
    var o = d.map[citySel];
    if (!o) { citySel = null; renderCityInner(body); return; }
    var info = cityInfoOf(citySel);
    var schools = Object.keys(o.schools).map(function (code) {
      var rows = window.GK.data.LIBRARY.filter(function (r) { return r[window.GK.data.L.CODE] === code; });
      var name = rows.length ? rows[0][window.GK.data.L.NAME] : code;
      var si = window.GK.data.schoolIndex[code] || null;
      var ranks = rows.map(function (r) { return r[window.GK.data.L.S25]; }).filter(Boolean);
      var mn = ranks.length ? Math.min.apply(null, ranks) : (si && si.minRank) || null;
      var majors = [];
      rows.forEach(function (r) {
        var mn2 = r[window.GK.data.L.MN];
        if (mn2 && majors.indexOf(mn2) < 0) majors.push(mn2);
      });
      var meta = META[name] || {};
      var intro = window.GK.data.schoolIntro(name) || null;
      var introText = intro && intro.content ? intro.content : ((JIANGHU[name] && JIANGHU[name].jianghu) || FEATURED[name] || "");
      var tags = [];
      try { tags = window.GK.data.tagsOfSchool(code, name) || []; } catch (err) { tags = []; }
      return { name: name, n: o.schools[code], minRank: mn, rk: meta.rk || meta.rank || null, majors: majors.slice(0, 3), intro: introText, tags: tags };
    }).sort(function (a, b) { return (a.minRank || 1e9) - (b.minRank || 1e9); }).slice(0, 40);
    var cards = schools.map(function (s) {
      return '<div class="cog-city-school" data-school="' + esc(s.name) + '"><div class="ccs-head"><b>' + esc(s.name) + "</b><span class='cog-badge'>" + s.n + " 个志愿</span></div>" +
        '<div class="ccs-meta"><span>' + (s.rk ? "软科 2026 #" + s.rk : (s.tags && s.tags.length ? esc(s.tags.slice(0, 2).join(" · ")) : "院校层次待补")) + "</span><span>" + (s.minRank ? "最低位次约 " + s.minRank : "位次数据待补") + "</span></div>" +
        (s.intro ? '<div class="ccs-intro">' + esc(s.intro.length > 56 ? s.intro.slice(0, 56) + "…" : s.intro) + "</div>" : "") +
        (s.majors.length ? '<div class="ccs-majors">' + s.majors.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div>" : "") +
        '<div class="ccs-actions"><em>查看学校 ›</em><button class="btn btn-ghost btn-sm cog-school-explore" data-school="' + esc(s.name) + '">详细认知</button></div></div>';
    }).join("");
    var pe = PROD_EDU[citySel];
    var peHtml = pe ? '<div class="cog-city-pe">产教融合 · ' + esc(pe) + "<span>《全国产教融合地方发展指数（2025）》蓝皮书</span></div>" : "";
    var topSchoolsHtml = (info && info.topSchools && info.topSchools.length)
      ? '<div class="cog-city-top">' + info.topSchools.map(function (s) {
          return '<button class="cog-city-top-school" data-school="' + esc(s.name) + '"><b>' + esc(s.name) + "</b>" +
            (s.tags && s.tags.length ? '<span class="cog-badge">' + esc(s.tags[0]) + "</span>" : "") +
            '<em>' + (s.tuimian ? "推免 " + esc(s.tuimian) + "%" : "") + (s.ac ? " · A类 " + s.ac : "") + (s.rank ? " · 位次约" + s.rank : "") + "</em></button>";
        }).join("") + "</div>" : "";
    var stats = '<div class="cog-city-stats">' +
      '<div class="ccs-stat"><b>' + o.count + "</b><span>招生志愿</span></div>" +
      '<div class="ccs-stat"><b>' + Object.keys(o.schools).length + "</b><span>院校数</span></div>" +
      '<div class="ccs-stat"><b>' + (info.best ? "约" + info.best : "—") + "</b><span>近年最低位次</span></div>" +
      '<div class="ccs-stat"><b>' + (info.nSchools || "—") + "</b><span>覆盖院校</span></div>" +
      "</div>";
    var blocks = [
      { ic: "🏙️", t: "这座城市是什么", txt: info.intro },
      { ic: "🏭", t: "产业构成", txt: info.ind },
      { ic: "🎓", t: "城市与大学的关系", txt: info.rel, extra: topSchoolsHtml },
      { ic: "🧭", t: "就业半径", txt: info.grad, tip: true }
    ].map(function (b) {
      return '<div class="cog-city-block' + (b.tip ? " is-tip" : "") + '"><div class="ccb-head"><span>' + b.ic + "</span>" + b.t + "</div><p>" + esc(b.txt) + "</p>" + (b.extra || "") + "</div>";
    }).join("");
    body.innerHTML =
      '<div class="cog-toolbar"><button class="btn btn-ghost btn-sm" id="cogCityBack"><span data-icon="back"></span>返回城市列表</button></div>' +
      '<div class="cog-city-hero" style="background:' + cityCover(citySel) + '">' +
        '<div class="cch-main"><span class="cch-name">' + esc(citySel) + "</span><em>" + esc(info.tag) + "</em></div>" +
        '<div class="cch-prov">' + esc(provinceOf(citySel)) + "</div>" +
      "</div>" +
      peHtml +
      stats +
      blocks +
      '<div class="sd-section-title" style="margin-top:18px">在 ' + esc(citySel) + " 招生的院校</div>" +
      '<div class="cog-city-school-grid">' + cards + "</div>";
    if (window.GKIcon) window.GKIcon.mount(body);
  }
  function cityCover(city) {
    var h = 0;
    for (var i = 0; i < city.length; i++) h = (h * 31 + city.charCodeAt(i)) % 360;
    return "linear-gradient(135deg,hsl(" + h + ",52%,46%),hsl(" + ((h + 45) % 360) + ",58%,30%))";
  }

  /* ---------- 渲染入口 ---------- */
  function render() {
    var body = document.getElementById("cogBody");
    if (!body) return;
    document.querySelectorAll(".cog-tab").forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-cog") === curTab); });
    try {
      if (curTab === "major") renderMajor();
      else if (curTab === "school") renderSchool();
      else if (curTab === "career") renderCareer();
      else if (curTab === "life") renderLife();
      else if (curTab === "book") {
        if (window.GK.whitepaper) window.GK.whitepaper.renderBook();
        else { curTab = "major"; renderMajor(); }
      }
      else renderCity();
    } catch (err) {
      if (window.console) console.error("认知板块渲染出错：", err);
      /* 不再跳回专业认知：留在当前 tab 并显示错误占位，便于定位 */
      if (body) body.innerHTML = '<div class="cog-empty">该板块渲染出错（' + esc(err && err.message ? err.message : "未知错误") + "）。可截图反馈，或点其他板块继续使用。</div>";
    }
  }

  function goTab(name) {
    var tabBtn = document.querySelector('.cog-tab[data-cog="' + name + '"]');
    curTab = tabBtn ? name : "major";
    if (curTab === "city") citySel = null;
    render();
    syncNavSub();
  }

  function syncNavSub() {
    document.querySelectorAll(".nav-sub-item[data-cog]").forEach(function (it) {
      it.classList.toggle("is-active", it.getAttribute("data-cog") === curTab);
    });
  }

  function bind() {
    var page = document.getElementById("page-cognition");
    if (page) page.addEventListener("click", function (e) {
      var t = e.target.closest(".cog-tab");
      if (!t) return;
      curTab = t.getAttribute("data-cog");
      if (curTab === "city") citySel = null;
      render();
      syncNavSub();
    });
    var body = document.getElementById("cogBody");
    body.addEventListener("click", function (e) {
      var major = e.target.closest(".cog-major");
      if (major) {
        var e2 = CAT[major.getAttribute("data-name")];
        if (e2) {
          var jobRows = (((window.GK_MAJOR_DB || {}).jobs || {}) || {})[e2.code] || [];
          var jobHtml = jobRows.length ? '<div class="sd-section-title" style="margin-top:12px">毕业去向 · 分布参考<span class="cog-src-inline">历史映射数据 · 非最新统计</span></div>' +
            '<div class="cog-job-list">' + jobRows.map(function (j) {
              var jobsTxt = (j[2] || []).length ? j[2].join("、") : "";
              var w = Math.max(8, Math.min(100, (j[1] || 0) * 1.5));
              return '<div class="cog-job-row"><div class="cog-job-line"><span class="cog-job-d">' + esc(j[0]) + "</span><b>" + j[1] + "%</b></div>" +
                '<div class="cog-bar cog-job-bar"><i style="width:' + w + '%"></i></div>' +
                (jobsTxt ? '<div class="cog-job-j">如：' + esc(jobsTxt) + "</div>" : "") + "</div>";
            }).join("") + "</div>" : "";
          var ex = window.GK.whitepaper ? window.GK.whitepaper.excerptFor(e2.name) : "";
          var mask = window.GK.modal({ title: e2.name, body: '<div class="cog-detail-tags"><span>' + (L1[e2.l2] || "") + "</span></div>" +
          '<div class="sd-section-title" style="margin-top:10px">专业简介</div><div class="sd-desc">' + esc(e2.intro) + "</div>" +
          (e2.courses ? '<div class="sd-section-title" style="margin-top:10px">主要课程</div><div class="sd-desc">' + esc(e2.courses) + "</div>" : "") +
          (e2.career ? '<div class="sd-section-title" style="margin-top:10px">就业方向</div><div class="sd-desc">' + esc(e2.career) + "</div>" : "") +
          (money(e2.salary) ? '<div class="sd-section-title" style="margin-top:10px">参考待遇</div><div class="sd-desc">' + money(e2.salary) + "（仅供参考，来源：专业库）</div>" : "") +
          jobHtml + topSchoolsHtml(e2.name) + ex, width: "680px" });
          if (window.GK.whitepaper) window.GK.whitepaper.bindExcerpt(mask);
          mask.querySelectorAll("[data-school-top]").forEach(function (b) {
            b.addEventListener("click", function () {
              schoolDetail(b.getAttribute("data-school-top"));
            });
          });
        }
        return;
      }
      var school = e.target.closest(".cog-school");
      if (school && !e.target.closest("[data-cmp]") && !e.target.closest("[data-detail]")) {
        schoolDetail(school.getAttribute("data-name"));
        return;
      }
      var cmp = e.target.closest("[data-cmp]");
      if (cmp) {
        var n = cmp.getAttribute("data-cmp");
        var i = compare.indexOf(n);
        if (i >= 0) compare.splice(i, 1);
        else if (compare.length >= 3) window.GK.toast("最多对比 3 所院校", "error");
        else compare.push(n);
        render();
        return;
      }
      var det = e.target.closest("[data-detail]");
      if (det) { schoolDetail(det.getAttribute("data-detail")); return; }
      var city = e.target.closest(".cog-city-card");
      if (city) { citySel = city.getAttribute("data-city"); render(); return; }
      var topSchool = e.target.closest(".cog-city-top-school");
      if (topSchool) {
        schoolDetail(topSchool.getAttribute("data-school"));
        return;
      }
      var citySchool = e.target.closest(".cog-city-school");
      if (citySchool) {
        schoolDetail(citySchool.getAttribute("data-school"));
        return;
      }
      var exploreBtn = e.target.closest(".cog-school-explore");
      if (exploreBtn) {
        var nm = exploreBtn.getAttribute("data-school");
        citySel = null;
        window.GK.goPage("explore");
        setTimeout(function () {
          if (window.GK.explore && window.GK.explore.openSchool) window.GK.explore.openSchool(nm);
          else window.GK.toast("探索板块暂不可用", "info");
        }, 80);
        return;
      }
      var career = e.target.closest(".cog-career");
      if (career) {
        careerDetail(parseInt(career.getAttribute("data-i"), 10));
        return;
      }
      if (e.target.id === "cogCompareGo") compareModal();
      if (e.target.id === "cogCompareClear") { compare = []; render(); }
      if (e.target.id === "cogCityBack") { citySel = null; render(); }
      if (e.target.id === "cogDormGo") {
        var q = (document.getElementById("cogDormSearch").value || "").trim();
        dormQuery(q);
      }
      var dormHit = e.target.closest(".cog-dorm-hit");
      if (dormHit) {
        var n = dormHit.getAttribute("data-school");
        var inp = document.getElementById("cogDormSearch");
        if (inp) inp.value = n;
        renderDormHints("");
        dormQuery(n);
        return;
      }
      var dormChip = e.target.closest(".cog-dorm-chip");
      if (dormChip) {
        var nc = dormChip.getAttribute("data-school");
        var inp2 = document.getElementById("cogDormSearch");
        if (inp2) inp2.value = nc;
        renderDormHints("");
        dormQuery(nc);
        return;
      }
      var lifeCatBtn = e.target.closest(".cog-life-cat");
      if (lifeCatBtn) {
        lifeCat = lifeCatBtn.getAttribute("data-cat");
        var cats = document.getElementById("cogLifeCats");
        if (cats) cats.querySelectorAll(".cog-life-cat").forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-cat") === lifeCat);
        });
        var lw = document.getElementById("cogLifeWrap");
        if (lw) {
          var ids = (LIFE_CATS.filter(function (c) { return c.k === lifeCat; })[0] || LIFE_CATS[0]).ids;
          lw.innerHTML = lifeConceptHtml(ids);
          lw.classList.remove("gk-fade");
          void lw.offsetWidth;
          lw.classList.add("gk-fade");
        }
        return;
      }
      if (e.target.id === "cogMajorClear") { majorQ = ""; render(); return; }
      if (e.target.id === "cogSchoolClear") { schoolQ = ""; render(); return; }
    });
    body.addEventListener("input", function (e) {
      if (e.target.id === "cogMajorSearch") { majorQ = e.target.value; renderMajorList(); }
      if (e.target.id === "cogSchoolSearch") { schoolQ = e.target.value; renderSchoolList(); }
      if (e.target.id === "cogCareerSearch") {
        var kw = e.target.value.trim();
        document.querySelectorAll(".cog-career").forEach(function (c) {
          c.style.display = (!kw || c.textContent.indexOf(kw) >= 0) ? "" : "none";
        });
      }
      if (e.target.id === "cogDormSearch") { renderDormHints(e.target.value); }
      if (e.target.id === "empSearch") {
        empQ = e.target.value;
        empPick = empExact(empQ);
        /* 只更新候选与结果区，保留输入焦点 */
        var wrap = e.target.closest(".cog-sec");
        if (wrap) {
          var holder = wrap.querySelector(".emp-cands");
          if (holder) {
            var cands = empCandidates(empQ);
            holder.innerHTML = cands.map(function (c) {
              return '<button class="emp-cand" data-type="' + c.t + '" data-name="' + esc(c.n) + '">' + esc(c.n) + "</button>";
            }).join("");
          }
          var res = wrap.querySelector(".cog-sec-sub");
          if (res) res.innerHTML = empResultHtml();
          var pk = wrap.querySelector(".emp-pick");
          if (pk) pk.innerHTML = empPick ? "当前限定：<b>" + esc(empPick.n) + "</b>" : "未选择（选下方候选或输入完整名称）";
        }
      }
    });
    body.addEventListener("click", function (e) {
      var mode = e.target.closest(".emp-mode");
      if (mode) {
        empMode = mode.getAttribute("data-mode");
        empQ = "";
        empPick = null;
        render();
        return;
      }
      var cand = e.target.closest(".emp-cand");
      if (cand) {
        empPick = { t: cand.getAttribute("data-type"), n: cand.getAttribute("data-name") };
        empQ = cand.getAttribute("data-name");
        render();
        return;
      }
      var lvl = e.target.closest(".emp-level-chip");
      if (lvl) {
        empPick = { t: "level", n: lvl.getAttribute("data-level") };
        render();
        return;
      }
      if (e.target.id === "empClear") {
        empQ = "";
        empPick = null;
        render();
        return;
      }
    });
    body.addEventListener("click", function (e) {
      var l1 = e.target.closest(".cog-chip[data-l1]");
      if (l1) { majorL1 = l1.getAttribute("data-l1"); render(); return; }
      var tag = e.target.closest(".cog-chip[data-tag]");
      if (tag) { schoolTag = tag.getAttribute("data-tag") === "全部" ? "" : tag.getAttribute("data-tag"); render(); return; }
      var cp = e.target.closest(".cog-chip[data-cprov]");
      if (cp) {
        var p = cp.getAttribute("data-cprov");
        if (p === "全部") cityProvs = {};
        else if (cityProvs[p]) delete cityProvs[p];
        else cityProvs[p] = 1;
        render();
        return;
      }
    });
  }

  window.GK = window.GK || {};
  window.GK.cognition = { render: render, bind: bind, goTab: goTab, getTab: function () { return curTab; }, openSchoolDetail: schoolDetail };
})();
