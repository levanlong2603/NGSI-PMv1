"use strict";
/* Hằng số: loại dự án, trạng thái, nguyên nhân ma sát, biểu tượng, menu + bảng đăng ký mở rộng */
/* ================= constants ================= */
/* Vai trò tài khoản: admin (hệ thống/khởi tạo CSDL, ẩn khỏi Cài đặt) > head (Trưởng phòng) >
   deputy (Phó phòng) > member (Nhân viên). Hiện admin/head/deputy đều toàn quyền như nhau (FULL_ROLES),
   khớp với FULL_ROLES ở backend/server.js – sẽ tách quyền riêng cho từng vai trò sau. "admin" không có
   nhãn hiển thị ở đây vì không bao giờ xuất hiện trên giao diện (máy chủ đã lọc khỏi GET /api/users). */
const FULL_ROLES = new Set(["admin","head","deputy"]);
const isFullRole = r => FULL_ROLES.has(r);
/* Thứ bậc quản lý tài khoản (khớp ROLE_RANK ở backend/server.js): không sửa được tài khoản/gán được vai
   trò cao hơn cấp của chính mình. Không liên quan quyền ghi dữ liệu dự án/tuần (vẫn ngang nhau ở 3 vai
   trò toàn quyền, xem FULL_ROLES) – chỉ áp dụng cho trang Cài đặt → Tài khoản đăng nhập. */
const ROLE_RANK = {admin:4, head:3, deputy:2, member:1};
/* "admin" chỉ dùng cho nhãn hiển thị CỦA CHÍNH phiên đăng nhập đó (vd trong userbox) – không xuất hiện
   trong danh sách chọn ở form tài khoản vì máy chủ đã ẩn hẳn khỏi GET /api/users. */
const ROLE_LABEL = {admin:"Admin", head:"Trưởng phòng", deputy:"Phó phòng", member:"Nhân viên"};
const TYPES = ["Triển khai", "Thầu", "Nội bộ"];
const TYPE_COLOR = {"Triển khai":"var(--teal)","Thầu":"var(--indigo)","Nội bộ":"var(--grey)"};
/* Vai trò dự án dùng cho "đầu việc chuẩn" (config/catalog, xem settings.js catFlatTable()) – khi tạo dự án
   mới từ khung mẫu, mỗi dòng catalog có "role" sẽ lấy người phụ trách = nhân sự được gán đúng vai trò đó
   trên dự án (p.pm/p.tm/p.am/p.acc, xem projectForm() ở plan.js), không cần chọn tay từng đầu việc. */
const CAT_ROLES = [["","–"],["PM","PM"],["TM","TM"],["AM","AM"],["ACC","ACC (kế toán)"]];
const CAT_PR = ["Cao","Bình thường"];
/* Ưu tiên đầu việc thật (task.pr, taskForm() ở plan.js) – 3 mốc giống đúng chữ dùng trong file mẫu Excel
   của phòng (cột "ƯU TIÊN" sheet NGSI chỉ có "Cao"/"Bình thường"), thêm "Thấp" làm mốc thứ 3 để PM tự hạ
   bớt ưu tiên những đầu việc phụ khi cần (file mẫu không có mốc này, catalog – CAT_PR – cũng chỉ có 2 mốc
   vì chỉ dùng làm khung mẫu "Cao"/"Bình thường" mặc định). Đã bỏ hẳn kiểu mã P1–P4 cũ (không khớp cách
   gọi tên của phòng) – nơi nào còn đọc "P1" là lỗi, phải đổi sang so chuỗi "Cao". */
