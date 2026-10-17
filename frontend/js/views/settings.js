"use strict";
/* Màn hình: settings */
/* ================= VIEW: settings ================= */
function viewSettings(){
  const ro = !S.canEdit;
  let h = `<div class="head"><div><h1>Cài đặt</h1></div></div>`;
  h += usersPanel();
  const icoDb = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg>';
  const icoDownload = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v10m0 0 4-4m-4 4-4-4M4 19h16"/></svg>';
  const icoUpload = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17V7m0 0 4 4m-4-4-4 4M4 19h16"/></svg>';
  h += `<section class="panel" style="margin-bottom:18px"><div class="panel-b" style="display:flex; align-items:center; gap:14px; flex-wrap:wrap">
    <div class="data-ico" style="background:var(--teal-soft); color:var(--teal-hover)">${icoDb}</div>
    <div style="flex:1; min-width:160px"><div class="data-t">Sao lưu &amp; khôi phục</div><div class="small muted">Dữ liệu phòng ban</div></div>
    ${S.canEdit?`<div class="toolbar">
      <button class="btn primary" data-act="exp-json" title="Tải toàn bộ dữ liệu hiện tại về máy">${icoDownload} Backup</button>
      <button class="btn" data-act="imp-json" title="Khôi phục từ file backup — THAY TOÀN BỘ dữ liệu hiện tại cho cả phòng">${icoUpload} Restore</button>
      <input type="file" accept=".json,application/json" id="impFile" hidden></div>`:""}
    </div></section>`;
  h += `<section class="panel" style="margin-bottom:18px"><div class="panel-h"><h2>Nhân sự & capacity</h2>${ro?"":'<button class="btn primary" data-act="addstaff">+ Nhân sự</button>'}</div>
    <div class="tbl-wrap"><table style="table-layout:fixed"><thead><tr><th style="width:24%">Họ tên</th><th style="width:13%; text-align:center">Giờ / tuần</th><th style="width:15%; text-align:center">% trừ họp, phát sinh</th><th style="width:14%; text-align:center">Kinh nghiệm (năm)</th><th style="width:16%; text-align:center">Hệ số năng lực</th><th style="width:18%; text-align:center">Capacity (điểm/tuần)</th></tr></thead><tbody>
    ${M.staff.map((s,i)=>`<tr class="${ro?"":"click"}" data-act="${ro?"":"editstaff"}" data-i="${i}" tabindex="0"><td class="cell-main">${esc(s.name)}${s.alias?` <span class="pill mute" title="Tên viết tắt dùng trong dự án">${esc(s.alias)}</span>`:""}${s.title?`<div class="small muted">${esc(s.title)}</div>`:""}</td><td style="text-align:center">${s.hours}</td><td style="text-align:center">${Math.round(s.pct*100)}%</td><td style="text-align:center">${s.years||"–"}</td><td style="text-align:center">${fmt1(s.factor)}</td><td style="text-align:center; font-weight:600">${fmt1(s.cap)}</td></tr>`).join("")||'<tr><td colspan="6" class="muted">Chưa có nhân sự.</td></tr>'}
    </tbody></table></div><div class="panel-b small muted">Capacity = Giờ/tuần × (1 − % họp, phát sinh) × Hệ số năng lực. Hệ số năng lực theo kinh nghiệm (gợi ý, trưởng phòng tự chọn): &lt;1 năm → 1 · 1–2 năm → 2 · 2–3 năm → 3 · ≥3 năm → 4.</div></section>`;
  h += catFlatTable(ro);
  h += milestoneRulePanel(ro);
  return h;
}
/* Cấu hình chung cho toàn hệ thống: quy tắc nhận diện "Mốc chính dự án" (từ "No." + tên đầu việc) và
   ngưỡng "Sắp đến hạn" (ngày) – xem MILESTONE_RULE_DEFAULT/MODES (constants.js), đọc/tính ở model.js
   (msClassify(), p._milestones), hiện ở panel "Mốc chính dự án" (planDetail(), plan.js). Chỉ trưởng phòng
   sửa được (collection "config" dùng chung rule "admin", xem RULES/server.js). */
