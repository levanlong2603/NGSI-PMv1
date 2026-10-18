"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../frontend/js/core/schedule.js");

const T = (id, no, f = {}) => ({id, no, dv:"Việc " + id, daysActual:null, daysProposed:null,
  hdStart:null, deadline:null, adjStart:null, adjEnd:null, expStart:null, expEnd:null, actStart:null, actEnd:null, ...f});
const get = (r, id) => r.tasks.find(t => t.id === id);

test("quy ước ngày: Kết thúc = Bắt đầu + N, cuối tháng/năm nhuận không lệch", () => {
  assert.equal(S.END_OFFSET, 0);
  assert.equal(S.addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(S.addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(S.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(S.addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(S.diffDays("2026-07-08", "2027-06-29"), 356);
  assert.equal(S.endOf("2026-05-14", 1), "2026-05-15");
  assert.equal(S.endOf("2026-05-14", 0), "2026-05-14");
});

test("ngày không phụ thuộc múi giờ máy chạy", () => {
  const old = process.env.TZ;
  const out = [];
  for(const tz of ["Asia/Ho_Chi_Minh", "UTC", "America/Los_Angeles", "Pacific/Kiritimati"]){
    process.env.TZ = tz;
    out.push([S.addDays("2026-03-08", 1), S.addDays("2026-10-31", 1), S.diffDays("2026-03-07", "2026-03-09")].join());
  }
  process.env.TZ = old;
  assert.equal(new Set(out).size, 1);
  assert.equal(out[0], "2026-03-09,2026-11-01,2");
});

test("phân cấp theo No. tới 1.1.1.1, dòng No. trống là con của dòng có số gần nhất", () => {
  const tasks = [T("a","A"), T("b","B"), T("i","I"), T("1","1"), T("11","1.1"), T("111","1.1.1"), T("1111","1.1.1.1"),
    T("x1",""), T("x2",""), T("2","2"), T("ii","II"), T("c","C"), T("v","V")];
  const tr = S.tree(tasks);
  assert.equal(tr.parent.get("a"), undefined);
  assert.equal(tr.parent.get("i"), "b");
  assert.equal(tr.parent.get("1"), "i");
  assert.equal(tr.parent.get("1111"), "111");
  assert.equal(tr.level.get("1111"), 6);
  assert.equal(tr.parent.get("x1"), "1111");
  assert.equal(tr.parent.get("x2"), "1111", "dòng trống liên tiếp là anh em, không lồng nhau");
  assert.equal(tr.parent.get("2"), "i");
  assert.equal(tr.parent.get("ii"), "b");
  assert.equal(tr.parent.get("v"), "c", "V là số La Mã, không phải chữ cái hạng mục");
  assert.deepEqual(tr.children.get("a"), []);
});

test("sửa Số ngày việc 1 → việc 2 (FS) và việc 3 (FS sau việc 2) dịch theo chuỗi", () => {
  const tasks = [
    T("t1","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06"}),
    T("t2","2", {daysActual:3, hdStart:"2026-07-06", deadline:"2026-07-09", sched:{pred:"t1", type:"FS", lag:0}}),
    T("t3","3", {daysActual:2, hdStart:"2026-07-09", deadline:"2026-07-11", sched:{pred:"t2", type:"FS", lag:0}}),
  ];
  const r = S.recalc(tasks, {taskId:"t1", set:{daysActual:8}});
  assert.ok(r.ok);
  assert.equal(get(r,"t1").deadline, "2026-07-09");
  assert.equal(get(r,"t2").hdStart, "2026-07-09");
  assert.equal(get(r,"t2").deadline, "2026-07-12");
  assert.equal(get(r,"t3").hdStart, "2026-07-12");
  assert.equal(get(r,"t3").deadline, "2026-07-14");
  assert.deepEqual(r.affected.sort(), ["t2","t3"]);
  const c = r.changes.find(x => x.taskId === "t3" && x.key === "deadline");
  assert.equal(c.delta, 3);
  assert.deepEqual(r.projectEnd.hd, {old:"2026-07-11", new:"2026-07-14"});
  assert.equal(tasks[0].deadline, "2026-07-06", "không sửa mảng đầu vào");
});

test("SS và lệch ngày dương/âm", () => {
  const tasks = [
    T("p","1", {daysProposed:10, expStart:"2026-08-01", expEnd:"2026-08-11"}),
    T("a","2", {daysProposed:4, expStart:"2026-08-03", expEnd:"2026-08-07", sched:{pred:"p", type:"SS", lag:2}}),
    T("b","3", {daysProposed:1, expStart:"2026-08-09", expEnd:"2026-08-10", sched:{pred:"p", type:"FS", lag:-2}}),
  ];
  const r = S.recalc(tasks, {taskId:"p", set:{expStart:"2026-08-05"}});
  assert.equal(get(r,"p").expEnd, "2026-08-15");
  assert.equal(get(r,"a").expStart, "2026-08-07");
  assert.equal(get(r,"a").expEnd, "2026-08-11");
  assert.equal(get(r,"b").expStart, "2026-08-13");
  assert.equal(get(r,"b").expEnd, "2026-08-14");
});

test("FF: Kết thúc theo việc trước, Bắt đầu tính ngược = Kết thúc − Số ngày", () => {
  const tasks = [
    T("p","1", {daysActual:10, hdStart:"2026-01-01", deadline:"2026-01-11"}),
    T("f","2", {daysActual:3, hdStart:"2026-01-08", deadline:"2026-01-11", sched:{pred:"p", type:"FF", lag:0}}),
  ];
  const r = S.recalc(tasks, {taskId:"p", set:{daysActual:20}});
  assert.equal(get(r,"f").deadline, "2026-01-21");
  assert.equal(get(r,"f").hdStart, "2026-01-18");
});

test("dòng nhóm không nhập Số ngày → MIN/MAX của con, bỏ qua con thiếu ngày, tính dần lên các cấp", () => {
  const tasks = [
    T("b","B"),
    T("i","I"),
    T("1","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06"}),
    T("2","2"),
    T("3","3", {daysActual:4, hdStart:"2026-07-10", deadline:"2026-07-14"}),
  ];
  const r = S.recalc(tasks, {taskId:"3", set:{daysActual:9}});
  assert.equal(get(r,"3").deadline, "2026-07-19");
  assert.equal(get(r,"i").hdStart, "2026-07-01");
  assert.equal(get(r,"i").deadline, "2026-07-19");
  assert.equal(get(r,"i").daysActual, 18);
  assert.equal(get(r,"b").deadline, "2026-07-19");
  assert.equal(get(r,"2").hdStart, null);
  assert.equal(get(r,"i").sched.kind, "summary", "đánh dấu để lần sau không bị coi là 'có Số ngày riêng'");
});

test("dòng nhóm CÓ Số ngày riêng giữ như việc thường, con SS theo nhóm", () => {
  const tasks = [
    T("f","F", {daysActual:227, hdStart:"2026-11-01", deadline:"2027-06-16"}),
    T("1","1", {daysActual:15, hdStart:"2026-11-01", deadline:"2026-11-16", sched:{pred:"f", type:"SS"}}),
  ];
  const r = S.recalc(tasks, {taskId:"f", set:{hdStart:"2026-11-05"}});
  assert.equal(get(r,"f").deadline, "2027-06-20");
  assert.equal(get(r,"1").hdStart, "2026-11-05");
  assert.equal(get(r,"f").daysActual, 227);
});

test("việc Hoàn thành không đổi ngày thực tế, ngày khoá không đổi – cả 2 vào danh sách bỏ qua", () => {
  const tasks = [
    T("p","1", {daysProposed:5, expStart:"2026-07-01", expEnd:"2026-07-06", actStart:"2026-07-01", actEnd:"2026-07-06"}),
    T("d","2", {daysProposed:2, expStart:"2026-07-06", expEnd:"2026-07-08", sched:{pred:"p", type:"FS"}}),
    T("k","3", {daysProposed:2, expStart:"2026-07-06", expEnd:"2026-07-08", sched:{pred:"p", type:"FS", lock:{expStart:true}}}),
  ];
  const r = S.recalc(tasks, {taskId:"p", set:{actEnd:"2026-07-10"}}, {status:{d:"Hoàn thành"}});
  assert.equal(get(r,"d").actStart, null, "không tự điền ngày thực tế cho việc đã hoàn thành");
  assert.ok(r.skipped.some(s => s.taskId === "d" && s.reason === "Đã hoàn thành"));

  const r2 = S.recalc(tasks, {taskId:"p", set:{daysProposed:7}});
  assert.equal(get(r2,"d").expStart, "2026-07-08");
  assert.equal(get(r2,"k").expStart, "2026-07-06");
  assert.ok(r2.skipped.some(s => s.taskId === "k" && s.key === "expStart" && s.reason.includes("khoá")));
  assert.equal(get(r2,"p").actEnd, "2026-07-06", "ngày thực tế đã có thì coi là khoá");
  assert.ok(r2.skipped.some(s => s.taskId === "p" && s.reason === "Đã có ngày thực tế"));
});

test("sửa Kết thúc (bộ HĐ) → tính lại Số ngày, HĐ điều chỉnh dùng chung F đi theo; sửa Kết thúc HĐ điều chỉnh → chỉ khoá ô đó", () => {
  const tasks = [T("t","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06", adjStart:"2026-07-03", adjEnd:"2026-07-08"})];
  const r = S.recalc(tasks, {taskId:"t", set:{deadline:"2026-07-11"}});
  assert.equal(get(r,"t").daysActual, 10);
  assert.equal(get(r,"t").hdStart, "2026-07-01");
  assert.equal(get(r,"t").adjEnd, "2026-07-13");

  const r2 = S.recalc(tasks, {taskId:"t", set:{adjEnd:"2026-07-20"}});
  assert.equal(get(r2,"t").daysActual, 5);
  assert.equal(get(r2,"t").deadline, "2026-07-06");
  assert.equal(get(r2,"t").sched.lock.adjEnd, true);
});

test("form gửi cả bộ trường: chỉ trường khác giá trị cũ mới tính là đã sửa; dữ liệu cũ lệch công thức không bị 'sửa hộ'", () => {
  const tasks = [T("t","1", {daysActual:5, daysProposed:2, hdStart:"2026-07-01", deadline:"2026-07-20", expStart:"2026-07-01", expEnd:"2026-07-03"})];
  const set = {...tasks[0], daysProposed:4};
  const r = S.recalc(tasks, {taskId:"t", set});
  assert.equal(get(r,"t").expEnd, "2026-07-05");
  assert.equal(get(r,"t").deadline, "2026-07-20", "bộ HĐ không bị đụng tới dù 07-01 + 5 ≠ 07-20");
});

test("bộ kế hoạch copy trong cùng dòng (HĐ điều chỉnh = HĐ, Thực tế = Dự kiến khi còn trống)", () => {
  const tasks = [T("t","1", {daysActual:5, daysProposed:3, hdStart:"2026-07-01", deadline:"2026-07-06", adjStart:"2026-07-01", adjEnd:"2026-07-06",
    expStart:"2026-07-01", expEnd:"2026-07-04",
    sched:{plans:{adj:{start:{k:"copy", plan:"hd"}}, act:{start:{k:"copy", plan:"exp"}, end:{k:"copy", plan:"exp"}}}}})];
  const r = S.recalc(tasks, {taskId:"t", set:{hdStart:"2026-07-03"}});
  assert.equal(get(r,"t").adjStart, "2026-07-03");
  assert.equal(get(r,"t").adjEnd, "2026-07-08");
  const r2 = S.recalc(tasks, {taskId:"t", set:{expStart:"2026-07-02"}});
  assert.equal(get(r2,"t").actStart, "2026-07-02");
  assert.equal(get(r2,"t").actEnd, "2026-07-05");
});

test("vòng phụ thuộc bị chặn, báo rõ các việc trong vòng", () => {
  const tasks = [
    T("a","1", {daysActual:1, hdStart:"2026-07-01", sched:{pred:"c"}}),
    T("b","2", {daysActual:1, sched:{pred:"a"}}),
    T("c","3", {daysActual:1, sched:{pred:"b"}}),
    T("d","4", {daysActual:1, sched:{pred:"c"}}),
  ];
  const r = S.recalc(tasks, {taskId:"a", set:{daysActual:2}});
  assert.equal(r.ok, false);
  assert.equal(r.error.type, "cycle");
  assert.deepEqual(r.error.taskIds.sort(), ["a","b","c"], "việc chỉ đứng sau vòng (d) không tính là trong vòng");

  const self = S.recalc([T("x","1", {sched:{pred:"x"}})], {taskId:"x", set:{daysActual:1}});
  assert.equal(self.ok, false);

  const viaParent = [T("i","I"), T("1","1", {daysActual:2, hdStart:"2026-01-01", sched:{pred:"i", type:"SS"}})];
  assert.equal(S.recalc(viaParent, {taskId:"1", set:{daysActual:3}}).ok, false, "con SS theo nhóm tự tính MIN/MAX là vòng");
});

test("Chỉ việc này: việc phụ thuộc giữ ngày cũ, dòng nhóm cha vẫn cập nhật, cảnh báo lệch lịch phát hiện được", () => {
  const tasks = [
    T("i","I"),
    T("1","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06"}),
    T("2","2", {daysActual:3, hdStart:"2026-07-06", deadline:"2026-07-09", sched:{pred:"1", type:"FS"}}),
  ];
  const r = S.recalc(tasks, {taskId:"1", set:{daysActual:10}}, {scope:"self"});
  assert.equal(get(r,"1").deadline, "2026-07-11");
  assert.equal(get(r,"2").hdStart, "2026-07-06");
  assert.equal(get(r,"i").deadline, "2026-07-11");
  assert.deepEqual(r.affected, ["i"]);
  const d = S.drift(r.tasks);
  assert.deepEqual(d.get("2"), [{plan:"hd", planLabel:"Kế hoạch theo HĐ", expected:"2026-07-11", actual:"2026-07-06"}]);
  assert.equal(S.drift(tasks).size, 0);

  const fix = S.recalc(r.tasks, {taskId:"2"}, {force:true});
  assert.equal(get(fix,"2").hdStart, "2026-07-11");
  assert.equal(get(fix,"2").deadline, "2026-07-14");
});