const TASK_PR = ["Cao","Bình thường","Thấp"];
/* Bộ lọc dự án dùng chung cho Kế hoạch dự án & Tổng quan dự án (S.typeFilter) – tách Triển khai thành Đang triển khai / Hoàn thành */
const PLAN_FILTERS = [
  {key:"Tất cả", label:"Tất cả"},
  {key:"Đang triển khai", label:"Đang triển khai", type:"Triển khai", done:false},
  {key:"Hoàn thành", label:"Hoàn thành", type:"Triển khai", done:true},
  {key:"Thầu", label:"Thầu", type:"Thầu"}
];
function planIsDone(p){ return !!p._allDone; }
/* Tên nhân sự dùng trong dự án (PM/TM/AM/ACC gõ tay ở projectForm(), "Phụ trách" đầu việc…) nhiều khi là
   tên viết tắt (vd "Lydk") khác với "Họ tên" đầy đủ lưu ở Cài đặt → Nhân sự (config/staff, S.staff) – từ
   file Excel nhập vào thường chỉ có tên tài khoản/viết tắt. Nhân sự có thể khai thêm "Tên viết tắt"
   (s.alias, Cài đặt → Nhân sự) để LIÊN KẾT 2 tên lại với nhau. canonStaffName(raw) trả về đúng "Họ tên"
   đầy đủ nếu `raw` khớp alias của 1 nhân sự nào đó, không khớp gì thì trả nguyên `raw` (coi như đã là tên
   chuẩn, hoặc tên tự do không quản lý được). Dùng ở những chỗ cần biết "đây có đúng là người X không"
   (quyền xem/sửa dự án, Capacity/Workload, KPI…) qua `projectAssigned()`/`model.js`/`kpi-calc.js` – KHÔNG
   dùng để đổi chữ hiển thị trên giao diện (bảng/thẻ dự án vẫn hiện nguyên tên đã gõ/nhập, không tự ý đổi
   thành Họ tên đầy đủ). Khớp đúng bản sao phía máy chủ `canonStaffName()` (async, đọc CSDL) ở
   `backend/server.js` – sửa 1 bên thì sửa cả 2, không chỉ chặn ở giao diện. */
function canonStaffName(raw){
  if(!raw) return raw;
  const hit = (S.staff||[]).find(s=>s.alias && s.alias===raw);
  return hit ? hit.name : raw;
}
/* TM (Phụ trách) của dự án – dùng để giới hạn những dự án nhân viên được thấy. Web này là web cho
   Phòng Quản lý dự án (không phải Phòng Kỹ thuật cũ): không còn vai trò "SE" – PM là vai trò chính, các
   bên khác (TM/AM/ACC) chỉ phối hợp. `p.se` đã bỏ khỏi mọi chỗ đọc/kiểm tra quyền (xem CLAUDE.md), vẫn
   còn trong schema tài liệu cũ nhưng không còn ý nghĩa gì. */
function projectAssigned(p, name){ return !!name && canonStaffName(p.owner)===name; }
/* Quyền ghi Note độc lập với quyền sửa toàn bộ dự án; luôn dùng nhân sự của tài khoản đăng nhập. */
function canNoteProject(p){
  const u = S.user;
  return !!p && (S.canEdit || (!!u && (p.created_by===u.username || (!!u.staff_name &&
    [p.owner,p.pm,p.tm,p.am,p.acc].some(n=>canonStaffName(n)===u.staff_name)))));
}
function planMatchFilter(p, key){
  const f = PLAN_FILTERS.find(x=>x.key===key) || PLAN_FILTERS[0];
  if(f.key==="Tất cả") return true;
  if(f.type && p.type!==f.type) return false;
  if(f.done!=null && planIsDone(p)!==f.done) return false;
  return true;
}
const ST_ALL = ["Chưa bắt đầu","Đang làm","Đang vướng","Tạm dừng","Hoàn thành","Hủy"];
const ST_WEEK = ["Đang làm","Đang vướng","Tạm dừng","Hoàn thành","Hủy"];
const OPEN = new Set(["Chưa bắt đầu","Đang làm","Đang vướng","Tạm dừng"]);
const CAUSES = ["Khách hàng","Hãng","Hàng hóa / thiết bị","Cộng sự","Hệ thống","Thay đổi yêu cầu","Chờ quyết định"];
/* Nhận diện "Mốc chính dự án" từ "No." (A/I/1/1.1…) + cảnh báo "Sắp đến hạn" – cấu hình chung cho cả hệ
   thống (config/milestoneRule, chỉ trưởng phòng sửa – xem settingsMilestonePanel(), settings.js), dựa
   đúng quy tắc đọc được từ file mẫu thật của phòng (xem CLAUDE.md "Bộ công thức sheet Report"):
     - mode 1: chỉ chữ cái đơn (A/B/C…, LOẠI I/V/X vì đó là số La Mã) + số La Mã (I..XX).
     - mode 2 (mặc định, khớp file mẫu): mode 1 + số nguyên cấp 1 (1/2/3…, loại 1.1/1.1.1…), CỘNG THÊM
       giữ toàn bộ nhánh có chữ "THANH TOÁN" trong tên (ở bất kỳ cấp con nào) kể từ dòng hạng mục chữ cái
       chứa chữ đó tới trước hạng mục chữ cái tiếp theo.
     - mode 3: chỉ nhánh "THANH TOÁN" như trên (bỏ hẳn các mốc chữ cái/La Mã/số nguyên khác).
   dueSoonDays: ngưỡng "Sắp đến hạn" (ngày) – thay cho số 14 cố định cũ trong model.js. */
