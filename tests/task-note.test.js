"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const vm = require("node:vm");
const bcrypt = require("bcryptjs");
const { createSqliteStore } = require("../backend/lib/store");

test("Note: nhân sự dự án ghi được, người ngoài bị chặn, đánh giá vẫn được bảo vệ", async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ngsi-note-test-"));
  const store = createSqliteStore(path.join(dir, "ptkt.db"));
  await store.init();
  const staff = [{name:"Nguyễn PM", alias:"pm-short"}];
  await store.upsertDoc("config/staff", "config", "staff", JSON.stringify({list:staff}), "test");
  const project = {id:"note-test", created_by:"creator", owner:"Nguyễn PM", pm:"pm-short", tm:"TM", am:"AM", acc:"ACC",
    tasks:[{id:"task-1", no:"1", dv:"Đầu việc", note:"ban đầu", eval:{dat:"giữ nguyên"}}]};
  await store.upsertDoc("projects/note-test", "projects", "note-test", JSON.stringify(project), "test");
  const password = "Test-only-8!";
  const accounts = {pm:"Nguyễn PM", tm:"TM", am:"AM", acc:"ACC", outsider:"Người ngoài", creator:null, unlinked:null, admin:null, head:null, deputy:null};
  for (const [username, staff_name] of Object.entries(accounts)) {
    await store.createUser({username, staff_name, display_name:username, role:["admin","head","deputy"].includes(username)?username:"member", pass_hash:bcrypt.hashSync(password, 4)});
  }
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1"); await once(socket, "listening");
  const port = socket.address().port; await new Promise(r=>socket.close(r));
  const child = spawn(process.execPath, ["backend/server.js"], {cwd:path.resolve(__dirname,".."),
    env:{...process.env, DB_CLIENT:"sqlite", DATA_DIR:dir, PORT:String(port), HOST:"127.0.0.1", JWT_SECRET:"test-secret-".repeat(4), COOKIE_SECURE:"false"}, stdio:["ignore","pipe","pipe"]});
  const exited = once(child, "exit");
  t.after(async () => {
    child.kill(); await exited; await store.close();
    assert.equal(path.dirname(dir), os.tmpdir());
    assert.ok(path.basename(dir).startsWith("ngsi-note-test-"));
    fs.rmSync(dir, {recursive:true, force:true});
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i=0; ; i++) {
    try { if ((await fetch(base+"/api/health")).ok) break; } catch {}
    if (i>=100) throw new Error("Máy chủ kiểm thử không khởi động");
    await new Promise(r=>setTimeout(r,50));
  }
  const cookies = {};
  for (const username of Object.keys(accounts)) {
    const res = await fetch(base+"/api/login", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password})});
    assert.equal(res.status,200); cookies[username]=res.headers.get("set-cookie").split(";")[0];
  }
  const request = (username, method, suffix, body) => fetch(base+"/api/doc/projects/note-test"+suffix, {
    method, headers:{"Content-Type":"application/json", cookie:cookies[username]}, body:JSON.stringify(body)});
  const read = async () => JSON.parse(await store.getDoc("projects/note-test"));
  for (const username of ["pm","tm","am","acc","creator","admin","head","deputy"]) {
    const res = await request(username,"PATCH","/task-note",{taskId:"task-1",note:username, eval:{dat:"không được ghi"}});
    assert.equal(res.status,204,username);
    assert.equal((await read()).tasks[0].note,username);
    assert.deepEqual((await read()).tasks[0].eval,project.tasks[0].eval);
  }
  for (const username of ["outsider","unlinked"]) {
    assert.equal((await request(username,"PATCH","/task-note",{taskId:"task-1",note:"cấm"})).status,403);
    assert.equal((await read()).tasks[0].note,"deputy");
  }
  assert.equal((await request("tm","PUT","",project)).status,403);
  const put = await read(); put.tasks[0].note="PUT note"; put.tasks[0].eval={dat:"cấm"};
  assert.equal((await request("pm","PUT","",put)).status,204);
  assert.equal((await read()).tasks[0].note,"PUT note");
  assert.deepEqual((await read()).tasks[0].eval,project.tasks[0].eval);
  const task = {...(await read()).tasks[0],note:"schedule note",eval:{dat:"cấm"}};
  const pv = await request("pm","POST","/schedule",{mode:"preview",task,scope:"self"});
  assert.equal(pv.status,200); const preview = await pv.json();
  assert.equal((await request("pm","POST","/schedule",{mode:"apply",task,scope:"self",baseVersion:preview.version})).status,200);
  assert.equal((await read()).tasks[0].note,"schedule note");
  assert.deepEqual((await read()).tasks[0].eval,project.tasks[0].eval);
  // Kiểm tra quyền giao diện dùng danh tính đăng nhập, kể cả tên viết tắt.
  const ctx = vm.createContext({S:{user:{username:"pm",staff_name:"Nguyễn PM"},canEdit:false,staff}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../frontend/js/core/constants.js"),"utf8"),ctx);
  ctx.p = {...project,owner:"khác"};
  assert.equal(vm.runInContext("canNoteProject(p)",ctx),true);
  ctx.S.user={username:"outsider",staff_name:"Người ngoài"};
  assert.equal(vm.runInContext("canNoteProject(p)",ctx),false);
});
