"use strict";
/* Màn hình: plan */
/* ================= VIEW: plan ================= */
/* Trưởng phòng sửa mọi dự án. Nhân viên sửa dự án do mình tạo, hoặc dự án mình là TM (phụ trách) – kể cả thêm/sửa/xoá đầu việc.
   Xoá cả dự án thì chặt hơn: chỉ người tạo hoặc trưởng phòng, xem canDeleteProject bên dưới. */
function canManageProject(p){ return !!p && (S.canEdit || (!!S.user && (p.created_by === S.user.username || projectAssigned(p, S.user.staff_name)))); }
function canDeleteProject(p){ return !!p && (S.canEdit || (!!S.user && p.created_by === S.user.username)); }
/* Kế hoạch dự án giờ là 1 tab bên trong màn "Dự án" (gộp chung với Tổng quan, xem project-overview.js:
   viewProject()) thay vì màn riêng – tách thanh công cụ (planToolbar, đặt lên hàng tiêu đề "Dự án" chung)
   khỏi phần nội dung (planContent, đặt dưới hàng tab), đúng kiểu đã làm cho Báo cáo (reports.js). */
function planToolbar(){
  /* Trang này tự lọc theo "Tôi là" riêng (S.me đọc thẳng ở planContent(), không qua effectiveSimAs()),
     nên ô kỳ và dropdown Cá nhân/Tổng thể ở đây CHƯA có tác dụng lọc gì, chỉ thêm cho đồng bộ giao diện
     (đã xác nhận với người dùng), dùng chung S.week/S.period/periodInfo()/exnav/exper/exrefresh với
     Dashboard/tab Tổng quan nên đổi kỳ ở đâu cũng khớp nơi khác. */
  const kind = S.period || "week", per = periodInfo(S.week, kind);
  return `<div class="ex-wk"><button data-act="exnav" data-d="-1" aria-label="Kỳ trước">‹</button><div class="lb">${esc(per.label)}</div><button data-act="exnav" data-d="1" aria-label="Kỳ sau">›</button></div>
    <div class="ex-seg" role="group" aria-label="Kỳ báo cáo">${[["week","Tuần"],["month","Tháng"],["quarter","Quý"]].map(([k,l])=>`<button data-act="exper" data-k="${k}" aria-pressed="${kind===k}">${l}</button>`).join("")}</div>
    ${scopeToggleHtml(true)}
    <button class="btn icon" data-act="exrefresh" title="Làm mới" aria-label="Làm mới">${ICONS.refresh}</button>`;
}
function planContent(){
  /* Góc nhìn theo "Tôi là": chọn một người (kể cả khi tài khoản là trưởng phòng) thì chỉ thấy dự án
     người đó là TM (phụ trách). Chọn "Tất cả" (chỉ trưởng phòng chọn được) hoặc chưa gắn với
     ai thì thấy mọi dự án. Muốn xem toàn bộ dự án của phòng mà không đổi "Tôi là" thì sang tab Tổng quan. */
  const ps = (!S.me || S.me==="__all__") ? M.projects : M.projects.filter(p=>projectAssigned(p, S.me));
  const filt = S.typeFilter || "Tất cả";
  const q = S.planQuery.toLowerCase();
  const pool = ps.filter(p=>planMatchFilter(p, filt) && (!q || p.name.toLowerCase().includes(q)))
    .sort((a,b)=>(b._stuck-a._stuck) || (b._late-a._late) || a.name.localeCompare(b.name,"vi"));
  /* Lọc "Đang triển khai": chỉ tự mở dự án vướng nhiều nhất một lần đầu tiên; sau đó tôn trọng việc đóng/mở thủ công,
     kể cả khi rời trang rồi quay lại (không tự mở lại mỗi lần vẽ lại trang) */
  S.planAutoOpened = S.planAutoOpened || {};
  if(filt==="Đang triển khai" && pool.length && !S.planAutoOpened[filt]){
    if(!pool.some(p=>p.id===S.planSel)) S.planSel = pool[0].id;
    S.planAutoOpened[filt] = true;
  }
  const chips = `<div class="chips" role="group" aria-label="Lọc dự án">${PLAN_FILTERS.map(f=>`<button class="chip-btn" data-act="tf" data-t="${esc(f.key)}" aria-pressed="${filt===f.key}">${esc(f.label)}</button>`).join("")}</div>`;
  let h = `<div class="head-ctl" style="margin-bottom:16px">${chips}
      <input class="inp" type="search" placeholder="Tìm dự án" style="width:180px" data-act="pq" value="${esc(S.planQuery)}" aria-label="Tìm dự án">
      ${S.canEdit?`<button class="btn" data-act="planimport" title="Tạo dự án mới từ file Excel theo đúng mẫu bảng tiến độ của phòng (sheet Infor + NGSI)">Nhập Excel</button>
      <input type="file" accept=".xlsx" id="planImportFile" hidden>
      <button class="btn primary" data-act="newp">+ Dự án mới</button>`:""}</div>`;
  let body = "";
  for(const t of TYPES){
    const g = pool.filter(p=>p.type===t);
    if(!g.length) continue;
    body += `<section class="panel" style="margin-bottom:18px">`;
    for(const p of g){
      const open = S.planSel===p.id;
      body += `<div class="prow" data-act="psel" data-id="${esc(p.id)}" role="button" tabindex="0" aria-expanded="${open}">
        <div><div class="nm">${esc(p.name)}</div><div class="ow">${esc(p.pm||"Chưa gán PM")}</div></div>
        <div><div class="pct">${pct(p._prog)}</div><div class="pbar"><i style="width:${Math.round((p._prog||0)*100)}%"></i></div></div>
        <div class="next small"><div class="muted">Mốc tiếp theo</div><div style="font-weight:600">${p._next?dmy(p._next):"–"}</div></div>
        <div class="strip-cell">${strip(p, "plan", "planSel")}</div>
        <div class="badges">${p._late?`<span class="pill bad">${p._late} quá hạn</span>`:""}${p._stuck?`<span class="pill warn">${p._stuck} vướng</span>`:""}${p._soon?`<span class="pill info">${p._soon} sắp hạn</span>`:""}${!(p.tasks||[]).length?'<span class="pill mute">Chưa có đầu việc</span>':!p._late&&!p._stuck&&!p._soon?'<span class="pill ok">Đúng tiến độ</span>':""}</div>
      </div>`;
      if(open) body += planDetail(p, true);
    }
    body += `</section>`;
  }
  if(!body) body = `<section class="panel"><div class="empty"><b>${ps.length?"Không có dự án nào trong bộ lọc này":"Chưa có dự án"}</b>${!ps.length ? (S.canEdit?`“${esc(S.me)}” chưa được gán làm TM hoặc SE của dự án nào. Đổi “Tôi là” thành “— Tất cả —” để xem hết, hoặc bấm “+ Dự án mới” để tạo.`:"Bạn chưa được gán làm TM hoặc SE của dự án nào. Xem toàn bộ dự án (chỉ xem) ở tab \"Tổng quan\".") : ""}</div></section>`;
  return h + body;
}
/* Bảng đầu việc đầy đủ, xổ ra ngay dưới dòng dự án khi bấm vào (giống cách mở rộng ở Tổng quan dự án) */
/* Số cột khớp đúng planTaskRow() (20 cột) – bảng rộng, cuộn ngang nhờ .tbl-wrap{overflow-x:auto} (base.css).
   "Mốc hợp đồng"/"Tình hình chung" (p.milestones/p.situation) đã bỏ khỏi trang này theo yêu cầu (chỉ còn ở
   form Sửa thông tin dự án – projectForm() – và Báo cáo → Báo cáo tổng hợp dự án, xem reports.js), dữ liệu
   cũ vẫn giữ nguyên trong CSDL. */
const PLAN_COLS = 16;
/* Mức phóng bảng "Kế hoạch dự án" (zoom CSS trên <table>, xem plan.css) – chỉ lưu trong phiên, không ghi
   CSDL, giống các tuỳ chọn hiển thị khác (S.planTog…). */
function planZoomLevel(){ return S.planZoom || 1; }
/* Nút ‹ › cuộn ngang bảng đang hiện (bảng đầu việc chính hoặc bảng trong panel như Tiến độ theo tuần) mà
   không phải kéo xuống cuối bảng tìm thanh cuộn ngang. Tìm trong cùng khối .pdetail phần tử đang cuộn ngang
   được (rộng nhất), trượt ~3/4 bề rộng nhìn thấy. Không render() lại (giữ nguyên vị trí cuộn). */
ACTIONS["planpan"] = el => {
  const box = el.closest(".pdetail"); if(!box) return;
  const sc = [...box.querySelectorAll("*")].filter(n => n.scrollWidth > n.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(n).overflowX))
    .sort((a, b) => b.scrollWidth - a.scrollWidth)[0];
  if(sc) sc.scrollBy({left: +el.dataset.d * Math.round(sc.clientWidth * 0.75), behavior:"smooth"});
};
ACTIONS["planzoom"] = el => {
  const d = +el.dataset.d;
  if(d===0) S.planZoom = 1;
  else S.planZoom = Math.min(1.5, Math.max(0.5, Math.round((planZoomLevel()+d)*10)/10));
  render();
};
/* "Tiến độ theo tuần" – lưới Gantt theo tuần (mỗi cột thứ 2→CN), tham khảo ý tưởng sheet Report của file
   mẫu thật (xem CLAUDE.md "Bộ công thức sheet Report" – hướng 3 "Gantt theo tuần thay cho thanh tiến độ",
   trước ghi CHƯA làm, nay bắt đầu làm theo yêu cầu người dùng). Excel gốc tô CHỒNG 3 dải màu/1 ô (kế hoạch
   gốc + điều chỉnh + thực tế cùng lúc nếu tuần đó nằm trong cả 3 khoảng) bằng Conditional Formatting; bản
   web này ĐƠN GIẢN HOÁ còn 1 màu/đầu việc/tuần – chọn theo đúng thứ tự ưu tiên "ngày khả dụng gần nhất" đã
   dùng nhất quán trong app (Thực tế → HĐ điều chỉnh → HĐ gốc, xem msDate() ở model.js), khác Excel có chủ
   đích: tránh 1 ô phải tô nhiều lớp màu chồng (khó đọc trên màn hẹp hơn Excel), đổi lại màu luôn phản ánh
   đúng khoảng ngày "đang dùng thật" của đầu việc đó tại thời điểm xem. Chỉ hiện ở trang "Tổng quan → bấm dự
   án" (planDetail(p) không extra) – xem nút "Tiến độ theo tuần" thay cho "Xoá dự án"/"Sửa thông tin" cũ ở
   đó (theo yêu cầu người dùng, trang báo cáo không cần sửa/xoá, các nút chức năng khác sẽ thêm dần sau). */
