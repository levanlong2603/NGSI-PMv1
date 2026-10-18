"use strict";
/* Mô hình tính toán (M): workload, trạng thái hiện tại, tiến độ, cảnh báo – tính lại mỗi lần vẽ */
/* ================= "Hạng mục" (t.phase/p._phases) + "Mốc chính dự án" (p._milestones) =================
   Nhận diện từ "No." (t.no, kiểu A/I/1/1.1 – người dùng tự gõ hoặc copy từ file Excel/"Nhập Excel") +
   tên đầu việc (t.dv), theo đúng công thức đọc được từ file mẫu thật của phòng (CLAUDE.md). Tách bạch 2
   khái niệm khác nhau dù cùng nguồn dữ liệu:
     - "Hạng mục" (phase): LUÔN tính theo 1 quy tắc cố định, không cấu hình được – gộp mọi đầu việc dưới
       đúng 1 dòng "chữ cái đơn" gần nhất phía trên nó (A, B, C… KHÔNG tính I/V/X vì đó là số La Mã – đây
       chính là quy tắc từng thiếu dẫn tới bỏ hẳn tính năng này trước đây, xem lịch sử ở dưới). Dùng cho
       dải cảnh báo theo giai đoạn (strip(), ui.js), cột "Hạng mục" (reports.js), gộp theo hạng mục ở
       "Việc trong tuần" (weekly-input.js) – cả 3 đã viết sẵn, chỉ chờ t.phase/p._phases có dữ liệu thật.
     - "Mốc chính dự án" (milestone, p._milestones): CẤU HÌNH ĐƯỢC qua S.milestoneRule (config/milestoneRule,
       Cài đặt → "Nhận diện mốc chính", chỉ trưởng phòng sửa) – xem MILESTONE_RULE_DEFAULT/MODES ở
       constants.js. Dùng cho panel "Mốc chính dự án" ở Kế hoạch dự án (planDetail(), plan.js). */
const MILESTONE_ROMAN = new Set(["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"]);
/* "Chữ cái đơn" làm hạng mục/mốc cấp 1: đúng 1 ký tự A-Z nhưng KHÔNG thuộc tập số La Mã ở trên (loại trừ
   I/V/X) – đây là điểm mấu chốt: không suy luận ngữ cảnh, chỉ quy ước cứng I/V/X luôn là số La Mã. */
function msLetterNo(no){ return /^[A-Za-z]$/.test(no) && !MILESTONE_ROMAN.has(no.toUpperCase()); }
function msRomanNo(no){ return MILESTONE_ROMAN.has(no.toUpperCase()); }
function msIntegerNo(no){ return no!=="" && /^\d+$/.test(no); }
function msPayment(dv){ return (dv||"").toUpperCase().includes("THANH TOÁN"); }
/* "Ngày khả dụng gần nhất" của 1 đầu việc – ưu tiên Thực tế → HĐ điều chỉnh → Kế hoạch theo HĐ gốc (bỏ
   qua "Kế hoạch dự kiến" vì không có vai trò ưu tiên rõ trong file mẫu gốc), dùng cho panel mốc chính. */
function msDate(t){ return {start: t.actStart||t.adjStart||t.hdStart||null, end: t.actEnd||t.adjEnd||t.deadline||null}; }
/* Duyệt đầu việc ĐÚNG THỨ TỰ lưu trong dự án (không sắp lại), đánh dấu dòng nào là "mốc chính" theo đúng
   mode đang cấu hình – xem mô tả 3 mode ở MILESTONE_RULE_MODES (constants.js). inPayment theo dõi "đang ở
   trong nhánh chữ cái có chữ THANH TOÁN hay không", reset lại mỗi khi gặp 1 dòng chữ cái đơn mới. */