test("dữ liệu cũ không có sched: sửa 1 việc không ảnh hưởng việc khác", () => {
  const tasks = [
    T("1","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06"}),
    T("2","2", {daysActual:3, hdStart:"2026-07-06", deadline:"2026-07-09"}),
  ];
  const r = S.recalc(tasks, {taskId:"1", set:{daysActual:6}});
  assert.equal(r.affected.length, 0);
  assert.equal(get(r,"2").hdStart, "2026-07-06");
  assert.equal(get(r,"1").sched, undefined, "không gắn sched rỗng vào dữ liệu cũ");
});

test("đổi phụ thuộc trong form → tính lại Bắt đầu theo phụ thuộc mới", () => {
  const tasks = [
    T("1","1", {daysActual:5, hdStart:"2026-07-01", deadline:"2026-07-06"}),
    T("2","2", {daysActual:3, hdStart:"2026-07-01", deadline:"2026-07-04"}),
  ];
  const r = S.recalc(tasks, {taskId:"2", set:{sched:{pred:"1", type:"FS", lag:1}}});
  assert.equal(get(r,"2").hdStart, "2026-07-07");
  assert.equal(get(r,"2").deadline, "2026-07-10");
});

/* ===== Chuyển công thức Excel (sheet NGSI) thành task.sched ===== */
const X = (row, id, cells) => ({row, id, cells});
const f = s => ({f:s, v:null});
const d = v => ({f:null, v});