const MILESTONE_RULE_DEFAULT = {mode:2, dueSoonDays:14};
const MILESTONE_RULE_MODES = [
  [1, "Chỉ chữ cái + số La Mã", "Chỉ các dòng No. là 1 chữ cái (A, B, C…) hoặc số La Mã (I, II, III…)."],
  [2, "+ số nguyên, giữ trọn nhánh Thanh toán", "Thêm các dòng No. là số nguyên cấp 1 (1, 2, 3…), và giữ nguyên toàn bộ nhánh có chữ “THANH TOÁN” dù ở cấp nào."],
  [3, "Chỉ nhánh Thanh toán", "Chỉ lấy các dòng thuộc nhánh có chữ “THANH TOÁN” trong tên, bỏ mọi mốc khác."]
];
const QM_HINT = {1:"0,5–2 giờ",2:"2–8 giờ",3:"8–12 giờ",4:"12–24 giờ",5:"24–32 giờ"};
const PT_HINT = {1:"Đơn giản",2:"Quen thuộc",3:"Cần chuyên môn",4:"Cần chuyên gia",5:"Chưa có tiền lệ"};
/* Công thức Workload: quy Quy mô (bậc thời gian) ra số giờ đại diện thực tế (trung điểm khoảng giờ ở
   QM_HINT), nhân với hệ số của Độ phức tạp — để Workload (giờ) chia cho Capacity (giờ/tuần, xem
   settings.js) ra đúng % tải thực tế. Độ phức tạp đầu việc (không phải "Độ khó dự án") là yếu tố duy nhất
   cộng thêm vào Quy mô; workload sau đó còn được chia cho Hệ số năng lực người phụ trách (xem model.js). */
const QM_HOURS = {1:1.25, 2:5, 3:10, 4:18, 5:28};
/* Hệ số Độ phức tạp: 0,8/1/1,2/1,5/2 (khớp thang "Hệ số năng lực" nhân sự, settings.js – cùng 5 cấp, cùng
   dãy số, cho dễ so sánh) – GIỮ NGUYÊN chú thích PT_HINT ở trên (Đơn giản…Chưa có tiền lệ), chỉ đổi con số
   nhân. Không cần script chuyển đổi dữ liệu: task.pt/e.pt chỉ lưu CẤP ĐỘ (1–5), tra số nhân thật qua bảng
   này mỗi lần tính (wlOf() dưới, model.js, kpi-calc.js) – không như staff.factor lưu thẳng giá trị số nên
   phải migrate riêng (xem CLAUDE.md). */
const PT_MULT = {1:0.8, 2:1, 3:1.2, 4:1.5, 5:2};
/* Thiếu Độ phức tạp (cả theo kế hoạch lẫn danh mục chuẩn đều không có) → coi như hệ số 1 (trung tính),
   không chặn tính workload; Quy mô vẫn là trường bắt buộc nên thiếu qm thì không tính được (null). */
function wlOf(qm, pt){
  if(!qm) return null;
  return Math.round(QM_HOURS[qm]*(pt ? PT_MULT[pt] : 1)*10)/10;
}
/* Tải tuần = Tổng số giờ THỰC TẾ của các đầu việc trong tuần / WEEK_HOURS (40 giờ/tuần, như nhau cho mọi
   người – không còn trừ % họp hay nhân Hệ số năng lực ở Cài đặt → Nhân sự nữa). */
