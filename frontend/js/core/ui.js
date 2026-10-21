"use strict";
/* Khung giao diện: header, menu, vẽ màn hình, thành phần dùng chung, form trượt (drawer) */
/* ================= shell ================= */
function avatarInitials(name){ return (name||"").trim().split(/\s+/).slice(-2).map(w=>w[0]).join("").toUpperCase(); }
const NAV_CHEV = '<svg class="nav-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
function renderNav(){
  const navBadge = id => { const fn = NAV_BADGE[id]; const n = fn ? fn() : 0; return n ? `<span class="nav-badge">${n>99?"99+":n}</span>` : ""; };
  /* `v.children` (mảng {label, act(), active()}) – mục menu TRÁI tự xổ ra mục con thay vì điều hướng thẳng,
     tham khảo kiểu menu xổ của 1 app khác (yêu cầu người dùng, áp dụng đầu tiên cho "Báo cáo" – xem
     VIEWS.splice() ở reports.js). Cơ chế GENERIC, core không biết gì về state riêng của module gọi: bấm
     mục cha chỉ xổ/đóng (`S.navOpen[v.id]`, không điều hướng – đúng hành vi app tham khảo, mục cha không
     có trang riêng); bấm mục con gọi `child.act()` (module tự set state của nó) rồi mới đổi `S.view`.
     Sidebar thu gọn (body.side-collapsed, chỉ còn icon): ẩn hẳn khối mục con (plan.css… không, xem base.css
     `body.side-collapsed .nav-sub`) vì không đủ chỗ hiện chữ – hạn chế đã biết, chưa xử lý xổ nổi kiểu
     flyout khi thu gọn, để sau nếu được yêu cầu.
     Đổi sang trang khác (bất kể từ menu hay nút trong nội dung, vd "← Quay lại tổng quan") → bỏ trạng thái
     mở/thu tay của mọi nhóm, quay về mặc định: chỉ mở nhóm chứa trang đang xem (nhóm khác tự thu lại). */
  if(S.navOpenView !== S.view){ S.navOpen = {}; S.navOpenView = S.view; }
  const btn = v => {
    if(v.children){
      const active = S.view===v.id;
      const open = (S.navOpen && v.id in S.navOpen) ? S.navOpen[v.id] : active;
      const kids = v.children.map((c,ci)=>`<button type="button" data-navkid="${v.id}|${ci}" ${c.active&&c.active()?'aria-current="page"':''}>${esc(c.label)}</button>`).join("");
      return `<button type="button" class="nav-grp-toggle${active?" active":""}" data-navgrp="${v.id}" aria-expanded="${open}" title="${esc(v.label)}">${ICONS[v.icon]}<span>${esc(v.label)}</span>${navBadge(v.id)}${NAV_CHEV}</button>
        <div class="nav-sub" ${open?"":"hidden"}>${kids}</div>`;
    }
    return `<button data-view="${v.id}" ${S.view===v.id?'aria-current="page"':''} title="${esc(v.label)}">${ICONS[v.icon]}<span>${esc(v.label)}</span>${navBadge(v.id)}</button>`;
  };
  /* Gom theo nhóm có tiêu đề nhỏ (vd "DASHBOARD & QUẢN LÝ" / "CÀI ĐẶT"): nhóm đầu tiên trước dấu {sep:true}
     đầu tiên trong VIEWS, nhóm sau là phần còn lại. Chỉ đổi cách hiển thị, không đổi danh sách/route màn hình. */
  const sepI = VIEWS.findIndex(v=>v.sep);
  const group1 = sepI<0 ? VIEWS : VIEWS.slice(0,sepI), group2 = sepI<0 ? [] : VIEWS.slice(sepI+1);
  document.getElementById("nav").innerHTML =
    `<div class="nav-grp" title="Dashboard &amp; Quản lý"><span class="full">Dashboard &amp; Quản lý</span><span class="ab" aria-hidden="true">D</span></div>${group1.map(btn).join("")}` +
    (group2.length ? `<div class="nav-grp" title="Cài đặt"><span class="full">Cài đặt</span><span class="ab" aria-hidden="true">C</span></div>${group2.map(btn).join("")}` : "");
  const ub = document.getElementById("userBox");
  if(S.user){ ub.hidden = false;
    const initials = avatarInitials(S.user.display_name);
    ub.innerHTML = `<div class="userbox-row"><div class="avatar">${esc(initials)}</div><div class="userbox-info"><b>${esc(S.user.display_name)}</b><span>${esc(ROLE_LABEL[S.user.role]||"Nhân viên")}</span></div></div><div class="acts"><button data-uact="out">${ICONS.logout}Đăng xuất</button></div>`; }
  const sel = document.getElementById("meSel");
  const isAdmin = !!(S.user && S.canEdit);
  sel.disabled = !!(S.user && !isAdmin);
  const names = S.staff.map(s=>s.name);
  /* "Tất cả" chỉ dành cho trưởng phòng: xem gộp dữ liệu mọi người thay vì theo một cá nhân.
     Trưởng phòng không có lựa chọn "— chọn tên —" bỏ trống nữa — chưa chọn ai thì mặc định là "Tất cả". */
  if(isAdmin && !S.me){ S.me = "__all__"; store("me", S.me); }
  const allOpt = isAdmin ? `<option value="__all__" ${S.me==="__all__"?"selected":""}>— Tất cả —</option>` : '<option value="">— chọn tên —</option>';
  sel.innerHTML = allOpt + names.map(n=>`<option ${n===S.me?"selected":""}>${esc(n)}</option>`).join("");
}
document.getElementById("nav").addEventListener("click", e => {
  const kid = e.target.closest("button[data-navkid]");
  if(kid){
    const [vid, ci] = kid.dataset.navkid.split("|");
    const v = VIEWS.find(x=>x.id===vid);
    const child = v && v.children && v.children[+ci];
    if(!child) return;
    if(child.act) child.act();
    S.view = vid; store("view", S.view);
    S.navOpen = S.navOpen||{}; S.navOpen[vid] = true;
    render(); document.getElementById("main").scrollTop = 0;
    return;
  }
  const grp = e.target.closest("button[data-navgrp]");
  if(grp){
    const id = grp.dataset.navgrp;
    S.navOpen = S.navOpen||{};
    const cur = (id in S.navOpen) ? S.navOpen[id] : (S.view===id);
    S.navOpen[id] = !cur;
    render();
    return;
  }
  const b = e.target.closest("button[data-view]");
  if(!b) return;
  S.view=b.dataset.view; store("view",S.view); render(); document.getElementById("main").scrollTop=0;
});
document.getElementById("meSel").addEventListener("change", e => { S.me=e.target.value; store("me",S.me); render(); });

