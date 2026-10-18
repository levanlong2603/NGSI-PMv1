"use strict";
/* Lưu thời gian đầu việc có lan truyền theo công thức (engine: core/schedule.js, máy chủ tự tính lại ở
   POST /api/doc/projects/:id/schedule). Gọi từ taskForm() (plan.js):
   1) xem trước ở máy chủ → không việc nào khác bị ảnh hưởng thì lưu luôn;
   2) có ảnh hưởng → modal "Các đầu việc bị ảnh hưởng": Áp dụng toàn bộ / Chỉ việc này / Hủy;
   3) lưu xong nháy sáng các dòng vừa đổi trên bảng (S.schedFlash, đọc ở planTaskRow()).
   Modal KHÔNG dùng #layer (đang chứa form đầu việc mở phía sau) mà tự gắn 1 lớp riêng vào body, nổi trên
   drawer (z-index 35/36 > 31, dưới toast 40). */
const SCHED_TYPE_HINT = {
  FS:"Bắt đầu = Kết thúc của việc phụ thuộc + lệch.",
  SS:"Bắt đầu = Bắt đầu của việc phụ thuộc + lệch.",
  FF:"Kết thúc = Kết thúc của việc phụ thuộc + lệch, Bắt đầu tính ngược theo Số ngày."
};
const SCHED_FIELD_LABEL = {start:"Bắt đầu", end:"Kết thúc", dur:"Số ngày"};
const SCHED_FIELDS = ["daysActual", "daysProposed", ...SCHED.DATE_FIELDS];

function schedTaskLabel(p, id){
  const t = (p.tasks||[]).find(x => x.id===id);
  return t ? `${t.no ? t.no+". " : ""}${t.dv || "(chưa đặt tên)"}` : "(đầu việc đã xoá)";
}
/* Mô tả quy tắc riêng của 1 bộ kế hoạch (thường có từ lúc nhập Excel) để người dùng biết vì sao ngày được
   tính như vậy – form chưa có ô sửa riêng từng quy tắc, chỉ giữ nguyên khi lưu. */
function schedRuleHint(raw, pk, p){
  if(!raw) return "";
  const sc = raw.sched || {}, pl = SCHED.PLAN[pk], o = (sc.plans || {})[pk] || {}, out = [];
  const st = o.start, en = o.end;
  if(st && st.k==="copy") out.push(`Bắt đầu = Bắt đầu của ${SCHED.PLAN[st.plan].label}`);
  else if(st && st.k==="dep") out.push(`Phụ thuộc riêng: ${st.type || sc.type || "FS"} theo ${schedTaskLabel(p, st.pred || sc.pred)}${st.plan && st.plan!==pk ? ` (${SCHED.PLAN[st.plan].label})` : ""}${+st.lag ? ` ${st.lag>0?"+":""}${st.lag} ngày` : ""}`);
  else if(st && st.k==="none") out.push("Bắt đầu nhập tay");
  if(en && en.k==="copy") out.push(`Kết thúc = Kết thúc của ${SCHED.PLAN[en.plan].label}`);
  else if(en && en.k==="dur" && (en.src || en.days!=null)) out.push(`Kết thúc = Bắt đầu + ${en.days!=null ? en.days+" ngày" : SCHED.DUR_FIELDS[en.src]}`);
  else if(en && en.k==="none") out.push("Kết thúc nhập tay");
  const l = sc.lock || {};
  const locked = [l[pl.start] && "Bắt đầu", l[pl.end] && "Kết thúc"].filter(Boolean);
  if(locked.length===1) out.push(`Đang khoá: ${locked[0]}`);
  return out.join(" · ");
}
function schedLockMode(raw, pk){
  const l = (raw && raw.sched && raw.sched.lock) || {}, pl = SCHED.PLAN[pk];
  return l[pl.start] && l[pl.end] ? "lock" : (l[pl.start] || l[pl.end]) ? "part" : "auto";
}
/* Dựng task.sched từ các ô của form, GIỮ NGUYÊN phần form không có ô sửa (quy tắc riêng từng bộ). */
function schedFromForm(raw, x, hasKids, detectedKind){
  const s = JSON.parse(JSON.stringify((raw && raw.sched) || {}));
  if(x.dep_pred){ s.pred = x.dep_pred; s.type = x.dep_type || "FS"; s.lag = Math.round(+x.dep_lag || 0); }
  else { delete s.pred; delete s.type; delete s.lag; }
  const lock = {...(s.lock || {})};
  for(const pk of ["hd", "adj", "exp"]){
    const pl = SCHED.PLAN[pk], m = x["mode_"+pk];
    if(m==="lock"){ lock[pl.start] = true; lock[pl.end] = true; }
    else if(m==="auto"){ delete lock[pl.start]; delete lock[pl.end]; }
  }
  if(Object.keys(lock).length) s.lock = lock; else delete s.lock;
  if(hasKids && x.kind && x.kind!==detectedKind) s.kind = x.kind;
  return Object.keys(s).length ? s : null;
}
/* Có đổi gì liên quan tới lịch không (ngày, Số ngày, phụ thuộc/khoá) – không đổi thì taskForm lưu theo đường cũ. */
function schedTouched(raw, body){
  const n = v => v==null || v==="" ? null : v;
  if(!raw) return SCHED_FIELDS.some(f => n(body[f])!=null) || !!body.sched;
  return SCHED_FIELDS.some(f => n(raw[f])!==n(body[f])) || JSON.stringify(raw.sched || null)!==JSON.stringify(body.sched || null);
}

