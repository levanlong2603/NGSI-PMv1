"use strict";
/* Màn hình: Dự án – gộp "Tổng quan dự án" (xem nhanh toàn bộ dự án dạng bảng, có menu ⋮ mở nhanh "Sửa
   thông tin" nhưng không sửa/xoá đầu việc tại đây) và "Kế hoạch dự án" (quản trị đầy đủ, plan.js) thành 1 mục
   menu "Dự án" với 2 tab ngang hàng (S.projTab, dùng chung .rp-tabs với Báo cáo – reports.js). Tách thanh
   công cụ (toolbar, lên hàng tiêu đề chung) khỏi nội dung từng tab (content), đúng kiểu reports.js:
   viewReports(). Giữ nguyên 2 bộ lọc/trạng thái độc lập của 2 tab (S.dashQuery/S.typeFilter cho Tổng quan,
   S.planQuery/S.me cho Kế hoạch – xem plan.js) – gộp giao diện, không gộp cơ chế lọc dữ liệu. */
function viewProject(){
  S.projTab = S.projTab || "overview";
  /* Bấm vào 1 dự án ở tab "Tổng quan" (data-act="goplan", core/events.js) KHÔNG còn mở trang riêng của
     dự án đó tại đây nữa – đã bỏ hẳn (ovDetailHeader() + planDetail(p) không extra, cùng S.ovDetailId/
     ACTIONS["ovback"]) theo yêu cầu người dùng, chuyển hẳn sang Báo cáo → "Báo cáo dự án" (tự chọn sẵn
     đúng dự án, xem events.js) – đó mới là nơi xem nhanh/báo cáo 1 dự án từ nay, gồm cả 3 nút "Tiến độ
     theo tuần"/"Đầu việc khẩn cấp"/"Mốc thanh toán" (dọn từ trang cũ sang, xem rpProjectContent() ở
     reports.js, vẫn dùng lại nguyên planGanttPanel()/planUrgentPanel()/planPaymentPanel() ở plan.js). */
  const toolbar = S.projTab==="plan" ? planToolbar() : dashToolbar();
  let h = `<div class="head"><div><h1>Dự án</h1></div><div class="ex-ctl">${toolbar}</div></div>`;
  h += `<div class="rp-tabs" role="tablist">
    <button type="button" role="tab" data-act="projtab" data-t="overview" aria-selected="${S.projTab==="overview"}">Tổng quan</button>
    <button type="button" role="tab" data-act="projtab" data-t="plan" aria-selected="${S.projTab==="plan"}">Kế hoạch dự án</button>
  </div>`;
  h += S.projTab==="plan" ? planContent() : dashContent();
  return h;
}
ACTIONS["projtab"] = el => { S.projTab = el.dataset.t; render(); };
/* Thanh điều khiển giống hệt Dashboard (ô kỳ + Tuần/Tháng/Quý + Tổng thể/Cá nhân + làm mới) – tab này
   chưa dùng kỳ để lọc gì, chỉ thêm sẵn cho đồng bộ giao diện, dùng chung S.week/S.period/periodInfo()/
   exnav/exper (exec-dashboard.js, events.js) với Dashboard nên đổi kỳ ở đâu cũng khớp nơi khác. */