/* ================= sidebar thu gọn/phóng to ================= */
/* Đồng bộ từ ptkt-appv1 (bản "Phòng Kỹ thuật" gốc, xem lịch sử phiên làm việc): bố cục điện thoại dùng menu
   ngăn kéo (nút ☰ ở đầu trang) thay vì thu gọn cột menu như máy tính – 2 cơ chế khác hẳn nhau nên chỉ nút
   thu gọn .side-toggle không đủ, cần thêm nhánh ≤860px riêng (mobileMQ/applyCollapsed/setNavOpen…). */
const sideToggleBtn = document.getElementById("sideToggle");
sideToggleBtn.insertAdjacentHTML("afterbegin", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6l-6 6 6 6"/></svg>');
/* Thu gọn chỉ có ý nghĩa ở bố cục máy tính; ở điện thoại menu là ngăn kéo nên luôn bỏ lớp side-collapsed (để nhãn
   hiện đủ), trở lại máy tính thì áp lại theo lựa chọn đã lưu */
const mobileMQ = window.matchMedia("(max-width:860px)");
const applyCollapsed = () => { document.body.classList.toggle("side-collapsed", !mobileMQ.matches && store("sideCollapsed")==="1"); };
applyCollapsed();
const syncSideToggleLabel = () => { const on = document.body.classList.contains("side-collapsed"); const label = on?"Mở rộng menu":"Thu gọn menu"; sideToggleBtn.setAttribute("aria-label", label); sideToggleBtn.title = label; };
syncSideToggleLabel();
/* Ngăn kéo menu ở điện thoại */
const tbMenu = document.getElementById("tbMenu");
tbMenu.insertAdjacentHTML("afterbegin", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>');
const setNavOpen = on => { document.body.classList.toggle("nav-open", on); tbMenu.setAttribute("aria-expanded", on ? "true" : "false"); tbMenu.setAttribute("aria-label", on ? "Đóng menu" : "Mở menu"); };
tbMenu.addEventListener("click", e => { e.stopPropagation(); setNavOpen(!document.body.classList.contains("nav-open")); });
document.getElementById("navScrim").addEventListener("click", () => setNavOpen(false));
document.addEventListener("keydown", e => { if(e.key==="Escape" && document.body.classList.contains("nav-open")) setNavOpen(false); });
document.getElementById("nav").addEventListener("click", e => { if(e.target.closest("button[data-view],button[data-navkid]")) setNavOpen(false); });
mobileMQ.addEventListener("change", () => { setNavOpen(false); applyCollapsed(); syncSideToggleLabel(); });
sideToggleBtn.addEventListener("click", () => {
  const on = document.body.classList.toggle("side-collapsed");
  store("sideCollapsed", on?"1":"0");
  syncSideToggleLabel();
});

/* ================= header (topbar) ================= */
/* Icon chỉ cần chèn 1 lần lúc khởi động (không phải mỗi lần render) vì không đổi theo dữ liệu */
document.getElementById("tbApps").insertAdjacentHTML("afterbegin", ICONS.grid);
document.getElementById("tbBell").insertAdjacentHTML("afterbegin", ICONS.bell);
document.querySelector("#tbAccount .tb-chev").outerHTML = ICONS.chevronDown.replace("<svg ", '<svg class="tb-chev" ');

function tbCloseAll(except){
  for(const id of ["tbAppsMenu","tbBellMenu","tbAccountMenu"]){
    if(id===except) continue;
    const m = document.getElementById(id); m.hidden = true;
    document.getElementById(id.replace("Menu","")).setAttribute("aria-expanded","false");
  }
}
function tbToggle(btnId, menuId){
  const btn = document.getElementById(btnId), menu = document.getElementById(menuId);
  const opening = menu.hidden;
  tbCloseAll(opening?menuId:null);
  menu.hidden = !opening; btn.setAttribute("aria-expanded", String(opening));
}
document.getElementById("tbApps").addEventListener("click", e => { e.stopPropagation(); tbToggle("tbApps","tbAppsMenu"); });
document.getElementById("tbBell").addEventListener("click", e => { e.stopPropagation(); tbToggle("tbBell","tbBellMenu"); });
document.getElementById("tbAccount").addEventListener("click", e => { e.stopPropagation(); tbToggle("tbAccount","tbAccountMenu"); });
document.getElementById("tbAccountMenu").addEventListener("click", e => {
  const th = e.target.closest("[data-theme-set]");
  if(th){ setTheme(th.dataset.themeSet); return; }
  const b = e.target.closest("[data-uact]"); if(!b) return;
  tbCloseAll(); if(b.dataset.uact==="pw") passwordForm(); else logout();
});
/* Giao diện: "light"/"dark" ép màu, "system" gỡ data-theme để CSS tự theo prefers-color-scheme.
   index.html đã gắn data-theme="light" ngay khi tải trang (đọc localStorage) để không bị chớp màu. */
function currentTheme(){ const t = store("theme"); return (t==="dark"||t==="system") ? t : "light"; }
function setTheme(t){
  if(t==="light"||t==="dark") document.documentElement.dataset.theme = t; else document.documentElement.removeAttribute("data-theme");
  store("theme", t); renderHeader();
}
document.getElementById("tbBellMenu").addEventListener("click", e => {
  const be = e.target.closest("[data-tbgo-event]");
  if(be){ // mở tab "Lịch" của Việc trong tuần, đúng tuần của sự kiện (modules/calendar.js)
    const ev = (S.events||[]).find(x=>x.id===be.dataset.tbgoEvent);
    tbCloseAll(); S.view = "input"; S.weekTab = "calendar"; if(ev) S.week = mondayOf(ev.start.slice(0,10)); store("view", S.view); render();
    return;
  }
  const bi = e.target.closest("[data-tbgo-issue]");
  if(bi){
    const [id, person] = bi.dataset.tbgoIssue.split("|");
    /* Mở thẳng Nhập theo tuần, đúng người + đúng tuần của lượt nhập đó, rồi mở luôn form sửa dòng này –
       để vào ghi chú/hướng xử lý ngay (ô "Vướng mắc / cần ai hỗ trợ"), không chỉ xem danh sách rồi tự
       tìm. Đổi cả "Tôi là" sang đúng người đó (giống cách trưởng phòng/phó phòng vẫn làm khi sửa dữ liệu
       tuần người khác) để entryForm() mở được. */
    const w = mondayOf(todayISO());
    tbCloseAll(); S.view = "input"; S.weekTab = "tasks"; S.week = w; S.me = person; store("view", S.view); store("me", S.me); render();
    const doc = weekDoc(w, person); const en = doc && (doc.entries||[]).find(x=>x.id===id);
    if(en) entryForm(en, person);
    return;
  }
  const b = e.target.closest("[data-tbgo]"); if(!b) return;
  tbCloseAll(); S.view = b.dataset.tbgo; if(S.view==="input") S.weekTab = "tasks"; store("view", S.view); render();
});
document.addEventListener("click", () => tbCloseAll());
document.addEventListener("keydown", e => { if(e.key==="Escape") tbCloseAll(); });

function renderHeader(){
  if(S.user){
    document.getElementById("tbAvatar").textContent = avatarInitials(S.user.display_name);
    document.getElementById("tbName").textContent = S.user.display_name;
  }
  /* Danh sách liên kết nhanh (nút lưới ở thanh đầu trang): mở trong thẻ mới, rel=noopener để trang đích không điều khiển được ứng dụng */
  const APP_LINKS = [
    {label:"Cổng thông tin", href:"https://www.ngsi.com.vn/", icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z"/></svg>'},
    {label:"Facebook", href:"https://www.facebook.com/profile.php?id=100056785749445", icon:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5h2.6l.5-3h-3.1V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.7V21h3z"/></svg>'}
  ];
  document.getElementById("tbAppsMenu").innerHTML = `<div class="tb-head">Danh sách chức năng (${APP_LINKS.length})</div>
    <div class="tb-apps">${APP_LINKS.map(a=>`<a class="tb-app" href="${a.href}" target="_blank" rel="noopener noreferrer"><span class="tb-app-ico">${a.icon}</span><span>${esc(a.label)}</span></a>`).join("")}</div>`;
  const th = currentTheme();
  document.getElementById("tbAccountMenu").innerHTML = S.user ? `
    <div class="tb-head">Giao diện</div>
    <div class="seg-in" role="group" aria-label="Giao diện" style="margin:0 10px 6px">
      <button type="button" data-theme-set="light" aria-pressed="${th==="light"}">Sáng</button>
      <button type="button" data-theme-set="dark" aria-pressed="${th==="dark"}">Tối</button>
      <button type="button" data-theme-set="system" aria-pressed="${th==="system"}">Hệ thống</button>
    </div>
    <div class="tb-sep"></div>
    <button class="tb-item" data-uact="pw">Đổi mật khẩu</button>
    <button class="tb-item" data-uact="out">Đăng xuất</button>` : "";
  /* Chuông thông báo: CHỈ còn đúng 1 nội dung – vướng mắc nhập trong "Nhập theo tuần" của tuần hiện tại
     (weekIssues() ở model.js, nguồn trực tiếp từ lượt nhập tuần, không lấy theo dữ liệu đã tổng hợp ở
     Kế hoạch dự án/Tổng quan dự án). Đã bỏ hẳn các mục cũ (đầu việc quá hạn, góp ý chưa xem).
     + Sự kiện lịch sắp bắt đầu trong 30 phút (calUpcoming() ở modules/calendar.js – nạp sau nên kiểm tra tồn tại),
     đồng bộ từ ptkt-appv1 cùng tab "Lịch" của Việc trong tuần. */
  const issues = (S.loaded && M) ? weekIssues() : [];
  const ups = (S.loaded && typeof calUpcoming==="function") ? calUpcoming() : [];
  const bellN = document.getElementById("tbBellN"), total = issues.length + ups.length;
  bellN.hidden = !total; bellN.textContent = total>99?"99+":total;
  const TB_BELL_MAX = 8;
  const rows = [];
  if(ups.length){
    rows.push(`<div class="tb-head">Sự kiện sắp diễn ra</div>`);
    for(const x of ups) rows.push(`<button class="tb-item" type="button" data-tbgo-event="${esc(x.e.id)}">
      <b><span class="pill info" style="margin-right:5px">${esc(calLeftText(x.inMin))}</span>${esc(x.e.title)}</b>
      <span class="muted">${esc(x.e.start.slice(11))}–${esc(x.e.end.slice(11))}${x.e.place?" · "+esc(x.e.place):""}${x.e.person===""?" · Cả phòng":""}</span></button>`);
    if(issues.length) rows.push(`<div class="tb-head">Vướng mắc trong tuần</div>`);
  }
  for(const e of issues.slice(0, TB_BELL_MAX)){
    const t = e.ref.t, p = e.ref.p;
    rows.push(`<button class="tb-item" type="button" data-tbgo-issue="${esc(e.id)}|${esc(e.person)}">
      <b><span class="pill ${e.ms>=3?"bad":"warn"}" style="margin-right:5px">Ma sát ${e.ms}</span>${esc(planShortName(t.dv))}</b>
      <span class="muted">${esc(p.name)}${e.nn?" · "+esc(e.nn):""} · ${esc(e.person)}</span></button>`);
  }
  if(issues.length>TB_BELL_MAX) rows.push(`<button class="tb-item" type="button" data-tbgo="input"><b>Xem tất cả ${issues.length} vướng mắc →</b></button>`);
  document.getElementById("tbBellMenu").innerHTML = rows.length ? rows.join("") : `<div class="tb-empty">Không có thông báo nào</div>`;
}

function render(){
  M = derive();
  renderNav();
  renderHeader();
  const main = document.getElementById("main");
  let html = "";
  const banner = S.conn==="off" ? `<div class="banner">Không kết nối được máy chủ. Kiểm tra mạng hoặc báo quản trị hệ thống.</div>` : "";
  if(S.conn==="on" && !S.loaded) html = `<div class="empty"><b>Đang tải dữ liệu…</b></div>`;
  else html = (VIEW_RENDER[S.view] || VIEW_RENDER.dash || (() => ""))();
  /* Chân trang cuối nội dung (cuộn cùng trang): tên đơn vị + năm + phiên bản ứng dụng */
  main.innerHTML = `<div class="page">${banner}${html}</div><footer class="app-foot"><div>NextGen Service Integration</div><div>© 2026 NGSI - Version 1</div></footer>`;
}


/* ================= shared pieces ================= */
/* Dải hạng mục: thay vì thanh tiến độ, mỗi ô hiện số cảnh báo (quá hạn/vướng/sắp hạn) của hạng mục đó,
   khớp với cột "Cảnh báo" trong bảng đầu việc, để nhìn dải là biết ngay hạng mục nào cần theo dõi.
   Mỗi ô là một nút: bấm vào sẽ mở dự án (nếu đang đóng) và mở đúng hạng mục đó trong bảng đầu việc bên
   dưới, đồng thời đóng các hạng mục khác lại (accordion) – scope/selVar phải khớp với tham số truyền cho
   planTreeRows() và biến state dùng để mở/đóng dự án ở trang gọi strip() (xem ACTIONS["stripgo"]). */
function strip(p, scope="plan", selVar="planSel"){
  if(!p._phases.length) return '<span class="muted small">–</span>';
  return `<div class="strip" role="img" aria-label="Cảnh báo theo giai đoạn">` + p._phases.map(ph => {
    const ts = p._tasks.filter(t=>t.phase===ph.code);
    const late = ts.filter(t=>t.warns.some(w=>w[1]==="Quá hạn")).length;
    const soon = ts.filter(t=>t.warns.some(w=>w[1]==="Sắp đến hạn")).length;
    const stuck = ts.filter(t=>OPEN.has(t.status) && (t.status==="Đang vướng" || (t.ms||0)>=1)).length;
    /* Số hiện ở ô = tổng số pill Cảnh báo thực tế trong bảng đầu việc (t.warns), không phải đếm theo
       3 điều kiện riêng late/stuck/soon – vì 1 đầu việc có thể khớp nhiều điều kiện cùng lúc (vd vừa
       Quá hạn vừa "Đang vướng" nhưng ma sát <3, chưa đủ thành pill riêng) khiến số bị đếm trùng, lệch
       với số pill người dùng thực sự thấy trong bảng. */
    const n = ts.reduce((a,t)=>a+t.warns.length,0);
    const cls = !ts.length ? "none" : late ? "bad" : (stuck||soon) ? "warn" : "ok";
    const parts = [late&&`${late} quá hạn`, stuck&&`${stuck} vướng`, soon&&`${soon} sắp hạn`].filter(Boolean);
    const tip = `${ph.code}. ${ph.name}: ${!ts.length?"không có đầu việc":parts.length?parts.join(", "):"không có cảnh báo"}`;
    return `<button type="button" class="seg ${cls}" data-act="stripgo" data-pid="${esc(p.id)}" data-scope="${esc(scope)}" data-code="${esc(ph.code)}" data-selvar="${esc(selVar)}" title="${esc(tip)}"><b>${esc(ph.code)}</b>${n?`<span class="segn">${n}</span>`:""}</button>`;
  }).join("") + `</div>`;
}
/* Bấm 1 ô trong strip() → mở dự án đó (nếu đang đóng) và mở đúng hạng mục trong bảng đầu việc, đóng các
   hạng mục khác lại (accordion) trong cùng dự án. */
ACTIONS["stripgo"] = el => {
  const { pid, scope, code, selvar } = el.dataset;
  S[selvar] = pid;
  S.planTog = S.planTog || {};
  for(const k of Object.keys(S.planTog)) if(k.startsWith(scope+"|grp:")) delete S.planTog[k];
  S.planTog[scope+"|grp:"+code] = true;
  render();
};
function stPill(st){
  const c = {"Hoàn thành":"ok","Đang làm":"info","Đang vướng":"bad","Tạm dừng":"mute","Hủy":"mute","Chưa bắt đầu":"mute"}[st]||"mute";
  return `<span class="pill ${c}">${esc(st||"–")}</span>`;
}
function warnPills(ws){ return ws.map(w=>`<span class="pill ${w[0]}">${esc(w[1])}</span>`).join(" "); }
function weekNav(){
  const w=S.week, isNow = w===mondayOf(todayISO());
  return `<div class="toolbar"><div class="weeknav">
    <button data-act="wk" data-d="-7" aria-label="Tuần trước">‹</button>
    <div class="lbl">Tuần ${isoWeek(w)} · ${dm(w)} – ${dmy(addDays(w,6))}</div>
    <button data-act="wk" data-d="7" aria-label="Tuần sau">›</button></div>
    ${isNow?"":'<button class="btn" data-act="wk" data-d="0">Tuần này</button>'}</div>`;
}
function typeDot(t){ return `<span class="tdot" style="background:${TYPE_COLOR[t]||"var(--grey)"}"></span>`; }
/* "Cá nhân"/"Tổng thể": dùng chung cho Dashboard/Tổng quan dự án/Tải tuần – những trang trước đây nhân
   viên luôn thấy dữ liệu CẢ PHÒNG, không tự thu hẹp về riêng mình được như trưởng phòng/phó phòng/admin
   (đã có ô "Tôi là" ở thanh bên để làm việc này). Chỉ hiện nút này cho nhân viên (!S.canEdit) có gắn
   nhân sự (staff_name) – không có gì để lọc riêng nếu tài khoản chưa gắn nhân sự.
   locked=true (dùng ở Kế hoạch dự án – trang đó tự lọc theo "Tôi là" riêng, luôn cá nhân với nhân viên,
   không qua effectiveSimAs()): vẫn hiện ô này cho đồng bộ giao diện nhưng khoá cứng ở "Cá nhân", disabled
   không đổi được, phản ánh đúng thực tế thay vì cho chọn "Tổng thể" mà không có tác dụng gì. */
function scopeToggleHtml(locked){
  if(S.canEdit || !(S.user && S.user.staff_name)) return "";
  if(locked) return `<select class="inp" style="width:auto; flex:none" aria-label="Phạm vi xem" disabled title="Kế hoạch dự án luôn lọc theo chính mình">
    <option selected>Cá nhân</option>
  </select>`;
  S.scopeMode = S.scopeMode || "all";
  return `<select class="inp" data-act="scopemode" style="width:auto; flex:none" aria-label="Phạm vi xem">
    <option value="all" ${S.scopeMode==="all"?"selected":""}>Tổng thể</option>
    <option value="personal" ${S.scopeMode==="personal"?"selected":""}>Cá nhân</option>
  </select>`;
}
/* simAs dùng chung cho Dashboard/Tổng quan dự án/Tải tuần: trưởng phòng/phó phòng/admin thu hẹp qua "Tôi
   là" ở thanh bên; nhân viên thu hẹp qua nút Cá nhân/Tổng thể (scopeToggleHtml() ở trên, S.scopeMode). */
function effectiveSimAs(){
  if(S.canEdit) return (S.me && S.me!=="__all__") ? S.me : null;
  return (S.scopeMode==="personal" && S.user && S.user.staff_name) ? S.user.staff_name : null;
}



/* ================= ảnh dán vào form (kiểu ô "images") =================
   Ảnh chụp màn hình thường vài MB → thu nhỏ (cạnh dài tối đa 1280px) rồi nén JPEG trước khi lưu thành data URL
   ngay trong tài liệu, để vẫn nằm gọn trong giới hạn 5MB của máy chủ và không cần kho tệp riêng. */
const IMG_MAX_SIDE = 1280, IMG_QUALITY = 0.82;
function imgCompress(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, IMG_MAX_SIDE/Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.width*k)); c.height = Math.max(1, Math.round(im.height*k));
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", IMG_QUALITY));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh vừa dán.")); };
    im.src = url;
  });
}
const imgOk = u => typeof u==="string" && /^data:image\/(jpeg|png|webp);base64,/.test(u); // chỉ hiện ảnh đúng dạng, không nhận URL tuỳ ý
function imgFieldHTML(list){
  return `<div class="img-field" tabindex="0">${(list||[]).filter(imgOk).map((u,i)=>`<div class="img-th"><img src="${u}" alt="Ảnh ${i+1}"><button type="button" class="img-x" data-imgdel="${i}" aria-label="Bỏ ảnh ${i+1}">✕</button></div>`).join("")}</div>
    <div class="img-pick"><button type="button" class="btn" data-imgpick>+ Chọn ảnh / chụp ảnh</button><input type="file" accept="image/*" multiple hidden data-imgfile></div>`;
}

