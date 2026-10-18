"use strict";
/* Engine tính lại lịch đầu việc theo công thức – THUẦN tính toán (không đọc S/M, không đụng DOM/CSDL), dùng
   chung cho trình duyệt (classic script, biến toàn cục SCHED) và máy chủ (require trên Node) để máy chủ tự
   tính lại đúng cùng công thức khi lưu, không tin danh sách thay đổi trình duyệt gửi lên.

   Quy tắc rút ra từ công thức thật của 3 file Excel tiến độ (sheet NGSI, xem CLAUDE.md):
   - Trong 1 dòng: Kết thúc = Bắt đầu + Số ngày (I=H+F, K=J+F, M=L+G). Số ngày F dùng cho HĐ + HĐ điều chỉnh,
     G dùng cho Dự kiến + Thực tế.
   - Giữa các dòng (cùng bộ kế hoạch): FS Bắt đầu = Kết thúc việc trước + lệch; SS Bắt đầu = Bắt đầu việc
     trước + lệch; FF Kết thúc = Kết thúc việc trước + lệch, Bắt đầu = Kết thúc − Số ngày.
   - Giữa các bộ trong cùng 1 dòng: "copy" (vd HĐ điều chỉnh = HĐ, Thực tế = Dự kiến).
   - Dòng nhóm (có việc con theo cột No.) KHÔNG nhập Số ngày riêng → Bắt đầu = MIN, Kết thúc = MAX của con.
   Chỉ tính lại những gì BỊ ẢNH HƯỞNG bởi lần sửa (lan truyền theo thứ tự topo) – không tự "sửa" dữ liệu cũ
   không liên quan dù dữ liệu đó không khớp công thức.

   task.sched (tuỳ chọn, dữ liệu cũ không có = không phụ thuộc gì, giữ nguyên hành vi cũ):
     { pred, type:"FS"|"SS"|"FF", lag,                     – phụ thuộc dùng chung cho cả 4 bộ
       plans:{hd|adj|exp|act:{start:RULE, end:RULE}},       – ghi đè riêng từng bộ
       lock:{<tên trường ngày>:true},                       – ngày nhập tay, không bị lan truyền ghi đè
       kind:"summary"|"task" }                              – ép kiểu dòng nhóm/việc thường
     RULE Bắt đầu: {k:"dep", pred, type, lag, plan?} | {k:"copy", plan} | {k:"none"}
     RULE Kết thúc: {k:"dur", src?, days?} | {k:"copy", plan} | {k:"none"} */
