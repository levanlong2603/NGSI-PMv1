"use strict";
/* Trạng thái ứng dụng (S): dữ liệu đã tải + lựa chọn hiện tại của người dùng */
/* ================= state ================= */
const S = {
  db:null, user:null, canEdit:false, conn:"wait",
  staff:[], catalog:[], projects:[], weeks:[], feedback:[],
  view: (store("view")==="load" ? "input" : store("view")==="help" ? "exec" : store("view")) || "exec", period:"week", // "load" (Tải tuần) đã gộp vào "input" thành 1 tab; "help" (Hướng dẫn) đã bỏ → về Dashboard
  weekTab: store("view")==="load" ? "load" : "", exPr:"Tất cả",
  week: mondayOf(todayISO()),
  me: store("me") || "",
  typeFilter:"Đang triển khai", planSel:null, planQuery:"", dashQuery:""
};