/* ================= form drawer ================= */
function openForm(cfg){
  const layer = document.getElementById("layer");
  const vals = {...cfg.values};
  const prevFocus = document.activeElement;
  const optsOverride = {};
  const fieldHTML = f => {
    if(f.heading) return `<h3 style="margin:22px 0 12px; padding-top:14px; border-top:1px solid var(--line)">${esc(f.heading)}</h3>`;
    const id = "f_"+f.key, v = vals[f.key];
    const hint = typeof f.hint==="function" ? f.hint(v, vals) : (f.hint||"");
    let ctl = "";
    const dis = f.disabled ? "disabled" : "";
    if(f.type==="text"||f.type==="number"||f.type==="password") ctl = `<input class="inp" id="${id}" type="${f.type==="number"?"number":f.type==="password"?"password":"text"}" ${f.type==="password"?'autocomplete="new-password"':""} ${f.type==="number"&&f.min!=null?`min="${f.min}"`:""} ${f.type==="number"&&f.max!=null?`max="${f.max}"`:""} ${f.type==="number"&&f.step!=null?`step="${f.step}"`:""} value="${esc(v??"")}" ${f.required?"required":""} ${dis}>`;
    else if(f.type==="date") ctl = `<input class="inp" id="${id}" type="date" value="${esc(v||"")}" ${dis}>`;
    else if(f.type==="datetime") ctl = `<input class="inp" id="${id}" type="datetime-local" value="${esc(v||"")}" ${dis}>`; // giá trị dạng "YYYY-MM-DDTHH:MM"
    else if(f.type==="textarea") ctl = `<textarea class="inp" id="${id}" ${dis}>${esc(v||"")}</textarea>`;
    else if(f.type==="check") ctl = `<label style="display:flex;gap:8px;align-items:center;font-weight:500;color:var(--ink)"><input type="checkbox" id="${id}" ${v?"checked":""} ${dis}> ${esc(f.label)}</label>`;
    else if(f.type==="select"){
      /* options: mảng [giá trị, nhãn], hoặc {group:"Tên nhóm", options:[[giá trị, nhãn], …]} để gom theo nhóm */
      const opts = optsOverride[f.key] || f.options;
      const optHTML = o => `<option value="${esc(o[0]??"")}" ${String(o[0]??"")===String(v??"")?"selected":""}>${esc(o[1])}</option>`;
      const hasPlaceholder = opts.some(o=>!o.group && (o[0]===""||o[0]==null));
      const body = opts.map(o => o.group ? `<optgroup label="${esc(o.group)}">${o.options.map(optHTML).join("")}</optgroup>` : optHTML(o)).join("");
      ctl = `<select class="inp" id="${id}" ${dis}>${hasPlaceholder?"":'<option value="">— chọn —</option>'}${body}</select>`;
    }
    else if(f.type==="seg") ctl = `<div class="seg-in" role="group" aria-label="${esc(f.label)}">${f.options.map(o=>`<button type="button" data-k="${f.key}" data-v="${esc(JSON.stringify(o[0]))}" aria-pressed="${JSON.stringify(o[0]??null)===JSON.stringify(v??null)}" ${f.disabled?"disabled":""}>${esc(o[1])}</button>`).join("")}</div>`;
    /* "images": ảnh dán (Ctrl+V) – vals[key] là mảng data URL; f.max = số ảnh tối đa (mặc định 4) */
    else if(f.type==="images") ctl = `<div id="${id}">${imgFieldHTML(v)}</div>`;
    /* "search": như <select> nhưng gõ để lọc thay vì cuộn tìm trong danh sách dài – options PHẲNG
       [[giá trị,nhãn],…] (không gom nhóm như "select"). Ô hiện chữ là input text độc lập (id+"_q"), giá trị
       THẬT lưu ở input ẩn cùng id với field (để readInputs() đọc được y hệt các field khác, không cần sửa
       riêng); xem dropdown `.search-dd` + phần xử lý input/focusin/focusout/click ở cuối openForm(). */
    else if(f.type==="search"){
      const opts = optsOverride[f.key] || f.options;
      const cur = opts.find(o=>String(o[0])===String(v??""));
      ctl = `<div class="search-field"><input type="text" class="inp" id="${id}_q" data-searchkey="${f.key}" autocomplete="off" placeholder="${esc(f.placeholder||"Gõ để tìm…")}" value="${esc(cur?cur[1]:(f.freeKey?vals[f.freeKey]||"":""))}" ${dis}>
        <input type="hidden" id="${id}" value="${esc(v??"")}">
        <div class="search-dd" id="${id}_dd" data-key="${f.key}" hidden></div></div>`;
    }
    /* "badge": không phải ô nhập, chỉ hiển thị tĩnh (vd số giờ còn lại cạnh ô nhập giờ) – dùng f.text, không đọc/ghi vals */
    else if(f.type==="badge") ctl = `<div class="field-badge"><span class="pill ${esc(f.tone||"info")}">${esc(f.text||"")}</span></div>`;
    const labelFor = f.type==="search" ? id+"_q" : id;
    return `<div class="field" ${f.half?'data-half="1"':""} data-field="${f.key}" ${f.showIf && !f.showIf(vals)?"hidden":""}>${f.type==="check"?"":`<label for="${labelFor}">${esc(f.label)}${f.required?' <span style="color:var(--bad)">*</span>':""}</label>`}${ctl}${hint!==""?`<div class="hint" data-hint="${f.key}">${esc(hint)}</div>`:`<div class="hint" data-hint="${f.key}"></div>`}</div>`;
  };
  const body = () => {
    let out = cfg.info || ""; let buf = [];
    const flush = () => { if(buf.length){ out += buf.length===2 ? `<div class="row2">${buf.join("")}</div>` : buf.join(""); buf=[]; } };
    for(const f of cfg.fields){ const h = fieldHTML(f); if(f.half){ buf.push(h); if(buf.length===2) flush(); } else { flush(); out += h; } }
    flush(); return out;
  };
  layer.innerHTML = `<div class="scrim" data-close></div><div class="drawer" role="dialog" aria-modal="true" aria-labelledby="dlgT">
    <div class="drawer-h"><div><h2 id="dlgT">${esc(cfg.title)}</h2>${cfg.subtitle?`<div class="small muted" style="margin-top:3px">${esc(cfg.subtitle)}</div>`:""}</div><button class="btn ghost icon" data-close aria-label="Đóng">✕</button></div>
    <div class="drawer-b" id="dlgB">${body()}</div>
    <div class="drawer-f"><div>${cfg.onDelete?'<button class="btn danger" data-del>Xoá</button>':""}</div><div class="toolbar">${cfg.extraBtn?`<button class="btn" data-extra>${esc(cfg.extraBtn.label)}</button>`:""}<button class="btn" data-close>${cfg.readOnly?"Đóng":"Huỷ"}</button>${cfg.readOnly?"":`<button class="btn primary" data-save>${esc(cfg.saveLabel||"Lưu")}</button>`}</div></div></div>`;
  const dlg = layer.querySelector(".drawer");
  const api = { setOptions(key, opts){ optsOverride[key]=opts; vals[key]=""; { const sf = cfg.fields.find(x=>x.key===key); if(sf && sf.freeKey) vals[sf.freeKey]=""; } const f = cfg.fields.find(x=>x.key===key); const wrap = dlg.querySelector(`[data-field="${key}"]`); if(f && wrap){ const tmp=document.createElement("div"); tmp.innerHTML=fieldHTML(f); wrap.replaceWith(tmp.firstElementChild); } },
    /* Đổi giá trị 1 ô từ code (vd ô ngày chỉ-đọc đi theo đầu việc vừa chọn) – vẽ lại đúng ô đó như setOptions */
    setValue(key, v){ vals[key]=v; const f = cfg.fields.find(x=>x.key===key); const wrap = dlg.querySelector(`[data-field="${key}"]`); if(f && wrap){ const tmp=document.createElement("div"); tmp.innerHTML=fieldHTML(f); wrap.replaceWith(tmp.firstElementChild); } } };
  /* f.showIf(vals) → ẩn/hiện ô theo giá trị các ô khác (vd "Cả ngày" ẩn ô giờ ở form sự kiện lịch); chạy lại sau mỗi
     lần đổi giá trị. Ô đang ẩn không bị bắt buộc nhập (xem kiểm tra required ở nút Lưu). */
  const applyShowIf = () => { for(const f of cfg.fields){ if(!f.showIf) continue; const w = dlg.querySelector(`[data-field="${f.key}"]`); if(w) w.hidden = !f.showIf(vals); } };
  const readInputs = () => { for(const f of cfg.fields){ if(!f.key) continue; const el = dlg.querySelector("#f_"+f.key); if(!el) continue; if(f.type==="check") vals[f.key]=el.checked; else if(f.type==="number") vals[f.key]=el.value===""?null:+el.value; else if(f.type!=="seg" && f.type!=="images") vals[f.key]=el.value||(f.type==="date"?null:""); } };
  const close = () => { layer.innerHTML=""; document.removeEventListener("keydown", onKey); if(prevFocus && prevFocus.focus) prevFocus.focus(); };
  const onKey = e => { if(e.key==="Escape") close(); };
  document.addEventListener("keydown", onKey);
  dlg.addEventListener("click", async e => {
    const sb = e.target.closest(".seg-in button");
    if(sb){ const k=sb.dataset.k; const v=JSON.parse(sb.dataset.v); vals[k]=v; applyShowIf(); sb.parentElement.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed", b===sb)); const f=cfg.fields.find(x=>x.key===k); const hn=dlg.querySelector(`[data-hint="${k}"]`); if(f && hn && typeof f.hint==="function") hn.textContent=f.hint(v, vals); return; }
    if(e.target.closest("[data-imgpick]")){ const inp = dlg.querySelector("[data-imgfile]"); if(inp) inp.click(); return; }
    const ix = e.target.closest("[data-imgdel]");
    if(ix){ const fi = cfg.fields.find(x=>x.type==="images"); if(fi){ vals[fi.key] = (vals[fi.key]||[]).filter((_, j) => j!==+ix.dataset.imgdel); dlg.querySelector("#f_"+fi.key).innerHTML = imgFieldHTML(vals[fi.key]); } return; }
    const so = e.target.closest(".search-dd button[data-sv]");
    if(so){ searchPick(so.closest(".search-dd").dataset.key, so.dataset.sv, so.dataset.sl); return; }
    const sfree = e.target.closest(".search-dd button[data-free]");
    if(sfree){ searchFree(sfree.closest(".search-dd").dataset.key, sfree.dataset.sl); return; }
    if(e.target.closest("[data-save]")){
      readInputs();
      for(const f of cfg.fields){ if(f.required && !(f.showIf && !f.showIf(vals)) && (vals[f.key]==null || vals[f.key]==="") && !(f.freeKey && vals[f.freeKey])){ toast("Còn thiếu: "+f.label); return; } }
      const btn = e.target.closest("[data-save]"); btn.disabled=true;
      try{ await cfg.onSave(vals); close(); }catch(err){ btn.disabled=false; if(err && err.message) toast(err.message); }
      return;
    }
    if(e.target.closest("[data-del]")){ try{ const r = await cfg.onDelete(); if(r!==false) close(); }catch(err){} return; }
    if(e.target.closest("[data-extra]")){ close(); cfg.extraBtn.onClick(); return; }
  });
  dlg.addEventListener("change", e => {
    const el = e.target; if(!el.id || !el.id.startsWith("f_")) return;
    const key = el.id.slice(2); const f = cfg.fields.find(x=>x.key===key); readInputs(); applyShowIf();
    if(f && f.onChange) f.onChange(vals[key], api);
    const hn = dlg.querySelector(`[data-hint="${key}"]`); if(f && hn && typeof f.hint==="function") hn.textContent=f.hint(vals[key], vals);
    cfg.fields.forEach(g=>{ if(typeof g.hint==="function"){ const h2=dlg.querySelector(`[data-hint="${g.key}"]`); if(h2) h2.textContent=g.hint(vals[g.key], vals); } });
  });
  /* Thêm ảnh: dán (Ctrl+V / giữ chạm → Dán) hoặc nút "Chọn ảnh / chụp ảnh" (thư viện ảnh, máy ảnh điện thoại).
     Chỉ xử lý khi clipboard có ảnh – dán chữ vẫn như thường. */
  const fImg = cfg.fields.find(x=>x.type==="images");
  const addImages = async files => {
    const max = fImg.max || 4, cur = [...(vals[fImg.key] || [])];
    if(cur.length >= max){ toast("Tối đa "+max+" ảnh – bỏ bớt ảnh cũ trước khi thêm."); return; }
    try{
      for(const fl of files.slice(0, max-cur.length)) cur.push(await imgCompress(fl));
      vals[fImg.key] = cur; dlg.querySelector("#f_"+fImg.key).innerHTML = imgFieldHTML(cur);
    }catch(err){ toast(err.message || "Không thêm được ảnh."); }
  };
  if(fImg && !cfg.readOnly){
    dlg.addEventListener("paste", async e => {
      const files = [...(e.clipboardData ? e.clipboardData.items : [])].filter(it => it.kind==="file" && /^image\//.test(it.type)).map(it => it.getAsFile()).filter(Boolean);
      if(!files.length) return;
      e.preventDefault(); await addImages(files);
    });
    dlg.addEventListener("change", async e => {
      const inp = e.target.closest && e.target.closest("[data-imgfile]"); if(!inp) return;
      const files = [...inp.files].filter(x => /^image\//.test(x.type)); inp.value = "";
      if(files.length) await addImages(files);
    });
  }
  /* Ô "search" (gõ để lọc trong danh sách dài, thay <select> – vd "Đầu việc" ở Nhập theo tuần,
     weekly-input.js): lọc theo chữ gõ (so nguyên chuỗi con, không phân biệt hoa/thường), tối đa 200 gợi ý
     hiện cùng lúc. searchPick() dùng chung cho bấm chọn (click) lẫn Enter (chọn gợi ý đầu tiên đang hiện).
     Rời khỏi ô (focusout) mà chưa bấm chọn gì thì trả lại đúng chữ của lựa chọn đang lưu (hoặc rỗng nếu
     chưa chọn) – không để chữ gõ dở tự ý trở thành giá trị, vì giá trị thật luôn phải là 1 trong các options. */
  const searchOptsOf = key => { const f = cfg.fields.find(x=>x.key===key); return f ? (optsOverride[key]||f.options||[]) : []; };
  /* So KHÔNG dấu + không phân biệt hoa/thường (như slug(), utils.js) – không chỉ tiện (gõ không cần đúng
     dấu) mà còn "chữa cháy" trường hợp bàn phím tiếng Việt (Unikey/Telex/VNI) gửi sự kiện input dồn dập lúc
     ghép dấu khiến ký tự có dấu dễ gõ sai/thiếu giữa chừng – so không dấu vẫn ra đúng kết quả trong lúc gõ. */
  const searchNorm = s => String(s??"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/gi,"d").toLowerCase();
  const searchRenderDD = (key, q) => {
    const dd = dlg.querySelector("#f_"+key+"_dd"); if(!dd) return;
    const nq = searchNorm(q).trim();
    /* Chỉ hiện gợi ý khi đã gõ chữ gì đó – rỗng (vd vừa focus vào ô, chưa gõ gì) thì ẩn hẳn dropdown thay
       vì đổ nguyên danh sách (có thể cả trăm dòng) ra ngay, đúng yêu cầu người dùng. */
    if(!nq){ dd.hidden = true; dd.innerHTML = ""; return; }
    const list = searchOptsOf(key).filter(o=>searchNorm(o[1]).includes(nq)).slice(0,200);
    /* f.freeKey: cho phép nhập tay ngoài danh sách gợi ý – thêm 1 dòng "Dùng … (nhập tay)" cuối danh sách;
       chữ nhập tay lưu ở vals[f.freeKey], còn vals[key] để rỗng (xem searchFree()). */
    const f = cfg.fields.find(x=>x.key===key), raw = String(q??"").trim();
    const freeBtn = f && f.freeKey ? `<button type="button" data-free="1" data-sl="${esc(raw)}" class="search-dd-free">+ Dùng “${esc(raw)}” (nhập tay)</button>` : "";
    dd.innerHTML = list.length ? list.map(o=>`<button type="button" data-sv="${esc(o[0])}" data-sl="${esc(o[1])}">${esc(o[1])}</button>`).join("") + freeBtn : (freeBtn || `<div class="search-dd-empty">Không tìm thấy</div>`);
    dd.hidden = false;
  };
  /* Nhập tay (ô có f.freeKey): bỏ chọn gợi ý, lưu chữ vào vals[f.freeKey] rồi gọi onChange như khi chọn */
  const searchFree = (key, text) => {
    const f = cfg.fields.find(x=>x.key===key); if(!f || !f.freeKey) return;
    vals[key] = ""; vals[f.freeKey] = text;
    const q = dlg.querySelector("#f_"+key+"_q"); if(q) q.value = text;
    const hid = dlg.querySelector("#f_"+key); if(hid) hid.value = "";
    const dd = dlg.querySelector("#f_"+key+"_dd"); if(dd){ dd.hidden = true; dd.innerHTML = ""; }
    if(f.onChange) f.onChange(vals[key], api);
    const hn = dlg.querySelector(`[data-hint="${key}"]`); if(hn && typeof f.hint==="function") hn.textContent = f.hint(vals[key], vals);
  };
  const searchPick = (key, sv, sl) => {
    { const f = cfg.fields.find(x=>x.key===key); if(f && f.freeKey) vals[f.freeKey] = ""; }
    vals[key] = sv;
    const q = dlg.querySelector("#f_"+key+"_q"); if(q) q.value = sl;
    /* Phải ghi cả vào input ẩn (id="f_"+key) chứ không chỉ "vals" trong bộ nhớ – readInputs() lúc bấm Lưu
       đọc lại DOM từ chính input ẩn này (giống mọi field khác), không đụng tới "vals" đang giữ sẵn; thiếu
       dòng này thì chọn xong vẫn báo "Còn thiếu" vì readInputs() ghi đè lại thành rỗng. */
    const hid = dlg.querySelector("#f_"+key); if(hid) hid.value = sv;
    const dd = dlg.querySelector("#f_"+key+"_dd"); if(dd){ dd.hidden = true; dd.innerHTML = ""; }
    const f = cfg.fields.find(x=>x.key===key);
    if(f && f.onChange) f.onChange(vals[key], api);
    const hn = dlg.querySelector(`[data-hint="${key}"]`); if(f && hn && typeof f.hint==="function") hn.textContent = f.hint(vals[key], vals);
  };
  if(cfg.fields.some(f=>f.type==="search") && !cfg.readOnly){
    dlg.addEventListener("input", e => { const inp = e.target.closest("[data-searchkey]"); if(inp) searchRenderDD(inp.dataset.searchkey, inp.value); });
    /* Bàn phím tiếng Việt (Unikey/bộ gõ hệ thống…) ghép dấu qua composition – một số trình duyệt/bộ gõ chỉ
       bắn "input" ở bước gõ ký tự gốc (chưa dấu) rồi lặng lẽ sửa giá trị khi dấu được ghép xong mà không
       bắn lại "input", khiến danh sách gợi ý bị kẹt lại theo chữ CHƯA ghép dấu. "compositionend" luôn bắn
       đúng lúc ghép dấu xong, dùng làm lưới an toàn lọc lại theo giá trị cuối cùng. */
    dlg.addEventListener("compositionend", e => { const inp = e.target.closest("[data-searchkey]"); if(inp) searchRenderDD(inp.dataset.searchkey, inp.value); });
    dlg.addEventListener("focusin", e => { const inp = e.target.closest("[data-searchkey]"); if(inp) searchRenderDD(inp.dataset.searchkey, inp.value); });
    dlg.addEventListener("focusout", e => {
      const inp = e.target.closest("[data-searchkey]"); if(!inp) return;
      const key = inp.dataset.searchkey;
      setTimeout(() => {
        const dd = dlg.querySelector("#f_"+key+"_dd"); if(dd) dd.hidden = true;
        const cur = searchOptsOf(key).find(o=>String(o[0])===String(vals[key]??""));
        /* Ô cho nhập tay: rời ô với chữ khác lựa chọn đang lưu → coi chữ đó là giá trị nhập tay */
        const f = cfg.fields.find(x=>x.key===key), typed = inp.value.trim();
        if(f && f.freeKey && !(cur && cur[1]===inp.value)){
          if(typed){ if(typed!==vals[f.freeKey] || vals[key]) searchFree(key, typed); return; }
          if(vals[key] || vals[f.freeKey]){ vals[key] = ""; vals[f.freeKey] = ""; const hid = dlg.querySelector("#f_"+key); if(hid) hid.value = ""; if(f.onChange) f.onChange("", api); }
          return;
        }
        inp.value = cur ? cur[1] : "";
      }, 150);
    });
    dlg.addEventListener("keydown", e => {
      const inp = e.target.closest("[data-searchkey]"); if(!inp) return;
      const key = inp.dataset.searchkey, dd = dlg.querySelector("#f_"+key+"_dd");
      if(e.key==="Escape"){ if(dd && !dd.hidden){ dd.hidden = true; e.stopPropagation(); } return; }
      if(e.key!=="Enter") return;
      e.preventDefault();
      const first = dd && dd.querySelector("button[data-sv]");
      if(first) searchPick(key, first.dataset.sv, first.dataset.sl);
      else { const fb = dd && dd.querySelector("button[data-free]"); if(fb) searchFree(key, fb.dataset.sl); }
    });
  }
  layer.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click", close));
  setTimeout(()=>{ const first = dlg.querySelector("input,select,textarea,.seg-in button"); (first||dlg.querySelector("[data-close]")).focus(); }, 30);
}