const SCHED = (() => {
  /* ===== Quy ước ngày – MỘT chỗ duy nhất =====
     Kết thúc = Bắt đầu + Số ngày + END_OFFSET. 0 = "N ngày sau" (khớp I=H+F của Excel, Số ngày 0 = mốc
     cùng ngày). Tính theo ngày lịch trên chuỗi YYYY-MM-DD quy về số ngày UTC – không dùng Date có giờ nên
     không lệch theo múi giờ trình duyệt/máy chủ. Muốn đổi sang ngày làm việc: chỉ sửa addDays/diffDays. */
  const END_OFFSET = 0;
  const DAY = 864e5;
  const toNum = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? Date.UTC(+m[1], +m[2]-1, +m[3]) / DAY : null; };
  const fromNum = n => { const d = new Date(n * DAY); return d.getUTCFullYear() + "-" + String(d.getUTCMonth()+1).padStart(2,"0") + "-" + String(d.getUTCDate()).padStart(2,"0"); };
  function addDays(s, n){ const v = toNum(s); return v==null || n==null || !isFinite(n) ? null : fromNum(v + Math.round(n)); }
  function diffDays(a, b){ const x = toNum(a), y = toNum(b); return x==null || y==null ? null : y - x; }
  const endOf = (start, dur) => dur==null ? null : addDays(start, dur + END_OFFSET);
  const durOf = (start, end) => { const d = diffDays(start, end); return d==null ? null : d - END_OFFSET; };
  const normDate = v => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) ? v.slice(0,10) : null;
  const normDur = v => (v==null || v==="" || !isFinite(+v)) ? null : +v;

  const PLANS = [
    {key:"hd",  label:"Kế hoạch theo HĐ",       start:"hdStart",  end:"deadline", dur:"daysActual"},
    {key:"adj", label:"Kế hoạch HĐ điều chỉnh", start:"adjStart", end:"adjEnd",   dur:"daysActual"},
    {key:"exp", label:"Kế hoạch dự kiến",       start:"expStart", end:"expEnd",   dur:"daysProposed"},
    {key:"act", label:"Kế hoạch thực tế",       start:"actStart", end:"actEnd",   dur:"daysProposed", actual:true},
  ];
  const PLAN = Object.fromEntries(PLANS.map(p => [p.key, p]));
  const DUR_FIELDS = {daysActual:"Thời gian theo HĐ (F)", daysProposed:"Thời gian theo đề xuất (G)"};
  /* Sửa Kết thúc ở bộ "chủ" của Số ngày (HĐ cho F, Dự kiến cho G) → tính lại Số ngày. Sửa Kết thúc ở bộ
     phụ (HĐ điều chỉnh, Thực tế) → coi là nhập tay (khoá), KHÔNG kéo theo Số ngày dùng chung – nếu không,
     sửa ngày điều chỉnh sẽ làm dịch luôn Kế hoạch theo HĐ gốc. */
  const DUR_OWNER = {daysActual:"hd", daysProposed:"exp"};
  const DONE = "Hoàn thành";

  /* ===== Phân cấp theo cột No. =====
     Chữ cái A-Z (trừ I/V/X – luôn là số La Mã, cùng quy ước msLetterNo() ở model.js) = cấp 1, La Mã = cấp 2,
     "1" = 3, "1.1" = 4, "1.1.1" = 5, "1.1.1.1" = 6… Cha = dòng gần nhất phía trên có cấp nhỏ hơn. Dòng No.
     trống/chữ tự do = con của dòng có số gần nhất phía trên, KHÔNG làm cha của dòng trống kế tiếp. */
  const ROMAN = new Set(["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"]);
  function levelOf(no){
    const s = String(no ?? "").trim();
    if(!s) return null;
    if(ROMAN.has(s.toUpperCase())) return 2;
    if(/^[A-Za-z]$/.test(s)) return 1;
    if(/^\d+(\.\d+)*\.?$/.test(s)) return 2 + s.replace(/\.$/, "").split(".").length;
    return null;
  }
  function tree(tasks){
    const parent = new Map(), children = new Map(), level = new Map();
    const stack = [];
    for(const t of tasks){
      const lv = levelOf(t.no);
      if(lv == null){
        const top = stack[stack.length-1];
        level.set(t.id, top ? top.level + 1 : 1);
        if(top){ parent.set(t.id, top.id); children.get(top.id).push(t.id); }
        continue;
      }
      while(stack.length && stack[stack.length-1].level >= lv) stack.pop();
      const top = stack[stack.length-1];
      level.set(t.id, lv);
      children.set(t.id, []);
      if(top){ parent.set(t.id, top.id); children.get(top.id).push(t.id); }
      stack.push({id:t.id, level:lv});
    }
    for(const t of tasks) if(!children.has(t.id)) children.set(t.id, []);
    return {parent, children, level};
  }
  function isSummary(t, tr){
    if(!(tr.children.get(t.id) || []).length) return false;
    const k = t.sched && t.sched.kind;
    if(k === "task") return false;
    if(k === "summary") return true;
    return normDur(t.daysActual) == null && normDur(t.daysProposed) == null;
  }

  function startRule(t, pk){
    const s = t.sched || {};
    const o = s.plans && s.plans[pk] && s.plans[pk].start;
    if(o && o.k){
      if(o.k === "dep") return {k:"dep", pred:o.pred || s.pred, type:o.type || s.type || "FS", lag:+(o.lag ?? 0) || 0, plan:o.plan};
      return o;
    }
    if(s.pred) return {k:"dep", pred:s.pred, type:s.type || "FS", lag:+s.lag || 0};
    return {k:"none"};
  }
  function endRule(t, pk){
    const o = t.sched && t.sched.plans && t.sched.plans[pk] && t.sched.plans[pk].end;
    return o && o.k ? o : {k:"dur"};
  }
  const clone = v => v == null ? v : JSON.parse(JSON.stringify(v));

  function inputsOf(t, pl, byId, summary, tr){
    const ins = [];
    if(summary.has(t.id)){
      for(const c of tr.children.get(t.id)) ins.push({n:c + "|" + pl.key, kind:"child"});
      return ins;
    }
    const r = startRule(t, pl.key);
    if(r.k === "dep" && byId.has(r.pred)) ins.push({n:r.pred + "|" + (r.plan || pl.key), kind: r.pred === t.id ? "copy" : "dep"});
    if(r.k === "copy" && PLAN[r.plan]) ins.push({n:t.id + "|" + r.plan, kind:"copy"});
    const e = endRule(t, pl.key);
    if(e.k === "copy" && PLAN[e.plan]) ins.push({n:t.id + "|" + e.plan, kind:"copy"});
    return ins;
  }

  /* Sắp xếp topo các nút (việc|bộ kế hoạch). Còn sót nút = có vòng phụ thuộc → trả về đúng các việc nằm
     trong vòng (bóc dần nút không còn trỏ tiếp vào phần còn lại để bỏ các nút chỉ đứng sau vòng). */
  function topo(tasks, byId, summary, tr){
    const nodes = [], ins = new Map(), outs = new Map(), indeg = new Map();
    for(const t of tasks) for(const pl of PLANS){
      const n = t.id + "|" + pl.key;
      nodes.push(n); outs.set(n, []); indeg.set(n, 0);
    }
    for(const t of tasks) for(const pl of PLANS){
      const n = t.id + "|" + pl.key;
      const list = inputsOf(t, pl, byId, summary, tr).filter(i => outs.has(i.n));
      ins.set(n, list);
      for(const i of list){ outs.get(i.n).push(n); indeg.set(n, indeg.get(n) + 1); }
    }
    const order = [], q = nodes.filter(n => indeg.get(n) === 0);
    const deg = new Map(indeg);
    while(q.length){
      const n = q.shift(); order.push(n);
      for(const m of outs.get(n)){ deg.set(m, deg.get(m) - 1); if(deg.get(m) === 0) q.push(m); }
    }
    if(order.length === nodes.length) return {order, ins};
    const rest = new Set(nodes.filter(n => deg.get(n) > 0));
    let shrunk = true;
    while(shrunk){
      shrunk = false;
      for(const n of [...rest]) if(!outs.get(n).some(m => rest.has(m))){ rest.delete(n); shrunk = true; }
    }
    return {cycle:[...new Set([...rest].map(n => n.split("|")[0]))]};
  }

  /* recalc(tasks, edit, opts)
     - tasks: mảng đầu việc THÔ của 1 dự án theo đúng thứ tự (p.tasks).
     - edit: {taskId, set:{trường: giá trị mới, … , sched?}} – chỉ trường KHÁC giá trị cũ mới tính là "đã sửa"
       (form gửi lên cả bộ trường, engine tự so).
     - opts.scope: "all" (mặc định, lan truyền tới việc phụ thuộc) | "self" (chỉ việc này + dòng nhóm cha).
     - opts.status: {taskId: trạng thái hiện tại} – dùng cho quy tắc "Hoàn thành không đổi ngày thực tế".
     - opts.force: tính lại Bắt đầu của việc đang sửa theo quy tắc dù không sửa gì ("Đồng bộ lại theo công thức").
     Trả {ok, tasks, changes, skipped, projectEnd, affected, notes} hoặc {ok:false, error}. */
  function recalc(tasksIn, edit, opts = {}){
    const scope = opts.scope || "all";
    const statusOf = id => (opts.status && opts.status[id]) || "";
    const origById = new Map(tasksIn.map(t => [t.id, t]));
    const tasks = tasksIn.map(t => ({...t, sched: clone(t.sched)}));
    const byId = new Map(tasks.map(t => [t.id, t]));
    const notes = [];
    let E = null;
    const pinned = new Set();
    let ruleChanged = !!opts.force;
    if(edit && edit.taskId){
      E = byId.get(edit.taskId);
      if(!E) return {ok:false, error:{type:"notfound", message:"Không tìm thấy đầu việc cần sửa."}};
      const O = origById.get(E.id);
      for(const [k, v] of Object.entries(edit.set || {})){
        if(k === "sched"){
          if(JSON.stringify(v || null) !== JSON.stringify(O.sched || null)){ E.sched = clone(v); ruleChanged = true; }
          continue;
        }
        if(DUR_FIELDS[k]){ const nv = normDur(v); if(nv !== normDur(O[k])){ E[k] = nv; pinned.add(k); } continue; }
        if(PLANS.some(p => p.start === k || p.end === k)){ const nv = normDate(v); if(nv !== normDate(O[k])){ E[k] = nv; pinned.add(k); } continue; }
        if(v !== O[k]) E[k] = v;
      }
    }
    const tr = tree(tasks);
    const summary = new Set(tasks.filter(t => isSummary(t, tr)).map(t => t.id));
    const tp = topo(tasks, byId, summary, tr);
    if(tp.cycle){
      const names = tp.cycle.map(id => { const t = byId.get(id); return (t.no ? t.no + ". " : "") + (t.dv || id); });
      return {ok:false, error:{type:"cycle", taskIds:tp.cycle, message:"Có vòng phụ thuộc giữa các đầu việc: " + names.join(" → ") + ". Hãy bỏ bớt 1 phụ thuộc."}};
    }

    /* Việc đang sửa: suy ra phần còn lại của dòng theo đúng quy tắc 2.2 trước khi lan truyền. */
    const affectedPlans = new Set();
    if(E && !summary.has(E.id)){
      if(!E.sched) E.sched = {};
      for(const pl of PLANS){
        const sP = pinned.has(pl.start), eP = pinned.has(pl.end), dP = pinned.has(pl.dur);
        if(sP || eP || dP) affectedPlans.add(pl.key);
        if(eP && !dP){
          if(DUR_OWNER[pl.dur] === pl.key){
            const d = durOf(normDate(E[pl.start]), normDate(E[pl.end]));
            if(d != null && d !== normDur(E[pl.dur])){ E[pl.dur] = d; for(const q of PLANS) if(q.dur === pl.dur) affectedPlans.add(q.key); }
          } else if(!pl.actual){
            E.sched.lock = {...(E.sched.lock || {}), [pl.end]:true};
            notes.push({taskId:E.id, text:`Khoá "${pl.label} – Kết thúc" (nhập tay, không đổi Số ngày dùng chung với Kế hoạch theo HĐ).`});
          }
        }
        if(sP && startRule(E, pl.key).k !== "none" && !ruleChanged && !pl.actual){
          E.sched.lock = {...(E.sched.lock || {}), [pl.start]:true};
          notes.push({taskId:E.id, text:`Khoá "${pl.label} – Bắt đầu" (nhập tay đè lên công thức phụ thuộc).`});
        }
        if(dP) for(const q of PLANS) if(q.dur === pl.dur) affectedPlans.add(q.key);
      }
      if(ruleChanged) for(const pl of PLANS) affectedPlans.add(pl.key);
      if(!Object.keys(E.sched).length) E.sched = clone(origById.get(E.id).sched);
    }

    const skipped = [];
    const skip = (t, pl, field, key, cur, would, reason) => skipped.push({taskId:t.id, no:t.no || "", dv:t.dv || "", plan:pl.key, planLabel:pl.label, field, key, current:cur, would, reason});
    const lockReason = (t, field, pl, isSum) => {
      if(t.sched && t.sched.lock && t.sched.lock[field]) return "Ngày đang khoá (nhập tay)";
      if(pl.actual){
        if(statusOf(t.id) === DONE) return "Đã hoàn thành";
        if(!isSum && normDate(origById.get(t.id)[field]) && !(t === E && pinned.has(field))) return "Đã có ngày thực tế";
      }
      return null;
    };
    const setDate = (t, f, v) => { if(v !== normDate(t[f])) t[f] = v; };

    function evalSummary(t, pl){
      const kids = tr.children.get(t.id);
      let mn = null, mx = null;
      for(const k of kids){
        const c = byId.get(k), s = normDate(c[pl.start]), e = normDate(c[pl.end]);
        if(s && (!mn || s < mn)) mn = s;
        if(e && (!mx || e > mx)) mx = e;
      }
      let blocked = false;
      for(const [f, v] of [[pl.start, mn], [pl.end, mx]]){
        if(!v || v === normDate(t[f])) continue;
        const why = lockReason(t, f, pl, true);
        if(why){ blocked = true; skip(t, pl, f === pl.start ? "start" : "end", f, normDate(t[f]), v, why); }
        else setDate(t, f, v);
      }
      if(!blocked && (pl.key === "hd" || pl.key === "exp")){
        const d = durOf(normDate(t[pl.start]), normDate(t[pl.end]));
        if(d != null && d !== normDur(t[pl.dur])){ t[pl.dur] = d; t.sched = {...(t.sched || {}), kind:"summary"}; }
      }
    }
    function evalTask(t, pl){
      const pinS = t === E && pinned.has(pl.start), pinE = t === E && pinned.has(pl.end);
      let ns = normDate(t[pl.start]), ne = normDate(t[pl.end]);
      const r = startRule(t, pl.key);
      let ff = null;
      if(!pinS && r.k !== "none"){
        let cand;
        if(r.k === "dep"){
          const p = byId.get(r.pred), pp = PLAN[r.plan || pl.key];
          if(p && pp){
            if(r.type === "SS") cand = addDays(normDate(p[pp.start]), r.lag);
            else if(r.type === "FF") ff = addDays(normDate(p[pp.end]), r.lag);
            else cand = addDays(normDate(p[pp.end]), r.lag);
          }
        } else if(r.k === "copy" && PLAN[r.plan]) cand = normDate(t[PLAN[r.plan].start]);
        if(cand && cand !== ns){
          const why = lockReason(t, pl.start, pl, false);
          if(why) skip(t, pl, "start", pl.start, ns, cand, why); else ns = cand;
        }
      }
      if(!pinE){
        let cand;
        if(ff) cand = ff;
        else {
          const er = endRule(t, pl.key);
          if(er.k === "dur"){
            const d = er.days != null ? normDur(er.days) : normDur(t[er.src || pl.dur]);
            if(ns && d != null) cand = endOf(ns, d);
          } else if(er.k === "copy" && PLAN[er.plan]) cand = normDate(t[PLAN[er.plan].end]);
        }
        if(cand && cand !== ne){
          const why = lockReason(t, pl.end, pl, false);
          if(why) skip(t, pl, "end", pl.end, ne, cand, why); else ne = cand;
        }
        if(ff && !pinS && ne === ff){
          const d = normDur(t[pl.dur]);
          const s2 = d == null ? null : addDays(ne, -(d + END_OFFSET));
          if(s2 && s2 !== ns){
            const why = lockReason(t, pl.start, pl, false);
            if(why) skip(t, pl, "start", pl.start, ns, s2, why); else ns = s2;
          }
        }
      }
      setDate(t, pl.start, ns); setDate(t, pl.end, ne);
    }

    const changedNodes = new Set();
    if(E && summary.has(E.id) && ruleChanged) for(const pl of PLANS) affectedPlans.add(pl.key);
    for(const n of tp.order){
      const [id, pk] = n.split("|");
      const t = byId.get(id), pl = PLAN[pk];
      const ins = tp.ins.get(n).filter(i => scope === "all" || i.kind !== "dep");
      const dirty = (t === E && affectedPlans.has(pk)) || ins.some(i => changedNodes.has(i.n));
      if(!dirty) continue;
      const O = origById.get(id);
      if(summary.has(id)) evalSummary(t, pl); else evalTask(t, pl);
      if(normDate(t[pl.start]) !== normDate(O[pl.start]) || normDate(t[pl.end]) !== normDate(O[pl.end])) changedNodes.add(n);
    }

    const changes = [];
    for(const t of tasks){
      const O = origById.get(t.id);
      const base = {taskId:t.id, no:t.no || "", dv:t.dv || "", self:t === E};
      for(const [f, label] of Object.entries(DUR_FIELDS)){
        const a = normDur(O[f]), b = normDur(t[f]);
        if(a !== b) changes.push({...base, plan:"dur", planLabel:label, field:"dur", key:f, old:a, new:b, delta: a == null || b == null ? null : b - a});
      }
      for(const pl of PLANS) for(const [field, f] of [["start", pl.start], ["end", pl.end]]){
        const a = normDate(O[f]), b = normDate(t[f]);
        if(a !== b) changes.push({...base, plan:pl.key, planLabel:pl.label, field, key:f, old:a, new:b, delta:diffDays(a, b)});
      }
    }
    const projectEnd = {};
    for(const pl of PLANS){
      const mx = list => list.reduce((m, t) => { const e = normDate(t[pl.end]); return e && (!m || e > m) ? e : m; }, null);
      projectEnd[pl.key] = {old:mx(tasksIn), new:mx(tasks)};
    }
    const affected = [...new Set(changes.filter(c => !c.self).map(c => c.taskId))];
    const seen = new Set();
    const skippedU = skipped.filter(s => { const k = s.taskId + "|" + s.key; if(seen.has(k)) return false; seen.add(k); return true; });
    return {ok:true, tasks, changes, skipped:skippedU, projectEnd, affected, notes};
  }

  /* Việc đang lệch so với công thức phụ thuộc (dùng cho cảnh báo "Lệch lịch với việc phụ thuộc" sau khi
     chọn "Chỉ việc này"): Bắt đầu theo quy tắc dep tính từ dữ liệu ĐANG LƯU ≠ Bắt đầu đang lưu. Bỏ qua bộ
     Thực tế, ngày đang khoá và dòng nhóm. Trả Map taskId → [{plan, planLabel, expected, actual}]. */
  function drift(tasks){
    const byId = new Map(tasks.map(t => [t.id, t]));
    const tr = tree(tasks);
    const out = new Map();
    for(const t of tasks){
      if(isSummary(t, tr)) continue;
      for(const pl of PLANS){
        if(pl.actual) continue;
        const r = startRule(t, pl.key);
        if(r.k !== "dep" || r.type === "FF") continue;
        if(t.sched && t.sched.lock && t.sched.lock[pl.start]) continue;
        const p = byId.get(r.pred), pp = PLAN[r.plan || pl.key];
        if(!p || p === t || !pp) continue;
        const exp = addDays(normDate(r.type === "SS" ? p[pp.start] : p[pp.end]), r.lag);
        const cur = normDate(t[pl.start]);
        if(exp && exp !== cur){
          if(!out.has(t.id)) out.set(t.id, []);
          out.get(t.id).push({plan:pl.key, planLabel:pl.label, expected:exp, actual:cur});
        }
      }
    }
    return out;
  }

  /* Lọc task.sched nhận từ trình duyệt (máy chủ gọi trước khi lưu): chỉ giữ đúng cấu trúc hợp lệ, bỏ mọi
     thứ khác; rỗng → null (không gắn sched cho việc không có phụ thuộc). */
  const DATE_FIELDS = PLANS.flatMap(p => [p.start, p.end]);
  function sanitize(s){
    if(!s || typeof s !== "object" || Array.isArray(s)) return null;
    const id = v => typeof v === "string" && /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(v) ? v : null;
    const type = v => ["FS","SS","FF"].includes(v) ? v : "FS";
    const lag = v => Number.isInteger(+v) && Math.abs(+v) <= 3650 ? +v : 0;
    const out = {};
    if(id(s.pred)){ out.pred = id(s.pred); out.type = type(s.type); out.lag = lag(s.lag); }
    if(s.plans && typeof s.plans === "object"){
      const plans = {};
      for(const pk of Object.keys(PLAN)){
        const src = s.plans[pk]; if(!src || typeof src !== "object") continue;
        const r = {};
        const st = src.start;
        if(st && st.k === "dep" && (id(st.pred) || out.pred)) r.start = {k:"dep", ...(id(st.pred) ? {pred:id(st.pred)} : {}), type:type(st.type), lag:lag(st.lag), ...(PLAN[st.plan] ? {plan:st.plan} : {})};
        else if(st && st.k === "copy" && PLAN[st.plan] && st.plan !== pk) r.start = {k:"copy", plan:st.plan};
        else if(st && st.k === "none") r.start = {k:"none"};
        const en = src.end;
        if(en && en.k === "dur") r.end = {k:"dur", ...(DUR_FIELDS[en.src] ? {src:en.src} : {}), ...(en.days != null && isFinite(+en.days) ? {days:+en.days} : {})};
        else if(en && en.k === "copy" && PLAN[en.plan] && en.plan !== pk) r.end = {k:"copy", plan:en.plan};
        else if(en && en.k === "none") r.end = {k:"none"};
        if(Object.keys(r).length) plans[pk] = r;
      }
      if(Object.keys(plans).length) out.plans = plans;
    }
    if(s.lock && typeof s.lock === "object"){
      const lock = {};
      for(const f of DATE_FIELDS) if(s.lock[f] === true) lock[f] = true;
      if(Object.keys(lock).length) out.lock = lock;
    }
    if(s.kind === "summary" || s.kind === "task") out.kind = s.kind;
    return Object.keys(out).length ? out : null;
  }

  /* ===== Chuyển công thức sheet NGSI (file Excel tiến độ của phòng) thành task.sched =====
     Cột: F/G = Số ngày (daysActual/daysProposed), H-I = HĐ, J-K = HĐ điều chỉnh, L-M = Dự kiến, N-O = Thực tế.
     rows: [{row:<số dòng Excel>, id:<taskId>, cells:{F..O:{f:<công thức không dấu "=" hoặc null>, v:<giá trị thô>}}}]
     – chỉ các dòng ĐÃ thành đầu việc; công thức trỏ tới dòng không có trong danh sách (vd dòng No. trống, bị
     bỏ khi nhập) → không gắn được, ghi vào stats.missing. Mẫu nhận được (đếm thật trên 3 file, xem CLAUDE.md):
       Bắt đầu  =X<dòng khác>[±k] → FS (X là cột Kết thúc) / SS (X là cột Bắt đầu), cùng bộ hoặc khác bộ
                =X<cùng dòng>      → copy từ bộ khác (J=H, L=J, N=L)
                =<Kết thúc>-<F|G>  + Kết thúc =X<dòng khác>[±k] → FF
                ngày gõ tay        → không quy tắc (giữ nguyên)
       Kết thúc =<Bắt đầu>+<F|G>   → Bắt đầu + Số ngày (ghi rõ nguồn nếu khác mặc định, vd K=J+G)
                =<Bắt đầu>+k / =<Bắt đầu> → Bắt đầu + k ngày
                =X<cùng dòng>      → copy Kết thúc bộ khác (O=M, K=I)
                ngày gõ tay        → KHOÁ (không để lan truyền ghi đè) – trừ bộ Thực tế (đã có giá trị = khoá sẵn)
     Mẫu khác (IFERROR, SUM, Kết thúc = Kết thúc dòng khác mà Bắt đầu không tính ngược…) → stats.unsupported,
     ô Kết thúc có giá trị thì khoá để giữ nguyên ngày. */
  const XL_COL = {H:["hd","start"], I:["hd","end"], J:["adj","start"], K:["adj","end"], L:["exp","start"], M:["exp","end"], N:["act","start"], O:["act","end"]};
  const XL_PLAN = {hd:["H","I"], adj:["J","K"], exp:["L","M"], act:["N","O"]};
  const XL_DUR = {F:"daysActual", G:"daysProposed"};
  function parseXlFormula(f){
    const s = String(f || "").replace(/\$/g, "").replace(/\s+/g, "").replace(/^=/, "").toUpperCase();
    let m;
    if((m = /^([A-Z]{1,2})(\d+)$/.exec(s))) return {t:"ref", a:{col:m[1], row:+m[2]}, k:0};
    if((m = /^([A-Z]{1,2})(\d+)([+-]\d+)$/.exec(s))) return {t:"ref", a:{col:m[1], row:+m[2]}, k:+m[3]};
    if((m = /^([A-Z]{1,2})(\d+)([+-])([A-Z]{1,2})(\d+)$/.exec(s))) return {t:m[3] === "+" ? "add" : "sub", a:{col:m[1], row:+m[2]}, b:{col:m[4], row:+m[5]}};
    return {t:"other", s};
  }
  const xlHasValue = v => v != null && v !== "" && !(typeof v === "string" && v.trim() === "-");
  function fromExcel(rows){
    const idOfRow = new Map(rows.map(r => [r.row, r.id]));
    const stats = {dep:{FS:0, SS:0, FF:0}, copy:0, lock:0, unsupported:[], missing:[]};
    const out = new Map();
    for(const R of rows){
      const parsed = {};
      for(const pk of Object.keys(XL_PLAN)){
        const [sc, ec] = XL_PLAN[pk];
        const S0 = R.cells[sc] || {}, E0 = R.cells[ec] || {};
        let start = null, end = null;
        const bad = (col, f) => stats.unsupported.push({row:R.row, col, formula:"=" + f});
        if(S0.f){
          const p = parseXlFormula(S0.f), info = p.a && XL_COL[p.a.col];
          if(p.t === "ref" && info && p.a.row === R.row){
            if(info[1] === "start" && info[0] !== pk && p.k === 0) start = {k:"copy", plan:info[0]};
            else bad(sc, S0.f);
          } else if(p.t === "ref" && info){
            const pred = idOfRow.get(p.a.row);
            if(!pred) stats.missing.push({row:R.row, col:sc, formula:"=" + S0.f});
            else start = {k:"dep", pred, type: info[1] === "end" ? "FS" : "SS", lag:p.k, plan:info[0]};
          } else if(p.t === "sub" && p.a.row === R.row && p.b.row === R.row && p.a.col === ec && XL_DUR[p.b.col]) start = {k:"fromEnd"};
          else bad(sc, S0.f);
        } else if(xlHasValue(S0.v)) start = {k:"manual"};
        if(E0.f){
          const p = parseXlFormula(E0.f), info = p.a && XL_COL[p.a.col];
          if(p.t === "add" && p.a.row === R.row && p.a.col === sc && p.b.row === R.row && XL_DUR[p.b.col]) end = {k:"dur", src:XL_DUR[p.b.col]};
          else if(p.t === "ref" && info && p.a.row === R.row && p.a.col === sc) end = {k:"dur", days:p.k};
          else if(p.t === "ref" && info && p.a.row === R.row && info[1] === "end" && info[0] !== pk && p.k === 0) end = {k:"copy", plan:info[0]};
          else if(p.t === "ref" && info && p.a.row !== R.row && info[1] === "end"){
            const pred = idOfRow.get(p.a.row);
            if(!pred){ stats.missing.push({row:R.row, col:ec, formula:"=" + E0.f}); end = {k:"manual"}; }
            else end = {k:"ref", pred, lag:p.k, plan:info[0]};
          } else { bad(ec, E0.f); end = {k:"manual"}; }
        } else if(xlHasValue(E0.v)) end = {k:"manual"};
        if(start && start.k === "fromEnd"){
          if(end && end.k === "ref"){ start = {k:"dep", pred:end.pred, type:"FF", lag:end.lag, plan:end.plan}; end = null; }
          else { bad(sc, S0.f); start = {k:"manual"}; }
        } else if(end && end.k === "ref"){ bad(ec, E0.f); end = {k:"manual"}; }
        parsed[pk] = {start, end};
      }
      const sig = s => s.pred + "|" + s.type + "|" + s.lag;
      const count = new Map();
      for(const pk of Object.keys(XL_PLAN)){ const s = parsed[pk].start; if(s && s.k === "dep" && s.plan === pk) count.set(sig(s), (count.get(sig(s)) || 0) + 1); }
      let shared = null;
      for(const pk of Object.keys(XL_PLAN)){
        const s = parsed[pk].start;
        if(s && s.k === "dep" && s.plan === pk && (!shared || count.get(sig(s)) > count.get(sig(shared)))) shared = s;
      }
      const sched = {}, plans = {}, lock = {};
      if(shared){ sched.pred = shared.pred; sched.type = shared.type; sched.lag = shared.lag; }
      for(const pk of Object.keys(XL_PLAN)){
        const {start, end} = parsed[pk], pl = PLAN[pk], r = {};
        if(start && start.k === "dep"){
          stats.dep[start.type]++;
          if(!(shared && start.plan === pk && sig(start) === sig(shared)))
            r.start = {k:"dep", pred:start.pred, type:start.type, lag:start.lag, ...(start.plan !== pk ? {plan:start.plan} : {})};
        } else if(start && start.k === "copy"){ stats.copy++; r.start = {k:"copy", plan:start.plan}; }
        else if(shared) r.start = {k:"none"};
        if(end && end.k === "dur"){
          if(end.days != null) r.end = {k:"dur", days:end.days};
          else if(end.src !== pl.dur) r.end = {k:"dur", src:end.src};
        } else if(end && end.k === "copy"){ stats.copy++; r.end = {k:"copy", plan:end.plan}; }
        else if(end && end.k === "manual" && !pl.actual){ lock[pl.end] = true; stats.lock++; }
        if(Object.keys(r).length) plans[pk] = r;
      }
      if(Object.keys(plans).length) sched.plans = plans;
      if(Object.keys(lock).length) sched.lock = lock;
      out.set(R.id, sanitize(sched));
    }
    return {sched:out, stats};
  }
  /* Bỏ phụ thuộc gây vòng (vd việc con SS theo dòng nhóm tự tính MIN/MAX – trong Excel không vòng vì dòng
     nhóm có ngày gõ tay). Ưu tiên bỏ phụ thuộc trỏ lên chính dòng tổ tiên; còn vòng thì bỏ hết phụ thuộc của
     các việc trong vòng. Trả {tasks, dropped:[taskId]} – không đổi mảng đầu vào. */
  function dropCycles(tasksIn){
    let tasks = tasksIn.map(t => ({...t, sched: clone(t.sched)}));
    const dropped = new Set();
    const stripDeps = t => {
      if(!t.sched) return;
      delete t.sched.pred; delete t.sched.type; delete t.sched.lag;
      for(const pk of Object.keys(t.sched.plans || {})){ const st = t.sched.plans[pk].start; if(st && st.k === "dep") delete t.sched.plans[pk].start; }
      t.sched = sanitize(t.sched) || undefined;
      dropped.add(t.id);
    };
    for(let round = 0; round < 50; round++){
      const r = recalc(tasks, null);
      if(r.ok || r.error.type !== "cycle") break;
      const tr = tree(tasks), byId = new Map(tasks.map(t => [t.id, t]));
      const isAnc = (id, anc) => { let c = tr.parent.get(id); while(c){ if(c === anc) return true; c = tr.parent.get(c); } return false; };
      let changed = false;
      for(const id of r.error.taskIds){
        const t = byId.get(id), preds = PLANS.map(pl => startRule(t, pl.key)).filter(x => x.k === "dep").map(x => x.pred);
        if(preds.some(p => isAnc(id, p))){ stripDeps(t); changed = true; }
      }
      if(!changed) for(const id of r.error.taskIds) stripDeps(byId.get(id));
    }
    return {tasks, dropped:[...dropped]};
  }

  return {END_OFFSET, PLANS, PLAN, DUR_FIELDS, DATE_FIELDS, addDays, diffDays, endOf, durOf, normDate, levelOf, tree, isSummary, startRule, endRule, recalc, drift, sanitize, fromExcel, dropCycles};
})();
if(typeof module !== "undefined" && module.exports) module.exports = SCHED;
