# CLAUDE.md – Ngữ cảnh dự án cho Claude Code

Ứng dụng web nội bộ **NGSI · Quản trị công việc và nguồn lực**, đang trong quá trình mở rộng phạm vi
từ công cụ riêng của **Phòng Kỹ thuật** sang công cụ dùng chung cho **Phòng Quản lý dự án (PM)**
(giao diện đăng nhập/đầu trang đã đổi tên "Technical Department"/"Phòng Kỹ thuật" →
"Project Management"/"Phòng quản lý dự án" – xem `frontend/index.html`, `frontend/js/core/server.js`).
Người dùng là người Việt: **giao diện, thông báo, chú thích code viết bằng tiếng Việt có dấu.**

## Bối cảnh nghiệp vụ Phòng Quản lý dự án (tham khảo khi mở rộng tính năng)
Công ty có 2 quy trình ISO chính thức mô tả nghiệp vụ PM (file nguồn do người dùng cung cấp, nằm
ngoài repo tại `D:\Documents\Code Web\Quy trinh QLDA dau thau v1.pdf` và
`...\Quy trinh QLDA trien khai v1.pdf` – **chưa** đưa vào repo, chỉ tóm tắt ở đây để code tính năng
PM sau này bám đúng thực tế):
- **Vai trò** xuất hiện trong quy trình: AM (Account Manager – phụ trách thầu/hợp đồng), PM (Project
  Manager – chủ trì đàm phán + triển khai), TM (Technical Manager – phụ trách kỹ thuật dự án), SE
  (Sales Engineer – lập BOM/kỹ thuật), TS/PS (hỗ trợ kỹ thuật/dự án bổ sung), TrP Quản lý dự án, TrP
  Kỹ thuật, TrP Kế toán, P.Hành chính, BTGĐ/TGĐ (lãnh đạo phê duyệt), QMR (quản lý chất lượng/khảo sát
  khách hàng cuối dự án). File báo cáo tiến độ mẫu (xem dưới) dùng thêm vai trò **ACC** (phụ trách kế
  toán dự án) đi kèm PM/TM/AM.
- **Quy trình đấu thầu (QT/QLDA-ĐT)**: Đánh giá năng lực tham gia thầu → Lập team thầu → Phân công
  (checklist BM-01-QLDA-ĐT) → Lập hồ sơ thầu (BOM, dự toán, hồ sơ khác) song song → Quản lý rủi ro
  thầu → Tập hợp/kiểm tra hồ sơ (3 lần kiểm độc lập: PM+TM → TS/PS → AM) → In đơn dự thầu/đóng gói/nộp
  thầu → Lưu hồ sơ nội bộ → Kết thúc dự án (họp rút kinh nghiệm, cập nhật Thắng/Thua thầu). Có nhánh
  riêng cho đấu thầu điện tử (hệ thống muasamcong/Viettel).
- **Quy trình triển khai (QT/QLDA-TK)**: Trình duyệt thực hiện hợp đồng → Đàm phán + trình duyệt hợp
  đồng bán (rà soát rủi ro theo từng phòng ban) → Họp khởi động dự án + phân công (checklist
  BM-16-QLDA-TK, báo cáo triển khai BM-08-QLDA-TK) → Quản lý chi phí (dự trù BM-01-QLDA-TK, tạm ứng/
  thanh toán) → Mua hàng → Nhập kho → Giao hàng → Triển khai + nghiệm thu kỹ thuật (PAC/FAC/ATP/TAC) →
  Đào tạo khách hàng → Nghiệm thu + thu hồi công nợ → Thanh lý hợp đồng (BM-10-QLDA-TK) → Thăm dò ý
  kiến khách hàng + họp kết thúc → Tổng kết + lưu hồ sơ → theo dõi bảo hành. Mỗi case/đầu việc có quy
  tắc phân quyền Full → hạ xuống Read theo tiến trình (SharePoint webpart).