test("fromExcel: FS dòng trên + copy giữa các bộ (dòng 14 file BRCD: H=I12, J=H, L=H, N=L, O=M)", () => {
  const rows = [
    X(12, "t12", {H:d("2026-07-08"), I:f("H12+F12"), J:f("H12"), K:f("J12+F12"), L:f("H12"), M:f("L12+G12")}),
    X(14, "t14", {H:f("I12"), I:f("H14+F14"), J:f("H14"), K:f("J14+F14"), L:f("H14"), M:f("L14+G14"), N:f("L14"), O:f("M14")}),
  ];
  const {sched, stats} = S.fromExcel(rows);
  assert.deepEqual(sched.get("t14"), {pred:"t12", type:"FS", lag:0, plans:{
    adj:{start:{k:"copy", plan:"hd"}}, exp:{start:{k:"copy", plan:"hd"}},
    act:{start:{k:"copy", plan:"exp"}, end:{k:"copy", plan:"exp"}}}});
  assert.deepEqual(sched.get("t12"), {plans:{adj:{start:{k:"copy", plan:"hd"}}, exp:{start:{k:"copy", plan:"hd"}}}});
  assert.equal(stats.dep.FS, 1);
});

test("fromExcel: việc trước khác nhau từng bộ, lệch ngày, SS, ngày gõ tay bị khoá, nguồn Số ngày khác mặc định", () => {
  const rows = [
    X(31, "a", {}), X(38, "b", {}), X(66, "c", {}),
    X(67, "x", {H:f("I31"), I:f("H67+F67"), J:f("K66"), K:f("J67+G67"), L:f("M66"), M:f("L67+G67")}),
    X(39, "y", {H:f("H38"), I:f("H39+F39"), L:f("M38+2"), M:d("2026-09-01"), O:d("2026-09-05")}),
  ];
  const {sched} = S.fromExcel(rows);
  const x = sched.get("x");
  assert.equal(x.pred === "a" || x.pred === "c", true);
  assert.deepEqual(sched.get("x").plans.adj.end, {k:"dur", src:"daysProposed"}, "K=J+G giữ đúng nguồn G");
  const y = sched.get("y");
  assert.deepEqual([y.pred, y.type, y.lag], ["b", "SS", 0]);
  assert.deepEqual(y.plans.exp.start, {k:"dep", pred:"b", type:"FS", lag:2});
  assert.deepEqual(y.lock, {expEnd:true}, "ngày gõ tay ở Kết thúc bị khoá; Thực tế không cần khoá");
});