const PLAN_GANTT_COLOR = {act:"#70AD47", adj:"#8064A2", hd:"#5B9BD5"};
/* Lấy đúng 1 cặp ngày "đang dùng thật" của 1 đầu việc + nguồn (act/adj/hd) để tô màu – PHẢI lấy nguyên cặp
   bắt đầu+kết thúc CÙNG 1 bậc (không trộn như msDate() ở model.js, nơi đó trộn độc lập từng vế cho mục đích
   khác – "ngày khả dụng gần nhất" đơn lẻ, không cần cặp sạch). Trả null nếu đầu việc không có cặp ngày nào
   đủ cả 2 đầu. */
function planTaskBar(t){
  const pairs = [["act",t.actStart,t.actEnd], ["adj",t.adjStart,t.adjEnd], ["hd",t.hdStart,t.deadline]];
  for(const [tier,s,e] of pairs){
    if(!s || !e) continue;
    let color = PLAN_GANTT_COLOR[tier];
    /* Cảnh báo (đầu việc đang mở mà quá hạn/sắp hạn) ĐÈ LÊN màu theo nguồn ngày – cảnh báo quan trọng hơn
       hiển thị đúng khung kế hoạch, cùng logic ưu tiên đã dùng ở cột "Cảnh báo"/dải cảnh báo theo giai đoạn. */
    if(OPEN.has(t.status)){
      if(t.warns.some(w=>w[1]==="Quá hạn")) color = "#C00000";
      else if(t.warns.some(w=>w[1]==="Sắp đến hạn")) color = "#F4B183";
    }
    return {start:s, end:e, color, tier};
  }
  return null;
}
function planGanttPanel(p){
  const bars = p._tasks.map(t=>({t, bar:planTaskBar(t)})).filter(x=>x.bar);
  if(!bars.length) return `<div class="empty" style="margin-bottom:12px">Chưa có đầu việc nào đủ cả ngày bắt đầu + kết thúc để vẽ tiến độ theo tuần.</div>`;
  let minD=null, maxD=null;
  for(const {bar} of bars){ if(!minD||bar.start<minD) minD=bar.start; if(!maxD||bar.end>maxD) maxD=bar.end; }
  const curWeekMon = mondayOf(todayISO());
  let cur = mondayOf(minD); const endMon = mondayOf(maxD);
  const weeks = [];
  while(cur<=endMon && weeks.length<156){ weeks.push(cur); cur = addDays(cur,7); } // chặn tối đa 3 năm, tránh bảng khổng lồ nếu dữ liệu ngày lỗi
  const head = weeks.map(w=>`<th class="plan-gc${w===curWeekMon?" plan-gc-cur":""}">Tuần ${isoWeek(w)}<div class="small" style="font-weight:400">${dmy(w)}–${dmy(addDays(w,6))}</div></th>`).join("");
  const rows = bars.map(({t,bar})=>{
    const cells = weeks.map(w=>{
      const wEnd = addDays(w,6);
      const covered = bar.start<=wEnd && bar.end>=w;
      const cur = w===curWeekMon;
      return `<td class="plan-gc${cur?" plan-gc-cur":""}"${covered?` style="background:${bar.color}"`:""}></td>`;
    }).join("");
    return `<tr><td class="plan-gc-label" title="${esc(t.dv)}">${t.no?esc(t.no)+". ":""}${esc(planShortName(t.dv))}</td>${cells}</tr>`;
  }).join("");
  return `<div class="plan-gantt-legend small muted">
      <span><i style="background:${PLAN_GANTT_COLOR.hd}"></i>Kế hoạch HĐ gốc</span>
      <span><i style="background:${PLAN_GANTT_COLOR.adj}"></i>HĐ điều chỉnh</span>
      <span><i style="background:${PLAN_GANTT_COLOR.act}"></i>Thực tế</span>
      <span><i class="plan-gc-cur" style="width:14px; height:14px"></i>Tuần hiện tại</span>
      <span><i style="background:#C00000"></i>Quá hạn</span>
      <span><i style="background:#F4B183"></i>Sắp đến hạn</span>
    </div>
    <div class="plan-gantt-scroll"><table class="plan-gantt-tbl"><thead><tr><th class="plan-gc-label">Đầu việc</th>${head}</tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}
ACTIONS["plangantt"] = el => { S.planGanttOpen = S.planGanttOpen||{}; const id=el.dataset.id; S.planGanttOpen[id] = !S.planGanttOpen[id]; render(); };
ACTIONS["planurgent"] = el => { S.planUrgentOpen = S.planUrgentOpen||{}; const id=el.dataset.id; S.planUrgentOpen[id] = !S.planUrgentOpen[id]; render(); };
ACTIONS["planpay"] = el => { S.planPayOpen = S.planPayOpen||{}; const id=el.dataset.id; S.planPayOpen[id] = !S.planPayOpen[id]; render(); };
/* extra=true: THAY cột "Đánh giá" (diff actEnd/deadline) bằng 2 cột "Cảnh báo" (t.warns – Quá hạn/Sắp đến
   hạn/Ma sát cao…, warnPills() core/ui.js, rộng cố định 180px) + "Note" (t.note – Ghi chú của trưởng phòng,
   chỉ trưởng phòng/phó phòng/admin sửa được qua taskForm()) – CHỈ bật ở tab "Kế hoạch dự án" (planContent(),
   gọi planDetail(p,true)); trang chi tiết 1 dự án mở từ tab "Tổng quan" (ovDetailHeader()+planDetail(p),
   project-overview.js) giữ nguyên cột "Đánh giá" như cũ, KHÔNG có Cảnh báo/Note. Bỏ hẳn "Đánh giá" khi có
   Cảnh báo (thay vì giữ cả 2) vì trùng ý: "Đánh giá" chỉ là 1 góc nhìn hẹp (so actEnd với deadline),
   "Cảnh báo" bao quát hơn (quá hạn/sắp hạn/ma sát cao) – theo đúng yêu cầu người dùng, 2 đường vào cùng 1
   bảng nhưng mức chi tiết khác nhau: "Kế hoạch dự án" là bảng làm việc đầy đủ, "Tổng quan → bấm dự án" là
   bảng xem nhanh kiểu báo cáo. */
function planDetail(p, extra, noTools){
  const cols = PLAN_COLS + (extra?1:0);
  const ganttOpen = !!(S.planGanttOpen && S.planGanttOpen[p.id]);
  const urgentOpen = !!(S.planUrgentOpen && S.planUrgentOpen[p.id]);
  const payOpen = !!(S.planPayOpen && S.planPayOpen[p.id]);
  /* noTools=true (chỉ dùng từ rpProjectContent(), reports.js): ẩn hẳn 3 nút Tiến độ theo tuần/Đầu việc
     khẩn cấp/Mốc thanh toán khỏi toolbar RIÊNG của bảng này – 3 nút đó đã dọn lên thanh điều khiển chung
     (cùng hàng "Tất cả"/chọn dự án/"← Quay lại tổng quan"/"Xuất báo cáo") theo yêu cầu người dùng, tránh
     lặp 2 chỗ. 3 PANEL (Tiến độ theo tuần/Đầu việc khẩn cấp/Mốc thanh toán) vẫn render Ở ĐÂY như cũ – vẫn
     đúng ý "hiển thị thành các bảng riêng" (mỗi panel 1 `<section class="panel">` riêng ngay trên bảng
     chính) – chỉ NÚT bấm mở/đóng là chuyển chỗ, trạng thái đóng/mở (S.planGanttOpen…) dùng chung nên nút ở
     đâu bấm cũng ra đúng kết quả. */
  let out = `<div class="pdetail">
    <div class="toolbar" style="margin-bottom:12px; justify-content:space-between">
      <div>${extra ? (canManageProject(p)?`${canDeleteProject(p)?`<button class="btn danger" data-act="delp" data-id="${esc(p.id)}">Xoá dự án</button>`:""}<button class="btn" data-act="editp" data-id="${esc(p.id)}">Sửa thông tin</button><button class="btn" data-act="schedxls" data-id="${esc(p.id)}" title="Đọc công thức trong file Excel tiến độ gốc của dự án để gắn phụ thuộc giữa các đầu việc – không đổi ngày nào">Gắn phụ thuộc từ Excel</button><input type="file" accept=".xlsx" id="schedXlsFile" data-pid="${esc(p.id)}" hidden>`:"")
        : (noTools ? "" : `<button class="btn${ganttOpen?" primary":""}" data-act="plangantt" data-id="${esc(p.id)}" aria-pressed="${ganttOpen}">Tiến độ theo tuần</button>
        <button class="btn${urgentOpen?" primary":""}" data-act="planurgent" data-id="${esc(p.id)}" aria-pressed="${urgentOpen}">Đầu việc khẩn cấp</button>
        <button class="btn${payOpen?" primary":""}" data-act="planpay" data-id="${esc(p.id)}" aria-pressed="${payOpen}">Mốc thanh toán</button>`)}</div>
      <div style="display:flex; gap:8px; flex:none">
      <div class="plan-zoom" role="group" aria-label="Cuộn ngang bảng">
        <button data-act="planpan" data-d="-1" title="Cuộn sang trái" aria-label="Cuộn sang trái">‹</button>
        <button data-act="planpan" data-d="1" title="Cuộn sang phải" aria-label="Cuộn sang phải">›</button>
      </div>
      <div class="plan-zoom" role="group" aria-label="Phóng to/thu nhỏ bảng">
        <button data-act="planzoom" data-d="-0.1" title="Thu nhỏ" aria-label="Thu nhỏ">−</button>
        <span class="lv">${Math.round(planZoomLevel()*100)}%</span>
        <button data-act="planzoom" data-d="0.1" title="Phóng to" aria-label="Phóng to">+</button>
      </div></div></div>`;
  /* Đang mở 1 trong 3 panel (chỉ áp dụng khi !extra, tức trang Báo cáo dự án) → ẨN HẲN bảng đầu việc chính
     bên dưới thay vì xếp chồng cả 2 – theo yêu cầu người dùng ("nó là riêng mà", chú thích màu Gantt đứng
     ngay sát bảng chính nhìn như 1 bảng dễ gây hiểu lầm chú thích đó mô tả luôn bảng chính). Đóng cả 3
     panel thì bảng chính hiện lại bình thường. Tab "Kế hoạch dự án" (`extra=true`) không có khái niệm 3
     panel này nên luôn hiện bảng chính, không bị ảnh hưởng. */
  const anyPanelOpen = !extra && (ganttOpen || urgentOpen || payOpen);
  /* Nút −/%/+ phóng to/thu nhỏ áp dụng cho CẢ 3 bảng này (yêu cầu người dùng: mọi trang hiển thị đều zoom
     được), không chỉ bảng đầu việc chính – bọc nội dung panel trong 1 khối có cùng `zoom` (Xuất PDF tự ép
     về zoom:1 ở onclone, xem rpExportPdf()). */
  const zoomWrap = html => `<div style="zoom:${planZoomLevel()}">${html}</div>`;
  if(!extra && ganttOpen) out += `<section class="panel" style="margin-bottom:12px"><div class="panel-b"><h2 style="margin:0 0 10px">Tiến độ theo tuần</h2>${zoomWrap(planGanttPanel(p))}</div></section>`;
  if(!extra && urgentOpen) out += `<section class="panel" style="margin-bottom:12px"><div class="panel-b"><h2 style="margin:0 0 10px">Đầu việc khẩn cấp / cần chú ý</h2>${zoomWrap(planUrgentPanel(p))}</div></section>`;
  if(!extra && payOpen) out += `<section class="panel" style="margin-bottom:12px"><div class="panel-b"><h2 style="margin:0 0 10px">Mốc thanh toán</h2>${zoomWrap(planPaymentPanel(p))}</div></section>`;
  if(!anyPanelOpen){
    const rows = planTreeRows(p, {cols, extra});
    out += `<div class="plan-scroll"><div class="tbl-wrap panel plan-grid${extra?"":" plan-grid-report"}"><table style="white-space:nowrap; zoom:${planZoomLevel()}"><thead>
    <tr><th rowspan="2" class="plan-no">No.</th><th rowspan="2" class="plan-dv" style="white-space:normal">Đầu việc</th><th rowspan="2">Trạng thái</th><th rowspan="2">Ưu tiên</th><th rowspan="2">Phụ trách</th>
      <th colspan="2">Thời gian (ngày)</th><th colspan="2">Kế hoạch theo HĐ</th><th colspan="2">Kế hoạch HĐ điều chỉnh</th><th colspan="2">Kế hoạch dự kiến</th><th colspan="2">Kế hoạch thực tế</th>
      ${extra?`<th rowspan="2" style="width:180px; white-space:normal">Cảnh báo</th><th rowspan="2" style="width:260px; white-space:normal">Note</th>`:`<th rowspan="2">Đánh giá</th>`}</tr>
    <tr><th>Theo thực tế</th><th>Theo đề xuất</th><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th></tr>
    </thead>
    <tbody>${rows||`<tr><td colspan="${cols}"><div class="empty"><b>Dự án chưa có đầu việc.</b>${canManageProject(p)?`<button class="btn primary" style="margin-top:10px" data-act="addtask" data-id="${esc(p.id)}">+ Đầu việc</button>`:""}</div></td></tr>`}</tbody></table></div></div>
    <p class="small muted" style="margin:8px 0 0">Bấm vào một đầu việc để xem chi tiết${S.canEdit?", sửa hoặc đánh giá khi hoàn thành":""}.</p>`;
  }
  out += `</div>`;
  return out;
}
/* "Mốc chính dự án" – tự nhận diện từ No./tên đầu việc theo quy tắc đang cấu hình (Cài đặt → "Nhận diện
   mốc chính", S.milestoneRule, xem msClassify() ở model.js) – tham khảo đúng Section II của sheet Report
   trong file mẫu thật của phòng (xem CLAUDE.md "Bộ công thức sheet Report"). Gấp/mở bằng <details> thuần,
   không cần thêm state riêng; tự ẩn hẳn khi dự án không có mốc nào khớp quy tắc (vd dự án không theo đúng
   quy ước "No." A/I/1/1.1). */
/* Dựng bảng 4 cặp ngày (STT/Hạng mục-Giai đoạn/Trạng thái/Ưu tiên/HĐ gốc/HĐ điều chỉnh/Dự kiến/Thực tế/
   Chênh lệch/Đánh giá) y hệt mẫu bảng "II. CÁC MỐC CHÍNH CỦA DỰ ÁN" của sheet Report – dùng chung cho
   `planMilestonesPanel()` (lọc theo S.milestoneRule) và `planPaymentPanel()` (lọc theo nhánh "THANH TOÁN")
   vì cả 2 chỉ khác nhau ở DANH SÁCH đầu vào, giống hệt phần hiển thị. */
function planMsTable(list){
  const d = x => x?dmy(x):"–";
  /* Màu nền ô "Trạng thái", đúng Conditional Formatting cột D của bảng mốc chính trong file mẫu thật
     (D17:D87: Hoàn thành=xanh lá nhạt, Đang thực hiện=xanh dương nhạt, Pending=vàng) – CHỈ tô riêng ô này
     (không tô cả dòng như đã thử ở bảng đầu việc chính rồi bỏ theo phản hồi người dùng, xem CLAUDE.md). */
  const stBg = {"Hoàn thành":"var(--ok-soft)", "Đang làm":"var(--info-soft)", "Tạm dừng":"var(--warn-soft)"};
  const rows = list.map((m,i) => {
    const no = String(m.no||"").trim();
    const hdrKind = msLetterNo(no) ? "a" : msRomanNo(no) ? "r" : "";
    /* "Chênh lệch (ngày)" + "Đánh giá": Thực tế – Kế hoạch theo HĐ gốc (actEnd − deadline), y hệt công
       thức M17 của file mẫu (K17−G17) – chỉ tính được khi có đủ cả 2 ngày, không suy đoán khi thiếu. */
    let diff = null, assess = "";
    if(m.actEnd && m.deadline){
      diff = days(m.deadline, m.actEnd);
      assess = diff===0 ? '<span class="pill ok">✓ Đúng hạn</span>'
        : diff<0 ? `<span class="pill ok">✓ Sớm ${Math.abs(diff)} ngày</span>`
        : `<span class="pill bad">⚠ Trễ ${diff} ngày</span>`;
    }
    return `<tr>
      <td class="plan-no" style="text-align:center">${i+1}</td>
      <td class="plan-dv" style="text-align:left">${hdrKind?`<span class="plan-no-tag plan-no-${hdrKind}">${esc(no||"–")}</span> `:(no?esc(no)+". ":"")}${esc(planShortName(m.dv))}</td>
      <td style="background:${stBg[m.status]||"transparent"}">${stPill(m.status)}</td>
      <td style="text-align:center">${m.pr?`<span class="pill ${m.pr==="Cao"?"bad":"mute"}">${esc(m.pr)}</span>`:"–"}</td>
      <td>${d(m.hdStart)}</td><td>${d(m.deadline)}</td>
      <td>${d(m.adjStart)}</td><td>${d(m.adjEnd)}</td>
      <td>${d(m.expStart)}</td><td>${d(m.expEnd)}</td>
      <td>${d(m.actStart)}</td><td>${d(m.actEnd)}</td>
      <td style="text-align:center">${diff==null?"–":diff}</td>
      <td style="text-align:center">${assess||"–"}</td></tr>`;
  }).join("");
  return `<div class="tbl-wrap plan-grid" style="max-height:60vh"><table style="min-width:1400px"><thead>
      <tr><th rowspan="2" class="plan-no">STT</th><th rowspan="2" class="plan-dv" style="white-space:normal">Hạng mục / Giai đoạn</th><th rowspan="2">Trạng thái</th><th rowspan="2">Ưu tiên</th>
        <th colspan="2">Kế hoạch (HĐ gốc)</th><th colspan="2">HĐ điều chỉnh</th><th colspan="2">Dự kiến</th><th colspan="2">Thực tế</th>
        <th rowspan="2" style="white-space:normal">Chênh lệch<br>(ngày)</th><th rowspan="2">Đánh giá</th></tr>
      <tr><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th><th>Bắt đầu</th><th>Kết thúc</th></tr>
    </thead><tbody>${rows}</tbody></table></div>`;
}
function planMilestonesPanel(p){
  const ms = p._milestones || [];
  if(!ms.length) return "";
  const mode = (S.milestoneRule && S.milestoneRule.mode) || 2;
  const modeInfo = MILESTONE_RULE_MODES.find(m=>m[0]===mode) || MILESTONE_RULE_MODES[1];
  return `<details class="panel" style="margin-bottom:12px"><summary class="panel-h" style="cursor:pointer"><h2>Mốc chính dự án <span class="small muted">· ${ms.length} mốc</span></h2></summary>
    <div class="panel-b small muted" style="padding-top:0">Chế độ nhận diện mốc: <b>Mode ${mode}</b> — ${esc(modeInfo[1])}. Đổi ở Cài đặt → "Nhận diện mốc chính &amp; cảnh báo".</div>
    ${planMsTable(ms)}</details>`;
}
/* "Mốc thanh toán" (tham khảo "IV. GANTT DÒNG TIỀN — CÁC MỐC THANH TOÁN" của sheet Report) – lọc đúng
   nhánh đầu việc nằm dưới 1 dòng hạng mục chữ cái (A/B/C…) có chữ "THANH TOÁN" trong tên, dùng lại NGUYÊN
   logic `inPayment` của `msClassify()` (model.js, reset mỗi dòng chữ cái đơn mới, bật nếu tên dòng đó chứa
   "THANH TOÁN") – viết lại vòng lặp riêng ở đây vì msClassify() trả về mảng boolean "là mốc chính" theo
   mode đang cấu hình (mục đích khác hẳn, không tách lọc riêng nhánh thanh toán được). KHÔNG phụ thuộc
   S.milestoneRule – nhánh thanh toán luôn cố định theo đúng tên "THANH TOÁN", không có mode chọn. */
function planPaymentTasks(p){
  let inPayment = false;
  const out = [];
  for(const t of p._tasks){
    const no = String(t.no||"").trim();
    if(msLetterNo(no)) inPayment = msPayment(t.dv);
    if(inPayment && (no!=="" || String(t.dv||"").trim()!=="")) out.push(t);
  }
  return out;
}
function planPaymentPanel(p){
  const list = planPaymentTasks(p);
  return `<div class="small muted" style="margin-bottom:8px">Tự nhận diện toàn bộ đầu việc dưới hạng mục có chữ "THANH TOÁN" trong tên, không phụ thuộc chế độ nhận diện mốc chính.</div>
    ${list.length ? planMsTable(list) : `<div class="empty">Dự án không có hạng mục nào tên chứa "THANH TOÁN".</div>`}`;
}
/* "Đầu việc khẩn cấp / cần chú ý" (tham khảo "III. CÁC ĐẦU VIỆC KHẨN CẤP / CẦN CHÚ Ý (URGENT)" của sheet
   Report) – 2 nhóm tự lọc từ chính `t.warns` đã tính sẵn ở derive() (model.js, không tính lại riêng):
   nhóm A = đầu việc đang mở mà có cảnh báo "Quá hạn", nhóm B = có cảnh báo "Sắp đến hạn" (ngưỡng ngày lấy
   đúng S.milestoneRule.dueSoonDays đang cấu hình – Cài đặt → "Nhận diện mốc chính & cảnh báo", KHÔNG tự
   đặt ngưỡng riêng cho panel này). Sắp theo "ngày khả dụng gần nhất" (tái dùng planTaskBar() lấy cặp ngày
   đang dùng thật) để đầu việc trễ/sắp đến hạn NHIỀU NHẤT lên trước, khớp đúng mục đích "bảng khẩn cấp". */
function planUrgentGroup(title, cls, list){
  const d = x => x?dmy(x):"–";
  const rows = list.map((t,i) => {
    const bar = planTaskBar(t);
    const today = todayISO();
    const lateDays = bar ? days(bar.end, today) : null;
    return `<tr class="click" data-act="task" data-pid="${esc(t.p.id)}" data-id="${esc(t.id)}" tabindex="0">
      <td class="plan-no" style="text-align:center">${i+1}</td>
      <td class="plan-dv" style="text-align:left">${t.no?esc(t.no)+". ":""}${esc(planShortName(t.dv))}</td>
      <td>${stPill(t.status)}</td>
      <td style="text-align:center">${t.pr?`<span class="pill ${t.pr==="Cao"?"bad":"mute"}">${esc(t.pr)}</span>`:"–"}</td>
      <td>${d(bar&&bar.start)}</td><td>${d(bar&&bar.end)}</td>
      <td style="text-align:center">${lateDays==null?"–":lateDays}</td>
      <td>${esc(t.owner||"–")}</td>
      <td style="white-space:normal; text-align:left">${esc(t.note||"–")}</td></tr>`;
  }).join("");
  return `<div class="plan-urgent-hdr ${cls}">${esc(title)} <span class="small">· ${list.length} đầu việc</span></div>
    ${list.length ? `<div class="tbl-wrap plan-grid" style="max-height:40vh"><table style="min-width:900px"><thead><tr>
      <th class="plan-no">STT</th><th class="plan-dv" style="white-space:normal">Hạng mục / Đầu việc</th><th>Trạng thái</th><th>Ưu tiên</th>
      <th>Bắt đầu</th><th>Kết thúc</th><th style="white-space:normal">Số ngày</th><th>Người phụ trách</th><th style="white-space:normal">Note</th></tr></thead>
      <tbody>${rows}</tbody></table></div>` : `<div class="empty small">Không có đầu việc nào.</div>`}`;
}
function planUrgentPanel(p){
  const dueSoonDays = (S.milestoneRule && S.milestoneRule.dueSoonDays) ?? 14;
  const late = p._tasks.filter(t=>OPEN.has(t.status) && t.warns.some(w=>w[1]==="Quá hạn"));
  const soon = p._tasks.filter(t=>OPEN.has(t.status) && t.warns.some(w=>w[1]==="Sắp đến hạn"));
  const byLate = (a,b) => { const ba=planTaskBar(a), bb=planTaskBar(b); return (ba?ba.end:"9999").localeCompare(bb?bb.end:"9999"); };
  late.sort(byLate); soon.sort(byLate);
  return `<div class="small muted" style="margin-bottom:8px">Ngưỡng "Sắp đến hạn": <b>${dueSoonDays} ngày</b>. Đổi ở Cài đặt → "Nhận diện mốc chính &amp; cảnh báo".</div>
    <div style="display:flex; flex-direction:column; gap:14px">
      ${planUrgentGroup("A. QUÁ HẠN", "plan-urgent-a", late)}
      ${planUrgentGroup("B. ĐẾN HẠN TRONG ≤ "+dueSoonDays+" NGÀY", "plan-urgent-b", soon)}
    </div>`;
}
/* Bảng đầu việc PHẲNG, không gấp/mở – đúng thứ tự lưu trong p.tasks (giữ nguyên thứ tự khung mẫu lúc tạo
   dự án, xem catFlatTable() ở settings.js/projectForm() ở plan.js). "No." (t.no, tự gõ hoặc copy từ khung
   mẫu, vd A/I/1/1.1) chỉ hiện như 1 nhãn đầu dòng, không dùng để tính lồng cấp hiển thị. */
/* Tên đầu việc – giữ tên hàm này vì nhiều màn khác (weekly-input.js, reports.js, kpi.js, ui.js…) đang gọi;
   trước đây tách bỏ phần "mã. hạng mục –" mã hoá trong t.dv, giờ t.dv đã là tên thuần nên chỉ trả nguyên. */
function planShortName(dv){ return dv||""; }
/* Khớp đúng mẫu bảng Excel giấy của phòng (No./Nội dung/Trạng thái/Ưu tiên/Người phụ trách/Thời gian
   (ngày)/4 cặp Bắt đầu-Kết thúc/cột "ĐÁNH GIÁ" cuối bảng) – đã bỏ cột "Note" (không có trong file mẫu) và
   đổi cột "Cảnh báo" riêng của app thành "Đánh giá" y hệt sheet `Report` của file mẫu: so Thực tế – Kế
   hoạch theo HĐ gốc (`actEnd − deadline`, công thức `M17`=`K17−G17`), chỉ tính khi có đủ cả 2 ngày – 0→"✓
   Đúng hạn", âm→"✓ Sớm N ngày", dương→"⚠ Trễ N ngày", dùng lại ĐÚNG công thức đã viết ở
   `planMilestonesPanel()` (xem bên dưới), không vẽ lại riêng. `t.warns`/cảnh báo kiểu cũ (Quá hạn/Sắp đến
   hạn/Ma sát cao…) không còn hiện thành cột ở đây nữa nhưng vẫn tính trong `model.js`, vẫn dùng ở dải cảnh
   báo theo giai đoạn (`strip()`), Dashboard, số đếm quá hạn/sắp hạn… – chỉ không có cột riêng trong bảng
   này. Xem thead 2 dòng tương ứng ở planDetail(). Bảng khá rộng, cuộn ngang nhờ .tbl-wrap{overflow-x:auto}
   (base.css).
   Với ai sửa được dự án (canManageProject): 3 nút nổi (.plan-rowacts, position:absolute đè lên trong đúng ô
   "No." – KHÔNG phải 1 cột riêng, để không làm bảng rộng thêm/đẩy lệch các cột khác) chỉ hiện khi di chuột
   vào dòng (CSS tr:hover, xem plan.css) – "Chèn dòng lên trên"/"Chèn dòng xuống dưới" (dòng trống mới, điền
   nội dung sau bằng cách bấm vào dòng) và "Xoá dòng" (xoá thẳng, có xác nhận) – nhanh hơn phải mở form rồi
   mới xoá được như trước, vì khung mẫu hiện có không khớp đúng quy trình thật của PM nên người dùng cần tự
   do thêm/bớt/sắp xếp lại đầu việc trực tiếp trên bảng, giống thao tác chèn/xoá hàng Excel. */
function planTaskRow(t, i, lvl=1, p, extra){
  const idle = t.status==="Chưa bắt đầu";
  const d = x => x?dmy(x):"–";
  /* Nút chèn/xoá dòng CHỈ hiện ở tab "Kế hoạch dự án" (extra=true) – trang Báo cáo dự án (extra falsy) là
     trang xem/xuất báo cáo, không phải chỗ sửa dữ liệu (dù tài khoản có quyền canManageProject(p) vẫn
     không nên sửa dự án từ đây), theo đúng phản hồi người dùng ("dù sao cũng không sửa được"). Muốn
     chèn/xoá dòng vẫn làm được bình thường, chỉ cần sang đúng tab "Kế hoạch dự án". */
  const canAct = extra && p && canManageProject(p);
  /* Nổi bật trực quan "No." là hạng mục chữ cái (A/B/C…) hay số La Mã (I/II/III…) để phân biệt ngay bằng
     mắt, dùng ĐÚNG quy tắc loại trừ I/V/X đã thống nhất (msLetterNo()/msRomanNo(), model.js) – không tự vẽ
     lại quy tắc riêng ở đây. Chữ cái = cấp hạng mục lớn nhất → đậm nhất (nền + chữ đậm cả dòng); La Mã =
     cấp hạng mục con → nhẹ hơn (chỉ đậm ô No., không tô nền cả dòng); còn lại (số thường/thập phân) giữ
     nguyên như trước, không đổi gì. */
  const no = String(t.no||"").trim();
  const hdrKind = msLetterNo(no) ? "a" : msRomanNo(no) ? "r" : "";
  /* Tô nền cả dòng theo Trạng thái từng thử (bảng chú giải màu sheet Infor) nhưng người dùng phản hồi muốn
     bảng trắng như cũ, CHỈ giữ màu nổi bật ở dòng hạng mục chữ cái (hdrKind="a") – đã bỏ class plan-st-*,
     xem CSS .plan-st-* ở plan.css vẫn giữ lại (không xoá) phòng khi cần dùng lại, chỉ không gắn ở đây nữa. */
  const flash = S.schedFlash && S.schedFlash.until > Date.now() && S.schedFlash.ids.has(t.id);
  return `<tr class="click${idle?" tr-idle":""}${hdrKind?" plan-hdr-"+hdrKind:""}${flash?" plan-flash":""}" data-act="task" data-id="${esc(t.id)}" tabindex="0" title="${esc(t.dv)}">
      <td class="plan-no">${hdrKind?`<span class="plan-no-tag plan-no-${hdrKind}">${esc(t.no||"–")}</span>`:esc(t.no||"–")}${canAct?`<div class="plan-rowacts">
        <button type="button" data-act="taskinsert" data-pid="${esc(p.id)}" data-id="${esc(t.id)}" data-dir="up" title="Chèn dòng lên trên">↑+</button>
        <button type="button" data-act="taskinsert" data-pid="${esc(p.id)}" data-id="${esc(t.id)}" data-dir="down" title="Chèn dòng xuống dưới">↓+</button>
        <button type="button" data-act="taskdelrow" data-pid="${esc(p.id)}" data-id="${esc(t.id)}" title="Xoá dòng">✕</button>
      </div>`:""}</td>
      <td class="plan-dv" style="padding-left:10px; white-space:normal; text-align:left"><div class="cell-main">${esc(t.dv)}</div>${t.detail&&!idle?`<div class="cell-sub">${esc(t.detail)}</div>`:""}</td>
      <td>${stPill(t.status)}${t.done?`<div class="small muted">xong tuần ${isoWeek(t.done)}</div>`:""}</td>
      <td style="text-align:center">${t.pr?`<span class="pill ${t.pr==="Cao"?"bad":"mute"}">${esc(t.pr)}</span>`:""}</td>
      <td>${esc(t.owner||"–")}</td>
      <td style="text-align:center">${t.daysActual??"–"}</td><td style="text-align:center">${t.daysProposed??"–"}</td>
      <td>${d(t.hdStart)}</td><td>${d(t.deadline)}</td>
      <td>${d(t.adjStart)}</td><td>${d(t.adjEnd)}</td>
      <td>${d(t.expStart)}</td><td>${d(t.expEnd)}</td>
      <td>${d(t.actStart)}</td><td>${d(t.actEnd)}</td>
      ${extra?`<td style="white-space:normal">${warnPills(t.warns)||"–"}</td><td style="white-space:normal; text-align:left">${esc(t.note||"–")}</td>`:`<td style="text-align:center">${(()=>{ if(!t.actEnd||!t.deadline) return "–"; const diff=days(t.deadline,t.actEnd);
        return diff===0?'<span class="pill ok">✓ Đúng hạn</span>':diff<0?`<span class="pill ok">✓ Sớm ${Math.abs(diff)} ngày</span>`:`<span class="pill bad">⚠ Trễ ${diff} ngày</span>`; })()}</td>`}</tr>`;
}
/* o.row dựng dòng (mặc định planTaskRow), o.cols số cột, o.extra bật 2 cột Cảnh báo/Note (xem planDetail()). */
function planTreeRows(p, o={}){
  const rowFn = o.row||planTaskRow;
  return p._tasks.map((t,i) => rowFn(t, i+1, 1, p, o.extra)).join("");
}
/* ===== Nhập dự án từ file Excel (mẫu bảng tiến độ giấy của phòng: sheet "Infor" + "NGSI") =====
   Tải "lười" ExcelJS giống hệt cách reports.js làm cho xuất file (rpEnsureExcel()) – bản sao riêng tiền tố
   "plan" ở đây thay vì gọi thẳng hàm của reports.js, để Kế hoạch dự án (lõi) không phụ thuộc vào module
   Báo cáo (dù nạp sau cùng 1 lúc nên gọi thẳng vẫn chạy được, chỉ không đúng ranh giới kiến trúc). */
function planLoadScript(src){
  return new Promise((resolve, reject) => {
    if(document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script"); s.src = src;
    s.onload = () => resolve(); s.onerror = () => reject(new Error("Không tải được thư viện: "+src));
    document.head.appendChild(s);
  });
}
let planExcelReady = null;
function planEnsureExcel(){ return planExcelReady || (planExcelReady = planLoadScript("https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js")); }
/* Nhiều ô NGÀY trong file mẫu thật là CÔNG THỨC (vd "=H10+G10" tính Kết thúc = Bắt đầu + số ngày), không
   phải giá trị thô – ExcelJS trả về {formula, result} cho ô công thức (result đã tính sẵn, dùng cái đó),
   không phải Date/số trực tiếp như ô nhập tay. Phải bóc "result" ra TRƯỚC khi xử lý tiếp, nếu không mọi ô
   công thức (rất phổ biến ở cột "Kết thúc"/"Bắt đầu" lấy từ ô khác) sẽ đọc ra null hết. */
function xlsVal(v){ return (v && typeof v==="object" && "result" in v) ? v.result : v; }
function xlsText(v){
  v = xlsVal(v);
  if(v==null) return "";
  if(typeof v==="object" && Array.isArray(v.richText)) return v.richText.map(r=>r.text).join("");
  if(typeof v==="object" && v.text!=null) return String(v.text);
  return String(v).trim();
}
/* Ô ngày: ExcelJS trả về Date thật nếu ô có định dạng ngày (đa số trường hợp trong file mẫu), hoặc số
   serial Excel thô nếu không – dùng chung công thức quy đổi serial→ISO như lúc đọc thủ công bằng script
   (xem lịch sử phiên làm việc tạo dự án mẫu "LB 08"), tính theo UTC để không lệch múi giờ trình duyệt. */
function xlsDateISO(v){
  v = xlsVal(v);
  if(v==null || v==="" || v==="-") return null;
  if(v instanceof Date) return v.getUTCFullYear()+"-"+String(v.getUTCMonth()+1).padStart(2,"0")+"-"+String(v.getUTCDate()).padStart(2,"0");
  const n = Number(v);
  if(!isFinite(n) || n<=0) return null;
  const d = new Date(Date.UTC(1899,11,30) + Math.round(n)*86400000);
  return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");
}
function xlsNum(v){ v=xlsVal(v); if(v==null||v==="-"||v==="") return null; const n=Number(v); return isFinite(n) ? Math.round(n*100)/100 : null; }
/* "No." kiểu "1.1000000000000001" (lỗi làm tròn số thực của Excel khi gõ "1.1" vào ô định dạng số) → "1.1" */
function xlsCleanNo(v){ const s=xlsText(v); const n=Number(s); if(isFinite(n) && s.includes(".")) return String(Math.round(n*1000)/1000); return s; }
const XLS_STATUS_MAP = {"Đang thực hiện":"Đang làm","Hoàn thành":"Hoàn thành","Chưa bắt đầu":"Chưa bắt đầu","Pending":"Tạm dừng","Chờ Nghiệm thu":"Đang làm"};
/* Công thức + giá trị thô các cột F..O của 1 dòng sheet NGSI – đầu vào cho SCHED.fromExcel() (core/schedule.js)
   để chuyển công thức Excel thành phụ thuộc giữa các đầu việc. `cell.formula` của ExcelJS trả về cả công thức
   "dùng chung" (shared formula) đã dịch đúng theo dòng – không đọc `value.formula` (rỗng ở ô shared). */
const XLS_SCHED_COLS = {F:6, G:7, H:8, I:9, J:10, K:11, L:12, M:13, N:14, O:15};
function xlsSchedCells(row){
  const cells = {};
  for(const [k, c] of Object.entries(XLS_SCHED_COLS)){
    const cell = row.getCell(c);
    let f = null; try{ f = cell.formula || null; }catch(e){}
    cells[k] = {f, v: f ? null : xlsVal(cell.value)};
  }
  return cells;
}
/* Đọc workbook đã nạp → {shInfor, rows:[{row, no, dv, r:<ExcelJS Row>}]} – đúng các dòng "Nhập Excel" tạo
   thành đầu việc (bỏ dòng No./tên trống và các dòng tiêu đề gộp ô). Dùng chung cho nhập dự án mới và nút
   "Gắn phụ thuộc từ Excel" (plan-schedule.js) để 2 nơi khớp dòng ↔ đầu việc theo CÙNG 1 quy tắc. */
function planXlsRows(wb){
  const shInfor = wb.getWorksheet("Infor"), shNgsi = wb.getWorksheet("NGSI");
  if(!shNgsi) throw new Error('Không tìm thấy sheet "NGSI" trong file – đúng mẫu bảng tiến độ của phòng mới đọc được.');
  let headerRow = 0;
  shNgsi.eachRow((row, rn) => { if(!headerRow && xlsText(row.getCell(1).value).trim()==="No.") headerRow = rn; });
  if(!headerRow) throw new Error('Không tìm thấy dòng tiêu đề (ô "No.") trong sheet "NGSI".');
  const rows = [];
  for(let rn=headerRow+1; rn<=shNgsi.rowCount; rn++){
    const r = shNgsi.getRow(rn);
    const no = xlsCleanNo(r.getCell(1).value), dv = xlsText(r.getCell(2).value);
    /* Bỏ dòng trống/phụ đề xen giữa (vd dòng "Theo Thực tế/Theo đề xuất") VÀ bỏ các dòng ngay dưới dòng
       tiêu đề: ô tiêu đề "No."/"NỘI DUNG CÔNG VIỆC" bị gộp dọc (merge) xuống vài dòng, mà ExcelJS tự
       nhân giá trị ô gộp ra MỌI dòng nằm trong vùng gộp (kể cả đọc qua getCell() như ở đây) – không chỉ
       dòng đầu tiên – nên nếu không chặn riêng sẽ đọc nhầm 2-3 dòng tiêu đề thành "đầu việc" rỗng dữ liệu. */
    if(!no || !dv || no==="No." || dv==="NỘI DUNG CÔNG VIỆC") continue;
    rows.push({row:rn, no, dv, r});
  }
  return {shInfor, rows};
}
async function planReadWorkbook(file){
  await planEnsureExcel();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  return wb;
}
ACTIONS["planimport"] = () => { const el = document.getElementById("planImportFile"); if(el) el.click(); };
async function planImportExcel(file){
  toast("Đang đọc file…");
  try{
    const wb = await planReadWorkbook(file);
    const {shInfor, rows} = planXlsRows(wb);
    // ----- sheet Infor: lấy PM/TM/AM/ACC/Tên dự án theo nhãn ở cột B, giá trị ở cột C (không khoá cứng số dòng) -----
    const info = {};
    if(shInfor){
      shInfor.eachRow(row => {
        const label = xlsText(row.getCell(2).value).trim();
        if(label) info[label] = row.getCell(3).value;
      });
    }
    const tasks = [];
    for(const {row:rn, no, dv, r:row} of rows){
      tasks.push({
        no, dv, _row:rn, _cells:xlsSchedCells(row),
        status: XLS_STATUS_MAP[xlsText(row.getCell(3).value)] || "",
        owner: xlsText(row.getCell(5).value),
        daysActual: xlsNum(row.getCell(6).value), daysProposed: xlsNum(row.getCell(7).value),
        hdStart: xlsDateISO(row.getCell(8).value), deadline: xlsDateISO(row.getCell(9).value),
        adjStart: xlsDateISO(row.getCell(10).value), adjEnd: xlsDateISO(row.getCell(11).value),
        expStart: xlsDateISO(row.getCell(12).value), expEnd: xlsDateISO(row.getCell(13).value),
        actStart: xlsDateISO(row.getCell(14).value), actEnd: xlsDateISO(row.getCell(15).value),
        note: xlsText(row.getCell(16).value),
        /* CỐ TÌNH bỏ qua cột "ƯU TIÊN" (cột D) của file Excel theo yêu cầu người dùng – ưu tiên lấy theo
           đúng "No." trong khung mẫu (Cài đặt → Chọn khung, config/catalog), không theo file nhập. */
      });
    }
    if(!tasks.length) throw new Error("Không đọc được đầu việc nào từ sheet NGSI.");
    planImportConfirm({
      name: xlsText(info["Tên dự án"]) || file.name.replace(/\.xlsx$/i,""),
      pm: xlsText(info["PM"]), tm: xlsText(info["TM"]), am: xlsText(info["AM"]), acc: xlsText(info["ACC"]),
      tasks,
    });
  }catch(err){ toast("Nhập Excel thất bại: "+(err.message||"lỗi không xác định")); }
}
/* Form xác nhận trước khi tạo dự án thật – cho sửa tên/loại/vai trò trước khi lưu (vd đổi "Loại" để ưu
   tiên từng đầu việc lấy đúng catalog của loại đó, xem onSave). */
function planImportConfirm(parsed){
  openForm({
    title: "Nhập dự án từ Excel", subtitle: `${parsed.tasks.length} đầu việc đọc được từ file`,
    values: {name:parsed.name, type:"Triển khai", pm:parsed.pm, tm:parsed.tm, am:parsed.am, acc:parsed.acc},
    fields:[
      {key:"name", label:"Tên dự án", type:"text", required:true},
      {key:"type", label:"Loại (quyết định khung mẫu dùng để lấy Ưu tiên theo No.)", type:"seg", options:TYPES.map(t=>[t,t])},
      {heading:"Vai trò dự án"},
      {key:"pm", label:"PM", type:"text", half:true}, {key:"tm", label:"TM", type:"text", half:true},
      {key:"am", label:"AM", type:"text", half:true}, {key:"acc", label:"ACC (kế toán)", type:"text", half:true},
    ],
    saveLabel: "Tạo dự án",
    onSave: async x => {
      if(!x.name.trim()) throw new Error("Nhập tên dự án.");
      let id = "p-"+slug(x.name); if(M.pById.get(id)) id += "-"+Math.random().toString(36).slice(2,5);
      let tasks = parsed.tasks.map((t,i) => {
        const cat = S.catalog.find(c=>c.type===x.type && c.no===t.no);
        return {id:"t"+String(i+1).padStart(3,"0"), no:t.no, dv:t.dv, detail:"",
          owner:t.owner||"", collab:"", deadline:t.deadline, hdStart:t.hdStart,
          adjStart:t.adjStart, adjEnd:t.adjEnd, expStart:t.expStart, expEnd:t.expEnd, actStart:t.actStart, actEnd:t.actEnd,
          daysActual:t.daysActual, daysProposed:t.daysProposed, qm:null, pt:null,
          pr: cat ? (cat.pr==="Cao"?"Cao":"Bình thường") : "Bình thường",
          init:{status:t.status||"", ms:null, nn:""}, note:t.note||"", eval:{}};
      });
      /* Chuyển công thức Excel của từng dòng (H22=I21…) thành phụ thuộc giữa các đầu việc (task.sched) để sửa
         thời gian trên web tự lan truyền như Excel – xem SCHED.fromExcel() (core/schedule.js). */
      const xs = SCHED.fromExcel(parsed.tasks.map((t,i) => ({row:t._row, id:tasks[i].id, cells:t._cells||{}})));
      tasks = SCHED.dropCycles(tasks.map(t => { const s = xs.sched.get(t.id); return s ? {...t, sched:s} : t; })).tasks;
      const roleFields = {owner:x.tm||x.pm||"", se:"", pm:x.pm||"", tm:x.tm||"", am:x.am||"", acc:x.acc||""};
      const order = Math.max(0,...M.projects.map(q=>q.order||0))+1;
      await saveProject({id, name:x.name.trim(), client:"", type:x.type, ...roleFields,
        milestones:"", progress:"", situation:"", proposal:"", difficulty:1, order, tasks});
      S.planSel = id; toast(`Đã nhập dự án với ${tasks.length} đầu việc, ${tasks.filter(t=>t.sched).length} đầu việc có công thức tính lịch`);
    }
  });
}
function projectForm(p){
  const isNew = !p;
  const v = p ? {...clean(p)} : {id:"", name:"", type:"Triển khai", client:"", owner:"", pm:"", tm:"", am:"", acc:"", milestones:"", progress:"", situation:"", proposal:"", difficulty:1};
  const staffOpts = [["",""],...(S.staff||[]).map(s=>[s.name,s.name])];
  openForm({
    title: isNew ? "Dự án mới" : "Sửa thông tin dự án", values:v,
    fields:[
      {key:"name", label:"Tên dự án / gói thầu / tư vấn", type:"text", required:true},
      {key:"client", label:"Khách hàng", type:"text"},
      {key:"type", label:"Loại", type:"seg", options:TYPES.map(t=>[t,t]), disabled:!isNew && (p.tasks||[]).length>0, hint:()=>!isNew&&(p.tasks||[]).length?"Không đổi loại khi dự án đã có đầu việc.":"Quyết định quy trình đầu việc áp dụng."},
      /* "Người phụ trách" (owner) – chọn trong danh sách nhân sự phòng (S.staff, theo đúng Họ tên đầy đủ,
         không phải tên viết tắt như 4 ô Vai trò dự án bên dưới) – khôi phục lại theo yêu cầu người dùng
         (trước đó đã bỏ, suy tự động owner=tm||pm, xem lịch sử ở onSave). Chọn thẳng từ S.staff tránh lặp
         lại vấn đề của roleOpts() (alias không khớp hết dữ liệu thật) vì đây LUÔN là Họ tên đầy đủ, khớp
         thẳng user.staff_name để tính quyền own-project (RULES/canWrite, server.js; projectAssigned(),
         constants.js) – không qua alias nên không có rủi ro "chưa khớp nhân sự". */
      {key:"owner", label:"Người phụ trách", type:"select", options:staffOpts, hint:"Người chịu trách nhiệm chính dự án – quyết định quyền sửa/xoá dự án."},
      /* Gõ tay tên (type:"text"), KHÔNG chọn trong danh sách nhân sự (config/staff) – đã thử đổi sang
         <select> lọc theo alias (roleOpts()) nhưng người dùng phản hồi muốn quay lại ô nhập tay như trước
         (dữ liệu dự án thật đang dùng nhiều biến thể tên viết tắt/tài khoản không khớp hết alias cấu hình
         sẵn, vd "Truonghm"/"Linhpd"/"Thuongnth" vẫn báo "chưa khớp nhân sự" dù đã nhập đúng) – ownerOpts ở
         taskForm() (gán "Phụ trách" cho đầu việc) vẫn hoạt động bình thường vì chỉ so khớp CHUỖI với 4
         trường này, không quan tâm có khớp tên trong S.staff hay không. */
      {heading:"Vai trò dự án (gán người phụ trách theo đầu việc chuẩn trong khung mẫu – xem Cài đặt)"},
      {key:"pm", label:"PM", type:"text", half:true},
      {key:"tm", label:"TM", type:"text", half:true},
      {key:"am", label:"AM", type:"text", half:true},
      {key:"acc", label:"ACC (kế toán)", type:"text", half:true},
      {key:"milestones", label:"Mốc hợp đồng / hạn nộp", type:"textarea"},
      {key:"situation", label:"Tình hình / vướng mắc chung", type:"textarea"},
      /* progress/proposal: chỉ dùng cho 2 cột "Tiến độ hiện tại"/"Đề xuất" ở Báo cáo → Báo cáo tổng hợp
         dự án (xem rpBuildOverview() ở reports.js) – KHÔNG hiện lại ở thẻ dự án tại Kế hoạch dự án/Tổng
         quan dự án (planDetail()/projectDetail() cố tình chỉ giữ 2 ô Mốc hợp đồng + Tình hình chung). */
      {key:"progress", label:"Tiến độ hiện tại (chỉ hiện ở Báo cáo)", type:"textarea"},
      {key:"proposal", label:"Đề xuất (chỉ hiện ở Báo cáo)", type:"textarea"},
      {key:"difficulty", label:"Độ khó dự án", type:"seg", options:[[0.8,"Dễ"],[1,"Trung bình"],[1.3,"Khó"],[1.6,"Cực khó"]],
        hint:v=>({0.8:"Dự án mở rộng, chỉ giao hàng, không cần triển khai.",1:"Đã triển khai công nghệ này trước đây.",1.3:"Triển khai mới.",1.6:"Công nghệ mới, cần chuyên gia hỗ trợ."}[v]||"")}
    ],
    saveLabel: isNew ? "Tạo dự án" : "Lưu thay đổi",
    onSave: async x => {
      if(!x.name.trim()) throw new Error("Nhập tên dự án.");
      /* "Người phụ trách" (owner) nay chọn trực tiếp từ ô "Người phụ trách" (select theo S.staff) – nếu
         chưa chọn (dự án cũ/để trống) thì rơi về suy tự động từ TM (hoặc PM) như trước để không phá quyền
         ghi own-project đang dựa vào p.owner (RULES/canWrite, server.js; projectAssigned(), constants.js).
         "SE" đã bỏ hẳn khỏi khái niệm web (web cho Phòng Quản lý dự án, PM là vai trò chính) – se vẫn ghi
         "" để không đổi định dạng tài liệu projects hiện có, nhưng không còn chỗ nào đọc/kiểm tra quyền
         theo trường này nữa (projectAssigned() chỉ còn so p.owner). */
      const roleFields = {owner:x.owner||x.tm||x.pm||"", se:"", pm:x.pm||"", tm:x.tm||"", am:x.am||"", acc:x.acc||""};
      if(isNew){
        let id = "p-"+slug(x.name); if(M.pById.get(id)) id += "-"+Math.random().toString(36).slice(2,5);
        /* Luôn tạo sẵn toàn bộ đầu việc theo đúng cấu trúc khung mẫu (config/catalog, xem catFlatTable()
           ở settings.js) của loại dự án vừa chọn – copy nguyên "No."/tên/ưu tiên, người phụ trách lấy theo
           vai trò (c.role) gán ở trên nếu có, không thì để trống cho PM tự gán sau. */
        const roleOf = {PM:x.pm, TM:x.tm, AM:x.am, ACC:x.acc};
        const tasks = S.catalog.filter(c=>c.type===x.type).map((c,i)=>({id:"t"+String(i+1).padStart(3,"0"), no:c.no||"", dv:c.name, detail:"",
          owner:(c.role && roleOf[c.role]) || "", collab:"", deadline:null, qm:null, pt:null, pr:c.pr==="Cao"?"Cao":"Bình thường",
          init:{status:"",ms:null,nn:""}, note:"", eval:{}}));
        const order = Math.max(0,...M.projects.map(q=>q.order||0))+1;
        await saveProject({id, name:x.name.trim(), client:x.client||"", type:x.type, ...roleFields, milestones:x.milestones||"", progress:x.progress||"", situation:x.situation||"", proposal:x.proposal||"", difficulty:x.difficulty||1, order, tasks});
        S.planSel = id; toast(`Đã tạo dự án${tasks.length?" với "+tasks.length+" đầu việc":""}`);
      } else {
        await saveProject({...p, name:x.name.trim(), client:x.client||"", type:x.type, ...roleFields, milestones:x.milestones||"", progress:x.progress||"", situation:x.situation||"", proposal:x.proposal||"", difficulty:x.difficulty||1}); toast("Đã lưu thông tin dự án");
      }
    },
    onDelete: (isNew || !canDeleteProject(p)) ? null : async () => { if(!confirm(`Xoá dự án “${p.name}” và toàn bộ đầu việc?`)) return false; await remove("projects/"+p.id); S.planSel=null; toast("Đã xoá dự án"); }
  });
}
function taskForm(p, t){
  const isNew = !t;
  const raw = t ? (p.tasks||[]).find(x=>x.id===t.id) : null;
  const v = raw ? {...raw, st0:(raw.init||{}).status||"", ms0:(raw.init||{}).ms??null, nn0:(raw.init||{}).nn||"", dat:(raw.eval||{}).dat||"", cl:(raw.eval||{}).cl??null, tc:(raw.eval||{}).tc??null, nx:(raw.eval||{}).nx||""}
    : {id:"", no:"", dv:"", detail:"", owner:p.owner||"", collab:"", deadline:null, hdStart:null, adjStart:null, adjEnd:null, expStart:null, expEnd:null, actStart:null, actEnd:null, daysActual:null, daysProposed:null, qm:null, pt:null, pr:"Bình thường", st0:"", ms0:null, nn0:"", note:""};
  /* "Đầu việc" là ô nhập tự do (type:"text"), KHÔNG còn chọn theo "Khung mẫu" (config/catalog) như trước –
     khung mẫu chỉ dùng để sinh sẵn đầu việc lúc tạo dự án mới (projectForm()), còn PM thêm/chèn đầu việc
     ngoài khung lúc dự án đã chạy (vd qua "Chèn dòng lên trên/xuống dưới" ở bảng, planTaskRow()) thì thực tế
     hiếm khi khớp đúng tên trong khung mẫu – để PM tự gõ tên thay vì ép chọn trong danh sách cố định
     (đổi theo yêu cầu người dùng).
     "Phụ trách" của 1 đầu việc chỉ chọn trong đúng 4 người giữ vai trò PM/TM/AM/ACC của dự án (gán ở
     "Sửa thông tin dự án" – projectForm() trên) – không còn chọn tự do trong toàn bộ nhân sự phòng như
     trước, đúng theo yêu cầu người dùng (4 vai trò này là nguồn duy nhất gán người phụ trách đầu việc). */
  const ownerOpts = [["",""],...[...new Set([p.pm,p.tm,p.am,p.acc].filter(Boolean))].map(n=>[n,n])];
  if(!canManageProject(p)){ if(isNew){ toast("Chỉ trưởng phòng hoặc người tạo dự án mới thêm đầu việc."); return; } return openInfo(p, t); }
  /* Tính lịch theo công thức (core/schedule.js + plan-schedule.js): cấp cha-con suy từ cột No.; dòng nhóm
     tự tính (MIN/MAX của con) thì khoá các ô ngày/Số ngày – đổi sang "Có thời gian riêng" rồi lưu mới sửa được. */
  const schedTr = SCHED.tree(p.tasks||[]);
  const hasKids = !!raw && (schedTr.children.get(raw.id)||[]).length > 0;
  const isSum = !!raw && SCHED.isSummary(raw, schedTr);
  const detectedKind = isSum ? "summary" : "task";
  const sc0 = (raw && raw.sched) || {};
  Object.assign(v, {dep_pred:sc0.pred||"", dep_type:sc0.type||"FS", dep_lag:sc0.lag||0, kind:detectedKind,
    mode_hd:schedLockMode(raw,"hd"), mode_adj:schedLockMode(raw,"adj"), mode_exp:schedLockMode(raw,"exp")});
  const predOpts = [["","— Không phụ thuộc —"], ...(p._tasks||p.tasks||[]).filter(x=>!raw || x.id!==raw.id)
    .map(x=>[x.id, `${x.pathNo||x.no||""}${(x.pathNo||x.no)?". ":""}${x.dv||"(chưa đặt tên)"}`])];
  const drift = raw ? (SCHED.drift(p.tasks||[]).get(raw.id) || []) : [];
  const modeField = pk => {
    const opts = [["auto","Theo công thức"],["lock","Nhập tay (khoá)"]];
    if(schedLockMode(raw, pk)==="part") opts.splice(1, 0, ["part","Khoá 1 ô (giữ nguyên)"]);
    return {key:"mode_"+pk, label:"Cách tính ngày", type:"seg", options:opts, disabled:isSum,
      hint:m => [m==="lock" ? "Ngày nhập tay, không bị tự đổi khi việc khác thay đổi." : m==="auto" ? "Bắt đầu theo phụ thuộc (nếu có), Kết thúc = Bắt đầu + Số ngày." : "", schedRuleHint(raw, pk, p)].filter(Boolean).join(" · ")};
  };
  openForm({
    title: isNew ? "Thêm đầu việc" : "Đầu việc", subtitle: p.name, values:v,
    info: (t ? `<div class="kv" style="margin-bottom:16px"><dt>Trạng thái hiện tại</dt><dd>${stPill(t.status)}</dd>
      <dt>Cập nhật mới nhất</dt><dd>${esc(t.upd||"–")}</dd><dt>Ngày cập nhật</dt><dd>${esc(t.updDate||"–")}</dd></div>` : "")
      + (drift.length ? `<div class="sched-drift"><b>Lệch lịch với việc phụ thuộc:</b> ${drift.map(d=>`${esc(d.planLabel)} – Bắt đầu đang ${dmy(d.actual)}, theo công thức ${dmy(d.expected)}`).join("; ")}. Bấm “Đồng bộ lại theo công thức” để cập nhật.</div>` : ""),
    extraBtn: drift.length ? {label:"Đồng bộ lại theo công thức", onClick:() => schedSync(p, raw)} : undefined,
    fields:[
      {key:"no", label:"No.", type:"text", half:true},
      {key:"dv", label:"Đầu việc", type:"text", required:true, half:true},
      /* Note dùng chung với Việc trong tuần; task.detail cũ vẫn được giữ khi lưu. */
      {key:"note", label:"Note", type:"textarea", disabled:!canNoteProject(p)},
      {key:"owner", label:"Phụ trách", type:"select", options:ownerOpts, half:true, hint:()=>ownerOpts.length>1?"":"Dự án chưa gán PM/TM/AM/ACC nào – sửa ở “Sửa thông tin dự án”."},
      {key:"pr", label:"Ưu tiên", type:"seg", options:TASK_PR.map(x=>[x,x]), half:true},
      /* Không bắt buộc chọn Quy mô nữa (theo yêu cầu người dùng, file mẫu thật nhiều đầu việc – nhất là
         dòng hạng mục – không có Quy mô) – thiếu Quy mô vẫn tính được (wlOf() trả null, model.js đã có sẵn
         cơ chế coi trọng số 1 khi tính tiến độ nên không "biến mất" khỏi mẫu số, xem "Công thức Workload/
         Capacity" ở CLAUDE.md), chỉ riêng Workload (giờ) của đầu việc đó hiện "–" thay vì có số. */
      {key:"qm", label:"Quy mô (để trống = chưa ước lượng)", type:"seg", options:[1,2,3,4,5].map(n=>[n,String(n)]), hint:v=>v?`${QM_HINT[v]} (≈${fmt1(QM_HOURS[v])}h)`:[1,2,3,4,5].map(n=>n+" = "+QM_HINT[n]+" (≈"+fmt1(QM_HOURS[n])+"h)").join(" · ")},
      {key:"pt", label:"Độ phức tạp (để trống = mặc định 1,0)", type:"seg", options:[[null,"Mặc định"],...[1,2,3,4,5].map(n=>[n,String(n)])], hint:v=>v?`${PT_HINT[v]} (×${fmt1(PT_MULT[v])})`:""},
      /* Khối ngày tháng theo đúng mẫu bảng Excel giấy của phòng (4 cặp Bắt đầu/Kết thúc song song + Thời
         gian theo ngày) – "Kế hoạch theo HĐ – Kết thúc" vẫn dùng field "deadline" cũ (KHÔNG đổi tên: nhiều
         nơi khác – cảnh báo quá hạn/sắp hạn ở model.js, sắp xếp, lateTasks()… – đang đọc thẳng t.deadline),
         chỉ thêm "hdStart" làm ngày bắt đầu đi kèm. 3 cặp còn lại (điều chỉnh/dự kiến/thực tế) là trường
         mới, không ảnh hưởng công thức tính Workload/cảnh báo hiện có. */
      {heading:"Thời gian (ngày)"},
      ...(hasKids ? [{key:"kind", label:"Dòng nhóm", type:"seg", options:[["summary","Tự tính từ việc con"],["task","Có thời gian riêng"]],
        hint:k => k==="summary" ? "Bắt đầu = sớm nhất, Kết thúc = muộn nhất của các việc con; Số ngày tự tính." + (isSum ? "" : " Lưu rồi mở lại để thấy ngày tự tính.")
          : "Nhập ngày/Số ngày như việc thường." + (isSum ? " Lưu rồi mở lại để sửa ngày." : "")}] : []),
      {key:"daysActual", label:"Theo thực tế", type:"number", half:true, disabled:isSum},
      {key:"daysProposed", label:"Theo đề xuất", type:"number", half:true, disabled:isSum},
      {heading:"Phụ thuộc (tự tính lịch)"},
      {key:"dep_pred", label:"Việc phụ thuộc", type:"search", options:predOpts, placeholder:"Gõ số hoặc tên đầu việc…", disabled:isSum,
        hint: isSum ? "Dòng nhóm tự tính từ việc con nên không đặt phụ thuộc." : "Ngày của việc này tự đổi theo việc được chọn, trong cùng từng bộ kế hoạch."},
      {key:"dep_type", label:"Kiểu phụ thuộc", type:"seg", options:[["FS","Nối tiếp (FS)"],["SS","Song song (SS)"],["FF","Kết thúc cùng (FF)"]], disabled:isSum, hint:k=>SCHED_TYPE_HINT[k]||""},
      {key:"dep_lag", label:"Lệch (ngày)", type:"number", step:1, disabled:isSum, hint:"Âm = sớm hơn, dương = muộn hơn so với mốc của việc phụ thuộc."},
      {heading:"Kế hoạch theo HĐ"},
      {key:"hdStart", label:"Bắt đầu", type:"date", half:true, disabled:isSum},
      {key:"deadline", label:"Kết thúc", type:"date", half:true, disabled:isSum},
      modeField("hd"),
      {heading:"Kế hoạch HĐ điều chỉnh"},
      {key:"adjStart", label:"Bắt đầu", type:"date", half:true, disabled:isSum},
      {key:"adjEnd", label:"Kết thúc", type:"date", half:true, disabled:isSum},
      modeField("adj"),
      {heading:"Kế hoạch dự kiến"},
      {key:"expStart", label:"Bắt đầu", type:"date", half:true, disabled:isSum},
      {key:"expEnd", label:"Kết thúc", type:"date", half:true, disabled:isSum},
      modeField("exp"),
      {heading:"Kế hoạch thực tế"},
      {key:"actStart", label:"Bắt đầu", type:"date", half:true, disabled:isSum},
      {key:"actEnd", label:"Kết thúc", type:"date", half:true, disabled:isSum, hint: isSum ? "" : "Đã có ngày thực tế thì không bị tự đổi."},
      {key:"st0", label:"Trạng thái ban đầu (chỉ dùng khi chưa có dữ liệu tuần)", type:"select", options:[["",""],...ST_ALL.map(s=>[s,s])]},
      /* Chỉ trưởng phòng đánh giá khi hoàn thành, không phải nhân viên (kể cả TM/người tạo được sửa đầu việc) */
      ...(t && t.status==="Hoàn thành" && S.canEdit ? [
        {heading:"Đánh giá khi hoàn thành"},
        {key:"dat", label:"Đạt yêu cầu?", type:"seg", options:[["Đạt","Đạt"],["Đạt một phần","Đạt một phần"],["Không đạt","Không đạt"]]},
        {key:"cl", label:"Chất lượng (1–5)", type:"seg", options:[1,2,3,4,5].map(n=>[n,String(n)]), half:true},
        {key:"tc", label:"Mức độ tự chủ (1–5)", type:"seg", options:[1,2,3,4,5].map(n=>[n,String(n)]), half:true},
        {key:"nx", label:"Nhận xét / đóng góp", type:"textarea"}] : [])
    ],
    saveLabel: isNew ? "Thêm đầu việc" : "Lưu thay đổi",
    onSave: async x => {
      const tasks = [...(p.tasks||[])];
      /* "Thực hiện" (task.collab – gán tay ai được giao làm) đã bỏ khỏi form theo yêu cầu từ trước; cột
         "Thực hiện" ở bảng Kế hoạch dự án (suy từ t.doers, model.js) sau đó cũng đã bỏ hẳn theo yêu cầu
         người dùng – t.doers vẫn tính trong model.js (dùng ở reports.js/kpi.js) chỉ không hiện cột riêng ở
         đây nữa. Vẫn GIỮ NGUYÊN giá trị collab cũ (nếu có từ lúc còn ô nhập) khi sửa đầu việc đã có sẵn,
         tránh xoá mất dữ liệu cũ một cách âm thầm. */
      const body = {id: x.id || nextTaskId(p), no:x.no||"", dv:x.dv, detail: raw ? (raw.detail||"") : "", owner:x.owner||"", collab: raw ? (raw.collab||"") : "", deadline:x.deadline||null,
        hdStart:x.hdStart||null, adjStart:x.adjStart||null, adjEnd:x.adjEnd||null, expStart:x.expStart||null, expEnd:x.expEnd||null, actStart:x.actStart||null, actEnd:x.actEnd||null,
        daysActual:x.daysActual??null, daysProposed:x.daysProposed??null, qm:x.qm||null, pt:x.pt||null, pr:x.pr||"",
        init:{status:x.st0||"", ms:x.ms0??null, nn:x.nn0||""}, note:x.note||"", eval: raw&&raw.eval ? {...raw.eval} : {}, updatedAt:Date.now()};
      if(t && t.status==="Hoàn thành" && S.canEdit) body.eval = {dat:x.dat||"", cl:x.cl??null, tc:x.tc??null, nx:x.nx||""};
      const sched = schedFromForm(raw, x, hasKids, detectedKind);
      if(sched) body.sched = sched;
      /* Đổi ngày/Số ngày/phụ thuộc → lưu qua máy chủ tính lại theo công thức (có xem trước việc bị ảnh hưởng,
         plan-schedule.js). Không đổi gì về lịch → lưu như trước (PUT cả dự án). Hủy ở modal → mở lại form
         với giá trị TRƯỚC khi sửa (không lưu gì). */
      if(schedTouched(raw, body)){
        await schedSave(p, body, {onCancel:() => setTimeout(() => {
          const pp = M.pById.get(p.id) || p;
          taskForm(pp, isNew ? null : ((pp._tasks||[]).find(q=>q.id===body.id) || t));
        }, 0)});
        return;
      }
      const i = tasks.findIndex(q=>q.id===body.id); if(i>=0) tasks[i]=body; else tasks.push(body);
      await saveProject({...p, tasks}); toast(isNew?"Đã thêm đầu việc":"Đã lưu đầu việc");
    },
    onDelete: isNew ? null : async () => { if(!confirm("Xoá đầu việc này?")) return false; await saveProject({...p, tasks:(p.tasks||[]).filter(q=>q.id!==t.id)}); toast("Đã xoá đầu việc"); }
  });
}
function nextTaskId(p){ let n=(p.tasks||[]).length+1; const ids=new Set((p.tasks||[]).map(t=>t.id)); while(ids.has("t"+String(n).padStart(3,"0"))) n++; return "t"+String(n).padStart(3,"0"); }
/* Chèn 1 dòng trống ngay lên trên/xuống dưới 1 đầu việc đang có (nút ẩn, chỉ hiện khi di chuột vào dòng –
   xem planTaskRow()) – không mở form, chèn thẳng rồi bấm vào dòng mới để điền nội dung sau, giống thao tác
   chèn hàng trống của Excel. Dùng khi khung mẫu không khớp đúng quy trình thật của dự án, cần tự sắp lại
   thứ tự đầu việc trực tiếp trên bảng. */
ACTIONS["taskinsert"] = async el => {
  const p = M.pById.get(el.dataset.pid); if(!p || !canManageProject(p)) return;
  const tasks = [...(p.tasks||[])];
  const idx = tasks.findIndex(q=>q.id===el.dataset.id); if(idx<0) return;
  const row = {id:nextTaskId(p), no:"", dv:"", detail:"", owner:"", collab:"", deadline:null,
    hdStart:null, adjStart:null, adjEnd:null, expStart:null, expEnd:null, actStart:null, actEnd:null,
    daysActual:null, daysProposed:null, qm:null, pt:null, pr:"Bình thường", init:{status:"",ms:null,nn:""}, note:"", eval:{}, updatedAt:Date.now()};
  tasks.splice(el.dataset.dir==="up" ? idx : idx+1, 0, row);
  await saveProject({...p, tasks}); toast("Đã chèn dòng – bấm vào dòng mới để điền nội dung");
};
ACTIONS["taskdelrow"] = async el => {
  const p = M.pById.get(el.dataset.pid); if(!p || !canManageProject(p)) return;
  if(!confirm("Xoá dòng này?")) return;
  await saveProject({...p, tasks:(p.tasks||[]).filter(q=>q.id!==el.dataset.id)}); toast("Đã xoá dòng");
};
/* extraBtn tuỳ chọn (vd {label, onClick}) – thêm nút đi tới nơi xử lý bên cạnh "Đóng", dùng cho chỗ gọi
   cần điều hướng tiếp (xem ACTIONS["exinfo"] ở exec-dashboard.js). Gọi không kèm tham số (taskForm() ở
   trên, khi nhân viên không có quyền sửa) thì vẫn chỉ xem thuần, không có nút thêm. */
function openInfo(p, t, extraBtn){
  const canNote = canNoteProject(p);
  openForm({title:"Đầu việc", subtitle:p.name, values:{note:t.note||""},
    fields:canNote ? [{key:"note", label:"Note", type:"textarea"}] : [], readOnly:!canNote, extraBtn,
    saveLabel:"Lưu ghi chú",
    onSave:async v => {
      await S.db.api("PATCH", `/api/doc/projects/${p.id}/task-note`, {taskId:t.id, note:v.note||""});
      toast("Đã lưu ghi chú");
    },
    info:`<h3 style="margin-bottom:12px">${t.no?esc(t.no)+". ":""}${esc(t.dv)}</h3><div class="kv"><dt>Nội dung</dt><dd>${esc(t.detail||"–")}</dd><dt>Phụ trách</dt><dd>${esc(t.owner||"–")}</dd>
    <dt>Trạng thái</dt><dd>${stPill(t.status)}</dd><dt>Cập nhật</dt><dd>${esc(t.upd||"–")}</dd><dt>Ngày cập nhật</dt><dd>${esc(t.updDate||"–")}</dd>
    <dt>Kế hoạch theo HĐ</dt><dd>${dmy(t.hdStart)} – ${dmy(t.deadline)}</dd>
    ${t.adjStart||t.adjEnd?`<dt>Kế hoạch HĐ điều chỉnh</dt><dd>${dmy(t.adjStart)} – ${dmy(t.adjEnd)}</dd>`:""}
    ${t.expStart||t.expEnd?`<dt>Kế hoạch dự kiến</dt><dd>${dmy(t.expStart)} – ${dmy(t.expEnd)}</dd>`:""}
    ${t.actStart||t.actEnd?`<dt>Kế hoạch thực tế</dt><dd>${dmy(t.actStart)} – ${dmy(t.actEnd)}</dd>`:""}
    <dt>Workload</dt><dd>${t.wl??"–"}</dd>
    ${canNote?"":`<dt>Note</dt><dd>${esc(t.note||"–")}</dd>`}</div>`});
}