- **Mẫu báo cáo tiến độ dự án thủ công hiện dùng** (Excel, 1 dự án/file, 3 sheet) – định hướng tham
  khảo cho tính năng Kế hoạch dự án/Báo cáo trong app:
  - `Infor`: cấu hình dự án (ngày bắt đầu, tên dự án, số/tên hợp đồng, PM/TM/AM/ACC, link site), chú
    giải màu trạng thái (Chưa bắt đầu/Đang thực hiện/Pending/Chờ nghiệm thu/Hoàn thành/khác) và chú
    giải Gantt (Kế hoạch HĐ gốc/HĐ điều chỉnh/Thực tế/Tuần hiện tại/Quá hạn/Sắp đến hạn), chú giải vai
    trò R(esponsible)/S(upport)/A(pprove)/N/A.
  - `NGSI`: bảng đầu việc phân cấp theo số thứ tự kiểu "A / I / 1 / 1.1" (chữ hoa = hạng mục lớn, số La
    Mã = hạng mục con, số thường = đầu việc), mỗi dòng có Trạng thái, Ưu tiên, Người phụ trách, Thời
    gian (ngày), và **4 cặp mốc ngày song song**: Kế hoạch theo HĐ (gốc) / Kế hoạch HĐ điều chỉnh /
    Kế hoạch dự kiến (nội bộ) / Kế hoạch thực tế – cho phép so sánh tiến độ cam kết hợp đồng với tiến
    độ nội bộ và thực tế cùng lúc (khác với Kế hoạch dự án hiện tại trong app chỉ có 1 cặp ngày kế
    hoạch + 1 trạng thái).
  - `Report`: báo cáo tổng hợp đọc lại từ sheet `NGSI` (đếm Tổng đầu việc/Hoàn thành/Đang thực hiện/
    Chưa bắt đầu/Pending/Sắp đến hạn/Quá hạn), tự nhận diện "mốc chính dự án" (milestones) theo quy
    tắc đánh số, và vẽ Gantt theo từng tuần (cột tuần thứ 2→CN, tô màu tuần hiện tại) suốt vòng đời dự
    án – đây là ý tưởng tham khảo nếu sau này làm Gantt theo tuần thay cho thanh tiến độ hiện tại.
  Lưu ý: đây là **tài liệu tham khảo nghiệp vụ**, không phải đặc tả kỹ thuật – không tự ý đổi mô hình
  dữ liệu `projects`/`weeks` hiện có theo mẫu này nếu người dùng chưa yêu cầu rõ.
  **Cập nhật**: 4 cặp mốc ngày song song ở trên **đã triển khai thật** trong `task` (xem mục "Quy ước bắt
  buộc" bên dưới), và Kế hoạch dự án có nút **"Nhập Excel"** (`planImportExcel()`, `plan.js`) đọc thẳng
  đúng 2 sheet `Infor`+`NGSI` này qua ExcelJS (tải lười giống `rpEnsureExcel()` ở `reports.js`, bản sao
  riêng tiền tố `plan` – xem bên dưới) để tạo 1 dự án mới kèm toàn bộ đầu việc, không cần gõ tay lại. Cột
  "ƯU TIÊN" của file **bị bỏ qua có chủ đích** (yêu cầu người dùng) – ưu tiên từng đầu việc lấy theo đúng
  `no` khớp trong "Khung mẫu" (`config/catalog`) của Loại dự án chọn ở form xác nhận, không theo giá trị
  trong file; không khớp được thì mặc định P2 ("Bình thường"). Sheet `Report` chưa dùng tới khi nhập.
  **Bộ công thức sheet `Report`** (đọc từ file mẫu thật `Bao cao tien do goi 04 BRCD_DPI_VT.xlsx`, người
  dùng cung cấp ngoài repo – chỉ tóm tắt ý tưởng công thức ở đây, **chưa** áp dụng vào app, xem mục "Hạng
  mục đã bị bỏ" bên dưới để biết lý do và điều kiện trước khi làm lại):
  - **KPI tổng quan** (dòng 7-9): đếm bằng `COUNTIFS` trên cột Trạng thái của `NGSI` (Hoàn thành/Đang thực
    hiện/Chưa bắt đầu/Pending) + 2 ô đếm Quá hạn/Sắp đến hạn dựa vào 1 cột phụ ẩn tính rủi ro từng dòng
    (xem "Rủi ro" bên dưới).
  - **Nhận diện "Mốc chính dự án" (milestones) tự động** (dòng 13+, cụm cột phụ ẩn `BP`→`CK`): giải được
    đúng bài toán "chữ cái thường vs số La Mã" mà app đã **bỏ cuộc** trước đây (xem "Hạng mục đã bị bỏ" ở
    mục "Khung mẫu" bên dưới) – không suy luận ngữ cảnh, mà quy ước cứng: liệt kê đủ bảng số La Mã hợp lệ
    (`I|II|III|...|XX`, so khớp chính xác) và **loại trừ thẳng "I"/"V"/"X" khỏi điều kiện "chữ cái đơn"**
    (coi 1 ký tự A-Z trừ I/V/X mới là "chữ cái tiêu đề", I/V/X luôn hiểu là số La Mã). 3 chế độ chọn được
    qua 1 ô cấu hình (`D14`, trong sheet `Report`, không phải `Infor`):
      - Rule 1: chỉ chữ cái đơn (trừ I/V/X) + số La Mã.
      - Rule 2 (file mẫu đang dùng): Rule 1 + số nguyên cấp 1 (`1`,`2`,`3`… loại `1.1`/`1.1.1`), **cộng
        thêm** luôn giữ toàn bộ nhánh có chữ "THANH TOÁN" trong nội dung dù ở cấp nào.
      - Rule 3: chỉ nhánh "THANH TOÁN" và các đầu việc con của nó.
  - **Chấm điểm rủi ro từng đầu việc** (cột phụ `CA`): 0 = chưa có ngày/không áp dụng, 1 = quá hạn (ngày
    kết thúc khả dụng gần nhất < hôm nay), 2 = sắp đến hạn (≤ hôm nay + `D90` ngày). `D90` (sheet `Report`)
    là **ngưỡng cảnh báo cấu hình được theo từng file** (file mẫu đặt 7 ngày) – khác app hiện tại đang
    **cố định cứng 14 ngày** (`days(today,t.deadline)<=14` ở `model.js`, xem "Sắp đến hạn").
  - **"Ngày khả dụng gần nhất"**: khi cần 1 mốc ngày đại diện cho đầu việc (để vẽ Gantt/tính rủi ro), luôn
    ưu tiên **Thực tế → HĐ điều chỉnh → Kế hoạch theo HĐ gốc** (cột nào có số trước dùng cột đó) – khớp
    đúng thứ tự ưu tiên 4 cặp ngày app đã có (`actStart/actEnd` → `adjStart/adjEnd` → `hdStart/deadline`,
    bỏ qua `expStart/expEnd` "dự kiến" vì sheet gốc không có cặp này).
  - **Gantt theo tuần** (cột `O`→`BN`, mỗi cột 1 tuần thứ 2→CN, nhãn tính từ `Infor!$C$3` lùi về thứ Hai):
    màu thanh Gantt **không** do công thức set giá trị ô mà hoàn toàn bằng **Conditional Formatting** (so
    màu nền theo điều kiện phủ tuần) – xanh dương = kế hoạch gốc, tím = điều chỉnh, xanh lá = thực tế,
    vàng = tuần hiện tại, đỏ/cam = quá hạn/sắp hạn (bảng rủi ro riêng, dùng đúng "ngày khả dụng gần nhất"
    ở trên). Cột trạng thái (D) và cột chênh lệch (M, "Trễ"/"Sớm"/"Đúng hạn") cũng tô màu bằng CF, không
    phải pill dựng sẵn.
  - **Đã áp dụng vào app (phần 1+2 trong 3 hướng từng liệt kê)** – xác nhận đúng với dữ liệu thật
    (`p-lb-08`/file Lydk: nhận diện sạch 6 hạng mục A-F không lẫn I/V, mode 2 giữ đúng toàn bộ nhánh
    "F. Thanh toán" tới tận cấp `1.1`/`2.2`):
      1. **"Hạng mục" (`t.phase`/`p._phases`) đã khôi phục**, LUÔN bật, không cấu hình được – gộp theo đúng
         1 dòng "chữ cái đơn" (`msLetterNo()`, `model.js`) gần nhất phía trước, loại trừ thẳng I/V/X khỏi
         "chữ cái đơn" (coi là số La Mã) thay vì suy luận ngữ cảnh như heuristic cũ đã bỏ. Khôi phục lại
         miễn phí 3 chỗ đã viết sẵn chờ dữ liệu: dải cảnh báo theo giai đoạn (`strip()`, `ui.js`), cột
         "Hạng mục" (`reports.js`), gộp theo hạng mục ở "Việc trong tuần" (`weekly-input.js`). Dự án có
         "No." không theo quy ước A/I/1/1.1 (gõ tự do) vẫn rơi về `phase=""`/"Khác" như cũ, không hỏng gì.
      2. **"Mốc chính dự án" (`p._milestones`) + ngưỡng "Sắp đến hạn" cấu hình được** qua
         `config/milestoneRule` (`{mode, dueSoonDays}`, mặc định `MILESTONE_RULE_DEFAULT` ở
         `constants.js` = mode 2/14 ngày – **giữ nguyên 14 ngày cũ** làm mặc định, không đổi hành vi
         sẵn có nếu chưa ai chỉnh) – panel "Cài đặt → Nhận diện mốc chính & cảnh báo"
         (`milestoneRulePanel()`/`milestoneRuleForm()`, `settings.js`, chỉ trưởng phòng sửa, rule `config`
         = `admin`) chọn mode 1/2/3 (seg, mô tả lấy từ `MILESTONE_RULE_MODES`) + ô số ngày. `model.js`:
         `msClassify(tasksInOrder, mode)` duyệt đúng thứ tự `p._tasks`, track `inPayment` (reset mỗi dòng
         chữ cái đơn mới, bật nếu tên dòng đó chứa "THANH TOÁN") y hệt công thức Excel `BT`/`BU`/`BW`.
         `msDate(t)` không còn dùng để dựng panel nữa (vẫn giữ hàm, không xoá) – `p._milestones` nay mang
         nguyên 4 cặp ngày song song của từng mốc (không chỉ "ngày khả dụng gần nhất"), để
         `planMilestonesPanel()` (`plan.js`) dựng lại ĐÚNG bảng "II. CÁC MỐC CHÍNH CỦA DỰ ÁN" của sheet
         `Report` trong file mẫu thật: cột STT/Hạng mục-Giai đoạn/Trạng thái/Ưu tiên/4 cặp Bắt đầu-Kết thúc
         (HĐ gốc/điều chỉnh/dự kiến/thực tế)/Chênh lệch (ngày)/Đánh giá – dùng lại style `.plan-grid` (đầu
         cột xanh, khoá khung 2 cột trái `plan-no`/`plan-dv`) và thẻ "No." màu theo chữ cái/La Mã
         (`msLetterNo()`/`msRomanNo()`) y hệt bảng đầu việc chính, không vẽ lại quy tắc riêng. "Chênh lệch
         (ngày)"/"Đánh giá" = `actEnd − deadline` (y hệt công thức `M17`=`K17−G17` của Excel: 0→"✓ Đúng
         hạn", âm→"✓ Sớm N ngày", dương→"⚠ Trễ N ngày"), chỉ tính khi có đủ cả 2 ngày. Ô "Trạng thái" tô
         nền theo đúng Conditional Formatting cột D của file mẫu (Hoàn thành=xanh lá nhạt, Đang
         làm=xanh dương nhạt, Tạm dừng=vàng) – **chỉ tô riêng ô này**, không tô cả dòng (đã thử tô cả dòng ở
         bảng đầu việc chính rồi bỏ theo phản hồi người dùng, xem mục "Nổi bật trực quan" bên dưới – 2 bảng
         là 2 quyết định độc lập, đừng đồng bộ ngược lại). Panel gấp/mở `<details>` "Mốc chính dự án" (hàm
         `planMilestonesPanel()`) dựng ra bảng này nhưng **đã bỏ khỏi `planDetail()`** (`plan.js`, không gọi
         `out += planMilestonesPanel(p)` nữa) theo yêu cầu người dùng – hàm vẫn giữ nguyên trong file (không
         xoá, phòng khi cần dùng lại), chỉ không còn hiện trên "Kế hoạch dự án" nữa. Đừng tự ý gọi lại hàm
         này nếu người dùng chưa yêu cầu.
      3. **Gantt theo tuần thay cho thanh tiến độ** – CHƯA làm (việc lớn nhất, để sau nếu được yêu cầu
         riêng): dựng lưới tuần + tô theo "ngày khả dụng gần nhất" + đổi màu theo CSS thay cho Conditional
         Formatting của Excel.
      Không tự ý đổi `msClassify()`/`msLetterNo()` sang suy luận khác khi chưa thống nhất với người dùng –
      đã kiểm chứng đúng với dữ liệu thật, đổi lại dễ quay về bug cũ (lẫn chữ cái/số La Mã).
  - **Nổi bật trực quan trên bảng đầu việc** (`planTaskRow()`, `plan.js`/`plan.css`), dùng thẳng
    `msLetterNo()`/`msRomanNo()` ở trên, không tự vẽ lại quy tắc riêng:
      - Dòng "No." là chữ cái đơn (A/B/C…, hạng mục lớn nhất) → tô teal đậm cả dòng + chữ đậm + thẻ "No."
        nền teal đặc chữ trắng (class `.plan-hdr-a`).
      - Dòng "No." là số La Mã (I/II/III…, hạng mục con) → nhẹ hơn: chỉ thẻ "No." nền teal nhạt + tên đầu
        việc in đậm màu teal, không tô nền cả dòng (class `.plan-hdr-r`) – để 2 cấp không trông giống hệt
        nhau.
      - Từng thử thêm **tô nền cả dòng theo Trạng thái** (đúng bảng chú giải màu ở sheet `Infor` của file
        mẫu thật) nhưng người dùng phản hồi **không muốn** – bảng quay lại nền trắng, **chỉ giữ** 2 mục ở
        trên (chữ cái/La Mã). CSS `.plan-st-new/-run/-pause/-done/-other` (`plan.css`) vẫn còn trong file
        (không xoá, phòng khi cần dùng lại) nhưng **không còn được gắn vào `<tr>`** ở `planTaskRow()` nữa –
        đừng tự ý gắn lại nếu người dùng chưa yêu cầu.

## Kiến trúc
- **Bố cục**: `backend/` máy chủ (server.js, lib/store.js, seed/, scripts/) · `frontend/` giao diện tĩnh (index.html, css/, js/) · `deploy/` systemd + Nginx + script vận hành. Frontend và backend tách thư mục nhưng **cùng một tiến trình Node**: Express phục vụ `frontend/` dưới dạng tệp tĩnh (`backend/server.js`), không có bước build và không có `package.json` riêng cho frontend.
- **Máy chủ**: `backend/server.js` – Node.js ≥ 20.6, Express 4. Truy cập CSDL **chỉ qua `backend/lib/store.js`** (hàm async: getDocs, getDoc, upsertDoc, deleteDoc, users…, audit, listAudit). `DB_CLIENT=mariadb` (máy chủ thật, mysql2) hoặc `sqlite` (máy lập trình, better-sqlite3) – mọi tính năng mới phải chạy được trên cả hai. Route async bọc bằng `A(async (req,res)=>…)`.
- **Dữ liệu**: bảng `docs` (MariaDB: `body` LONGTEXT chứa JSON, utf8mb4) lưu tài liệu JSON theo đường dẫn `<collection>/<id>`. Collections hiện có: `config` (`config/staff`, `config/catalog`, `config/kpiCriteria`), `projects`, `weeks`, `feedback`, `kpiNote`. Quyền ghi khai báo trong hằng `RULES` ở `backend/server.js`:
  - `admin`: chỉ trưởng phòng ghi/xoá.
  - `member`: mọi tài khoản đã đăng nhập ghi/xoá.
  - `own-week`: trưởng phòng ghi tất cả; nhân viên chỉ ghi dữ liệu tuần của chính mình, và chỉ tuần **hiện tại trở đi** (tuần cũ đã khoá với nhân viên, chỉ trưởng phòng sửa được — xem `mondayOfToday()`).
  - `own-project`: trưởng phòng ghi tất cả (kể cả tạo dự án mới); nhân viên sửa được nếu là người tạo (`created_by`) hoặc là TM/SE của dự án, nhưng chỉ người tạo mới xoá được cả dự án. Trường `task.eval`/`task.note` (đánh giá khi hoàn thành, ghi chú trưởng phòng) chỉ trưởng phòng ghi được dù PUT cả dự án.
  - `own`: ai cũng tạo mới được; sửa/xoá thì chỉ người tạo (`created_by`, máy chủ ghi) hoặc trưởng phòng (dùng cho `feedback`).
  Bảng `users`, `audit` (ghi vết mọi lần ghi/xoá, hiện không có UI hiển thị lại nhưng vẫn ghi).
- **Giao diện**: HTML/CSS/JavaScript thuần, **không build, không framework, không npm cho frontend**. Các file `.js` là *classic script* chia sẻ phạm vi toàn cục, nạp theo thứ tự trong `frontend/index.html`; `js/main.js` luôn cuối cùng.
- **Luồng dữ liệu**: máy chủ → `S` (state, `core/state.js`) → `derive()` tạo `M` (model đã tính, `core/model.js`) → hàm `viewXxx()` trả về chuỗi HTML → `render()` gán vào `#main`. Người dùng bấm phần tử có `data-act` → `ACTIONS[act]` hoặc `core/events.js` → `write()`/`remove()` (`core/data.js`) → máy chủ phát sự kiện SSE → client tải lại collection → `schedule()` vẽ lại.

## Màn hình hiện có
Lõi (`frontend/js/views/`): Dashboard (`exec-dashboard.js`), Tổng quan dự án – chỉ xem (`project-overview.js`),
Tải tuần (`weekly-load.js`), Nhập theo tuần (`weekly-input.js`), Kế hoạch dự án (`plan.js`), Cài đặt
(`settings.js`), Hướng dẫn (`help.js`). Module mở rộng (`frontend/js/modules/`, nạp sau lõi): Góp ý
(`feedback.js`, collection `feedback`), Báo cáo (`reports.js`, xuất Excel/PDF, không lưu dữ liệu riêng –
chỉ đọc lại `M`/`S`; 3 tab ngang hàng: "Báo cáo tuần" – theo dữ liệu Nhập theo tuần/Tải tuần (lọc Loại dự
án/Nhân sự/Tuần), bảng chi tiết gộp ô (rowspan, class `.rp-sec-grn`) theo cấp Người thực hiện (chỉ khi xem
"Tất cả nhân sự") → Dự án → Hạng mục → Đầu việc, cột "Chi tiết thực hiện" lấy từ việc đã làm trong tuần
(`e.work`); "Báo cáo dự án" – 1 dự án cụ thể theo kỳ tuần/tháng, dải KPI + bảng "Danh sách đầu việc" gộp ô
theo Hạng mục, cột "Chi tiết thực hiện" lấy "Nội dung chi tiết" tĩnh của đầu việc (`t.detail`) – khác tab
Báo cáo tuần (không có phần nhân sự); "Báo cáo tổng hợp dự án" – toàn bộ dự án đang chạy theo kỳ tuần/
tháng, dải KPI + đúng 1 bảng "Tình hình các dự án" theo đúng mẫu Excel giấy của phòng (STT/Tên dự án/Người
phụ trách/SE/Mốc HĐ/Tiến độ hiện tại/Vướng mắc/Đề xuất, đầu cột tô vàng, class `.rp-sec-xl`), không có
bảng tải nhân sự riêng. Cả 2 bảng gộp ô (`.rp-sec-grn`/`.rp-sec-xl`) đều không có thanh tiêu đề tối phía
trên như kiểu `.rp-sec-h` cũ. Quá hạn/Sắp hạn/Rủi ro ở 2 tab theo kỳ luôn tính theo tình trạng hiện tại
lúc xuất, không truy hồi lại đúng thời điểm cuối kỳ vì không lưu ảnh chụp tiến độ lịch sử – chỉ "Xong
trong kỳ" lọc thật theo kỳ đã chọn), KPI & Năng lực (`kpi.js`, Giai đoạn 1 – xem chú thích đầu file để
biết phạm vi/giới hạn). Thứ tự nạp trong `index.html` quyết định thứ tự hiện trên menu trái.

## "Khung mẫu" đầu việc chuẩn (`config/catalog`) – bảng phẳng kiểu Excel, không tự suy luận lồng cấp
Mỗi mục catalog là 1 dòng **phẳng**, độc lập: `{id, type, no, name, pr, role, result, evidence}` (2 trường
cuối `result`/`evidence` vẫn còn trong schema vì dữ liệu cũ có thể có, nhưng **không còn ô nhập** ở
`catFlatTable()` và **không còn nơi nào đọc lại** – đã bỏ khỏi `taskForm()`/`openInfo()` ở `plan.js` theo
yêu cầu người dùng, vì tồn tại mà không có đường nhập liệu nên luôn hiện "–"; đừng thêm lại cách đọc 2
trường này nếu chưa có UI nhập cho nó).
`no` là chuỗi tự do người dùng gõ (vd `"A"`, `"I"`, `"1"`, `"1.1"`) copy đúng số thứ tự trong file Excel
giấy của phòng – **không** mã hoá/lồng cấp trong `name` như các bản trước đó (đã bỏ hẳn cơ chế
`parseCat()`/`buildCatTree()` từng dùng); kể cả dòng "hạng mục" (vd `no:"A"`, `name:"KÝ HỢP ĐỒNG"`) cũng là
1 dòng catalog bình thường như dòng đầu việc lá, không có khái niệm cha/con trong dữ liệu. Sửa trực tiếp
trên bảng tại Cài đặt → "Chọn khung" (`catFlatTable()`, `settings.js`): mỗi ô tự lưu khi rời ô (`input`)
hoặc đổi lựa chọn (`select`) qua `data-act="catfield"` (xử lý ở `core/events.js`, gọi `catFieldSave()`);
nút `+`/`✕` mỗi dòng (`ACTIONS["addcatrow"]`/`["delcatrow"]`) chèn/xoá ngay, không qua form popup.
- `pr` ("Cao"/"Bình thường") và `role` ("", "PM", "TM", "AM", "ACC" – `CAT_ROLES`, `constants.js`): khi tạo
  dự án mới (`projectForm()`, `plan.js`), **mọi** dòng catalog của loại dự án đó được copy 1-1 thành đầu
  việc thật (`no`→`task.no`, `name`→`task.dv`, `pr` Cao/Bình thường → `task.pr` Cao/Bình thường), người phụ trách
  (`task.owner`) lấy theo nhân sự được gán đúng `role` đó trên dự án (`p.pm`/`p.tm`/`p.am`/`p.acc` – 4
  trường mới, **gõ tay** (`type:"text"`, không phải `select`) trong `projectForm()`/`planImportConfirm()` –
  nhiều dự án nhập từ Excel có PM/TM/AM/ACC là tên viết tắt/tài khoản (vd "Lydk") không khớp tên đầy đủ
  trong `config/staff`, `select` sẽ luôn hiện trống không gõ được. **Đã thử đổi 4 ô này sang `<select>` lọc
  theo `alias` một lần (`roleOpts(curVal)`)** nhưng người dùng phản hồi muốn quay lại ô nhập tay – dữ liệu
  dự án thật đang dùng nhiều biến thể tên viết tắt không khớp hết `alias` cấu hình sẵn trong `config/staff`
  (vẫn báo "chưa khớp nhân sự" dù nhập đúng), nên **đã revert về `type:"text"` như cũ**, đừng tự ý đổi lại
  sang `select`/`search` cho 4 trường này nếu chưa được yêu cầu lại; `task.owner` ở `taskForm()` cũng chọn
  theo đúng 4 chuỗi này (`ownerOpts`, so khớp chuỗi thuần, không cần khớp `S.staff`)), **không** liên quan
  `p.owner`/`p.se` cũ vẫn giữ nguyên cho quyền ghi `own-project`/`projectAssigned()`).
- **"Hạng mục" (`task.phase`) ĐÃ KHÔI PHỤC** (xem mục "Bộ công thức sheet Report" ở trên) – từng thử suy
  luận tự động bằng cách duyệt `p.tasks` và coi `no` thuần 1–2 chữ cái (vd `"A"`) là dòng mở hạng mục mới,
  nhưng số La Mã (`"I"`, `"II"`…) cũng thuần chữ cái nên **không phân biệt được** với chữ cái dùng làm mã
  hạng mục bằng text thuần tuý — thử trên dữ liệu thật đã từng gom sai hàng loạt đầu việc vào nhầm hạng
  mục, nên có giai đoạn đã **bỏ hẳn** (`p._phases` luôn `[]`). Nay dùng đúng quy tắc đọc được từ file mẫu
  thật của phòng để fix: `msLetterNo()` (`model.js`) loại trừ thẳng `"I"/"V"/"X"` khỏi điều kiện "1 chữ
  cái" (coi là số La Mã, không phải mã hạng mục) thay vì đoán theo ngữ cảnh – không còn mơ hồ. `p._phases`/
  `t.phase` tính lại trong `derive()`, dải cảnh báo theo giai đoạn (`strip()`, `ui.js`) và cột "Hạng mục" ở
  `reports.js` hiện đúng dữ liệu thật thay vì rỗng/"Khác" cố định. `taskPhase(p, taskId)` (`model.js`) vẫn
  giữ nguyên chữ ký, giờ trả đúng `t.phase` thật. **Đừng** đổi lại `msLetterNo()` sang suy luận khác (vd
  thêm điều kiện độ dài `no`) nếu chưa kiểm chứng lại với dữ liệu thật – bài học cũ vẫn còn giá trị: số La
  Mã nhiều ký tự (II, III…) không mơ hồ, chỉ 3 ký tự đơn "I"/"V"/"X" mới cần quy ước cứng này.
  - **`t.pathNo`** (`model.js`, `derive()`, tính ngay cạnh `t.phase` – dùng chung `curPhaseCode` + thêm
    tracker `curRoman`): đường dẫn phân cấp ĐẦY ĐỦ kiểu "E.V.1"/"E.V.1.1" (chữ cái.La Mã.số…, khác `t.phase`
    chỉ dừng ở cấp chữ cái) – gặp dòng chữ cái đơn thì reset (bỏ La Mã), gặp La Mã thì nối sau chữ cái, gặp
    số thường/thập phân thì nối `t.no` vào cuối chuỗi hiện có. Trước đây chỉ tính RIÊNG trong `taskOpts()`
    (ô "search" chọn Đầu việc ở Nhập theo tuần, `weekly-input.js`) để hiện gợi ý kiểu "E.V.1. Đổ tải"; nay
    chuyển lên `derive()` tính 1 lần cho mọi đầu việc, dùng lại ở cả `entryTaskLabel(e)` (`weekly-input.js`,
    dùng cho `inputRow()`/`inputAllRow()` – dòng "Việc trong tuần" hiện tên kèm đường dẫn y hệt lúc chọn
    trong ô search, theo yêu cầu người dùng) lẫn `taskOpts()` (đọc thẳng `t.pathNo` từ `p._tasks`, không tự
    duyệt lại). **`taskPathNo(p, taskId)`** (`model.js`, viết cùng chỗ với `taskPhase()` có sẵn) là cách
    **BẮT BUỘC** để đọc `pathNo` từ `M.entries` – `e.ref.t` ở đây là task THÔ lấy qua `taskMap` (dựng từ
    `p.tasks` TRƯỚC khi vòng lặp enrich `p._tasks` chạy trong `derive()`, xem bình luận tại `taskMap`),
    nên **`e.ref.t.pathNo` luôn `undefined`** – lần đầu viết `entryTaskLabel()` đọc thẳng field này nên bị
    rỗng y hệt bug cũ `e.ref.t.phase` mà `taskPhase()` từng phải vá (comment cũ ở đó), phải sửa lại tra qua
    `taskPathNo(e.ref.p, e.ref.t.id)` mới ra đúng giá trị. Nơi nào cần hiện "đường dẫn phân cấp" của 1 đầu
    việc mà chỉ có `M.entries`/`e.ref` trong tay (không phải `p._tasks`) thì PHẢI dùng `taskPathNo()`, đọc
    thẳng `t.pathNo` chỉ an toàn khi `t` chắc chắn lấy từ `p._tasks` (như trong `taskOpts()`).
- Màn "Kế hoạch dự án" (`planTreeRows()`, `plan.js`) và "Tổng quan dự án" hiện đầu việc **phẳng hoàn toàn**
  theo đúng thứ tự `p.tasks` (không gấp/mở theo hạng mục nữa, theo đúng yêu cầu người dùng) – `t.no` chỉ
  hiện như 1 nhãn nhỏ đầu dòng (`planTaskRow()`).
- Đổi/xoá dòng khung mẫu của 1 loại dự án **không** ảnh hưởng dự án đã tạo trước đó (`task.dv`/`task.no`
  được copy nguyên văn lúc tạo, độc lập với catalog) – chỉ ảnh hưởng dự án tạo **mới** sau này (`projectForm()`
  sinh đầu việc từ khung mẫu lúc tạo dự án). Ô "Đầu việc" trong `taskForm()` (thêm/sửa 1 đầu việc) là **ô
  nhập tự do** (`type:"text"`, không còn `<select>` tra theo khung mẫu như trước – bỏ theo yêu cầu người
  dùng, vì đầu việc PM tự thêm/chèn ngoài khung lúc dự án đã chạy thường không khớp tên có sẵn trong khung
  mẫu). `cOf(t.dv)` (hàm tra khung mẫu theo tên đầu việc, từng dùng để hiện "Kết quả đầu ra"/"Chú thích"
  tham khảo trong `info` của `taskForm()`) **đã bỏ hẳn** cùng với 2 dòng hiển thị đó (theo yêu cầu người
  dùng – không có UI nhập `result`/`evidence` ở Khung mẫu nên 2 ô luôn hiện "–", vô nghĩa).

## Công thức Workload / Capacity (`frontend/js/core/constants.js`, `model.js`)
- **Đầu việc theo kế hoạch** (`p._tasks`, Kế hoạch dự án): `Workload (giờ) = QM_HOURS[Quy mô] ×
  PT_MULT[Độ phức tạp]` (hàm `wlOf()`); thiếu Độ phức tạp → hệ số mặc định 1,0 (không chặn). Quy mô
  **không còn bắt buộc chọn** ở `taskForm()` (bỏ `required:true` theo yêu cầu người dùng – nhiều đầu việc
  trong file mẫu thật, nhất là dòng hạng mục, không có Quy mô) – thiếu Quy mô → `wlOf()` trả `null`, ô
  "Workload" hiện "–", không chặn lưu; mẫu số tiến độ dự án vẫn không bị lệch nhờ dùng trọng số `t.wl ?? 1`
  (xem ngay dưới), không cần script chuyển đổi dữ liệu cũ. Đây là ước lượng/kế hoạch.
- **Một lượt nhập trong tuần** (Nhập theo tuần): `Workload (giờ) = e.hours (ô "Thời gian thực hiện", giờ
  thật người nhập tự gõ) × PT_MULT[e.pt]`. `e.qm` (ô "Quy mô") ở màn này chỉ còn là ước lượng/tham khảo,
  **không** tham gia công thức. Chọn Độ phức tạp trong tuần vẫn đồng bộ ngược về `t.pt` của đầu việc trong
  Kế hoạch dự án khi lưu (dùng chung cho ước lượng kế hoạch ở trên). Các lượt nhập cũ chỉ có `e.qm` (từ
  trước khi có ô giờ thật) đọc lại qua `wlOf(e.qm, e.pt)` để không đổi dữ liệu lịch sử.
- `Capacity (giờ/tuần) = Giờ/tuần × (1 − % họp, phát sinh) × Hệ số năng lực` (`model.js`, `derive()`).
  Hệ số năng lực **chỉ nhân ở Capacity**, Workload không chia lại cho hệ số (tránh tính trùng).
  **`staff.factor` (Hệ số năng lực) đổi từ 4 nấc `1/2/3/4` sang 5 cấp độ `0,8/1/1,2/1,5/2`** (chốt sau 2
  lần chỉnh – lần đầu thử dãy đều `0,8/1,1/1,4/1,7/2,0`, người dùng yêu cầu đổi lại đúng dãy `0,8/1/1,2/1,5/2`
  cho khớp luôn cả `PT_MULT` bên dưới) – `FACTOR_LEVELS` (`settings.js`, cạnh `staffForm()`), mỗi mức kèm
  mô tả theo khung đánh giá năng lực chung của phòng (Cấp 1 Biết/Cơ bản → Cấp 5 Chuyên gia, hiện trong
  `hint` khi sửa nhân sự). Lưu thẳng giá trị số vào `staff.factor`, nhân trực tiếp vào Capacity – giống hệt
  cách `p.difficulty` lưu thẳng giá trị ở `projectForm()` (`plan.js`), không qua bảng tra riêng. **Lý do
  đổi**: thang cũ dùng thẳng 1–4 làm hệ số nhân nghĩa là nhân sự "hệ số 4" có Capacity gấp 4 lần người "hệ
  số 1" – quá lệch thực tế, chưa từng rà lại từ khi có trường này. Gợi ý theo số năm kinh nghiệm (`years`)
  cũng đổi ngưỡng tương ứng: &lt;1 năm→0,8 · 1–2 năm→1 · 2–4 năm→1,2 · 4–6 năm→1,5 · ≥6 năm→2 (vẫn chỉ là
  gợi ý, trưởng phòng tự chọn lại). **Đã chạy script chuyển đổi 1 lần** cho CSDL lập trình cá nhân (sqlite)
  khi còn ở dãy số trung gian, ánh xạ theo thứ hạng tương đối: `{1:0.8, 2:1.1, 3:1.7, 4:2.0}` – mọi nhân sự
  hiện có đều rơi vào mức `0,8` (thấp nhất), **vẫn là giá trị hợp lệ ở dãy số mới** nên không cần migrate
  lại lần 2. **Chưa chạy script này trên CSDL máy chủ thật** (`ngsi` trên 192.168.11.205) vì lúc đổi chưa
  có nhân sự thật nào được nhập – nếu sau này phát hiện có `staff.factor` cũ dạng số nguyên 1–4 trên đó,
  ánh xạ về đúng dãy mới (`{1:0.8, 2:1, 3:1.2, 4:1.5}`, không có giá trị cũ nào map thẳng tới `2`) trước
  khi tin số liệu Capacity.
  **`PT_MULT` (hệ số Độ phức tạp đầu việc, `constants.js`) dùng chung đúng dãy số trên: `{1:0.8, 2:1, 3:1.2,
  4:1.5, 5:2}`** theo yêu cầu người dùng (khớp hẳn thang Hệ số năng lực, dễ so sánh) – **GIỮ NGUYÊN**
  `PT_HINT` (nhãn "Đơn giản/Quen thuộc/Cần chuyên môn/Cần chuyên gia/Chưa có tiền lệ"), chỉ đổi con số
  nhân. **Không cần script chuyển đổi dữ liệu** (khác hẳn `staff.factor` ở trên) vì `task.pt`/`e.pt` chỉ
  lưu CẤP ĐỘ (số nguyên 1–5), số nhân thật tra qua `PT_MULT[pt]` mỗi lần tính workload (`wlOf()`,
  `model.js`, `kpi-calc.js`) – đổi bảng tra là áp dụng ngay cho toàn bộ dữ liệu cũ lẫn mới, không có giá
  trị cũ nào cần sửa lại.
- Tiến độ dự án (`p._prog`, `p._phases`, `planStat()`) dùng trọng số `t.wl ?? 1` (không phải `t.wl || 0`)
  để đầu việc thiếu Quy mô không "biến mất" khỏi mẫu số gây tiến độ ảo 100%.
- `planIsDone(p)` dựa vào `p._allDone` (mọi đầu việc chưa Hủy đều Hoàn thành), không dùng `p._prog===1`.
- `t.doers` (`model.js`): người "Thực hiện" hiển thị = người được gán sẵn (`t.collab`) **hợp** người đã
  nhập tuần cho đúng đầu việc đó ở **tuần gần nhất có dữ liệu** (không tính mọi tuần từ trước tới giờ).

## Cách mở rộng (ưu tiên, không sửa lõi)
- Màn hình mới: tạo `frontend/js/modules/<ten>.js`, gọi `registerView({id,label,iconSvg,render})`.
- Nút bấm: `ACTIONS["ten-hanh-dong"] = (el, e) => {...}` và dùng `data-act="ten-hanh-dong"` trong HTML.
- Dữ liệu mới: thêm dòng vào `RULES` trong `backend/server.js`; client nghe bằng `ON_SESSION.push(db => db.collection("x").onSnapshot(snap => {...; schedule();}))`.
- Form: dùng `openForm({title, values, fields, onSave, onDelete})` (kiểu field: text, password, number, date, textarea, select, seg, check, heading, badge (hiển thị tĩnh dạng `.pill`, không phải ô nhập – dùng `text`/`tone`, không đọc/ghi `vals`), images (dán/chọn ảnh, xem mục Góp ý ở "Quy ước bắt buộc"), search (gõ để lọc trong danh sách DÀI thay cho `select` phải cuộn tìm – `options` PHẲNG `[[giá trị,nhãn],…]`, không gom nhóm như `select`; vd "Đầu việc" ở Nhập theo tuần, `weekly-input.js`. Input hiện chữ + dropdown gợi ý tối đa 200 dòng, Enter chọn gợi ý đầu tiên, rời ô mà chưa bấm chọn thì tự trả lại đúng chữ của lựa chọn đang lưu – không để chữ gõ dở lọt vào `vals`. So khớp qua `searchNorm()` – **bỏ dấu + hạ chữ thường cả 2 vế** (không phải so nguyên văn có dấu), vừa cho gõ không cần đúng dấu vừa tránh kẹt gợi ý khi gõ tiếng Việt có dấu (một số bộ gõ hệ thống ghép dấu xong không bắn lại sự kiện `input`, nên có thêm lưới an toàn nghe `compositionend` để lọc lại đúng giá trị cuối). Code ở `openForm()`, `core/ui.js`, CSS `.search-field`/`.search-dd` ở `base.css`); tuỳ chọn half, required, hint, onChange, placeholder (riêng cho `search`).
- Khai báo `<script src="js/modules/<ten>.js">` trong `index.html` trước `js/main.js`. CSS riêng: `frontend/css/<ten>.css`.
- Muốn thêm mục menu ở vị trí cụ thể (không phải đầu/cuối danh sách chính): tự thao tác mảng `VIEWS` toàn
  cục sau khi `registerView`/gán trực tiếp (xem `reports.js`, `kpi.js` chèn ngay sau 1 mục có sẵn bằng
  `VIEWS.splice(VIEWS.findIndex(v=>v.id==="...")+1, 0, {...})`).
- Thư viện ngoài nặng (xuất Excel/PDF…): **không** thêm `<script>` tĩnh trong `<head>` (làm chậm mọi trang) –
  tải "lười" bằng cách chèn `<script>` CDN động chỉ khi người dùng thực sự cần (xem `rpLoadScript()` /
  `rpEnsureExcel()`/`rpEnsurePdf()` trong `reports.js`). Vẫn không có bước build; chỉ thêm CDN (jsDelivr)
  cho thư viện cần file nhị phân thật: ExcelJS cho `.xlsx` (dựng bảng thật, gộp ô bằng `ws.mergeCells`);
  PDF dùng html2canvas + jsPDF – chụp đúng khối DOM `#rp-print` đang hiển thị thành ảnh rồi dán vào từng
  trang A4 (`rpExportPdf()`), đảm bảo PDF luôn giống hệt bảng xem trước trên web, không tự dựng lại bảng.

## Quy ước bắt buộc
- Luôn `esc()` mọi dữ liệu người dùng trước khi chèn vào HTML.
- Đặt tiền tố cho hàm/hằng của module (vd `riskForm`, `RISK_LEVELS`) – mọi file chung phạm vi toàn cục, trùng tên `const` sẽ lỗi trang.
- Màu sắc dùng biến CSS trong `frontend/css/theme.css` (`var(--teal)`, `var(--bad)`…), hỗ trợ chế độ tối.
- Lớp CSS có sẵn: `.head .sub .panel .panel-h .panel-b .band .stat .btn .btn.primary .btn.ghost .btn.danger .pill.(ok|warn|bad|info|mute) .tbl-wrap table tr.click .empty .row2 .grid2 .chips .chip-btn .seg-in .weeknav .hbar .data-ico .data-t`.
- Nhân sự (`S.staff`, `config/staff`) có các trường tuỳ chọn cộng dồn qua nhiều lần mở rộng: `years` (kinh
  nghiệm, chỉ gợi ý), `factor` (hệ số năng lực, 5 mức cố định), `title` (chức danh, dùng cho KPI & Năng
  lực Giai đoạn 2), `alias` (**Tên viết tắt**, thêm mới – vd "Lydk" cho "Đỗ Khánh Ly") – tài liệu cũ
  thiếu trường nào thì coi như rỗng/0, không cần script chuyển đổi.
  - **`alias` dùng để LIÊN KẾT tên viết tắt với Họ tên đầy đủ**: dữ liệu dự án (PM/TM/AM/ACC gõ tay ở
    `projectForm()`, "Phụ trách"/"Thực hiện" của đầu việc) nhiều khi lưu tên viết tắt thay vì Họ tên đầy đủ
    trong `config/staff` (đặc biệt dự án nhập từ Excel – xem file mẫu thật của phòng). Không liên kết thì
    nhân viên có thể KHÔNG thấy được dự án/đầu việc của chính mình khi chọn "Tôi là" (so `p.owner`/
    `task.owner` với Họ tên đầy đủ thất bại vì lệch tên), và trưởng phòng/hệ thống tính sai KPI/quyền sửa.
  - Cài ở Cài đặt → "Nhân sự & capacity" (`staffForm()`, `settings.js`, ô "Họ tên" + "Tên viết tắt" nằm
    chung 1 hàng – `half:true` cả 2). Hiện kèm Họ tên trong bảng dạng pill nhỏ.
  - **`suggestAlias(fullName)`** (`settings.js`) tự gợi ý "Tên viết tắt" ngay khi rời ô "Họ tên" (sự kiện
    `change`/blur) NẾU ô "Tên viết tắt" đang trống – vẫn sửa tay đè lên được bình thường, không tự gán lại
    nếu ô đã có chữ. Quy tắc: lấy từ cuối của Họ tên (tên gọi, bỏ dấu) làm gốc + nối thêm chữ cái đầu (bỏ
    dấu, viết thường) của từng từ còn lại theo đúng thứ tự họ→đệm, "Đ"/"đ" bỏ dấu thành "D"/"d". **Đã kiểm
    chứng khớp đúng 3/3 ví dụ thật** lấy từ file mẫu Excel của phòng: "Tạ Thị Mai Huyền"→"Huyenttm" (AM dự
    án DLP 18), "Lưu Ánh Uyên"→"Uyenla" (PM dự án DLP 18), "Đỗ Khánh Ly"→"Lydk" (Phụ trách dự án LB 08) –
    **lưu ý: "Lydk" là của "Đỗ Khánh Ly", KHÔNG phải "Đặng Hương Ly"** (đã từng gán nhầm 1 lần ở phiên làm
    việc trước, đã sửa lại – xem kỹ trước khi suy luận theo tên viết tắt nếu chưa chắc đúng người). Đã chạy
    1 lần cho toàn bộ nhân sự hiện có trong CSDL theo đúng quy tắc này, vẫn sửa tay lại được qua UI.
  - **Có 2 bản `canonStaffName(raw)`** (tra `raw` có khớp alias của nhân sự nào không, khớp thì trả Họ tên
    đầy đủ, không khớp thì trả nguyên `raw`) – **phải sửa đồng thời cả 2 nếu đổi logic**:
    - `frontend/js/core/constants.js` (đồng bộ, đọc thẳng `S.staff`) – dùng ở `projectAssigned()`,
      `weekly-input.js` (`assigned()` – dự án nào nhân viên thấy được), `exec-dashboard.js` (lọc "Cá nhân"),
      `model.js` (`capOf` đăng ký Capacity theo cả 2 tên; gộp `t.collab` vào "Thực hiện" tránh 1 người hiện
      2 dòng khác tên).
    - `backend/server.js` (**async**, tự đọc `config/staff` từ CSDL mỗi lần gọi) – dùng ở `canWrite()`
      (quyền sửa/xoá dự án `own-project`, so `existing.owner` với `user.staff_name`) và route PATCH
      `/api/doc/projects/:id/task-pt`. Đây là **chặn quyền thật sự** (không chỉ UI) nên bắt buộc có bản
      backend riêng, không thể chỉ sửa phía trình duyệt.
    - `frontend/js/modules/kpi-calc.js` chạy được cả Node (`backend/lib/kpi.js`) lẫn trình duyệt nên
      **không gọi được 2 hàm trên** (không có `S` trên Node) – tự dựng alias map riêng ngay trong
      `prepare(data)` từ `data.staff` (đã có `s.alias`), canon hoá `owner`/`collab`/`pOwner` ngay lúc dựng
      `ix.tasks` để `compute()`/`work()` so khớp đúng người.
  - **Không đổi chữ hiển thị** ở bất kỳ đâu khác (bảng/thẻ dự án vẫn hiện nguyên "Phụ trách" đã gõ/nhập, vd
    vẫn hiện "Lydk" chứ không tự đổi thành "Đặng Hương Ly") – `alias` chỉ phục vụ SO KHỚP định danh (quyền,
    Capacity, KPI), không phải chuẩn hoá nội dung hiển thị. Ngoại lệ duy nhất: cột "Thực hiện" ở `model.js`
    (gộp `t.collab` theo tên chuẩn để không hiện trùng 1 người thành 2 dòng khác tên trong cùng 1 ô).
- Dự án (`projects/<id>`) có 2 trường tường thuật `milestones` (Mốc hợp đồng), `situation` (Tình hình/
  vướng mắc chung) – **không còn hiện** ở Kế hoạch dự án/Tổng quan dự án (bỏ theo yêu cầu người dùng, 2 ô
  này là tàn dư thiết kế cũ "Phòng Kỹ thuật"), chỉ còn sửa được ở form "Sửa thông tin dự án" (`projectForm`,
  plan.js) và đọc lại ở Báo cáo → Báo cáo tổng hợp dự án (cột "Mốc HĐ"/"Vướng mắc", `reports.js`) – dữ liệu
  cũ của dự án có sẵn vẫn giữ nguyên, đừng xoá trường hay bớt field khỏi `projectForm`/`reports.js`. 2 trường
  thêm sau, nhập chung 1 form `projectForm` nhưng **chỉ hiện ở Báo cáo → Báo cáo tổng hợp dự án**, không hiện
  lại ở thẻ dự án: `progress` (Tiến độ hiện tại), `proposal` (Đề xuất) – cố ý tách theo yêu cầu người dùng,
  đừng gộp lại khi sửa; và 4 trường vai trò `pm`/`tm`/`am`/`acc` (tên nhân sự, ô text gõ tay trong `projectForm`)
  dùng để tự gán người phụ trách cho đầu việc sinh từ khung mẫu theo `catalog.role` (xem mục "Khung mẫu" ở
  trên). `owner` (trường duy nhất `RULES`/`projectAssigned()` server.js/constants.js dùng để tính quyền ghi
  `own-project`) có **ô "Người phụ trách" riêng** (`type:"select"`, options lấy thẳng từ `S.staff` theo Họ
  tên đầy đủ – `staffOpts` trong `projectForm()`, `plan.js`) đặt ngay dưới "Loại" – từng bị bỏ 1 lần (lý do
  cũ: trùng việc với khối Vai trò dự án) rồi **khôi phục lại theo yêu cầu người dùng**. Khác 4 ô Vai trò dự
  án (`pm`/`tm`/`am`/`acc`, vẫn là `type:"text"` gõ tay vì hay dùng tên viết tắt), ô này chọn thẳng Họ tên
  đầy đủ trong `S.staff` nên khớp chính xác `user.staff_name` để tính quyền, không qua `alias` nên không
  gặp lại vấn đề "chưa khớp nhân sự" của `roleOpts()` (đã revert ở 4 ô Vai trò, xem trên). `onSave`:
  `owner = x.owner || x.tm || x.pm || ""` – nếu người dùng không chọn (dự án cũ/bỏ trống) vẫn rơi về suy tự
  động từ TM/PM như hành vi cũ, không phá dự án có sẵn.
  **"SE" đã bỏ hẳn khỏi web** (yêu cầu người dùng – đây là web cho Phòng Quản lý dự án, PM là vai trò
  chính, các bên khác TM/AM/ACC chỉ phối hợp, không có khái niệm SE như bên Kỹ thuật): `p.se` không còn
  được đọc/kiểm tra ở bất kỳ đâu (`projectAssigned()` chỉ còn so `p.owner`; `canWrite()`/route `task-pt` ở
  `backend/server.js` đã bỏ nhánh `existing.se`/`body.se`; cột "SE" ở Báo cáo tổng hợp dự án – `reports.js`
  – và nhãn "SE" trong `pRole` của `kpiWorkHtml()` – `kpi-calc.js` – đã xoá hẳn). `onSave` vẫn ghi
  `se = ""` vào tài liệu (không đổi định dạng `projects` hiện có, chỉ không dùng trường này nữa) – **đừng**
  thêm lại bất kỳ chỗ đọc/hiển thị `p.se` nào, kể cả khi thấy trường này còn tồn tại trong dữ liệu cũ.
  Thêm `client` (Khách hàng, text tự do – vd "Viettel", "VCM") hiện ở cột "Khách hàng" bảng Tổng
  quan dự án (`project-overview.js`); dự án tạo trước khi có trường này hiện "–".
- Đầu việc (`task`, trong `projects/<id>.tasks[]`) có khối ngày tháng khớp đúng mẫu bảng Excel giấy của
  phòng (4 cặp Bắt đầu/Kết thúc song song + Thời gian theo ngày, xem `taskForm()`/`planTaskRow()`/
  `planDetail()` ở `plan.js`): `hdStart` + **`deadline` cũ** (= "Kế hoạch theo HĐ", **không đổi tên
  `deadline`** – nhiều nơi khác đọc thẳng field này: cảnh báo quá hạn/sắp hạn ở `model.js`, `lateTasks()`,
  sắp xếp…), `adjStart`/`adjEnd` ("Kế hoạch HĐ điều chỉnh"), `expStart`/`expEnd` ("Kế hoạch dự kiến"),
  `actStart`/`actEnd` ("Kế hoạch thực tế"), `daysActual`/`daysProposed` ("Thời gian (ngày)" – Theo thực tế/
  Theo đề xuất). Tất cả là trường tường thuật/tham khảo, **không** tham gia công thức Workload/Capacity hay
  cảnh báo (chỉ `deadline` tham gia, như trước). Task cũ thiếu các trường này hiển thị "–", không cần script
  chuyển đổi.
- `task.collab` ("Thực hiện – được giao làm") **không còn ô nhập tay** ở `taskForm()` (bỏ theo yêu cầu người
  dùng) – cột "Thực hiện" ở bảng Kế hoạch dự án giờ chỉ còn suy từ `t.doers` (người thực sự nhập "Nhập theo
  tuần" cho đúng đầu việc, `model.js`), không còn gán trước tay. `taskForm.onSave` vẫn **giữ nguyên** giá
  trị `collab` cũ khi sửa đầu việc đã có sẵn (đọc từ `raw.collab`, không đụng tới) để không âm thầm xoá dữ
  liệu cũ; đầu việc tạo mới từ nay `collab` luôn rỗng.
- **`task.pr` ("Ưu tiên") đổi từ 4 mốc mã `P1`–`P4` sang 3 mốc chữ `TASK_PR = ["Cao","Bình thường","Thấp"]`**
  (`constants.js`) – khớp đúng chữ dùng ở cột "ƯU TIÊN" trong file mẫu Excel thật của phòng (chỉ có
  "Cao"/"Bình thường"; "Thấp" là mốc thứ 3 thêm cho PM tự hạ bớt việc phụ). `CAT_PR` (khung mẫu) vẫn chỉ 2
  mốc như cũ, không đổi. Mọi nơi so sánh `t.pr==="P1"` (cảnh báo "Cần ưu tiên xử lý" ở `exec-dashboard.js`,
  biggest-risk note ở `reports.js`, màu thẻ ưu tiên ở `plan.js`) đã đổi hết sang so `"Cao"`; CSS thẻ màu ở
  `exec-dashboard.js` dùng lại nguyên 3 lớp `.tg-p1/.tg-p4/.tg-p3` có sẵn (`dashboard.css`, không thêm lớp
  mới) qua bảng tra `prTagCls`, không còn suy lớp từ `t.pr.toLowerCase()` (sẽ vỡ vì "Bình thường" có dấu
  cách). **Đã chạy script chuyển đổi 1 lần** cho dữ liệu `projects` hiện có trong CSDL (P1→Cao, P2→Bình
  thường, P3/P4→Thấp) – dự án tạo/sửa từ nay luôn dùng đúng 3 chữ mới, không còn `t.pr` nào mang giá trị
  `P1`–`P4` nữa; nơi nào còn so sánh theo mã cũ là lỗi.
- **Tham khảo `ptkt-appv1` cho "giao diện dự án"**: đã diff `plan.js`/`plan.css`/`project-overview.js` 2 bên
  – khác nhau SÂU hơn màu sắc (ptkt dùng lại kiểu thẻ/card nhóm theo Loại ở Tổng quan dự án – đúng kiểu NGSI
  **đã bỏ** theo yêu cầu người dùng trước đó để đổi sang bảng sort được; bảng đầu việc chính của ptkt tái
  dùng thẳng style `.rp-sec-grn`/báo cáo thay vì `.plan-grid` khoá khung 2 cột + 4 cặp ngày của NGSI) – nên
  **không** đồng bộ cấu trúc/bố cục, chỉ lấy đúng 1 chi tiết trực quan nhỏ theo xác nhận của người dùng: nút
  zoom bảng (−/%/+) gộp chung 1 khung bo tròn (`all:unset` + 1 border ngoài) thay vì 3 nút `.btn icon` rời
  (`.plan-zoom`, `plan.css`/`plan.js`); và **thanh Kỳ** (‹ Tuần… › + Tuần/Tháng/Quý + làm mới, `dashToolbar()`)
  thêm vào hàng tiêu đề "Dự án" ở trang chi tiết 1 dự án (`viewProject()`, `project-overview.js`, nhánh
  `S.projTab==="overview" && S.ovDetailId`) – khớp đúng bố cục `projectPage()` của ptkt-appv1 (thanh Kỳ ở
  `.head`/`.ex-ctl` TRÊN CÙNG, tách riêng dòng tóm tắt dự án `ovDetailHeader()` bên dưới) nhưng **không**
  lấy theo ô "SE" trong thanh tóm tắt của ptkt (web này đã bỏ SE hẳn, xem mục "SE đã bỏ hẳn khỏi web"
  bên dưới). Lần sau muốn tham khảo tiếp ptkt-appv1, hỏi rõ phạm vi trước (chi tiết nhỏ hay cả cấu trúc) vì
  2 bên đã rẽ nhánh UX, không phải chỉ lệch theme.
- Bảng "Kế hoạch dự án" (`.plan-grid.tbl-wrap`, `plan.css`) đã chỉnh giao diện cho giống bảng báo cáo
  (`.rp-sec-grn`/`.rp-sec-xl`, `reports.css` – cùng đầu cột xanh lá nhạt `#D7E8C7` sẵn có): bo góc khung
  bảng tăng `8px`→`12px` (khớp `.panel` chung, `base.css`) + thêm `box-shadow` nhẹ cho nổi khối. Riêng
  **thanh cuộn** của khung này đã thử đổi dày `16px`/bo tròn hẳn rồi **revert lại đúng thanh cuộn mảnh mặc
  định dùng chung toàn app** (`*::-webkit-scrollbar`, `base.css`, 5px) theo phản hồi người dùng – khớp đúng
  ptkt-appv1 (không có override riêng cho bảng nào) – đã bỏ hẳn khối `.plan-grid.tbl-wrap::-webkit-scrollbar*`
  khỏi `plan.css`, đừng thêm lại nếu chưa được yêu cầu. Chỉ đổi phần khung – **không** đổi bộ cột hay cấu
  trúc bảng (người dùng xác nhận chỉ muốn đổi giao diện, không đổi cột khi được hỏi).
  **Tách khung viền khỏi vùng cuộn** (phát hiện sau khi trả về thanh cuộn mặc định ở trên – thanh cuộn nằm
  sát viền đúng chỗ đường kẻ lưới dòng/cột cuối kết thúc, nhìn như đường kẻ bị "hở"): `planDetail()`
  (`plan.js`) nay bọc `<table>` trong 1 `<div class="plan-scroll">` lồng bên trong `.tbl-wrap.plan-grid`
  thay vì `overflow:auto` đặt thẳng trên khung có viền. `.plan-grid.tbl-wrap` (`plan.css`) chỉ còn lo viền/
  bo góc/shadow (`overflow:hidden` để bo tròn góc vùng con bên trong, KHÔNG có padding riêng); `.plan-scroll`
  mới là nơi thật sự `overflow:auto`/`max-height:72vh`. **Đệm phải/dưới 8px (`padding:0 8px 8px 0`) phải đặt
  ngay trên `.plan-scroll`, không phải khung ngoài** – lần sửa đầu tiên đặt nhầm padding ở khung ngoài nên
  không có tác dụng (thanh cuộn thuộc về chính phần tử `overflow:auto`, render sát mép trong CỦA NÓ, không
  liên quan padding của phần tử cha); phải sửa lại đặt đúng chỗ thì mới thật sự chừa khoảng trống giữa nội
  dung bảng và thanh cuộn. Mọi selector dựa vào "ancestor cuộn gần nhất" (`.plan-grid thead{position:
  sticky}`, `.plan-no`/`.plan-dv{position:sticky; left:...}`) vẫn khớp đúng vì chỉ đổi *ancestor* cuộn từ
  `.tbl-wrap` sang `.plan-scroll`, không đổi cơ chế sticky.
- Bảng "Kế hoạch dự án" (`planTaskRow()`, `plan.js`), với ai sửa được dự án (`canManageProject(p)`): 3 nút
  chèn/xoá dòng **nổi đè lên** (`position:absolute`, class `.plan-rowacts`, `plan.css`) ngay trong ô "No."
  của dòng (tràn sang cả ô "Đầu việc" liền kề) – **KHÔNG phải 1 cột riêng** (đã thử thêm hẳn 1 cột trước đó
  rồi bỏ theo phản hồi người dùng – thêm cột làm bảng rộng thêm/đẩy lệch các cột khác, chỉ cần nổi lên trên
  là đủ). Ẩn mặc định (`opacity:0; pointer-events:none`), chỉ hiện khi di chuột vào dòng hoặc đang focus
  bằng bàn phím (`tr:hover`/`:focus-within`) – "Chèn dòng lên trên"/"Chèn dòng xuống dưới"
  (`ACTIONS["taskinsert"]`, chèn thẳng 1 dòng trống vào `p.tasks` theo đúng vị trí, KHÔNG mở form – người
  dùng tự bấm vào dòng mới để điền nội dung, giống thao tác chèn hàng Excel) và "Xoá dòng"
  (`ACTIONS["taskdelrow"]`, xoá thẳng có xác nhận, không cần mở form như `taskForm.onDelete` cũ). Lý do:
  "Khung mẫu" hiện có không khớp đúng quy trình thật của dự án PM nên chỉ dùng để khởi tạo nhanh, sau đó
  người dùng cần tự do thêm/bớt/sắp xếp lại đầu việc trực tiếp trên bảng. `planTaskRow(t, i, lvl, p)` nay
  nhận thêm `p` (dự án) để biết `p.id` cho các nút này; `planTreeRows()` truyền `p` vào, gọi nơi khác nếu tự
  viết `o.row` riêng cũng cần nhận đủ 4 tham số. `td.plan-no` cần `overflow:visible` (ghi đè `overflow:hidden`
  chung của `.plan-grid td`) để phần nổi tràn sang không bị cắt, và tăng tạm `z-index` khi hover để đè lên
  `td.plan-dv` liền kề (2 ô cùng sticky `z-index:1`, đứng trước thì bị vẽ đè lên theo thứ tự DOM).
- Quyền phải kiểm tra ở **máy chủ** (`RULES`/`canWrite`), không chỉ ẩn nút.
- Không đổi định dạng tài liệu đang có (`projects`, `weeks`, `config`) mà không viết bước chuyển đổi dữ liệu.
- Không commit `.env`, `data/`, `node_modules/`.
- **Đồng bộ giao diện (thuần hiển thị) từ dự án anh em `ptkt-appv1`** (web "Phòng Kỹ thuật" cùng gốc, vẫn
  phát triển độc lập): đã đồng bộ 1 lần `frontend/css/base.css` (chép nguyên văn – bố cục, topbar, sidebar,
  menu ☰ điện thoại, chân trang `.app-foot`, `.tb-apps`) + thêm đoạn cảm ứng (`@media (pointer:coarse)`) vào
  cuối `frontend/css/dashboard.css`, cùng việc thêm `<button class="tb-menu" id="tbMenu">` (trong
  `.topbar-l`, trước logo) và `<div class="nav-scrim" id="navScrim">` (sau `.app`) vào `frontend/index.html`,
  và phần JS thu/mở menu ngăn kéo điện thoại trong `renderNav()`/phần "sidebar thu gọn" của
  `frontend/js/core/ui.js` (biến `mobileMQ`, `setNavOpen`, lắng nghe `tbMenu`/`navScrim`/Esc). **Chỉ đồng bộ
  phần hiển thị thuần** – **không** kéo theo: `frontend/css/plan.css` (khác hẳn, chứa bảng kiểu Excel
  riêng của PM, đừng ghi đè), `frontend/js/modules/plan-import.js`/`kpi-calc.js` (tính năng nghiệp vụ riêng
  của bản Kỹ thuật), `css/kpi.css`/`css/feedback.css` của bản đó, tính năng dán ảnh vào form
  (`openForm` field "images") ở `ui.js` bản Kỹ thuật, model/state/catalog/quyền hạn (`model.js`, `state.js`,
  `constants.js`, `events.js`, `server.js` của 2 dự án đã rẽ nhánh nghiệp vụ, không so để đồng bộ), và
  không đổi lại `<title>`/`.topbar-app` về "Technical Department". Lần sau muốn đồng bộ tiếp UI mới từ
  `ptkt-appv1`, diff riêng từng file CSS/HTML thuần hiển thị, không diff/chép các file đã rẽ nhánh nghiệp vụ
  kể trên.
- **Đồng bộ toàn bộ trang "Góp ý" từ `ptkt-appv1`** (lần này đồng bộ cả tính năng, không chỉ hiển thị,
  theo yêu cầu người dùng): `frontend/js/modules/feedback.js` nay có thêm (1) **Sửa góp ý** (chỉ người viết/
  admin hệ thống – trưởng phòng/phó phòng không còn sửa/xoá được góp ý người khác, chỉ còn đổi **trạng thái
  xử lý**, xem `canWrite()`/`RULES.feedback` ở `backend/server.js`), (2) **ảnh minh hoạ** dán bằng Ctrl+V hoặc
  chọn tệp (tối đa 4 ảnh/góp ý, tự nén JPEG cạnh dài ≤1280px trước khi lưu base64 – field type `"images"` mới
  trong `openForm()`, `frontend/js/core/ui.js`: `imgCompress()`/`imgOk()`/`imgFieldHTML()`, CSS riêng
  `frontend/css/feedback.css`), (3) **phản hồi/thảo luận** dưới mỗi góp ý – collection mới `feedbackReply`
  (`RULES.feedbackReply = "own"`, ai cũng viết được, xoá thì chỉ người viết/trưởng phòng/phó phòng/admin;
  xoá góp ý thì xoá theo luôn các phản hồi của nó, tránh mồ côi – xem route DELETE `/api/doc/:coll/:id`).
  Máy chủ kiểm tra khớp y hệt giao diện (`imagesBad()`, nhánh riêng cho `feedback`/`feedbackReply` đầu
  `canWrite()`) – **không** nới lỏng các kiểm tra này dù giao diện đã ẩn nút. Field type `"images"` trong
  `openForm()` dùng chung được cho module khác nếu cần (không riêng cho Góp ý).
- **Đồng bộ toàn bộ trang "KPI & Năng lực" từ `ptkt-appv1`** (cả tính năng, theo đúng yêu cầu người dùng –
  giống cách đã làm với trang Góp ý ở trên): thay hẳn bản "Giai đoạn 1" cũ (chỉ admin xem, không lưu/chốt
  được) bằng bản đang phát triển dần theo "Bước" của `ptkt-appv1`:
  - **Công thức tính điểm tách riêng** vào `frontend/js/modules/kpi-calc.js` (IIFE `KPI_CALC`, dùng được cả
    trên trình duyệt – classic script, nạp trước `kpi.js` trong `index.html` – lẫn trên Node qua
    `require()`), để `backend/lib/kpi.js` tính lại CHÍNH XÁC cùng công thức khi chốt kỳ, không tin điểm
    trình duyệt gửi lên. Vì thế `frontend/js/core/utils.js` và `constants.js` nay có thêm
    `if(typeof module!=="undefined"...) module.exports = {...}` ở cuối file (không đổi gì khác) để
    `kpi-calc.js` require được trên Node – đừng xoá 2 dòng này dù chúng "thừa" với trình duyệt.
  - **Bản đánh giá KPI** (collection mới `kpiReview`, `RULES.kpiReview = "server"` – không ai ghi/xoá được
    qua PUT/DELETE chung dù là trưởng phòng, chỉ qua `/api/kpi/review`, `/api/kpi/review/lock`,
    `/api/kpi/review/unlock`, xem `backend/lib/kpi.js`): lưu nhận xét/minh chứng (nháp), **chốt** (máy chủ
    tự tính lại điểm + lưu `snapshot` ngay lúc chốt, không phụ thuộc cấu hình tiêu chí đổi sau này), **mở
    lại** (bắt buộc ghi lý do, giữ lịch sử). Chỉ `KPI_ROLES = admin+head` gọi được 3 route này (khớp
    `KPI_WRITE_ROLES` ở `kpi.js`) – `kpi.js` (file này) mới chỉ hiển thị nhận xét trưởng phòng (`kpiNote`,
    tính năng cũ) và đọc `kpiReview` để biết trạng thái Chưa đánh giá/Đang đánh giá/Đã chốt; **chưa có nút
    Lưu/Chốt/Mở lại** trên giao diện (đúng hiện trạng "Bước 1" của bản gốc – backend đã sẵn route, frontend
    sẽ nối vào ở bước sau, không tự thêm UI chốt khi chưa được yêu cầu).
  - **Mọi tài khoản đã đăng nhập xem được trang này** (không riêng admin như bản cũ) – `KPI_VIEW_ROLES` ở
    `kpi.js` khớp việc server không giới hạn đọc `kpiReview` qua `READ_ROLES` (để trống sẵn, có thể gán
    `kpiReview: KPI_ROLES` vào đó nếu sau này cần ẩn lại). Thêm tab "Trang cá nhân" (hồ sơ KPI của chính
    người xem, dựa theo "Tôi là"/`staff_name` tài khoản) cạnh "Tổng quan" (`.rp-tabs`, giống kiểu tab màn Dự
    án/Báo cáo).
  - Thêm biểu đồ xu hướng KPI trung bình theo kỳ (`kpiTrendHtml`, SVG polyline tự vẽ) và biểu đồ mạng nhện
    theo tiêu chí (`kpiRadarHtml`) trong trang chi tiết 1 nhân viên, cùng bảng "Dự án và đầu việc thực hiện
    trong kỳ" (`kpiWorkHtml`) liệt kê đúng những gì người đó đã làm (không phải đầu việc họ *phụ trách* nói
    chung) – cả 3 đọc `KPI_CALC.work()`, không tính điểm. CSS riêng `frontend/css/kpi.css`.
  - **Đổi hành vi dùng chung với Kế hoạch dự án**: bảng `kpiWorkHtml` liệt kê đầu việc của NHIỀU dự án cùng
    lúc (không giống Kế hoạch dự án chỉ xem 1 dự án đang chọn `S.planSel`), nên mỗi dòng phải tự mang theo
    mã dự án (`data-pid`) để bấm mở đúng `taskForm()`. Đã sửa `ACTIONS["task"]`
    (`frontend/js/core/events.js`): `M.pById.get(t.dataset.pid || S.planSel)` – ưu tiên `data-pid` nếu dòng
    có mang theo (kpi.js), rơi về `S.planSel` như cũ nếu không (mọi dòng hiện có trong Kế hoạch dự án,
    `planTaskRow()`, chưa và không cần đổi). Khi thêm bảng đầu việc mới cũng liệt kê nhiều dự án, nhớ gắn
    `data-pid` theo đúng kiểu này, đừng chỉnh lại `S.planSel` làm fallback chung.
  - **Không porting**: `backend/server.js`'s `READ_ROLES` cơ chế đã thêm theo đúng bản gốc (hiện rỗng,
    không giới hạn gì) – đừng tự ý gán `kpiReview: KPI_ROLES` vào đó nếu người dùng chưa yêu cầu ẩn dữ liệu
    đánh giá của người khác.

## Lệnh
- Máy cá nhân: `.env` đặt `DB_CLIENT=sqlite`, `DATA_DIR=./data`.
- Chạy phát triển (tự khởi động lại khi sửa backend/server.js): `npm run dev` → http://127.0.0.1:3000
- Tạo tài khoản: `npm run user -- create`
- Kiểm tra cú pháp: `node --check backend/server.js` và `for f in frontend/js/**/*.js; do node --check "$f"; done`

## Triển khai
Máy chủ thật: mã ở `/opt/ptkt`, CSDL MariaDB `ptkt` (user `ptkt`@localhost), dịch vụ systemd `ptkt`, Nginx. Quy trình cập nhật: sao lưu (`deploy/backup.sh`) → chép mã mới vào `/opt/ptkt` (giữ `.env` và dữ liệu) → `npm ci --omit=dev` → `systemctl restart ptkt`. Luôn sao lưu trước khi cập nhật.
