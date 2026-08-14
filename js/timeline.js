(function () {
  var S = window.GK.state;
  /* 2026 浙江官方进程（浙江省教育考试院 2026-06 公布，来源：2026 普通高校招生录取工作进程 / 志愿填报时间安排） */
  var DEFAULTS = [
    { id: "t2026-1", cat: "模拟与查分", name: "志愿填报模拟练习", date: "2026-06-12", done: true, desc: "6.12–18 省考试院开放志愿填报模拟系统与辅助系统，可提前熟悉操作；6.18 清空模拟数据" },
    { id: "t2026-2", cat: "模拟与查分", name: "成绩 / 位次 / 一分一段公布", date: "2026-06-26", done: true, desc: "6.26 左右公布普通类分段线、一分一段表，可查成绩与位次号" },
    { id: "t2026-3", cat: "志愿填报", name: "首轮志愿填报（提前批 + 一段）", date: "2026-06-29", done: true, desc: "6.29 8:30–6.30 17:30：普通类提前录取（含一段、二段考生）、第一段平行志愿、高校专项 / 地方专项 / 高水平运动队、浙江警察学院三位一体等一并填报" },
    { id: "t2026-4", cat: "提前批录取", name: "强基计划 / 西湖大学创新班录取", date: "2026-07-05", done: true, desc: "7.5 前录取；7.7 前香港单招高校录取；7.1–9 军检、政审" },
    { id: "t2026-5", cat: "提前批录取", name: "高水平大学三位一体录取", date: "2026-07-08", done: true, desc: "复旦、上交、浙大等高水平三位一体按提前批录取；7.9 浙江警察学院三位一体投档录取" },
    { id: "t2026-6", cat: "提前批录取", name: "普通类提前录取投档", date: "2026-07-12", done: true, desc: "第一段 7.12–14 五个院校志愿逐轮投档；7.15 军校征求志愿、高校专项投档；7.16 高水平运动队 / 地方专项；第二段 7.17–18" },
    { id: "t2026-7", cat: "一段录取", name: "普通类一段平行志愿投档", date: "2026-07-21", done: true, desc: "7.21 8:30 投档，7.22 退档录检结束；7.23 晚可查询一段平行录取结果" },
    { id: "t2026-8", cat: "一段录取", name: "公布剩余计划", date: "2026-07-24", done: true, desc: "上午公布普通类 / 艺术类 / 体育类剩余计划，一段未录取考生准备二段" },
    { id: "t2026-9", cat: "志愿填报", name: "普通类二段志愿填报", date: "2026-07-26", done: false, desc: "7.26 8:30–7.27 17:30：普通类第二段平行志愿，艺术类 / 体育类第二段一并填报" },
    { id: "t2026-10", cat: "二段录取", name: "二段平行志愿投档", date: "2026-07-30", done: false, desc: "7.30 14:30 投档，7.31 退档录检结束，之后可查询二段录取结果" },
    { id: "t2026-11", cat: "二段录取", name: "公布征求计划", date: "2026-08-02", done: false, desc: "上午公布征求计划（是否征求视缺额而定）" },
    { id: "t2026-12", cat: "二段录取", name: "征求志愿填报", date: "2026-08-03", done: false, desc: "8.3 8:30–17:30 普通类 / 艺术类 / 体育类征求志愿填报；8.5 征求志愿投档录取" },
    { id: "t2026-13", cat: "通知书", name: "录取通知书寄送", date: "2026-08-06", done: false, desc: "录取通知书按批次陆续寄出：提前批约 7 月中下旬、一段约 7 月底至 8 月初、二段约 8 月中旬，并非统一寄送，留意 EMS 物流" }
  ];
  var OLD_IDS = ["t1", "t2", "t3", "t4", "t5"];

  function fresh() { return JSON.parse(JSON.stringify(DEFAULTS)); }

  function items() {
    if (!S.timeline) S.timeline = fresh();
    else if (!S.timelineMigrated) {
      /* 旧版内置节点（t1–t5，含错误的一段投档日 7.11）升级为官方完整日程；用户自建节点保留 */
      var hasOld = S.timeline.some(function (t) { return OLD_IDS.indexOf(t.id) >= 0; });
      if (hasOld) {
        var custom = S.timeline.filter(function (t) { return OLD_IDS.indexOf(t.id) < 0; });
        S.timeline = fresh().concat(custom);
      } else {
        S.timeline = fresh().concat(S.timeline);
      }
      S.timelineMigrated = true;
      window.GK.save();
    }
    return S.timeline;
  }

  function render() {
    var list = document.getElementById("timelineList");
    var tl = items().slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (!tl.length) {
      list.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("timeline") + '<div class="es-title">还没有日程节点</div><div class="es-desc">用下面的表单添加志愿填报关键节点，或点「恢复官方日程」。</div></div>';
      return;
    }
    list.innerHTML = "";
    var I = window.GK_QQ_INSIGHTS;
    if (I && I.timeline && I.timeline["志愿填报期"] && I.timeline["志愿填报期"].length) {
      var escT = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
      var tip = document.createElement("div");
      tip.style.cssText = "padding:10px 14px;margin:0 0 12px;border:1px solid var(--line);border-radius:12px;font-size:13px;color:var(--text-2);background:var(--glass-bg)";
      tip.innerHTML = "<b>填报季真实声音：</b>" + escT(I.timeline["志愿填报期"][0]) +
        (I.timeline["志愿填报期"][1] ? "<br><span style='opacity:.85'>" + escT(I.timeline["志愿填报期"][1]) + "</span>" : "");
      list.appendChild(tip);
    }
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var lastCat = null;
    tl.forEach(function (t, i) {
      if (t.cat !== lastCat) {
        lastCat = t.cat;
        var cat = document.createElement("div");
        cat.className = "tl-cat";
        cat.textContent = t.cat;
        list.appendChild(cat);
      }
      var parts = String(t.date).split("-");
      var d = new Date(t.date + "T00:00:00");
      var diff = Math.round((d - today) / 86400000);
      var item = document.createElement("div");
      item.className = "tl-item" + (t.done ? " done" : "") + (diff === 0 ? " today" : "");
      var dateBox = document.createElement("div");
      dateBox.className = "tl-date";
      dateBox.innerHTML = '<div class="tl-d">' + parseInt(parts[2], 10) + '</div><div class="tl-m">' + parseInt(parts[1], 10) + " 月</div>";
      var body = document.createElement("div");
      body.className = "tl-body";
      var name = document.createElement("div");
      name.className = "tl-name";
      name.textContent = t.name;
      var desc = document.createElement("div");
      desc.className = "tl-desc";
      desc.textContent = t.desc || "";
      var cnt = document.createElement("div");
      cnt.className = "tl-count " + (t.done ? "past" : diff === 0 ? "active" : diff < 0 ? "past" : "next");
      cnt.textContent = t.done ? "已完成" : diff === 0 ? "就是今天" : diff < 0 ? "已过 " + (-diff) + " 天" : "还有 " + diff + " 天";
      if (!t.done && diff < 0) cnt.textContent = "已过期，注意核对官方时间";
      body.appendChild(name);
      body.appendChild(desc);
      body.appendChild(cnt);
      var actions = document.createElement("div");
      actions.className = "tl-actions";
      var doneBtn = document.createElement("button");
      doneBtn.className = "row-btn";
      doneBtn.title = t.done ? "标记为未完成" : "标记完成";
      doneBtn.appendChild(window.GKIcon.render("check", 15));
      doneBtn.addEventListener("click", function () { t.done = !t.done; window.GK.save(); render(); });
      var delBtn = document.createElement("button");
      delBtn.className = "row-btn danger";
      delBtn.title = "删除";
      delBtn.appendChild(window.GKIcon.render("trash", 15));
      delBtn.addEventListener("click", function () {
        S.timeline = S.timeline.filter(function (x) { return x.id !== t.id; });
        window.GK.save();
        render();
      });
      actions.appendChild(doneBtn);
      actions.appendChild(delBtn);
      item.appendChild(dateBox);
      item.appendChild(body);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  function init() {
    document.getElementById("tlAddBtn").addEventListener("click", function () {
      var name = document.getElementById("tlName").value.trim();
      var date = document.getElementById("tlDate").value;
      var desc = document.getElementById("tlDesc").value.trim();
      if (!name || !date) { window.GK.toast("请填写节点名称与日期", "error"); return; }
      S.timeline.push({ id: window.GK.uid(), cat: "自定义", name: name, date: date, done: false, desc: desc });
      window.GK.save();
      document.getElementById("tlName").value = "";
      document.getElementById("tlDate").value = "";
      document.getElementById("tlDesc").value = "";
      render();
      window.GK.toast("已添加节点", "success");
    });
    var resetBtn = document.getElementById("tlReset");
    if (resetBtn) resetBtn.addEventListener("click", function () {
      window.GK.confirmDialog("恢复官方日程", "将日程恢复为 2026 年浙江官方志愿填报/录取进程，你添加的自定义节点会保留。", function () {
        var custom = S.timeline.filter(function (t) { return t.id.indexOf("t2026-") !== 0; });
        S.timeline = fresh().concat(custom);
        window.GK.save();
        render();
        window.GK.toast("已恢复官方日程", "success");
      });
    });
    render();
  }

  window.GK = window.GK || {};
  window.GK.timeline = { init: init, render: render, items: items };
})();