test("fromExcel: FF (Bắt đầu = Kết thúc − Số ngày, Kết thúc theo dòng khác) và dòng tham chiếu không có trong dự án", () => {
  const rows = [
    X(31, "a", {}), X(39, "b", {}),
    X(66, "c", {H:f("I66-F66"), I:f("I31"), L:f("M66-G66"), M:f("M39+1")}),
    X(74, "e", {L:f("M73"), M:f("L74+G74")}),
  ];
  const {sched, stats} = S.fromExcel(rows);
  const c = sched.get("c");
  assert.deepEqual([c.pred, c.type, c.lag], ["a", "FF", 0]);
  assert.deepEqual(c.plans.exp.start, {k:"dep", pred:"b", type:"FF", lag:1});
  assert.equal(sched.get("e"), null, "dòng 73 không thành đầu việc → không gắn được");
  assert.deepEqual(stats.missing.map(m => m.row), [74]);
});

test("fromExcel + engine: tái hiện đúng chuỗi Excel khi sửa Số ngày", () => {
  const tasks = [
    T("t21","1.2", {daysActual:1, hdStart:"2026-07-08", deadline:"2026-07-09"}),
    T("t22","1.3", {daysActual:3, hdStart:"2026-07-09", deadline:"2026-07-12"}),
  ];
  const {sched} = S.fromExcel([
    X(21, "t21", {H:d("2026-07-08"), I:f("H21+F21")}),
    X(22, "t22", {H:f("I21"), I:f("H22+F22")}),
  ]);
  tasks.forEach(t => { const s = sched.get(t.id); if(s) t.sched = s; });
  assert.equal(S.drift(tasks).size, 0, "gắn xong khớp công thức, không báo lệch");
  const r = S.recalc(tasks, {taskId:"t21", set:{daysActual:4}});
  assert.equal(get(r,"t22").hdStart, "2026-07-12");
  assert.equal(get(r,"t22").deadline, "2026-07-15");
});

test("dropCycles: bỏ phụ thuộc con SS theo dòng nhóm tự tính", () => {
  const tasks = [T("i","I"), T("1","1", {daysActual:2, hdStart:"2026-01-01", sched:{pred:"i", type:"SS"}}), T("2","2", {daysActual:1, sched:{pred:"1"}})];
  const r = S.dropCycles(tasks);
  assert.deepEqual(r.dropped, ["1"]);
  assert.equal(r.tasks.find(t => t.id === "1").sched, undefined);
  assert.equal(r.tasks.find(t => t.id === "2").sched.pred, "1", "phụ thuộc không gây vòng giữ nguyên");
  assert.ok(S.recalc(r.tasks, null).ok);
});
