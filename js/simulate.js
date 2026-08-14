(function () {
  var S = window.GK.state;
  var currentFile = null;
  var lastResult = null;

  /* 离线 CMap 工厂：file:// 下 XHR 被 CORS 拦截，改为内嵌 base64 数据 */
  function OfflineCMapFactory() {}
  OfflineCMapFactory.prototype.fetch = function (params) {
    var b64 = (window.GK_CMAPS || {})[params.name];
    if (!b64) return Promise.reject(new Error("CMap not found: " + params.name));
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return Promise.resolve({ cMapData: arr, compressionType: 1 });
  };

  function init() {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js";
    }
    var input = document.getElementById("simFile");
    input.addEventListener("change", function () {
      currentFile = input.files[0] || null;
      var info = document.getElementById("simFileInfo");
      if (currentFile) {
        info.innerHTML = '<span class="file-tag">' + (currentFile.name.split(".").pop().toUpperCase()) + "</span><span>" + currentFile.name + " · " + (currentFile.size / 1024).toFixed(1) + " KB</span>";
      } else {
        info.innerHTML = "";
      }
    });
    if (S.profile) document.getElementById("simRank").value = S.profile.rank;
    document.getElementById("btnSimulate").addEventListener("click", simulate);
    document.getElementById("btnSimExport").addEventListener("click", exportResult);
    renderSameScore();
  }

  function refresh() {
    renderSameScore();
  }

  /* 同分不同位次说明（社区收集的选考组合位次） */
  function renderSameScore() {
    var box = document.getElementById("sameScoreCard");
    if (!box) return;
    var p = S.profile;
    if (!p) {
      box.style.display = "none";
      return;
    }
    var sr = window.GK.data.subjectRank(p.score, 2026);
    if (!sr) {
      box.style.display = "none";
      return;
    }
    var parts = [];
    var groupName = "";
    var subjects = (p.subjects || []).slice().sort();
    if (subjects.indexOf("物理") >= 0 && subjects.indexOf("化学") >= 0) groupName = "物化";
    else if (subjects.indexOf("物理") >= 0) groupName = "物理";
    else if (subjects.indexOf("化学") >= 0) groupName = "化学";
    var groupRank = groupName === "物化" ? sr.wh : groupName === "物理" ? sr.wl : groupName === "化学" ? sr.hx : null;
    parts.push("2026 年 " + p.score + " 分：总位次约 <b>" + sr.total + "</b> 名");
    if (groupRank) parts.push("你的选科组合（" + groupName + "）位次约 <b>" + groupRank + "</b> 名");
    var html = "平行志愿按<b>位次</b>投档，分数相同的考生位次由选科组合与单科成绩决定。依据历年志愿填报数据：" + parts.join("；") +
      "。所以本工具用「我的位次 ≤ 投档最低位次」判断是否达标，而不是比分数。" +
      '<span class="card-desc" style="display:block;margin-top:6px;">数据为社区收集，仅供定位参考；正式录取以省考试院公布为准。</span>';
    box.querySelector("#sameScoreText").innerHTML = html;
    box.style.display = "";
  }

  function simulate() {
    var rank = parseInt(document.getElementById("simRank").value, 10);
    if (!rank || rank <= 0) { window.GK.toast("请先填写你的位次", "error"); return; }
    if (!currentFile) { window.GK.toast("请先选择志愿表文件", "error"); return; }
    var ext = currentFile.name.split(".").pop().toLowerCase();
    var year = parseInt(document.getElementById("simYear").value, 10);
    window.GK.toast("正在解析文件…", "info");
    if (ext === "pdf") {
      if (!window.pdfjsLib) { window.GK.toast("PDF 解析组件未加载（离线时需保留 js/vendor/pdf.min.js）", "error"); return; }
      parsePdf(currentFile).then(function (entries) {
        if (!entries.length) { window.GK.toast("未能从 PDF 中识别到志愿行", "error"); return; }
        runMatch(entries, rank, year);
      }).catch(function (err) {
        window.GK.toast("PDF 解析失败：" + err.message, "error");
      });
    } else {
      if (!window.XLSX) { window.GK.toast("Excel 组件未加载", "error"); return; }
      parseExcel(currentFile).then(function (entries) {
        if (!entries.length) { window.GK.toast("未能从文件中识别到志愿行", "error"); return; }
        runMatch(entries, rank, year);
      });
    }
  }

  /* ---------- PDF 解析 ---------- */
  function parsePdf(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var data = new Uint8Array(e.target.result);
        runExtract(data).then(resolve).catch(function (err) {
          /* file:// 下 worker 偶发未就绪，等待后重试一次 */
          setTimeout(function () {
            runExtract(data).then(resolve).catch(reject);
          }, 400);
        });
      };
      reader.onerror = function () { reject(new Error("文件读取失败")); };
      reader.readAsArrayBuffer(file);
    });
  }

  function runExtract(data) {
    return window.pdfjsLib.getDocument({
      data: data,
      CMapReaderFactory: OfflineCMapFactory
    }).promise.then(function (pdf) {
      var pages = [];
      for (var i = 1; i <= pdf.numPages; i++) {
        pages.push(pdf.getPage(i).then(function (page) {
          if (typeof page.getTextContent !== "function") throw new Error("PDF 文本解析不可用");
          return page.getTextContent();
        }));
      }
      return Promise.all(pages).then(function (contents) {
        var entries = [];
        contents.forEach(function (content) {
          entries = entries.concat(rowsFromText(content));
        });
        entries.sort(function (a, b) { return a.seq - b.seq; });
        return entries;
      });
    });
  }

  function rowsFromText(content) {
    /* 官方 PDF：序号在左列(x≈87)，院校列(x≈128)、专业列(x≈287)；
       以序号为锚点切记录，其余文本按 x 路由到院校/专业，
       并用行窗口过滤表头与跨行杂质 */
    var items = content.items.filter(function (it) { return it.str && it.str.trim(); }).map(function (it) {
      return { x: it.transform[4], y: it.transform[5], w: it.width || it.str.length * 4, str: it.str.trim() };
    });
    items.sort(function (a, b) { return a.y - b.y; });
    var records = [];
    var cur = null;
    items.forEach(function (it) {
      if (/^(志愿序号|院校|专业)$/.test(it.str)) return;
      if (/考生|校验码|证件号码|类别及批次|导出时间|普通类|填报表/.test(it.str)) return;
      if (/^\d{1,2}$/.test(it.str) && it.x < 115) {
        if (cur) records.push(cur);
        cur = { seq: parseInt(it.str, 10), y: it.y, school: [], major: [] };
        return;
      }
      if (!cur) return;
      if (it.y < cur.y - 26 || it.y > cur.y + 26) return;
      if (it.x < 250) cur.school.push(it.str);
      else cur.major.push(it.str);
    });
    if (cur) records.push(cur);
    var entries = records.map(parseRecord).filter(function (e) { return !!e; });
    entries.sort(function (a, b) { return a.seq - b.seq; });
    return entries;
  }

  function parseRecord(record) {
    var schoolText = record.school.join(" ");
    var majorText = record.major.join(" ");
    var sm = schoolText.match(/(\d{4})/);
    var mm = majorText.match(/(\d{3})(?!\d)/);
    if (!sm || !mm) return null;
    var schoolCode = sm[1];
    /* 优先按院校代码取官方全名：PDF 里的括号杂质（双一流标注等）不再影响检索；
       官方库名本身可能带「(民办学校)」等标签，统一再过一遍清洗 */
    var schoolName = window.GK.data.cleanSchoolName(window.GK.data.schoolNameByCode(schoolCode) || "");
    if (!schoolName) {
      schoolName = window.GK.data.cleanSchoolName(schoolText.slice(schoolText.indexOf(sm[1]) + 4));
      schoolName = String(schoolName).replace(/[）)]+$/, "").replace(/[（(][^（）()]*(?:双一流|一流大学建设|一流学科建设|民办|中外合作办学|独立学院|新设院校)[^（）()]*$/, "").trim();
    }
    var majorCode = mm[1];
    var majorName = String(majorText.slice(majorText.indexOf(mm[1]) + 3)).replace(/[）)]+$/, "").trim();
    var duration = "";
    var dm = majorName.match(/（本科，学制\s*([\d.]+)\s*年[\s）]*$/);
    if (dm) {
      duration = dm[1];
      majorName = majorName.slice(0, dm.index).trim();
    }
    return {
      seq: record.seq == null ? 9999 : record.seq,
      schoolCode: schoolCode,
      schoolName: schoolName,
      majorCode: majorCode,
      majorName: majorName,
      duration: duration
    };
  }

  /* ---------- Excel 解析 ---------- */
  function parseExcel(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          var sheet = wb.Sheets[wb.SheetNames[0]];
          var rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          var header = rows[0] || [];
          var ci = header.indexOf("院校代码"); if (ci < 0) ci = header.indexOf("学校代号");
          var ni = header.indexOf("院校名称"); if (ni < 0) ni = header.indexOf("学校名称");
          var mi = header.indexOf("专业代码");
          var Mi = header.indexOf("专业名称");
          var markI = header.indexOf("标记");
          var noteI = header.indexOf("备注");
          function markOf(label) {
            var l = String(label || "").trim();
            if (!l) return null;
            var found = S.marks.find(function (m) { return m.label === l; });
            return found ? found.id : null;
          }
          function norm(code, len) {
            var s = String(code == null ? "" : code).trim();
            return /^\d{1,4}$/.test(s) ? s.padStart(len, "0") : s;
          }
          var entries = [];
          if (ci >= 0 && mi >= 0) {
            for (var i = 1; i < rows.length; i++) {
              var r = rows[i];
              var code = norm(r[ci], 4), mc = norm(r[mi], 3);
              if (!code || !mc) continue;
              entries.push({
                seq: entries.length + 1,
                schoolCode: norm(r[ci], 4),
                schoolName: ni >= 0 ? String(r[ni] || "").trim() : "",
                majorCode: norm(r[mi], 3),
                majorName: Mi >= 0 ? String(r[Mi] || "").trim() : "",
                duration: "",
                mark: markI >= 0 ? markOf(r[markI]) : null,
                note: noteI >= 0 ? String(r[noteI] || "").trim() : ""
              });
            }
          } else {
            /* 无表头：假定 序号/院校代码/院校名称/专业代码/专业名称 顺序 */
            for (var j = 1; j < rows.length; j++) {
              var rr = rows[j];
              if (!rr[1] || !rr[3]) continue;
              entries.push({
                seq: parseInt(rr[0], 10) || j,
                schoolCode: norm(rr[1], 4),
                schoolName: String(rr[2] || "").trim(),
                majorCode: norm(rr[3], 3),
                majorName: String(rr[4] || "").trim(),
                duration: "",
                mark: null,
                note: ""
              });
            }
          }
          entries.sort(function (a, b) { return a.seq - b.seq; });
          resolve(entries);
        } catch (err) { reject(err); }
      };
      reader.onerror = function () { reject(new Error("文件读取失败")); };
      reader.readAsArrayBuffer(file);
    });
  }

  /* ---------- 匹配（复刻 exe：int(最低位次) >= 我的位次 → 录取） ---------- */
  function runMatch(entries, rank, year) {
    var admitted = null;
    var rows = entries.map(function (v) {
      var lines = window.GK.data.findLines(year, v.schoolCode, v.majorCode);
      var line = lines.length ? lines[0] : null;
      var weici = line ? line[6] : null;
      var status;
      if (weici == null) status = { type: "none", text: "无数据" };
      else if (rank <= weici) status = { type: "ok", text: "达标 · 录取" };
      else status = { type: "no", text: "未达标" };
      var out = {
        seq: v.seq,
        school: v.schoolName || (line ? line[2] : v.schoolCode),
        schoolCode: v.schoolCode,
        major: v.majorName || (line ? line[3] : v.majorCode),
        majorCode: v.majorCode,
        weici: weici,
        status: status
      };
      if (status.type === "ok" && !admitted) admitted = out;
      return out;
    });
    lastResult = { entries: entries, rows: rows, rank: rank, year: year, admitted: admitted };
    renderResult();
  }

  function renderResult() {
    var r = lastResult;
    var card = document.getElementById("simResult");
    card.hidden = false;
    var tableCard = document.getElementById("simTableCard");
    tableCard.hidden = false;

    if (r.admitted) {
      card.className = "sim-result ok";
      card.innerHTML =
        '<span class="sr-badge"><span data-icon="check"></span>模拟录取</span>' +
        "<h2>第 " + r.admitted.seq + " 志愿 · " + window.GK.plan.esc(r.admitted.school) + "</h2>" +
        '<div class="sr-sub">' + window.GK.plan.esc(r.admitted.major) + "</div>" +
        '<div class="sr-line">' + r.year + " 年投档最低位次 " + r.admitted.weici + " ≤ 你的位次 " + r.rank + "，按志愿顺序第一个达标。</div>";
    } else {
      card.className = "sim-result fail";
      card.innerHTML =
        '<span class="sr-badge"><span data-icon="alert"></span>模拟结果</span>' +
        "<h2>全部志愿未达标</h2>" +
        '<div class="sr-sub">你的位次 ' + r.rank + " 未达到任何志愿的投档最低位次，模拟滑档。</div>" +
        '<div class="sr-line">请核对位次或补充投档线数据（部分专业本轮投档人数未满，位次为空）。</div>';
    }
    window.GKIcon.mount(card);

    var tbody = document.getElementById("simBody");
    var html = "";
    r.rows.forEach(function (row) {
      var cls = row.status.type === "ok" ? "grade-2" : row.status.type === "no" ? "grade-1" : "grade-0";
      html += "<tr>" +
        '<td class="col-seq">' + row.seq + "</td>" +
        '<td><span class="school-name">' + window.GK.plan.esc(row.school) + '</span> <span class="muted">(' + row.schoolCode + ")</span></td>" +
        '<td>' + window.GK.plan.esc(row.major) + ' <span class="muted">(' + row.majorCode + ")</span></td>" +
        '<td class="col-num">' + (row.weici == null ? "-" : row.weici) + "</td>" +
        '<td class="col-grade"><span class="grade-pill ' + cls + '">' + row.status.text + "</span></td>" +
        "</tr>";
    });
    tbody.innerHTML = html;
  }

  function exportResult() {
    if (!lastResult || !window.XLSX) { window.GK.toast("暂无可导出的结果", "error"); return; }
    var r = lastResult;
    var rows = [["序号", "院校代码", "院校名称", "专业代码", "专业名称", "最低位次", "匹配结果"]];
    r.rows.forEach(function (row) {
      rows.push([row.seq, row.schoolCode, row.school, row.majorCode, row.major, row.weici == null ? "" : row.weici, row.status.text]);
    });
    var ws = window.XLSX.utils.aoa_to_sheet(rows);
    var wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "匹配结果");
    window.XLSX.writeFile(wb, "录取模拟结果-" + r.year + ".xlsx");
    window.GK.toast("已导出结果", "success");
  }

  window.GK = window.GK || {};
  window.GK.simulate = {
    init: init,
    refresh: refresh,
    /* 供「导入志愿」复用：按扩展名分发 PDF / Excel 解析 */
    parseFile: function (file) {
      var ext = (file.name || "").split(".").pop().toLowerCase();
      return ext === "pdf" ? parsePdf(file) : parseExcel(file);
    }
  };
})();