function milestoneRulePanel(ro){
  const r = S.milestoneRule || MILESTONE_RULE_DEFAULT;
  const modeInfo = MILESTONE_RULE_MODES.find(m=>m[0]===r.mode) || MILESTONE_RULE_MODES[1];
  return `<section class="panel" style="margin-bottom:18px">
    <div class="panel-h"><h2>Nhận diện mốc chính &amp; cảnh báo</h2>${ro?"":'<button class="btn" data-act="milestonecfg">Sửa</button>'}</div>
    <div class="panel-b">
      <div class="kv">
        <dt>Quy tắc đang dùng</dt><dd>Mode ${r.mode} — ${esc(modeInfo[1])}</dd>
        <dt>Ngưỡng "Sắp đến hạn"</dt><dd>${r.dueSoonDays} ngày</dd>
      </div>
      <p class="small muted" style="margin:10px 0 0">Áp dụng cho panel "Mốc chính dự án" ở Kế hoạch dự án và cảnh báo "Sắp đến hạn" trong toàn hệ thống. Đổi quy tắc không ảnh hưởng dữ liệu đầu việc đã nhập, chỉ đổi cách hiển thị/tính cảnh báo.</p>
    </div></section>`;
}
function milestoneRuleForm(){
  const r = S.milestoneRule || MILESTONE_RULE_DEFAULT;
  openForm({title:"Nhận diện mốc chính & cảnh báo", values:{mode:r.mode, dueSoonDays:r.dueSoonDays},
    fields:[
      {key:"mode", label:"Quy tắc nhận diện mốc chính", type:"seg", options:MILESTONE_RULE_MODES.map(m=>[m[0],"Mode "+m[0]]),
        hint:v=>(MILESTONE_RULE_MODES.find(m=>m[0]===v)||MILESTONE_RULE_MODES[1])[2]},
      {key:"dueSoonDays", label:"Ngưỡng \"Sắp đến hạn\" (ngày)", type:"number", required:true, hint:()=>"Đầu việc còn hạn trong vòng bao nhiêu ngày thì cảnh báo \"Sắp đến hạn\"."}
    ],
    onSave: async v => {
      const dueSoonDays = +v.dueSoonDays;
      if(!dueSoonDays || dueSoonDays<1) throw new Error("Ngưỡng cảnh báo phải lớn hơn 0 ngày.");
      await write("config/milestoneRule", {mode:+v.mode||2, dueSoonDays});
      toast("Đã lưu cấu hình");
    }
  });
}
ACTIONS["milestonecfg"] = () => milestoneRuleForm();
/* "Khung mẫu" đầu việc chuẩn (config/catalog) – 1 bảng PHẲNG, đúng y hệt thứ tự/số thứ tự ("No.") người
   dùng tự gõ theo mẫu Excel của phòng (A/B/C…, I/II…, 1/2…, 1.1…), KHÔNG tự suy luận lồng cấp từ "No." –
   mỗi dòng (kể cả dòng "hạng mục" như "A. TỔNG THỜI GIAN...") là 1 mục catalog độc lập, có thể kèm Ưu
   tiên + Vai trò (PM/TM/AM/ACC) để khi tạo dự án mới, đầu việc sinh ra tự gán người phụ trách theo đúng
   vai trò đó của dự án (xem projectForm() ở plan.js). Sửa trực tiếp trên bảng (mỗi ô tự lưu khi rời ô/đổi
   lựa chọn), không qua form popup. */
