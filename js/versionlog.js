/* 潮汐志愿 · 版本日志（Minecraft 式命名体系）
 * 大版本：v1.0/v2.0/v2.1…（每大版本有主题）；补丁：v2.1.1/v2.1.2…
 * 快照：v2.1-snapshot-1…（挂靠下一个正式版）
 * 简单视图 = 大厂更新日志式重点；详细视图 = Minecraft 式（新增/修改/Bug 修复）
 */
(function () {
  var VERSIONS = [
    {
      v: "v2.1", theme: "白皮书馆", date: "2026-08-12", kind: "major", snapshot: "v2.1-snapshot-1",
      simple: "品牌更名「潮汐志愿」；白皮书馆上线（三本白皮书）；赞助改版为爱发电饮品点单；数据层大整理（加载文件 35→13）；城市认知补全数据并联动探索；宿舍速览结构化重构",
      detail: {
        added: [
          "品牌体系：中文名「潮汐志愿」、英文 TIDE、Slogan「顺潮而行，落笔有光」",
          "白皮书馆：认知 / 浙江文科 / 计算机+ 三本白皮书封面墙 + 整本阅读（目录/进度/主题色）",
          "赞助点单：6 款饮品 + 自定义档位，点杯直达爱发电支付",
          "城市认知：院校卡新增软科排名/层次标签、代表专业、院校简介摘要",
          "城市认知院校卡新增「详细认知」按钮，直达探索板块院校详情",
          "宿舍速览：重点高校快捷入口 + 结构化键值卡片（床位/断电/限电/门禁等）",
          "个人中心昵称独立「保存」按钮",
          "版本日志双视图（简单/详细）与 Minecraft 式命名体系"
        ],
        changed: [
          "快照命名：旧 26wXXx → 新 v2.1-snapshot-N（历史日志不追溯）",
          "数据层：投档线/评估/排名/专业/院校 5 域合并，35 个加载文件减至 13 个",
          "全站文案「浙志愿」→「潮汐志愿」",
          "全局补齐展开/弹层/卡片过渡动画"
        ],
        fixed: [
          { id: "BUG-201", desc: "城市认知院校专业与排名数据为空", fix: "改用 2025 投档位次 + 院校元数据/简介/特色专业聚合展示" },
          { id: "BUG-202", desc: "志愿表无志愿时空态未覆盖志愿区，残留毛玻璃", fix: "空态行铺满表面色并撑高表格区" },
          { id: "BUG-203", desc: "进入填报界面后修改昵称不生效", fix: "新增独立保存按钮，直接更新档案并全链路刷新" },
          { id: "BUG-204", desc: "宿舍信息大段文字粘连难读", fix: "解析为结构化卡片，院校详情与速览统一渲染" },
          { id: "BUG-205", desc: "「导入志愿」按钮无底色不显眼", fix: "改为带底色按钮样式" }
        ]
      }
    },
    {
      v: "v2.0", theme: "潮汐正式版", date: "2026-08-09", kind: "major",
      simple: "2.0 正式版：全部实验功能转正；认知白皮书合入；城市探索全量 322 城；头像自定义开放；就业检索转正",
      detail: {
        added: [
          "实验功能全部转正：等位分/录取概率区间/风险地图/策略助手/快照对比/院校对比/城市探索/毕业去向/纪念卡/智问助手",
          "认知白皮书整本阅读 + 专业节选 + 双向跳转正式合入",
          "头像自定义（圆形裁切面板）正式开放",
          "城市探索全量 322 城（65 城手写精编 + 数据画像 + 产教融合指数徽章）",
          "就业检索（按专业/院校/层次）转正"
        ],
        changed: ["存储沿用 zzy-volunteer-v1，历史数据无缝保留"],
        fixed: []
      }
    },
    {
      v: "v1.3", theme: "认知时代", date: "2026-08-08 — 08-09", kind: "major",
      simple: "认知板块上线（专业/高校/职业/大学生活/城市探索）；三本白皮书从研究稿到产品化；城市探索全量重写",
      detail: {
        added: [
          "顶级「认知」板块：专业认知 / 高校认知 / 职业认知 / 大学生活 / 城市探索",
          "《浙江高考认知白皮书》1000+ 行产品化（封面/目录/进度/节选/双向跳转）",
          "高校认知覆盖 63 → 210 所（软科 2026 主榜前 200 + 行业特色校）",
          "城市探索全量 322 城：手写精编 65 城 + 数据画像 + 产教融合徽章",
          "就业全景检索：3747 专业 × 按层次七档画像",
          "考研与保研 2026 全景、大学关键概念、入学清单",
          "头像自定义与昵称体系"
        ],
        changed: [
          "导航收敛为 5 个一级入口（工作台/志愿表/探索/认知/我的）",
          "专业认知搜索优先级：前缀 > 包含 > 简介/就业"
        ],
        fixed: [
          { id: "BUG-130", desc: "城市探索点击跳回专业认知", fix: "聚合性能 805 万次调用降至 175ms + 渲染兜底" },
          { id: "BUG-131", desc: "城市详情点不出 / 省份缓存丢失崩溃", fix: "类名绑定同步 + 缓存声明补回 + 错误就地展示" },
          { id: "BUG-132", desc: "白皮书目录胶囊/专业入口失效", fix: "启动时挂载事件委托" },
          { id: "BUG-133", desc: "头像裁切面板被引导层覆盖且按钮失效", fix: "挂 body 顶层 + 显式点击 + Esc 关闭" }
        ]
      }
    },
    {
      v: "v1.2", theme: "工作台进化", date: "2026-08-08", kind: "major",
      simple: "主页工作台上线；志愿表拖拽/列宽/导入全面重构；赞助支持；独立测试版",
      detail: {
        added: [
          "主页欢迎工作台：方案速览/冲稳保分布/一分一段山峰图/日程提醒",
          "志愿表：空位槽拖拽模型、可调列宽、全宽模式、导入志愿（PDF/Excel）、志愿数量体检",
          "赞助支持与独立测试版 index-beta（实验功能面板）",
          "风险地图 / 录取概率区间 / 策略助手 / 方案快照对比"
        ],
        changed: [
          "趋势图位次轴方向与直觉一致（位次越小越靠上）",
          "列设置、固定标记列、行标记着色"
        ],
        fixed: [
          { id: "BUG-120", desc: "「仅看我能报」全年份扫描页面卡死", fix: "渲染耗时 90 秒 → 0.2 秒" },
          { id: "BUG-121", desc: "慢速拖拽抖动错位", fix: "空位槽模型 + 中线换位判定" },
          { id: "BUG-122", desc: "明暗切换出现双图标", fix: "修复初始渲染" }
        ]
      }
    },
    {
      v: "v1.1", theme: "数据深潜", date: "2026-08-07 — 08-08", kind: "major",
      simple: "高校排名五视图与学科评估；宿舍/王牌专业数据并入；9 套主题体系；移动端全面适配；照片终审落地",
      detail: {
        added: [
          "高校排名：软科 2026 全榜 / ARWU 2025 全量 / QS 2026 全量 / 最好学科 / 专业 A+ 五视图",
          "学科评估第四轮官方 ⇄ 第五轮整理版切换 + 25 所官宣透出",
          "宿舍 2,393 所 + 王牌专业 2,171 所（标注仅供参考）",
          "9 套主题（含南雍紫 · NJU）+ 明暗 + 壁纸 + 毛玻璃",
          "移动端底部导航与全面适配（390px 无横向溢出）",
          "院校照片终审：62 所直链 + 品牌封面回退体系",
          "310 所矢量校徽字体"
        ],
        changed: ["主榜补全 590 所、专业排名换 2026 A+ 档（2022 退役）"],
        fixed: [
          { id: "BUG-110", desc: "favicon 404", fix: "补齐图标" },
          { id: "BUG-111", desc: "山峰图切换动画影响可用性", fix: "回退稳定淡入淡出" }
        ]
      }
    },
    {
      v: "v1.0", theme: "潮汐起航", date: "2026-08-07", kind: "major",
      simple: "初始版：建档/主题、志愿表、数据查询（六年 112,224 条）、志愿库、录取模拟、探索与个人中心",
      detail: {
        added: [
          "首启建档（选科 7 选 3 / 总分 / 位次）与 8 色主题 + 明暗",
          "志愿表：80 志愿、冲稳保标记、拖拽排序、梯度体检、分享长图、日程",
          "数据查询：2021—2026 六年投档线全量、属性胶囊、行展开详情",
          "志愿库 / 录取模拟（官方 PDF 解析）/ 个人中心",
          "院校探索 / 专业探索：965 个专业目录、院校简介、照片挑选",
          "等位分实验、必应壁纸、毛玻璃"
        ],
        changed: ["冲稳保阈值放宽（1741 名对 1300 位次正确判「冲」）"],
        fixed: [
          { id: "BUG-100", desc: "省份筛选失效", fix: "修复筛选逻辑" },
          { id: "BUG-101", desc: "校区括号与专业城市显示混乱", fix: "保留校区全名 + 城市校区解析" }
        ]
      }
    }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function verTag(v) {
    var badge = v.kind === "major" ? '<span class="vl-badge vl-badge-major">大版本</span>' : "";
    var sn = v.snapshot ? '<span class="vl-snapshot">' + esc(v.snapshot) + "</span>" : "";
    return '<b class="vl-ver">' + esc(v.v) + "</b>" + (v.theme ? '<em class="vl-theme">' + esc(v.theme) + "</em>" : "") + badge + sn + '<span class="vl-date">' + esc(v.date) + "</span>";
  }

  function simpleHtml() {
    return VERSIONS.map(function (v) {
      return '<div class="ver-item vl-simple"><div class="vl-head">' + verTag(v) + "</div><p>" + esc(v.simple) + "</p></div>";
    }).join("");
  }

  function listHtml(items) {
    return items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  }

  function fixHtml(fixes) {
    return fixes.map(function (f) {
      return '<li class="vl-fix"><span class="vl-fix-id">' + esc(f.id) + "</span><span class='vl-fix-desc'>" + esc(f.desc) + "</span><span class='vl-fix-arrow'>→</span><span class='vl-fix-sol'>" + esc(f.fix) + "</span></li>";
    }).join("");
  }

  function detailHtml() {
    return VERSIONS.map(function (v) {
      var d = v.detail || {};
      var sec = "";
      if (d.added && d.added.length) sec += '<div class="vl-sec"><span class="vl-sec-tag vl-sec-add">新增</span><ul>' + listHtml(d.added) + "</ul></div>";
      if (d.changed && d.changed.length) sec += '<div class="vl-sec"><span class="vl-sec-tag vl-sec-chg">修改</span><ul>' + listHtml(d.changed) + "</ul></div>";
      if (d.fixed && d.fixed.length) sec += '<div class="vl-sec"><span class="vl-sec-tag vl-sec-fix">Bug 修复</span><ul>' + fixHtml(d.fixed) + "</ul></div>";
      return '<div class="ver-item vl-detail"><div class="vl-head">' + verTag(v) + "</div>" + sec + "</div>";
    }).join("");
  }

  function render(mode) {
    var body = document.getElementById("versionLogBody");
    if (!body) return;
    body.innerHTML = mode === "detail" ? detailHtml() : simpleHtml();
    document.querySelectorAll("#versionLog .vl-switch-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-vl") === mode);
    });
  }

  function bind() {
    var wrap = document.getElementById("versionLog");
    if (!wrap) return;
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest(".vl-switch-btn");
      if (b) render(b.getAttribute("data-vl"));
    });
    render("simple");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