function dashToolbar(){
  const kind = S.period || "week", per = periodInfo(S.week, kind);
  return `<div class="ex-wk"><button data-act="exnav" data-d="-1" aria-label="Kỳ trước">‹</button><div class="lb">${esc(per.label)}</div><button data-act="exnav" data-d="1" aria-label="Kỳ sau">›</button></div>
    <div class="ex-seg" role="group" aria-label="Kỳ báo cáo">${[["week","Tuần"],["month","Tháng"],["quarter","Quý"]].map(([k,l])=>`<button data-act="exper" data-k="${k}" aria-pressed="${kind===k}">${l}</button>`).join("")}</div>
    ${scopeToggleHtml()}
    <button class="btn icon" data-act="exrefresh" title="Làm mới" aria-label="Làm mới">${ICONS.refresh}</button>`;
}
function dashContent(){
  /* Trưởng phòng/phó phòng/admin chọn một người cụ thể ở "Tôi là" (không phải "Tất cả") → chỉ thấy dự án
     người đó là TM/SE, như đang xem thay họ. Nhân viên tự đăng nhập: mặc định vẫn thấy cả phòng, nhưng có
     thể tự bật "Cá nhân" (nút scopeToggleHtml() ở toolbar chung) để thu hẹp về đúng dự án của mình. */
  const simAs = effectiveSimAs();
  const P = M.projects.filter(p => p.type!=="Nội bộ" && (!simAs || projectAssigned(p, simAs)));
  const allT = M.tasks.filter(t=>t.p.type!=="Nội bộ" && (!simAs || projectAssigned(t.p, simAs)));
  const late = allT.filter(t=>t.warns.some(w=>w[1]==="Quá hạn"));
  const soon = allT.filter(t=>t.warns.some(w=>w[1]==="Sắp đến hạn"));
  const stuck = allT.filter(t=>OPEN.has(t.status) && (t.status==="Đang vướng"||(t.ms||0)>=1));
  const running = t => P.filter(p=>p.type===t && (p._prog==null || p._prog<1)).length;
  const q = (S.dashQuery||"").toLowerCase();
  let h = `<div class="head-ctl" style="margin-bottom:16px">
      <div class="chips" role="group" aria-label="Lọc theo loại">${PLAN_FILTERS.map(f=>`<button class="chip-btn" data-act="tf" data-t="${esc(f.key)}" aria-pressed="${S.typeFilter===f.key}">${esc(f.label)}</button>`).join("")}</div>
      <input class="inp" type="search" placeholder="Tìm dự án" style="width:180px" data-act="dashq" value="${esc(S.dashQuery||"")}" aria-label="Tìm dự án">
    </div>`;
  h += `<div class="band">
    <div class="stat"><div class="v">${running("Triển khai")}</div><div class="l">${typeDot("Triển khai")}Dự án triển khai đang chạy</div></div>
    <div class="stat"><div class="v">${running("Thầu")}</div><div class="l">${typeDot("Thầu")}Gói thầu đang làm</div></div>
    <div class="stat ${late.length?"bad":""}"><div class="v">${late.length}</div><div class="l">Đầu việc quá hạn</div></div>
    <div class="stat ${soon.length?"warn":""}"><div class="v">${soon.length}</div><div class="l">Đến hạn trong 14 ngày</div></div>
    <div class="stat ${stuck.length?"warn":""}"><div class="v">${stuck.length}</div><div class="l">Đầu việc đang vướng</div></div></div>`;
  return h + ovTable(P, q);
}
/* Ngày bắt đầu/kết thúc "của cả dự án" không có trường riêng (dự án không lưu field này) – suy từ đầu việc
   THẬT của dự án: sớm nhất trong "Kế hoạch theo HĐ – Bắt đầu" (t.hdStart) và muộn nhất trong "…– Kết thúc"
   (t.deadline, xem plan.js). Dự án chưa có đầu việc nào có ngày → "–". */
function projDateRange(p){
  const starts = (p._tasks||[]).map(t=>t.hdStart).filter(Boolean).sort();
  const ends = (p._tasks||[]).map(t=>t.deadline).filter(Boolean).sort();
  return {start: starts[0]||null, end: ends[ends.length-1]||null};
}
function projStatusText(p){
  if(planIsDone(p)) return ["Hoàn thành","ok"];
  if(p._prog==null || p._prog===0) return ["Chưa bắt đầu","mute"];
  return ["Đang thực hiện","info"];
}
/* Bảng danh sách dự án (Tổng quan dự án) – đúng theo mẫu người dùng đưa (#/Tên dự án/Khách hàng/PM/Bắt
   đầu/Kết thúc/% HT/Trạng thái/Đánh giá/⋮), gộp hết các loại dự án vào 1 bảng duy nhất (không còn chia
   theo Loại thành từng khối/tiêu đề riêng như trước – đã bỏ theo yêu cầu người dùng), sắp theo cột đang
   chọn (S.ovSort). "Khách hàng" = `p.client` (trường mới, nhập ở `projectForm()`, plan.js – dự án cũ
   trước khi có trường này hiện rỗng/"–"). KHÔNG có cột "Mã dự án" (đã bỏ theo yêu cầu người dùng – `p.id`
   là slug tự sinh từ tên, dài và không có ý nghĩa để hiển thị, vd "p-du-an-nang-cao-..."); tên dự án tô
   màu teal thay vào vị trí "liên kết" đó. Bấm vào 1 dòng (ngoài menu ⋮) đi thẳng sang tab "Kế hoạch dự án"
   của đúng dự án đó (data-act="goplan", core/events.js). Menu ⋮ (S.ovMenuOpen, giữ id dự án đang mở – chỉ
   1 menu mở tại 1 thời điểm) cho "Xem chi tiết" (giống hệt bấm dòng) và "Sửa thông tin" (mở thẳng
   projectForm(p), plan.js – chỉ hiện nếu canManageProject(p), cùng điều kiện với nút "Sửa thông tin" ở Kế
   hoạch dự án) – KHÔNG có "Xoá dự án" ở đây, vẫn phải vào Kế hoạch dự án để xoá (hành động phá huỷ, cố
   tình không đặt ở màn xem nhanh). */