function msClassify(tasksInOrder, mode){
  let inPayment = false;
  return tasksInOrder.map(t => {
    const no = String(t.no||"").trim();
    const letter = msLetterNo(no), roman = msRomanNo(no), integer = msIntegerNo(no);
    if(letter) inPayment = msPayment(t.dv);
    const hasContent = no!=="" || String(t.dv||"").trim()!=="";
    if(mode===1) return letter || roman;
    if(mode===3) return inPayment && hasContent;
    return letter || roman || integer || (inPayment && hasContent);
  });
}
/* ================= derived model ================= */
let M = null;
function derive(){
  const today = todayISO(), thisMon = mondayOf(today);
  const staff = S.staff.map(s => ({...s, cap: Math.round((+s.hours||0)*(1-(+s.pct||0))*(+s.factor||1)*10)/10}));
  /* Đăng ký Capacity theo CẢ Họ tên đầy đủ lẫn Tên viết tắt (s.alias, Cài đặt → Nhân sự – xem
     canonStaffName() ở constants.js) để tra đúng Capacity dù task.owner/p.pm… lưu tên nào trong 2 tên. */
  const capOf = new Map();
  for(const s of staff){ capOf.set(s.name, s.cap); if(s.alias) capOf.set(s.alias, s.cap); }
  const projects = [...S.projects].sort((a,b)=>(a.order??999)-(b.order??999) || a.name.localeCompare(b.name,"vi"));
  const pById = new Map(projects.map(p => [p.id, p]));
  const taskMap = new Map();
  for(const p of projects) for(const t of (p.tasks||[])) taskMap.set(p.id+"|"+t.id, {p, t});
  // weekly entries flat
  const entries = [];
  for(const w of S.weeks) for(const e of (w.entries||[])){
    const ref = taskMap.get(e.projectId+"|"+e.taskId);
    /* Workload của một lượt nhập tuần = e.hours (số giờ thực tế đã làm, người nhập tự gõ trong ô "Thời
       gian thực hiện") × PT_MULT[Độ phức tạp] – Quy mô (e.qm) ở màn Nhập theo tuần giờ chỉ để tham
       khảo/ước lượng, KHÔNG tham gia công thức này nữa (tránh tính trùng với giờ thật đã gõ). Thiếu Độ
       phức tạp → hệ số mặc định 1,0 (không chặn). Các lượt nhập cũ chỉ có e.qm (từ trước khi có ô giờ
       thật) vẫn đọc lại qua wlOf(e.qm, e.pt) để không đổi dữ liệu lịch sử. */
    const wl = e.hours!=null ? Math.round(e.hours*(e.pt?PT_MULT[e.pt]:1)*10)/10 : wlOf(e.qm, e.pt);
    entries.push({...e, week:w.week, person:w.person, docId:w._id, ref, wl, type: ref ? ref.p.type : (pById.get(e.projectId)||{}).type || "Nội bộ"});
  }
  // latest per task
  const latest = new Map(), doneWk = new Map();
  for(const e of entries){
    const k = e.projectId+"|"+e.taskId;
    if(e.status){ const cur = latest.get(k); if(!cur || e.week > cur.week) latest.set(k, e); }
    if(e.status==="Hoàn thành"){ const d=doneWk.get(k); if(!d || e.week<d) doneWk.set(k, e.week); }
  }
  const lastAny = new Map();
  for(const e of entries){ const k=e.projectId+"|"+e.taskId; const cur=lastAny.get(k); if(!cur || e.week>cur.week) lastAny.set(k,e); }
  /* Những ai thực sự đang làm một đầu việc: gộp người được phân công sẵn (t.collab) với những người đã
     nhập việc đó trong "Nhập theo tuần" ở TUẦN GẦN NHẤT có dữ liệu (không tính mọi tuần từ trước tới giờ –
     nếu không, một người chỉ cần từng nhập 1 lần duy nhất trong quá khứ sẽ dính mãi vào cột này dù không
     còn liên quan). Nếu 2 người cùng nhập đầu việc đó trong cùng tuần gần nhất, cả 2 đều hiện ra. */
  const entriesByTask = new Map();
  for(const e of entries){ const k=e.projectId+"|"+e.taskId; if(!entriesByTask.has(k)) entriesByTask.set(k, []); entriesByTask.get(k).push(e); }
  const doersByTask = new Map();
  for(const [k, es] of entriesByTask){
    const lastWk = es.reduce((a,e)=>!a||e.week>a?e.week:a, null);
    doersByTask.set(k, new Set(es.filter(e=>e.week===lastWk).map(e=>e.person)));
  }
  // tasks enriched
  const tasks = [];
  const dueSoonDays = (S.milestoneRule && S.milestoneRule.dueSoonDays) ?? 14;
  for(const p of projects){
    /* "Hạng mục" (t.phase/phaseName): gộp mọi đầu việc dưới đúng 1 dòng "chữ cái đơn" (msLetterNo(), ở
       trên) gần nhất phía trước nó trong p.tasks – duyệt đúng thứ tự lưu, không sắp lại. Trước đây từng bỏ
       hẳn tính năng này vì nhầm số La Mã (I, II…) với chữ cái tiêu đề; nay msLetterNo() loại trừ thẳng
       I/V/X nên hết nhầm. Đầu việc đứng trước dòng chữ cái đơn đầu tiên (nếu có) nhận phase="" (rơi về
       "Khác" ở reports.js/strip() như cũ, không gãy gì). */
    let curPhaseCode = "", curPhaseName = "", curRoman = "";
    const phases = [];
    /* "Lệch lịch với việc phụ thuộc": Bắt đầu đang lưu ≠ giá trị theo công thức phụ thuộc (thường do chọn
       "Chỉ việc này" khi sửa việc trước) – tính động, không lưu; sửa bằng "Đồng bộ lại theo công thức" trong
       chi tiết đầu việc (plan.js). Xem core/schedule.js. */
    const schedDrift = (p.tasks||[]).some(t=>t.sched) ? SCHED.drift(p.tasks) : new Map();
    p._tasks = (p.tasks||[]).map(t => {
      const k = p.id+"|"+t.id;
      const qm = t.qm, pt = t.pt;
      /* Workload (giờ) = số giờ đại diện của Quy mô × hệ số thời gian của Độ phức tạp (xem wlOf() ở
         constants.js) — không chia cho Hệ số năng lực nữa, vì hệ số đó đã nhân vào Capacity (cap ở trên)
         rồi; chia thêm ở đây sẽ tính hệ số năng lực hai lần.
         "Độ khó dự án" (p.difficulty) chỉ là nhãn phân loại dự án, không tham gia công thức tính tải. */
      const wl = wlOf(qm, pt);
      const le = latest.get(k), la = lastAny.get(k);
      const status = le ? le.status : (t.init && t.init.status) || "Chưa bắt đầu";
      const src = le ? "Tuần "+isoWeek(le.week) : "";
      const ms = le ? (le.ms ?? null) : (t.init ? t.init.ms ?? null : null);
      const nn = le ? (le.nn||"") : (t.init ? t.init.nn||"" : "");
      const upd = la ? [la.work, la.note].filter(Boolean).join(" · ") : "";
      /* Vướng mắc của NGƯỜI LÀM, tách riêng khỏi "Ghi chú của trưởng phòng" (t.note, trường gốc trên task) –
         lấy từ lượt nhập tuần gần nhất (la.note), dùng cho cột "Vướng mắc" ở Báo cáo dự án (reports.js),
         không lẫn với t.note ("Hướng giải quyết"). */
      const lastNote = la ? (la.note||"") : "";
      /* "Ngày cập nhật": tuần/ngày nhân viên lưu lần gần nhất, tách riêng khỏi nội dung "Cập nhật" ở trên */
      /* Ngày cập nhật = mốc gần nhất giữa lần nhập theo tuần và lần trưởng phòng/TM/SE sửa trực tiếp đầu việc ở Kế hoạch dự án */
      const weekDate = la ? parse(la.week) : null;
      const editDate = t.updatedAt ? new Date(t.updatedAt) : null;
      const latestDate = weekDate && editDate ? (weekDate >= editDate ? weekDate : editDate) : (weekDate || editDate);
      const updDate = latestDate ? dmy(iso(latestDate)) : "";
      const lastWeek = la ? la.week : null;
      const doerSet = new Set(doersByTask.get(k) || []);
      /* canonStaffName(): t.collab (dữ liệu cũ) có thể là tên viết tắt – quy về đúng Họ tên đầy đủ trước
         khi gộp, tránh 1 người hiện thành 2 dòng khác nhau trong "Thực hiện" (vd vừa "Lydk" vừa "Đặng
         Hương Ly" cho cùng 1 người) khi so với người đã nhập tuần bằng tên đầy đủ (luôn chuẩn, chọn từ
         S.staff). */
      if(t.collab) doerSet.add(canonStaffName(t.collab));
      const doers = [...doerSet].sort((a,b)=>a.localeCompare(b,"vi"));
      const done = status==="Hoàn thành" ? (doneWk.get(k) || null) : null;
      const ontime = done && t.deadline ? (done <= t.deadline) : null;
      const warns = [];
      if(p.type!=="Nội bộ"){
        if(!t.owner) warns.push(["bad","Chưa có người phụ trách"]);
        if(OPEN.has(status) && t.deadline && t.deadline < today) warns.push(["bad","Quá hạn"]);
        if(OPEN.has(status) && t.deadline && t.deadline >= today && days(today,t.deadline) <= dueSoonDays) warns.push(["warn","Sắp đến hạn"]);
        if(OPEN.has(status) && (ms||0) >= 3) warns.push(["bad","Ma sát cao"]);
        if((status==="Đang làm"||status==="Đang vướng") && (!lastWeek || lastWeek < addDays(thisMon,-14))) warns.push(["warn","Không cập nhật >2 tuần"]);
      }
      if(schedDrift.has(t.id)) warns.push(["warn","Lệch lịch với việc phụ thuộc"]);
      const noStr = String(t.no||"").trim();
      /* pathNo: đường dẫn phân cấp đầy đủ kiểu "E.V.1"/"E.V.1.1" (chữ cái.La Mã.số…) – dùng chung logic
         với curPhaseCode ở trên (msLetterNo() reset về đúng chữ cái, bỏ La Mã) + thêm curRoman (nối La Mã
         vào sau chữ cái) để khớp đúng format đã dùng ở ô "search" Đầu việc (taskOpts(), weekly-input.js) –
         viết 1 lần ở đây để dùng lại mọi nơi cần hiện đường dẫn (vd dòng "Việc trong tuần", inputRow()),
         thay vì mỗi nơi tự duyệt lại p.tasks riêng. */
      let pathNo;
      if(msLetterNo(noStr)){
        curPhaseCode = noStr.toUpperCase(); curPhaseName = t.dv||""; curRoman = "";
        pathNo = curPhaseCode;
        if(!phases.some(ph=>ph.code===curPhaseCode)) phases.push({code:curPhaseCode, name:curPhaseName});
      } else if(msRomanNo(noStr)){
        curRoman = noStr.toUpperCase();
        pathNo = [curPhaseCode, curRoman].filter(Boolean).join(".");
      } else {
        pathNo = [curPhaseCode, curRoman, noStr].filter(Boolean).join(".");
      }
      const o = {...t, p, key:k, qmE:qm, ptE:pt, wl, status, src, ms, nn, upd, lastNote, updDate, lastWeek, doers, done, ontime, warns, phase:curPhaseCode, phaseName:curPhaseName, pathNo};
      tasks.push(o); return o;
    });
    const live = p._tasks.filter(t => t.status!=="Hủy");
    /* Đầu việc chưa chấm Quy mô (wl=null) vẫn phải có trọng số (mặc định 1) khi tính tiến độ, nếu không
       nó "biến mất" khỏi mẫu số — khiến % tiến độ có thể ra 100% dù đầu việc đó còn dang dở (chỉ cần các
       đầu việc có Quy mô đều đã xong). Áp dụng cùng cách tính này ở p._phases bên dưới. */
    const tot = live.reduce((a,t)=>a+(t.wl??1),0), dn = live.filter(t=>t.status==="Hoàn thành").reduce((a,t)=>a+(t.wl??1),0);
    p._prog = tot ? dn/tot : null;
    /* "Đã hoàn thành cả dự án" (planIsDone) không được chỉ dựa vào p._prog===1 — nếu các đầu việc còn mở
       (quá hạn/đang vướng) thiếu Quy mô (wl=null→0), chúng không cộng vào tot, nên dn/tot có thể ra đúng
       1 dù dự án vẫn còn việc chưa xong. Dùng cờ riêng, đếm theo trạng thái từng đầu việc, không theo wl. */
    p._allDone = live.length>0 && live.every(t=>t.status==="Hoàn thành");
    const nexts = p._tasks.filter(t=>OPEN.has(t.status) && t.deadline && t.deadline>=today).map(t=>t.deadline).sort();
    p._next = nexts[0] || null;
    p._late = p._tasks.filter(t=>t.warns.some(w=>w[1]==="Quá hạn")).length;
    p._soon = p._tasks.filter(t=>t.warns.some(w=>w[1]==="Sắp đến hạn")).length;
    p._stuck = p._tasks.filter(t=>OPEN.has(t.status) && (t.status==="Đang vướng" || (t.ms||0)>=1)).length;
    p._maxms = Math.max(0, ...p._tasks.filter(t=>OPEN.has(t.status)).map(t=>t.ms||0));
    p._phases = phases;
    /* "Mốc chính dự án": lọc theo đúng mode đang cấu hình (S.milestoneRule), giữ nguyên thứ tự p._tasks.
       Mang nguyên 4 cặp ngày song song (không chỉ "ngày khả dụng gần nhất") để panel Kế hoạch dự án vẽ lại
       đúng bảng "II. CÁC MỐC CHÍNH CỦA DỰ ÁN" của sheet Report trong file mẫu (planMilestonesPanel(),
       plan.js) – xem "Bộ công thức sheet Report" ở CLAUDE.md. */
    const msFlags = msClassify(p._tasks, (S.milestoneRule && S.milestoneRule.mode) || 2);
    p._milestones = p._tasks.filter((t,i)=>msFlags[i]).map(t => ({no:t.no, dv:t.dv, pr:t.pr, status:t.status,
      hdStart:t.hdStart, deadline:t.deadline, adjStart:t.adjStart, adjEnd:t.adjEnd,
      expStart:t.expStart, expEnd:t.expEnd, actStart:t.actStart, actEnd:t.actEnd,
      ontime:t.ontime, warns:t.warns}));
  }
  return {today, thisMon, staff, capOf, projects, pById, taskMap, entries, tasks};
}
/* Đầu việc quá hạn toàn phòng (không tính dự án Nội bộ) – dùng chung cho Dashboard và chuông thông báo ở
   header. lateTasks() sắp theo độ gấp: Ưu tiên (P1 trước) rồi tới hạn chót (quá hạn lâu nhất lên đầu). */
