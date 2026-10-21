"use strict";
/* Xử lý bấm nút chung (data-act) – module mới nên dùng ACTIONS thay vì sửa file này */
/* ================= events ================= */
const main = document.getElementById("main");
main.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if(!t) return;
  const a = t.dataset.act;
  if(ACTIONS[a]){ ACTIONS[a](t, e); return; }
  if(a==="exnav"){ S.week = shiftAnchor(S.week, S.period||"week", +t.dataset.d); render(); return; }
  if(a==="exper"){ S.period = t.dataset.k; render(); return; }
  if(a==="exrefresh"){ render(); toast("Đã làm mới"); return; }
  if(a==="expr"){ S.exPr = t.dataset.p; render(); return; }
  if(a==="golo"){ S.view="input"; S.weekTab="load"; store("view","input"); render(); return; }
  /* S.projOpenId=null: lỡ đang mở trang chi tiết 1 dự án (xem "goplan" bên dưới) mà bấm "Xem tất cả"/"Quay
     lại tổng quan" ở nơi khác thì phải về đúng danh sách, không kẹt lại trang chi tiết cũ. */
  if(a==="godash"){ S.view="dash"; S.projOpenId=null; store("view","dash"); render(); return; }
  if(a==="wk"){ const d=+t.dataset.d; S.week = d===0 ? mondayOf(todayISO()) : addDays(S.week, d); render(); }
  else if(a==="tf"){ S.typeFilter=t.dataset.t; render(); }
  /* Bấm 1 dự án ở trang "Dự án" (gộp Tổng quan + Kế hoạch dự án thành 1 trang, project-overview.js) mở
     THẲNG trang chi tiết dự án đó (S.projOpenId, đọc ở viewProject()) – THAY HẲN nội dung trang, có nút
     "← Quay lại" (ACTIONS["ovback"]) để trở về danh sách. Trang chi tiết dùng lại NGUYÊN planDetail(p,true)
     (bảng "Kế hoạch dự án" đầy đủ, sửa/xoá được) – các nút bên trong nó ("Sửa thông tin"/"Xoá dự án"/
     "+ Đầu việc", action "editp"/"delp"/"addtask" bên dưới, và bấm vào 1 dòng đầu việc, action "task") đều
     đọc `S.planSel` (không phải data-id riêng của từng nút) để biết đang sửa dự án nào – PHẢI đặt luôn
     `S.planSel` ở đây cùng lúc với `S.projOpenId`, thiếu dòng này các nút đó sẽ thao tác nhầm dự án (hoặc
     null) vì S.planSel có thể đang trỏ dự án khác/còn trống từ trước. */
  else if(a==="goplan"){ S.planSel=t.dataset.id; S.projOpenId=t.dataset.id; render(); }
  else if(a==="addentry") entryForm(null);
  else if(a==="editentry"){ const person=t.dataset.person||S.me; const doc=weekDoc(S.week,person); const en=doc&&(doc.entries||[]).find(x=>x.id===t.dataset.id); if(en) entryForm(en, person); }
  else if(a==="copyprev") copyPrev();
  else if(a==="syncdue") syncDue();
  else if(a==="psel"){ S.planSel = S.planSel===t.dataset.id ? null : t.dataset.id; render(); }
  else if(a==="newp") projectForm(null);
  else if(a==="editp") projectForm(M.pById.get(S.planSel));
  else if(a==="addtask") taskForm(M.pById.get(S.planSel), null);
  else if(a==="delp"){
    const p = M.pById.get(S.planSel);
    if(p && canDeleteProject(p) && confirm(`Xoá dự án “${p.name}” và toàn bộ đầu việc?`)){
      remove("projects/"+p.id); S.planSel=null; toast("Đã xoá dự án");
    }
  }
  else if(a==="task"){ const p=M.pById.get(t.dataset.pid || S.planSel); const tk=p&&p._tasks.find(x=>x.id===t.dataset.id); if(tk) taskForm(p, tk); }
  else if(a==="addstaff") staffForm(null);
  else if(a==="editstaff") staffForm(+t.dataset.i);
  else if(a==="adduser") userForm(null);
  else if(a==="edituser"){ const u=(S.users||[]).find(x=>String(x.id)===t.dataset.id); if(u) userForm(u); }
  else if(a==="exp-json") exportBackup();
  else if(a==="imp-json") document.getElementById("impFile").click();
});
main.addEventListener("keydown", e => { if((e.key==="Enter"||e.key===" ") && e.target.matches("[data-act][tabindex]")){ e.preventDefault(); e.target.click(); } });
main.addEventListener("change", e => { if(e.target.id==="impFile" && e.target.files[0]){ importBackup(e.target.files[0]); e.target.value=""; return; }
  if(e.target.id==="planImportFile" && e.target.files[0]){ planImportExcel(e.target.files[0]); e.target.value=""; return; }
  if(e.target.dataset.act==="pickme"){ S.me=e.target.value; store("me",S.me);
    /* Đổi "Tôi là" thì đồng bộ luôn ô "Nhân sự" ở Báo cáo tuần (nếu đã từng mở Báo cáo trong phiên này) –
       giống đúng cách Dashboard/Tổng quan dự án/Tải tuần tự thu hẹp theo "Tôi là" (effectiveSimAs()), tránh
       phải tự chọn lại 2 nơi. Chỉ set khi S.rp đã có (rpInit() đã chạy) – reports.js nạp sau nên không gọi
       rpInit() thẳng ở đây được. */
    if(S.rp) S.rp.wkStaff = (S.me && S.me!=="__all__") ? S.me : "__all__";
    render(); } else if(e.target.dataset.act==="scopemode"){ S.scopeMode=e.target.value; render(); }
  else if(e.target.dataset.act==="catsel"){ S.catSel=e.target.value; render(); }
  else if(e.target.dataset.act==="catfield"){ catFieldSave(e.target.dataset.id, e.target.dataset.f, e.target.value); } });
main.addEventListener("input", e => {
  const a = e.target.dataset.act;
  if(a==="pq"){ S.planQuery=e.target.value; const pos=e.target.selectionStart; render(); const el=main.querySelector('[data-act="pq"]'); if(el){ el.focus(); el.setSelectionRange(pos,pos); } }
  else if(a==="exq"){ S.exQ=e.target.value; const pos=e.target.selectionStart; render(); const el=main.querySelector('[data-act="exq"]'); if(el){ el.focus(); el.setSelectionRange(pos,pos); } }
  else if(a==="dashq"){ S.dashQuery=e.target.value; const pos=e.target.selectionStart; render(); const el=main.querySelector('[data-act="dashq"]'); if(el){ el.focus(); el.setSelectionRange(pos,pos); } }
});
