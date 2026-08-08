(function () {
  var S = window.GK.state;
  var DEFAULTS = [
    { id: "t1", name: "高考成绩与位次公布", date: "2026-06-26", done: true, desc: "浙江省教育考试院官网查询成绩、位次与一分一段表" },
    { id: "t2", name: "普通类一段志愿填报", date: "2026-06-29", done: true, desc: "登录浙江省高校招生考试信息管理系统填报，提交前用本工具导出核对" },
    { id: "t3", name: "一段平行志愿投档", date: "2026-07-11", done: true, desc: "投档线公布，查询录取结果；滑档考生准备二段" },
    { id: "t4", name: "普通类二段志愿填报", date: "2026-07-26", done: false, desc: "二段考生填报（参考日期，以官方通知为准）" },
    { id: "t5", name: "录取通知书寄送", date: "2026-08-10", done: false, desc: "关注录取通知书物流，准备开学" }
  ];

  function items() {
    if (!S.timeline || !S.timeline.length) S.timeline = JSON.parse(JSON.stringify(DEFAULTS));
    return S.timeline;
  }

  function render() {
    var list = document.getElementById("timelineList");
    var tl = items().slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (!tl.length) {
      list.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("timeline") + '<div class="es-title">还没有日程节点</div><div class="es-desc">用下面的表单添加志愿填报关键节点。</div></div>';
      return;
    }
    list.innerHTML = "";
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var nextIdx = -1;
    tl.forEach(function (t, i) {
      if (!t.done && nextIdx < 0) nextIdx = i;
    });
    tl.forEach(function (t, i) {
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
      S.timeline.push({ id: window.GK.uid(), name: name, date: date, done: false, desc: desc });
      window.GK.save();
      document.getElementById("tlName").value = "";
      document.getElementById("tlDate").value = "";
      document.getElementById("tlDesc").value = "";
      render();
      window.GK.toast("已添加节点", "success");
    });
    render();
  }

  window.GK = window.GK || {};
  window.GK.timeline = { init: init, render: render };
})();