function lateTaskCount(){ return lateTasks().length; }
function lateTasks(){
  const prRank = {P1:1, P2:2, P3:3, P4:4};
  return M.tasks.filter(t=>t.p.type!=="Nội bộ" && t.warns.some(w=>w[1]==="Quá hạn"))
    .sort((a,b)=>(prRank[a.pr]||9)-(prRank[b.pr]||9) || String(a.deadline||"9999").localeCompare(String(b.deadline||"9999")));
}
/* Vướng mắc TRONG TUẦN HIỆN TẠI (dùng riêng cho chuông thông báo ở header) – lấy thẳng từ lượt nhập
   "Nhập theo tuần" của đúng tuần này (M.entries, e.ms), KHÔNG lấy theo t.ms/t.nn của đầu việc (giá trị
   "mới nhất tính tới hiện tại" dùng chung cho Kế hoạch dự án/Tổng quan dự án – có thể đến từ một tuần cũ
   hơn nhiều). Sắp theo cấp độ ma sát cao nhất lên đầu. Nhân viên chỉ thấy vướng mắc của chính mình
   (so theo S.me, gắn với tài khoản); trưởng phòng/phó phòng/admin (S.canEdit) thấy của mọi người. */
function weekIssues(){
  const w = mondayOf(todayISO());
  let list = M.entries.filter(e=>e.week===w && e.ref && e.ref.p.type!=="Nội bộ" && (e.ms||0)>=1);
  if(!S.canEdit) list = list.filter(e=>e.person===S.me);
  return list.sort((a,b)=>(b.ms||0)-(a.ms||0));
}
/* e.ref.t (M.entries, derive() ở trên) là task THÔ lấy từ taskMap – taskMap dựng từ p.tasks TRƯỚC khi vòng
   lặp enrich p._tasks chạy (thứ tự cố ý: entries cần ref sớm hơn), nên e.ref.t KHÔNG có các field tính
   thêm (phase, pathNo, wl…). 2 hàm tra lại dưới đây đọc đúng bản đã enrich trong p._tasks theo id, để nơi
   gọi không phải tự rẽ nhánh riêng cho task thô (vd e.ref.t) và task đã derive(). */
function taskPhase(p, taskId){ const t = (p._tasks||[]).find(x=>x.id===taskId); return t ? t.phase : ""; }
function taskPathNo(p, taskId){ const t = (p._tasks||[]).find(x=>x.id===taskId); return t ? t.pathNo : ""; }