function schedFlash(ids){
  S.schedFlash = {ids:new Set(ids || []), until:Date.now() + 3500};
  setTimeout(() => { S.schedFlash = null; render(); }, 3600);
}

function schedPreviewModal(p, task, pv){
  return new Promise(resolve => {
    const tr = SCHED.tree(p.tasks || []);
    const order = new Map((p.tasks || []).map((t, i) => [t.id, i]));
    const byTask = new Map();
    for(const c of pv.changes){ if(!byTask.has(c.taskId)) byTask.set(c.taskId, []); byTask.get(c.taskId).push(c); }
    const groupOf = id => {
      const names = []; let cur = tr.parent.get(id);
      while(cur){ if((tr.level.get(cur) || 9) <= 2) names.unshift(schedTaskLabel(p, cur)); cur = tr.parent.get(cur); }
      return names.join(" › ") || "Không thuộc nhóm";
    };
    const fmt = (c, v) => v==null ? "–" : c.field==="dur" ? `${v} ngày` : dmy(v);
    const delta = d => d==null || d===0 ? '<span class="muted">–</span>' : `<span class="sched-d ${d>0?"late":"early"}">${d>0?"+":"−"}${Math.abs(d)} ngày</span>`;
    const rows = (list, self) => list.map((c, i) => `<tr${self?' class="sched-self"':""}>
      ${i===0 ? `<td rowspan="${list.length}" class="sched-no">${esc(c.no || "")}</td><td rowspan="${list.length}" class="sched-dv">${esc(c.dv || "")}${self?' <span class="pill info">Đang sửa</span>':""}</td>` : ""}
      <td>${esc(c.plan==="dur" ? "Thời gian (ngày)" : c.planLabel)}</td>
      <td>${esc(c.plan==="dur" ? c.planLabel.replace(/^Thời gian t/, "T") : SCHED_FIELD_LABEL[c.field])}</td>
      <td class="sched-ov">${esc(fmt(c, c.old))} → <b>${esc(fmt(c, c.new))}</b></td><td>${delta(c.delta)}</td></tr>`).join("");
    let body = byTask.has(task.id) ? rows(byTask.get(task.id), true) : "";
    let lastGroup = null;
    for(const id of [...byTask.keys()].filter(id => id!==task.id).sort((a, b) => (order.get(a) ?? 1e9) - (order.get(b) ?? 1e9))){
      const g = groupOf(id);
      if(g!==lastGroup){ body += `<tr class="sched-grp"><td colspan="6">${esc(g)}</td></tr>`; lastGroup = g; }
      body += rows(byTask.get(id), false);
    }
    const ends = ["hd", "adj", "exp"].map(pk => {
      const e = pv.projectEnd[pk];
      return !e || e.old===e.new ? "" : `<li>${esc(SCHED.PLAN[pk].label)}: ${dmy(e.old)} → <b>${dmy(e.new)}</b> ${delta(SCHED.diffDays(e.old, e.new))}</li>`;
    }).filter(Boolean);
    const skipRows = pv.skipped.map(s => `<tr><td class="sched-no">${esc(s.no)}</td><td class="sched-dv">${esc(s.dv)}</td><td>${esc(s.planLabel)}</td><td>${esc(SCHED_FIELD_LABEL[s.field])}</td>
      <td class="sched-ov">${esc(s.current ? dmy(s.current) : "–")} <span class="muted">(theo công thức ${esc(dmy(s.would))})</span></td><td>${esc(s.reason)}</td></tr>`).join("");
    const host = document.createElement("div");
    host.className = "sched-layer";
    host.innerHTML = `<div class="sched-scrim" data-sc="cancel"></div>
      <div class="sched-modal" role="dialog" aria-modal="true" aria-labelledby="schedT">
        <div class="sched-h">
          <h2 id="schedT">Các đầu việc bị ảnh hưởng</h2>
          <div class="small muted">Sửa “${esc(schedTaskLabel(p, task.id)==="(đầu việc đã xoá)" ? (task.dv || "đầu việc mới") : schedTaskLabel(p, task.id))}” làm thay đổi <b>${pv.affected.length}</b> đầu việc khác ·
            Ngày kết thúc dự án: <b>${ends.length ? "có thay đổi" : "không đổi"}</b></div>
          ${ends.length ? `<ul class="sched-end">${ends.join("")}</ul>` : ""}
        </div>
        <div class="sched-b">
          <div class="tbl-wrap"><table class="sched-tbl"><thead><tr><th>No.</th><th>Đầu việc</th><th>Bộ kế hoạch</th><th>Trường</th><th>Cũ → Mới</th><th>Chênh lệch</th></tr></thead>
            <tbody>${body || '<tr><td colspan="6" class="muted">Không có ngày nào thay đổi.</td></tr>'}</tbody></table></div>
          ${skipRows ? `<h3 class="sched-sub">Không tự đổi (${pv.skipped.length})</h3>
            <div class="tbl-wrap"><table class="sched-tbl"><thead><tr><th>No.</th><th>Đầu việc</th><th>Bộ kế hoạch</th><th>Trường</th><th>Hiện tại</th><th>Lý do</th></tr></thead><tbody>${skipRows}</tbody></table></div>` : ""}
          ${pv.notes.length ? `<ul class="sched-notes">${pv.notes.map(n => `<li>${esc(n.text)}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="sched-f">
          <button class="btn" type="button" data-sc="cancel">Hủy</button>
          <div class="toolbar">
            <button class="btn" type="button" data-sc="self" title="Chỉ lưu việc đang sửa (và dòng nhóm cha). Các việc phụ thuộc giữ ngày cũ, được đánh dấu “Lệch lịch với việc phụ thuộc”.">Chỉ việc này</button>
            <button class="btn primary" type="button" data-sc="all">Áp dụng toàn bộ</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(host);
    const onKey = e => { if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); done("cancel"); } };
    const done = v => { host.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    document.addEventListener("keydown", onKey, true);
    host.addEventListener("click", e => { const b = e.target.closest("[data-sc]"); if(b) done(b.dataset.sc); });
    host.querySelector('[data-sc="all"]').focus();
  });
}

/* Trả true = đã lưu, false = người dùng bấm Hủy ở modal (opts.onCancel được gọi). Lỗi (vòng phụ thuộc, dự án
   vừa bị người khác sửa – 409…) ném Error để form đầu việc giữ nguyên, bấm Lưu lại sẽ xem trước lại. */
async function schedSave(p, task, opts = {}){
  const url = `/api/doc/projects/${encodeURIComponent(p.id)}/schedule`;
  let pv;
  try{ pv = await S.db.api("POST", url, {mode:"preview", task, scope:"all", force:!!opts.force}); }
  catch(e){ throw new Error((e && e.message) || "Không tính được lịch mới."); }
  const others = pv.affected.length > 0 || pv.skipped.some(s => s.taskId!==task.id);
  if(opts.force && !pv.changes.length){ toast("Đầu việc đã khớp công thức, không có gì thay đổi."); return true; }
  let scope = "all";
  if(others){
    scope = await schedPreviewModal(p, task, pv);
    if(scope==="cancel"){ if(opts.onCancel) opts.onCancel(); return false; }
  }
  let r;
  try{ r = await S.db.api("POST", url, {mode:"apply", task, scope, force:!!opts.force, baseVersion:pv.version}); }
  catch(e){ throw new Error((e && e.message) || "Lưu không thành công, thử lại sau."); }
  schedFlash(r.changedTaskIds);
  const n = (r.changedTaskIds || []).filter(id => id!==task.id).length;
  toast(scope==="self" ? "Đã lưu riêng đầu việc này – việc phụ thuộc giữ ngày cũ (đánh dấu “Lệch lịch”)."
    : n ? `Đã lưu và cập nhật thêm ${n} đầu việc.` : "Đã lưu đầu việc");
  if(pv.notes.length && !others) setTimeout(() => toast(pv.notes.map(x => x.text).join(" ")), 2600);
  return true;
}
async function schedSync(p, raw){
  try{ await schedSave(p, {...raw}, {force:true}); }
  catch(e){ toast(e.message); }
}

/* ===== "Gắn phụ thuộc từ Excel" cho dự án ĐÃ CÓ (nhập trước khi có tính năng này, mất công thức) =====
   Chọn lại đúng file Excel tiến độ gốc → đọc các dòng thành đầu việc theo CÙNG quy tắc "Nhập Excel"
   (planXlsRows(), plan.js) → khớp lần lượt với đầu việc của dự án theo No. + tên (tiến dần, không quay lại)
   → SCHED.fromExcel() chuyển công thức thành task.sched → bỏ phụ thuộc gây vòng → xem trước thống kê → lưu.
   CHỈ thay task.sched của các đầu việc khớp được, KHÔNG đổi ngày/Số ngày nào (công thức Excel tái hiện đúng
   ngày đang lưu – đã thử trên 3 dự án thật: 0 việc báo lệch lịch sau khi gắn). */
ACTIONS["schedxls"] = () => { const el = document.getElementById("schedXlsFile"); if(el) el.click(); };
document.getElementById("main").addEventListener("change", e => {
  if(e.target.id!=="schedXlsFile" || !e.target.files[0]) return;
  const file = e.target.files[0], pid = e.target.dataset.pid;
  e.target.value = "";
  schedAttachExcel(pid, file);
});
async function schedAttachExcel(pid, file){
  const p = M.pById.get(pid);
  if(!p || !canManageProject(p)) return;
  toast("Đang đọc file…");
  let rep;
  try{
    const {rows} = planXlsRows(await planReadWorkbook(file));
    const n = s => String(s||"").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
    const tasks = p.tasks || [];
    const matched = [], unmatched = [];
    let j = 0;
    for(const r of rows){
      let k = j;
      while(k < tasks.length && !(n(tasks[k].no)===n(r.no) && n(tasks[k].dv)===n(r.dv))) k++;
      if(k < tasks.length){ matched.push({row:r.row, id:tasks[k].id, cells:xlsSchedCells(r.r)}); j = k + 1; }
      else unmatched.push(r);
    }
    if(!matched.length) throw new Error("không khớp được dòng nào trong file với đầu việc của dự án này – kiểm tra đúng file của dự án.");
    const xs = SCHED.fromExcel(matched);
    const ids = new Set(matched.map(m => m.id));
    const next = tasks.map(t => {
      if(!ids.has(t.id)) return t;
      const o = {...t}, s = xs.sched.get(t.id);
      if(s) o.sched = s; else delete o.sched;
      return o;
    });
    const dc = SCHED.dropCycles(next);
    rep = {p, file, rows, matched, unmatched, xs, tasks:dc.tasks, dropped:dc.dropped, drift:SCHED.drift(dc.tasks),
      replaced:tasks.filter(t => ids.has(t.id) && t.sched).length};
  }catch(e){ toast("Không gắn được phụ thuộc: " + (e.message || "lỗi không xác định")); return; }
  schedAttachConfirm(rep);
}
function schedAttachConfirm(rep){
  const {p, xs} = rep, st = xs.stats;
  const withSched = rep.tasks.filter(t => t.sched && (t.sched.pred || t.sched.plans)).length;
  const list = (arr, fmt, max = 8) => arr.length ? `<ul class="sched-list">${arr.slice(0, max).map(x => `<li>${fmt(x)}</li>`).join("")}${arr.length > max ? `<li class="muted">… và ${arr.length - max} mục khác</li>` : ""}</ul>` : "";
  const label = id => esc(schedTaskLabel(p, id));
  const info = `<div class="kv" style="margin-bottom:12px">
      <dt>File</dt><dd>${esc(rep.file.name)}</dd>
      <dt>Khớp dòng ↔ đầu việc</dt><dd><b>${rep.matched.length}</b>/${rep.rows.length} dòng${rep.unmatched.length ? ` · <span class="pill warn">${rep.unmatched.length} dòng không khớp</span>` : ""}</dd>
      <dt>Đầu việc có công thức</dt><dd><b>${withSched}</b> – nối tiếp (FS) ${st.dep.FS}, song song (SS) ${st.dep.SS}, kết thúc cùng (FF) ${st.dep.FF} liên kết; copy giữa các bộ kế hoạch ${st.copy}; ngày gõ tay được khoá ${st.lock}</dd>
      <dt>Sau khi gắn</dt><dd>${rep.drift.size ? `<span class="pill warn">${rep.drift.size} việc báo “Lệch lịch”</span> (ngày đang lưu khác công thức – dùng “Đồng bộ lại theo công thức” nếu muốn)` : '<span class="pill ok">Khớp hoàn toàn công thức</span>'} · <b>không đổi ngày nào</b></dd>
      ${rep.replaced ? `<dt>Thay phụ thuộc cũ</dt><dd>${rep.replaced} đầu việc đã có phụ thuộc sẽ được thay theo file</dd>` : ""}
    </div>
    ${rep.unmatched.length ? `<div class="hint" style="margin-bottom:4px">Dòng trong file không tìm thấy đầu việc tương ứng (đã đổi tên/xoá trên web) – bỏ qua:</div>${list(rep.unmatched, r => `Dòng ${r.row}: ${esc(r.no)}. ${esc(r.dv)}`)}` : ""}
    ${st.missing.length ? `<div class="hint" style="margin-bottom:4px">Công thức trỏ tới dòng không thành đầu việc (No. trống, bị bỏ khi nhập) – ô đó giữ nguyên ngày:</div>${list(st.missing, m => `Ô ${m.col}${m.row}: ${esc(m.formula)}`)}` : ""}
    ${st.unsupported.length ? `<div class="hint" style="margin-bottom:4px">Công thức chưa hỗ trợ – giữ nguyên ngày (ô Kết thúc có ngày thì khoá):</div>${list(st.unsupported, u => `Ô ${u.col}${u.row}: ${esc(u.formula)}`)}` : ""}
    ${rep.dropped.length ? `<div class="hint" style="margin-bottom:4px">Bỏ phụ thuộc vì gây vòng (vd việc con theo dòng nhóm tự tính):</div>${list(rep.dropped, id => label(id))}` : ""}`;
  openForm({
    title:"Gắn phụ thuộc từ Excel", subtitle:p.name, values:{}, fields:[], info,
    saveLabel:"Gắn phụ thuộc",
    onSave: async () => {
      const cur = M.pById.get(p.id) || p;
      const bySched = new Map(rep.tasks.map(t => [t.id, t.sched]));
      const ids = new Set(rep.matched.map(m => m.id).concat(rep.dropped));
      await saveProject({...cur, tasks:(cur.tasks || []).map(t => {
        if(!ids.has(t.id)) return t;
        const o = {...t}, s = bySched.get(t.id);
        if(s) o.sched = s; else delete o.sched;
        return o;
      })});
      toast(`Đã gắn công thức tính lịch cho ${withSched} đầu việc.`);
    }
  });
}
