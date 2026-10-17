"use strict";
/* Màn hình: Dự án – GỘP THÀNH 1 TRANG DUY NHẤT (không còn 2 tab "Tổng quan"/"Kế hoạch dự án" như trước –
   bỏ hẳn theo yêu cầu người dùng, "sẽ không còn trang dự án [dạng tab] nữa"): giao diện CHÍNH luôn là
   bảng "Tổng quan" (danh sách sort được, `dashContent()`/`ovTable()`) kèm 2 nút "Nhập Excel"/"+ Dự án mới"
   (dọn từ `planContent()`/`plan.js` sang đây, cùng `ACTIONS["planimport"]`/`["newp"]` có sẵn, không viết
   lại). Bấm vào 1 dự án (`data-act="goplan"`, `core/events.js` – đặt `S.projOpenId`) thay THẲNG toàn bộ nội
   dung trang bằng trang CHI TIẾT dự án đó: `ovDetailHeader(p)` (thanh tóm tắt + nút "← Quay lại") +
   `planDetail(p, true)` (đúng bảng "Kế hoạch dự án" ĐẦY ĐỦ, sửa/xoá được – `extra=true`, y hệt bảng dùng ở
   `planContent()` cũ, chỉ khác chỗ gọi). `planContent()`/`planToolbar()` (`plan.js`, kiểu card xổ inline
   cũ) không còn nơi nào gọi tới nữa – GIỮ LẠI không xoá (quy ước chung của file này, phòng khi cần dùng
   lại), chỉ không còn là 1 tab riêng. Lưu ý: bảng "Báo cáo dự án" ở menu "Báo cáo" (reports.js) KHÔNG đổi
   gì – đó vẫn là nơi xem/xuất báo cáo riêng (chọn dự án qua `<select>` ở đó), tách bạch hẳn với trang "Dự
   án" (sửa/xoá được) ở đây. */
function viewProject(){
  const p = S.projOpenId && M.pById.get(S.projOpenId);
  if(p) return `<div class="head"><div><h1>Dự án</h1></div></div>` + ovDetailHeader(p) + planDetail(p, true);
  S.projOpenId = null;
  const toolbar = dashToolbar();
  let h = `<div class="head"><div><h1>Dự án</h1></div><div class="ex-ctl">${toolbar}</div></div>`;
  h += dashContent();
  return h;
}
/* Thanh tóm tắt đầu trang chi tiết 1 dự án (Dự án/Phụ trách/Tiến độ/Mốc tiếp theo + dải hạng mục + cảnh
   báo quá hạn/sắp hạn + nút "← Quay lại"), cùng kiểu nhãn nhỏ/giá trị đậm với trang chi tiết nhân sự ở
   KPI & Năng lực (me-sum me-sum-end, kpi.js) – không có "SE" (web này không còn khái niệm đó, CLAUDE.md). */
function ovDetailHeader(p){
  const cell = (label, val) => `<div><div class="small muted">${label}</div><div style="font-weight:700; font-size:16px">${val}</div></div>`;
  return `<section class="panel" style="margin-bottom:12px"><div class="panel-b me-sum me-sum-end">
    ${cell("Dự án", typeDot(p.type)+esc(p.name))}
    ${cell("Phụ trách", esc(p.pm||p.owner||"–"))}
    ${cell("Tiến độ", pct(p._prog))}
    ${cell("Mốc tiếp theo", p._next?dmy(p._next):"–")}
    <div class="strip-cell">${strip(p, "plan", "planSel")}</div>
    <div class="badges">${p._late?`<span class="pill bad">${p._late} quá hạn</span>`:""}${p._stuck?`<span class="pill warn">${p._stuck} vướng</span>`:""}${p._soon?`<span class="pill info">${p._soon} sắp hạn</span>`:""}</div>
    <div class="toolbar" style="margin-left:auto"><button class="btn" data-act="ovback">← Quay lại</button></div>
  </div></section>`;
}
ACTIONS["ovback"] = () => { S.projOpenId = null; render(); };
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
      ${S.canEdit?`<button class="btn" data-act="planimport" title="Tạo dự án mới từ file Excel theo đúng mẫu bảng tiến độ của phòng (sheet Infor + NGSI)">Nhập Excel</button>
      <input type="file" accept=".xlsx" id="planImportFile" hidden>
      <button class="btn primary" data-act="newp">+ Dự án mới</button>`:""}
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
   màu teal thay vào vị trí "liên kết" đó. Bấm vào 1 dòng (ngoài menu ⋮) mở THẲNG trang chi tiết đúng dự án
   đó (data-act="goplan", core/events.js – đặt S.projOpenId, xem viewProject() ở trên). Menu ⋮ (S.ovMenuOpen,
   giữ id dự án đang mở – chỉ 1 menu mở tại 1 thời điểm) cho "Xem chi tiết" (giống hệt bấm dòng) và "Sửa
   thông tin" (mở thẳng projectForm(p), plan.js – chỉ hiện nếu canManageProject(p), cùng điều kiện với nút
   "Sửa thông tin" ở trang chi tiết) – KHÔNG có "Xoá dự án" ở đây, vẫn phải mở trang chi tiết để xoá (hành
   động phá huỷ, cố tình không đặt ở màn xem nhanh). */
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
    out += `<tr><td colspan="10"><div class="empty">${q?`Không có dự án nào khớp “${esc(S.dashQuery)}”.`:'Chưa có dự án nào. Bấm "+ Dự án mới" ở trên để tạo.'}</div></td></tr>`;
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
