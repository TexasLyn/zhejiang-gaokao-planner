(function () {
  var S = window.GK.state;

  function render() {
    renderBadge();
    var meta = document.getElementById("libMeta");
    meta.textContent = "共 " + S.library.length + " 条收藏 · 数据保存在本地浏览器";
    renderStats();
    renderList();
  }

  function renderBadge() {
    var el = document.getElementById("navLibCount");
    if (el) el.textContent = S.library.length;
  }

  function renderStats() {
    var marked = S.library.filter(function (x) { return x.mark; }).length;
    var inPlans = 0;
    S.plans.forEach(function (p) {
      p.items.forEach(function (it) {
        if (S.library.some(function (l) { return l.code === it.code && l.majorCode === it.majorCode; })) inPlans++;
      });
    });
    var el = document.getElementById("libStats");
    el.innerHTML = statCard(S.library.length, "全部收藏") + statCard(marked, "已标记") + statCard(S.library.length - marked, "未标记") + statCard(inPlans, "已用于方案");
  }

  function statCard(n, l) {
    return '<div class="lib-stat"><div><div class="n">' + n + '</div><div class="l">' + l + "</div></div></div>";
  }

  function renderList() {
    var el = document.getElementById("libList");
    if (!S.library.length) {
      el.innerHTML = '<div class="empty-state">' + window.GK.emptyIllust("library") + '<div class="es-title">志愿库还是空的</div><div class="es-desc">去「数据查询」里点收藏，把心仪的志愿先收进来。</div><div class="es-copy">收藏后可以随时加入方案，方便多套方案复用。</div></div>';
      return;
    }
    el.innerHTML = "";
    S.library.forEach(function (it, i) {
      var item = document.createElement("div");
      item.className = "lib-item";
      item.setAttribute("data-lid", it.lid);
      item.setAttribute("data-mark", it.mark || "");

      var drag = document.createElement("span");
      drag.className = "drag";
      drag.appendChild(window.GKIcon.render("grip", 15));
      var name = document.createElement("div");
      name.className = "li-name";
      name.innerHTML = '<div class="li-school">' + window.GK.plan.esc(it.name) + '</div><div class="li-major">' + window.GK.plan.esc(it.majorName) + "</div>";
      var actions = document.createElement("div");
      actions.className = "li-actions";

      S.marks.forEach(function (m) {
        var pill = document.createElement("button");
        pill.className = "mark-pill" + (it.mark === m.id ? "" : " grade-0");
        pill.setAttribute("data-mark", m.id);
        pill.textContent = m.label;
        pill.title = "标记为「" + m.label + "」（再次点击取消）";
        pill.addEventListener("click", function () {
          it.mark = it.mark === m.id ? null : m.id;
          window.GK.save();
          render();
        });
        actions.appendChild(pill);
      });

      var noteBtn = document.createElement("button");
      noteBtn.className = "row-btn";
      noteBtn.appendChild(window.GKIcon.render("edit", 14));
      noteBtn.title = "备注";
      noteBtn.addEventListener("click", function () { editNote(it); });

      var addBtn = document.createElement("button");
      addBtn.className = "row-btn";
      addBtn.appendChild(window.GKIcon.render("plus", 14));
      addBtn.title = "加入当前方案";
      addBtn.addEventListener("click", function () { addToPlan(it); });

      var delBtn = document.createElement("button");
      delBtn.className = "row-btn danger";
      delBtn.appendChild(window.GKIcon.render("trash", 14));
      delBtn.title = "删除收藏";
      delBtn.addEventListener("click", function () {
        S.library = S.library.filter(function (x) { return x.lid !== it.lid; });
        window.GK.save();
        render();
      });

      actions.appendChild(noteBtn);
      actions.appendChild(addBtn);
      actions.appendChild(delBtn);
      item.appendChild(drag);
      item.appendChild(name);
      item.appendChild(actions);
      el.appendChild(item);
    });
    bindDrag(el);
  }

  function editNote(it) {
    var input = document.createElement("input");
    input.value = it.note || "";
    input.placeholder = "备注";
    input.style.cssText = "width:100%;height:36px;padding:0 12px;font-size:13px;border:1px solid var(--border-strong);border-radius:9px;background:var(--surface);color:var(--text);outline:none";
    window.GK.modal({
      title: "备注",
      body: input,
      width: "420px",
      footer: [{
        text: "保存",
        kind: "primary",
        onClick: function () {
          it.note = input.value.trim();
          window.GK.save();
          window.GK.toast("已保存", "success");
        }
      }]
    });
    setTimeout(function () { input.focus(); }, 50);
  }

  function addToPlan(it) {
    var plan = window.GK.plan.activePlan();
    if (!plan) return;
    if (plan.items.length >= window.GK.plan.MAX) { window.GK.toast("方案已达上限 " + window.GK.plan.MAX, "error"); return; }
    var dupe = plan.items.some(function (x) { return x.code === it.code && x.majorCode === it.majorCode; });
    if (dupe) { window.GK.toast("该志愿已在方案中", "info"); return; }
    plan.items.push(window.GK.plan.attachHistory({
      uid: window.GK.uid(), code: it.code, name: it.name, majorCode: it.majorCode, majorName: it.majorName,
      duration: it.duration, tuition: it.tuition, mark: it.mark, note: it.note
    }));
    window.GK.save();
    window.GK.plan.renderTable();
    window.GK.plan.updateStats();
    window.GK.toast("已加入「" + plan.name + "」", "success");
  }

  function bindDrag(el) {
    window.GK.elasticDrag({
      container: el,
      gripSel: ".drag",
      itemSel: ".lib-item",
      scrollEl: null,
      uidOf: function (x) { return x.getAttribute("data-lid"); },
      items: function () { return S.library; },
      indexOf: function (lid) { return S.library.findIndex(function (x) { return x.lid === lid; }); },
      ghostHTML: function (it, index) {
        return '<span class="dg-seq">' + index + '</span><span class="dg-body"><b>' + window.GK.plan.esc(it.name) + '</b><span>' + window.GK.plan.esc(it.majorName) + '</span></span>';
      },
      ghostSeq: ".dg-seq",
      onDrop: function (from, to, uid) {
        if (from !== to) {
          var it = S.library.splice(from, 1)[0];
          S.library.splice(to, 0, it);
          window.GK.save();
        }
        render();
        var nd = el.querySelector('.lib-item[data-lid="' + uid + '"]');
        if (nd) {
          nd.classList.add("drag-in");
          void nd.offsetWidth;
        }
      }
    });
  }

  function exportLib() {
    if (!window.XLSX) { window.GK.toast("Excel 组件未加载", "error"); return; }
    var rows = [["序号", "院校代码", "院校名称", "专业代码", "专业名称", "标记", "备注"]];
    S.library.forEach(function (it, i) {
      rows.push([i + 1, it.code, it.name, it.majorCode, it.majorName, it.mark ? S.marks[it.mark - 1].label : "", it.note || ""]);
    });
    var ws = window.XLSX.utils.aoa_to_sheet(rows);
    var wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "志愿库");
    window.XLSX.writeFile(wb, "潮汐志愿-志愿库.xlsx");
    window.GK.toast("已导出志愿库", "success");
  }

  function importLib(file) {
    if (!window.XLSX) { window.GK.toast("Excel 组件未加载", "error"); return; }
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
        var header = rows[0] || [];
        var ci = header.indexOf("院校代码"), ni = header.indexOf("院校名称"), mi = header.indexOf("专业代码"), Mi = header.indexOf("专业名称"), ki = header.indexOf("标记"), bi = header.indexOf("备注");
        if (ci < 0) ci = header.indexOf("学校代号");
        if (ni < 0) ni = header.indexOf("学校名称");
        if (ci < 0 || ni < 0 || mi < 0 || Mi < 0) { window.GK.toast("未识别到院校/专业列，请使用本系统导出的格式", "error"); return; }
        var added = 0, skipped = 0;
        for (var i = 1; i < rows.length; i++) {
          var r = rows[i];
          var code = String(r[ci] || "").trim(), name = String(r[ni] || "").trim(), mc = String(r[mi] || "").trim(), mn = String(r[Mi] || "").trim();
          if (!code || !mc) continue;
          if (S.library.some(function (x) { return x.code === code && x.majorCode === mc; })) { skipped++; continue; }
          var mark = 0;
          if (ki >= 0) {
            var label = String(r[ki] || "").trim();
            var found = S.marks.find(function (m) { return m.label === label; });
            if (found) mark = found.id;
          }
          S.library.push({ lid: window.GK.uid(), code: code, name: name, majorCode: mc, majorName: mn, mark: mark || null, note: bi >= 0 ? String(r[bi] || "").trim() : "" });
          added++;
        }
        window.GK.save();
        render();
        window.GK.toast("导入完成：新增 " + added + " 条，跳过重复 " + skipped + " 条", "success");
      } catch (err) {
        window.GK.toast("导入失败：" + err.message, "error");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function init() {
    document.getElementById("btnLibExport").addEventListener("click", exportLib);
    document.getElementById("btnLibImport").addEventListener("click", function () {
      var inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".xlsx,.xls";
      inp.onchange = function () { if (inp.files[0]) importLib(inp.files[0]); };
      inp.click();
    });
    render();
  }

  window.GK = window.GK || {};
  window.GK.library = { init: init, render: render, renderBadge: renderBadge };
})();