const OV_SORT = {
  name: p=>p.name.toLowerCase(),
  client: p=>(p.client||"").toLowerCase(),
  pm: p=>(p.pm||p.owner||"").toLowerCase(),
  start: p=>projDateRange(p).start||"",
  end: p=>projDateRange(p).end||"",
  prog: p=>p._prog??-1,
};
ACTIONS["ovsort"] = el => {
  const k = el.dataset.k;
  S.ovSort = (S.ovSort && S.ovSort.key===k) ? {key:k, dir:S.ovSort.dir==="asc"?"desc":"asc"} : {key:k, dir:"asc"};
  render();
};
ACTIONS["ovmenu"] = el => { S.ovMenuOpen = S.ovMenuOpen===el.dataset.id ? null : el.dataset.id; render(); };
ACTIONS["ovedit"] = el => { S.ovMenuOpen = null; const p = M.pById.get(el.dataset.id); if(p) projectForm(p); };
/* Bấm ra ngoài menu ⋮ thì tự đóng – cùng cách làm với .rp-export (nút "Xuất báo cáo", reports.js) */
document.addEventListener("click", e => {
  if(S.ovMenuOpen && !e.target.closest(".ov-menu")){ S.ovMenuOpen = null; render(); }
});
function ovTable(P, q){
  const filt = S.typeFilter || "Tất cả";
  let ps = P.filter(p=>planMatchFilter(p, filt) && (!q || p.name.toLowerCase().includes(q)));
  const sort = S.ovSort || {key:"name", dir:"asc"};
  const sf = OV_SORT[sort.key] || OV_SORT.name;
  ps = [...ps].sort((a,b)=>{ const av=sf(a), bv=sf(b); const cmp = av<bv?-1:av>bv?1:0; return sort.dir==="asc"?cmp:-cmp; });
  const sortIco = k => sort.key!==k ? "↕" : (sort.dir==="asc"?"▲":"▼");
  const th = (k,label) => `<th data-act="ovsort" data-k="${k}" style="cursor:pointer; user-select:none">${label} <span class="small muted">${sortIco(k)}</span></th>`;
  /* KHÔNG dùng .tbl-wrap{overflow-x:auto} (base.css) cho bảng này – menu ⋮ bên dưới là position:absolute,
     bị overflow:auto/hidden của cha cắt mất (hiện 1 mẩu kèm thanh cuộn riêng thay vì nổi tự do như mong
     đợi). Bảng này không nhiều cột bằng Kế hoạch dự án nên không thật cần cuộn ngang riêng – overflow:visible
     để menu thoát ra ngoài bình thường, lỡ màn quá hẹp thì cuộn cả trang thay vì cuộn trong khung bảng. */
  let out = `<section class="panel"><div class="tbl-wrap" style="overflow:visible"><table><thead><tr>
    <th style="width:36px">#</th>${th("name","Tên dự án")}${th("client","Khách hàng")}${th("pm","PM")}${th("start","Bắt đầu")}${th("end","Kết thúc")}${th("prog","% HT")}<th>Trạng thái</th><th>Đánh giá</th><th style="width:36px"></th>
    </tr></thead><tbody>`;
  if(!ps.length){
    out += `<tr><td colspan="10"><div class="empty">${q?`Không có dự án nào khớp “${esc(S.dashQuery)}”.`:'Chưa có dự án nào. Thêm ở tab "Kế hoạch dự án".'}</div></td></tr>`;
  }
  ps.forEach((p,i) => {
    const dr = projDateRange(p);
    const [stText, stTone] = projStatusText(p);
    const menuOpen = S.ovMenuOpen===p.id;
    out += `<tr class="click" data-act="goplan" data-id="${esc(p.id)}" tabindex="0">
      <td class="small muted">${i+1}</td>
      <td><div class="cell-main" style="color:var(--teal-hover)">${esc(p.name)}</div><div class="small muted">${esc(p.type)}</div></td>
      <td>${esc(p.client||"–")}</td>
      <td>${esc(p.pm||p.owner||"–")}</td>
      <td>${dr.start?dmy(dr.start):"–"}</td>
      <td>${dr.end?dmy(dr.end):"–"}</td>
      <td><div class="pct" style="font-size:13px; font-weight:700">${pct(p._prog)}</div><div class="pbar" style="width:80px"><i style="width:${Math.round((p._prog||0)*100)}%"></i></div></td>
      <td><span class="pill ${stTone}">${stText}</span></td>
      <td>${p._late?'<span class="pill bad">Chậm tiến độ</span>':'<span class="pill ok">Đúng tiến độ</span>'}</td>
      <td class="ov-menu" style="position:relative">
        <button class="btn icon" type="button" data-act="ovmenu" data-id="${esc(p.id)}" aria-haspopup="true" aria-expanded="${menuOpen}" title="Thao tác">⋮</button>
        ${menuOpen ? `<div class="tb-dropdown tb-dropdown-r" style="min-width:170px">
          <button class="tb-item" type="button" data-act="goplan" data-id="${esc(p.id)}">Xem chi tiết</button>
          ${canManageProject(p)?`<button class="tb-item" type="button" data-act="ovedit" data-id="${esc(p.id)}">Sửa thông tin</button>`:""}
        </div>` : ""}
      </td>
      </tr>`;
  });
  out += `</tbody></table></div></section>`;
  return out;
}


VIEW_RENDER.dash = viewProject;