const WEEK_HOURS = 40;
/* Workload (giờ) của 1 lượt nhập tuần = số giờ thực hiện thực tế (e.actH), KHÔNG nhân Độ phức tạp.
   Chưa điền giờ thực tế (việc chưa xong) → 0. Lượt nhập cũ từ trước khi tách 2 ô dự kiến/thực tế (chưa có
   khoá actH) → coi e.hours là giờ thực tế; cũ hơn nữa chỉ có e.qm → đọc qua wlOf() như trước. Dùng chung
   cho model.js và kpi-calc.js. */
function entryWl(e){
  if("actH" in e) return e.actH!=null ? Math.round((+e.actH||0)*10)/10 : 0;
  if(e.hours!=null) return Math.round((+e.hours||0)*10)/10;
  return wlOf(e.qm, e.pt);
}
const ICONS = {
  dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  load:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  input:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  plan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/></svg>',
  set:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  exec:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 13l3-3 2.5 2.5L17 8"/></svg>',
  help:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 13.5 6 9z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="5" height="5" rx="1.2"/><rect x="14" y="4" width="5" height="5" rx="1.2"/><rect x="4" y="14" width="5" height="5" rx="1.2"/><rect x="14" y="14" width="5" height="5" rx="1.2"/></svg>',
  chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5" width="17" height="16" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  panelLeft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M9.5 4v16"/><path d="M14.5 10l-2 2 2 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  task:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  logout:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18"/><path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.2 0 10 7 10 7a16.3 16.3 0 0 1-3.2 4"/><path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.8 7 10 7c1.4 0 2.6-.3 3.7-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
};
/* "dash" gộp chung "Tổng quan dự án" + "Kế hoạch dự án" (2 tab trong 1 màn – xem project-overview.js:
   viewProject()/plan.js) từ khi có yêu cầu gộp 2 mục menu, không còn mục "plan" riêng nữa. Giữ nguyên id
   "dash" (không đổi tên) để không phải sửa lại các chỗ đang tham chiếu S.view==="dash"/VIEW_RENDER.dash/
   VIEWS.findIndex(v=>v.id==="dash") (reports.js chèn "Báo cáo" ngay sau mục này). */
const VIEWS = [
  {id:"exec", label:"Dashboard", icon:"exec"},
  {id:"dash", label:"Dự án", icon:"dash"},
  {id:"input", label:"Việc trong tuần", icon:"input"}, // gồm 3 tab: Tải tuần (weekly-load.js) | Đầu việc (weekly-input.js) | Lịch (modules/calendar.js) – xem viewWeek()
  {sep:true},
  {id:"settings", label:"Cài đặt", icon:"set"}
];


/* ---------- Bảng đăng ký mở rộng (dùng khi thêm module mới) ---------- */
/** id màn hình → hàm trả về HTML của màn hình đó */
const VIEW_RENDER = {};
/** tên hành động (thuộc tính data-act trên nút) → hàm xử lý (element, event) */
const ACTIONS = {};
/** id màn hình → hàm trả về số thông báo hiện ở menu (0/undefined = không hiện chấm) */
const NAV_BADGE = {};
/** các hàm chạy sau khi đăng nhập, nhận db để đăng ký nghe dữ liệu */
const ON_SESSION = [];
/**
 * Đăng ký một màn hình mới vào menu.
 *   registerView({ id:"risks", label:"Rủi ro", iconSvg:"<svg…>", render: viewRisks })
 *   position: "main" (mặc định – trước nhóm Cài đặt) | "bottom" (cuối menu)
 */
function registerView({id, label, icon, iconSvg, render, position = "main"}){
  const key = icon || id;
  if(iconSvg) ICONS[key] = iconSvg;
  const def = {id, label, icon: key};
  const i = VIEWS.findIndex(v => v.sep);
  if(position === "bottom" || i < 0) VIEWS.push(def); else VIEWS.splice(i, 0, def);
  VIEW_RENDER[id] = render;
}
if(typeof module!=="undefined" && module.exports) module.exports = {QM_HOURS, PT_MULT, wlOf, WEEK_HOURS, entryWl};