function catFlatTable(ro){
  S.catSel = S.catSel && TYPES.includes(S.catSel) ? S.catSel : TYPES[0];
  const opts = TYPES.map(t => `<option value="${esc(t)}" ${S.catSel===t?"selected":""}>Quy trình ${t.toLowerCase()} (${esc(t)}, ${S.catalog.filter(c=>c.type===t).length} dòng)</option>`).join("");
  const list = S.catalog.filter(c=>c.type===S.catSel);
  const rows = list.map(c => `<tr>
      <td><input class="inp" style="width:100%" value="${esc(c.no||"")}" data-act="catfield" data-id="${esc(c.id)}" data-f="no" ${ro?"disabled":""}></td>
      <td><input class="inp" style="width:100%" value="${esc(c.name||"")}" data-act="catfield" data-id="${esc(c.id)}" data-f="name" ${ro?"disabled":""}></td>
      <td>${selectHTML("catfield", c.id, "pr", CAT_PR.map(x=>[x,x]), c.pr||"Bình thường", ro)}</td>
      <td>${selectHTML("catfield", c.id, "role", CAT_ROLES, c.role||"", ro)}</td>
      ${ro?"":`<td style="white-space:nowrap"><button class="btn icon" title="Thêm dòng sau" data-act="addcatrow" data-id="${esc(c.id)}">+</button><button class="btn icon" title="Xoá dòng" data-act="delcatrow" data-id="${esc(c.id)}">✕</button></td>`}
    </tr>`).join("");
  return `<section class="panel" style="margin-bottom:18px">
    <div class="panel-h"><h2>Chọn khung</h2></div>
    <div class="panel-b">
      <select class="inp" data-act="catsel" style="margin-bottom:10px">${opts}</select>
      <p class="small muted" style="margin:0 0 14px">Khi tạo dự án từ khung: sinh đầu việc theo đúng cấu trúc, ưu tiên và vai trò người phụ trách (gán theo PM/TM/AM/ACC của dự án). Thời lượng, ngày và việc trước do PM phụ trách thiết lập riêng cho từng dự án. Sửa trực tiếp trên bảng; thay đổi chỉ áp dụng cho dự án tạo mới sau này.</p>
      <div class="tbl-wrap"><table style="table-layout:fixed"><thead><tr><th style="width:8%">No.</th><th style="width:${ro?"52":"42"}%">Nội dung công việc</th><th style="width:20%">Ưu tiên</th><th style="width:20%">Vai trò</th>${ro?"":'<th style="width:10%"></th>'}</tr></thead>
        <tbody>${rows || `<tr><td colspan="5"><div class="empty">Khung này chưa có dòng nào.${ro?"":" Bấm + ở 1 dòng để thêm, hoặc dùng nút bên dưới."}</div></td></tr>`}</tbody></table></div>
      ${ro?"":`<div class="toolbar" style="margin-top:10px"><button class="btn" data-act="addcatrow">+ Thêm dòng</button></div>`}
    </div></section>`;
}
function selectHTML(act, id, field, options, val, ro){
  return `<select class="inp" style="width:100%" data-act="${act}" data-id="${esc(id)}" data-f="${field}" ${ro?"disabled":""}>${options.map(([v,l])=>`<option value="${esc(v)}" ${val===v?"selected":""}>${esc(l)}</option>`).join("")}</select>`;
}
/* Tự gợi ý "Tên viết tắt" từ Họ tên đầy đủ, ĐÚNG quy ước đã kiểm chứng ngược lại với tên thật trong file
   mẫu Excel của phòng (vd "Tạ Thị Mai Huyền"→"Huyenttm", "Lưu Ánh Uyên"→"Uyenla", "Đỗ Khánh Ly"→"Lydk" – cả
   3 đều khớp đúng y hệt dữ liệu PM/TM/AM/ACC thật đã đọc được): lấy TỪ CUỐI (tên gọi, vd "Huyền"→"Huyen",
   bỏ dấu) làm gốc, nối thêm chữ cái đầu (bỏ dấu, viết thường) của TỪNG TỪ còn lại theo đúng thứ tự (họ →
   đệm…). "Đ"/"đ" bỏ dấu thành "D"/"d" như quy ước đặt tên tài khoản phổ biến của phòng. */
function suggestAlias(fullName){
  const parts = String(fullName||"").trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return "";
  const strip = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D");
  const first = strip(parts[parts.length-1]);
  const initials = parts.slice(0,-1).map(w=>strip(w)[0].toLowerCase()).join("");
  return first + initials;
}
function staffForm(i){
  const isNew = i==null; const s = isNew ? {name:"", alias:"", title:"", hours:40, pct:0.2, factor:1.0, years:0} : {...S.staff[i]};
  const factorHint = (val,vals) => {
    const y = +vals.years||0;
    const sug = y<1?1:y<2?2:y<3?3:4;
    return `Gợi ý theo ${y||0} năm kinh nghiệm: ${sug}`;
  };
  openForm({title:isNew?"Thêm nhân sự":"Sửa nhân sự", values:{...s, pctV:Math.round(s.pct*100)},
    fields:[
      /* Họ tên + Tên viết tắt nằm chung 1 hàng (half:true cả 2, openForm() tự ghép cặp field half liền
         nhau thành 1 row2, core/ui.js) – gõ xong Họ tên rồi rời ô (change, tức blur) thì TỰ GÁN gợi ý
         (suggestAlias()) vào ô Tên viết tắt NẾU ô đó đang TRỐNG, vẫn sửa tay lại được bình thường (không
         ghi đè nếu đã có chữ, kể cả gợi ý cũ – chỉ coi "trống" mới tự gán, theo đúng yêu cầu người dùng). */
      {key:"name", label:"Họ tên", type:"text", required:true, half:true, onChange:v=>{
        const a = document.getElementById("f_alias");
        if(a && !a.value.trim()) a.value = suggestAlias(v);
      }},
      /* "Tên viết tắt" – nhiều dự án (nhất là nhập từ Excel) lưu PM/TM/AM/ACC/Phụ trách bằng tên viết tắt
         (vd "Lydk") khác Họ tên đầy đủ ở đây, nên không tự khớp được người. Khai thêm tên này để LIÊN KẾT
         2 tên lại (canonStaffName(), constants.js/backend/server.js – dùng cho quyền xem/sửa dự án,
         KPI/Workload…, KHÔNG đổi chữ hiển thị "Phụ trách" trên các bảng, vẫn hiện nguyên tên đã gõ/nhập). */
      {key:"alias", label:"Tên viết tắt (tên dùng trong dự án, vd \"Lydk\")", type:"text", half:true, hint:()=>"Tự gợi ý theo Họ tên, gõ đè lại nếu khác."},
      {key:"title", label:"Chức danh (chỉ để tham khảo, dùng cho KPI & Năng lực)", type:"text", hint:()=>"Vd: Network Engineer, Security Engineer…"},
      {key:"hours", label:"Giờ làm / tuần", type:"number", half:true}, {key:"pctV", label:"% trừ họp, phát sinh", type:"number", half:true, hint:()=>"Khuyến nghị 15–25"},
      {key:"years", label:"Số năm kinh nghiệm (chỉ để tham khảo)", type:"number", half:true, hint:()=>"Dùng để gợi ý hệ số năng lực bên cạnh"},
      {key:"factor", label:"Hệ số năng lực", type:"seg", options:[[1,"1"],[2,"2"],[3,"3"],[4,"4"]], half:true, hint:factorHint}],
    onSave: async x => {
      if(!x.name.trim()) throw new Error("Nhập họ tên.");
      const list=[...S.staff]; const row={name:x.name.trim(), alias:(x.alias||"").trim(), title:x.title||"", hours:+x.hours||40, pct:(+x.pctV||0)/100, factor:+x.factor||1, years:+x.years||0};
      if(isNew) list.push(row); else list[i]=row;
      await write("config/staff",{list}); toast("Đã lưu nhân sự");
    },
    onDelete: isNew?null: async()=>{ if(!confirm("Xoá nhân sự này?")) return false; const list=S.staff.filter((_,k)=>k!==i); await write("config/staff",{list}); toast("Đã xoá"); }
  });
}
/* Sửa 1 ô trên bảng phẳng (no/name/pr/role) – lưu ngay khi rời ô (input text) hoặc đổi lựa chọn (select),
   xem main.addEventListener("change", …) ở core/events.js. */
async function catFieldSave(id, field, val){
  const list = S.catalog.map(c => c.id===id ? {...c, [field]: val} : c);
  await write("config/catalog", {list});
}
ACTIONS["addcatrow"] = async el => {
  const id = el.dataset.id;
  const list = [...S.catalog];
  const row = {id: uid("c"), type: S.catSel, no:"", name:"", pr:"Bình thường", role:"", result:"", evidence:""};
  const at = id ? list.findIndex(c=>c.id===id) : -1;
  if(at>=0) list.splice(at+1, 0, row); else list.push(row);
  await write("config/catalog", {list}); toast("Đã thêm dòng");
};
ACTIONS["delcatrow"] = async el => {
  if(!confirm("Xoá dòng này khỏi khung mẫu? Các dự án đã tạo trước đó vẫn giữ nguyên đầu việc.")) return;
  await write("config/catalog", {list: S.catalog.filter(c=>c.id!==el.dataset.id)}); toast("Đã xoá dòng");
};


VIEW_RENDER.settings = viewSettings;
