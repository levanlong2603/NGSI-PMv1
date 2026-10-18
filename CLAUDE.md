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
      3. **Gantt theo tuần** – **đã bắt đầu làm** (`planGanttPanel()`/`planTaskBar()`, `plan.js`, CSS
         `.plan-gantt-*`/`.plan-gc*` ở `plan.css`) theo yêu cầu người dùng, dạng v1 **đơn giản hoá** so với
         Excel: Excel gốc tô CHỒNG 3 dải màu/1 ô (kế hoạch gốc + điều chỉnh + thực tế cùng lúc nếu tuần đó
         rơi vào cả 3 khoảng) bằng Conditional Formatting; bản web chỉ tô **1 màu/đầu việc/tuần**, chọn theo
         đúng thứ tự ưu tiên "ngày khả dụng gần nhất" đã dùng nhất quán trong app (Thực tế → HĐ điều chỉnh →
         HĐ gốc – nhưng lấy NGUYÊN CẶP bắt đầu+kết thúc cùng 1 bậc, khác `msDate()` ở `model.js` trộn độc
         lập từng vế cho mục đích khác) – cố tình khác Excel để tránh 1 ô phải tô nhiều lớp chồng (khó đọc
         trên màn hẹp hơn Excel), đổi lại màu luôn đúng khoảng ngày "đang dùng thật" tại thời điểm xem. Mã
         màu giữ nguyên đọc từ file mẫu thật (không tự chọn): HĐ gốc `#5B9BD5` (xanh dương), HĐ điều chỉnh
         `#8064A2` (tím), Thực tế `#70AD47` (xanh lá) – đầu việc đang mở (`OPEN.has(status)`) mà quá hạn/
         sắp hạn thì ĐÈ hẳn sang đỏ `#C00000`/cam `#F4B183` (ưu tiên cảnh báo hơn đúng màu kế hoạch). Cột
         tuần hiện tại tô vàng nhạt `#FFF7D6` (nhạt hơn `#FFD966` gốc, dễ đọc trên nền trắng web) đè lên mọi
         màu khác nếu trùng ô. **Hiện ở tab "Báo cáo → Báo cáo dự án"** (`rpProjectContent()`, `reports.js`
         – xem mục cập nhật vị trí ngay dưới "Tham khảo `ptkt-appv1`..." bên dưới, trang "Tổng quan → bấm dự
         án" cũ ĐÃ BỎ HẲN) – nút bấm mở/đóng `<button data-act="plangantt">Tiến độ theo tuần</button>`.
         Trạng thái mở/đóng lưu phiên theo từng dự án (`S.planGanttOpen[p.id]`, không ghi CSDL, giống
         `S.planZoom`) – hàm gốc vẫn ở `plan.js` dù gọi từ `reports.js` (plan.js nạp trước trong
         `index.html`). **Còn thiếu/CHƯA làm**: tô chồng nhiều màu/ô như Excel gốc (quyết định bỏ hẳn, xem
         lý do trên – không phải thiếu sót).
      4. **"Đầu việc khẩn cấp / cần chú ý"** (`planUrgentPanel()`/`planUrgentGroup()`, `plan.js`, CSS
         `.plan-urgent-*` ở `plan.css`) – tham khảo "III. CÁC ĐẦU VIỆC KHẨN CẤP..." của sheet Report: 2
         nhóm A (Quá hạn)/B (Sắp đến hạn, thanh tiêu đề đỏ đậm `#8B0000`/cam `#C77A1E` chữ trắng kiểu Excel)
         lọc thẳng từ `t.warns` đã tính sẵn ở `derive()` (không tính lại cảnh báo riêng), ngưỡng "Sắp đến
         hạn" dùng đúng `S.milestoneRule.dueSoonDays` đang cấu hình (không có ngưỡng D90 riêng cho panel
         này như file mẫu – dùng chung 1 ngưỡng toàn app cho nhất quán). Sắp theo ngày kết thúc của
         `planTaskBar(t)` (cặp ngày "đang dùng thật", dùng lại hàm đã viết cho Tiến độ theo tuần) – trễ/sắp
         hạn nhiều nhất lên đầu. Mỗi dòng bấm được thẳng vào `taskForm()` (`data-act="task" data-pid="..."`,
         khớp đúng cơ chế `data-pid` đã dùng ở `kpiWorkHtml()` cho bảng liệt kê nhiều dự án).
      5. **"Mốc thanh toán"** (`planPaymentPanel()`/`planPaymentTasks()`, `plan.js`) – tham khảo "IV. GANTT
         DÒNG TIỀN — CÁC MỐC THANH TOÁN": lọc đúng nhánh đầu việc dưới 1 dòng hạng mục chữ cái có chữ
         "THANH TOÁN" trong tên, viết lại vòng lặp `inPayment` giống hệt `msClassify()` (không gọi thẳng
         hàm đó vì nó trả về mảng "là mốc chính theo mode", mục đích khác) – **không** phụ thuộc
         `S.milestoneRule`, nhánh thanh toán luôn nhận diện cố định theo tên, không có mode chọn. Hiển thị
         dùng lại nguyên `planMsTable()` (tách ra từ `planMilestonesPanel()` cũ – giờ cả 2 panel mốc chính
         và mốc thanh toán dùng chung 1 hàm dựng bảng 4-cặp-ngày, chỉ khác danh sách đầu vào).
      Cả 3 panel (Tiến độ theo tuần/Đầu việc khẩn cấp/Mốc thanh toán) **ban đầu** gắn vào trang riêng "Tổng
      quan → bấm dự án" (`planDetail(p)` không `extra`, thay 2 nút "Xoá dự án"/"Sửa thông tin" cũ ở đó) –
      **sau đó trang đó bị bỏ hẳn** (xem mục cập nhật vị trí ở "Tham khảo `ptkt-appv1`..." bên dưới), 3 nút
      dọn nguyên sang tab "Báo cáo → Báo cáo dự án" (`rpProjectContent()`, `reports.js`), hàm/CSS/ACTIONS/
      state gốc (`data-act="plangantt"/"planurgent"/"planpay"`, `S.planGanttOpen`/`S.planUrgentOpen`/
      `S.planPayOpen`, đều theo `p.id`, không ghi CSDL) **vẫn ở nguyên `plan.js`/`plan.css`**, chỉ đổi NƠI
      GỌI. Còn "nút chức năng khác" người dùng nhắc tới nếu có thêm nữa sau này, hỏi lại phạm vi cụ thể
      trước khi làm.
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
- **Mục menu trái xổ ra mục con** (thay vì điều hướng thẳng tới 1 trang) – thêm `children:[{label, act(), active()}]`
  vào đúng object đang `VIEWS.splice()` vào (xem "Báo cáo" làm mẫu, `reports.js`): mỗi mục con tự mang
  `act()` (module tự set state/tab riêng của nó – vd `S.rp.tab`) + `active()` (trả `true/false` biết mục
  con nào đang chọn, để tô đậm) – `renderNav()` (`core/ui.js`) chỉ GỌI 2 hàm này, không biết gì về state
  riêng của module (đúng kiến trúc "không sửa lõi": cơ chế generic ở core, dữ liệu cụ thể ở module). Bấm
  mục CHA chỉ xổ/đóng (`S.navOpen[v.id]`, không điều hướng, không có trang riêng) – tham khảo đúng kiểu
  menu xổ thụt lề của 1 app khác theo yêu cầu người dùng ("chuyển 3 mục báo cáo sang dạng sổ xuống", thay
  cho 3 tab ngang `.rp-tabs` cũ ở đầu trang). **Hạn chế đã biết**: sidebar thu gọn (`body.side-collapsed`,
  chỉ còn icon) ẩn hẳn mục con (`.nav-sub`/`.nav-chev` display:none, `base.css`) vì không đủ chỗ hiện chữ –
  chưa làm kiểu xổ nổi (flyout) khi thu gọn, để sau nếu được yêu cầu riêng.
  **Bug đã gặp 1 lần (nhớ kỹ nếu thêm mục xổ khác)**: mục con dùng thuộc tính `hidden` để ẩn/hiện
  (`<div class="nav-sub" ${open?"":"hidden"}>`), nhưng `.nav-sub{display:flex}` (CSS tác giả) tự ĐÈ LÊN mặc
  định `[hidden]{display:none}` của trình duyệt (CSS tác giả luôn thắng CSS mặc định UA bất kể độ ưu tiên)
  → mục con hiện ra, đóng lại không mất đi được ("Báo cáo đang không thu lại được"). Phải thêm riêng
  `.nav-sub[hidden]{display:none}` mới đúng. Bất kỳ phần tử nào vừa đặt `display` qua CSS vừa dùng thuộc
  tính `hidden` để ẩn/hiện đều cần ghi đè `[hidden]{display:none}` kiểu này, không tự suy ra được.
  **Nút CHA không tô nền/thanh viền trái khi active nữa** (`.nav-grp-toggle.active`, `base.css`) – lúc đầu
  tô y hệt `[aria-current="page"]` (nền đặc + thanh viền trái), nhưng mục CON đang chọn ngay bên dưới cũng
  tô y hệt → nhìn như "2 thanh active" cùng lúc, rối mắt. Theo yêu cầu người dùng (đối chiếu lại ảnh tham
  khảo 1 app khác): nút cha giờ CHỈ đổi màu chữ + icon (không nền, không viền trái) khi đang mở đúng nhóm
  chứa trang hiện tại; "thanh" tô nền đặc CHỈ còn ở đúng 1 chỗ – mục con đang chọn thật
  (`[aria-current="page"]`, kế thừa nguyên `.nav button` chung).
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
- **CẬP NHẬT VỊ TRÍ – trang riêng "Tổng quan → bấm dự án" ĐÃ BỎ HẲN**: toàn bộ 3 đoạn tiếp theo (tham khảo
  `ptkt-appv1`/thanh Kỳ/`ovDetailHeader()`, và `planDetail(p, extra)` mô tả `extra` falsy) mô tả trang đó
  khi còn tồn tại – **giữ lại làm lịch sử**, nhưng từ nay **bấm 1 dự án ở tab "Tổng quan" nhảy thẳng sang
  "Báo cáo → Báo cáo dự án"** (`data-act="goplan"`, `core/events.js` – đặt `S.view="reports"`,
  `S.rp.tab="project"`, `S.rp.pjProject=<id>`, reset `S.rp.pjPtype="Tất cả"` để dự án vừa chọn không bị lọc
  mất khỏi `<select>`), KHÔNG còn mở trang riêng nữa (theo yêu cầu người dùng). Vì vậy: `ovDetailHeader()`,
  `S.ovDetailId`, `ACTIONS["ovback"]` **đã xoá hẳn** (không phải giữ lại, khác các hàm "giữ lại phòng khi
  cần" khác trong file này); `planDetail(p, extra)` **chỉ còn 1 nơi gọi thật** – `planDetail(p, true)` ở
  `planContent()` (tab "Kế hoạch dự án") – nhánh `extra` falsy (cột "Đánh giá", class `.plan-grid-report`
  tiêu đề navy) vẫn còn trong code nhưng **không ai gọi tới nữa**, giữ lại phòng khi cần (không xoá, theo
  đúng quy ước file này). 3 panel Tiến độ theo tuần/Đầu việc khẩn cấp/Mốc thanh toán đã dọn sang
  `rpProjectContent()` (`reports.js`, xem mục "Gantt theo tuần" ở "Bộ công thức sheet Report" phía trên).
  Bảng "Danh sách đầu việc" ngay trong `rpProjectContent()` cũng đổi tiêu đề từ xanh lá `.rp-sec-grn` sang
  navy đậm `#1F4E78`/chữ trắng (lớp mới `.rp-sec-blue`, `reports.css`, đặt SAU `.rp-sec-grn thead th` để
  thắng khi 1 phần tử mang cả 2 lớp) theo yêu cầu người dùng – **chỉ riêng bảng này**, 3 nơi khác còn dùng
  `.rp-sec-grn` (Báo cáo tuần, Tải tuần, Báo cáo tổng hợp dự án) **giữ nguyên xanh lá**, đừng đổi màu
  `.rp-sec-grn` gốc. Ô "Hạng mục" gộp dòng cũng đổi nền `var(--ok-soft)`→`var(--info-soft)` cho đồng bộ.
  **CẬP NHẬT TIẾP – đã bỏ hẳn bảng `.rp-sec-blue` này** (chỉ tồn tại 1 thời gian ngắn): theo yêu cầu người
  dùng "không phải bảng kiểu cũ của kỹ thuật nữa", bảng "Chi tiết thực hiện" đơn giản trong
  `rpProjectContent()` **đổi hẳn sang gọi `planDetail(pr.p, false, true)`** (bản `extra` falsy – đúng bảng
  đầy đủ 4 cặp ngày + cột "Đánh giá" + tiêu đề navy, trước đây hiện ở trang riêng "Tổng quan → bấm dự án"
  nay đã bỏ) – đặt BÊN TRONG `#rp-print` (cùng khối với tiêu đề + dải KPI) để Xuất PDF (chụp đúng
  `#rp-print`) tự khớp theo bảng mới, không cần sửa riêng.
  **Tham số thứ 3 `noTools=true`** (`planDetail(p, extra, noTools)`, `plan.js`) – thêm sau khi người dùng
  yêu cầu dọn 3 nút Tiến độ theo tuần/Đầu việc khẩn cấp/Mốc thanh toán LÊN thanh điều khiển chung (cùng
  hàng chọn Loại/dự án + "← Quay lại tổng quan" + "Xuất báo cáo", biến `toolBtns` trong `rpProjectContent()`)
  thay vì nằm trong toolbar riêng của `planDetail()` ngay trên bảng – `noTools=true` chỉ tắt việc VẼ LẠI 3
  nút đó bên trong `planDetail()` (tránh lặp 2 chỗ), KHÔNG tắt 3 PANEL tương ứng (Tiến độ theo tuần/Đầu
  việc khẩn cấp/Mốc thanh toán vẫn render `<section class="panel">` riêng ngay trên bảng chính như cũ –
  đúng ý "hiển thị thành các bảng riêng"). Trạng thái đóng/mở dùng chung `S.planGanttOpen`/
  `S.planUrgentOpen`/`S.planPayOpen` theo `p.id` nên nút đặt ở ĐÂU bấm cũng ra đúng panel, không cần đồng bộ
  gì thêm. Lời gọi `planDetail(p, true)` ở `planContent()` (tab "Kế hoạch dự án") không đổi – `noTools`
  chỉ có tác dụng khi `extra` falsy (nhánh "Xoá dự án"/"Sửa thông tin" của `extra=true` không liên quan).
  **Bảng chính ẨN HẲN khi đang mở 1 trong 3 panel** (`anyPanelOpen = !extra && (ganttOpen||urgentOpen||
  payOpen)`, `planDetail()`) – trước đó bảng chính + panel đang mở XẾP CHỒNG cùng lúc, chú thích màu Gantt
  (`.plan-gantt-legend`) đứng sát ngay trên bảng chính nhìn như 1 khối, dễ hiểu lầm chú thích mô tả bảng
  chính (theo phản hồi người dùng – "nó là riêng mà") – nay chỉ hiện ĐÚNG 1 trong 2: panel đang mở, hoặc
  bảng chính khi cả 3 panel đều đóng. Chỉ áp dụng cho `extra` falsy (trang Báo cáo dự án) – tab "Kế hoạch
  dự án" (`extra=true`) không có khái niệm 3 panel này, luôn hiện bảng chính bình thường. **Chú thích màu
  Gantt chuyển lên ĐẦU `planGanttPanel()`** (trước ở cuối, dưới lưới tuần) – `.plan-gantt-legend` đổi
  `margin-top:10px`→`margin-bottom:10px` (`plan.css`) cho khớp vị trí mới.
  **CẬP NHẬT TIẾP – `rpBuildProjectExport()` đã viết lại khớp đúng bảng mới** (trước đó Xuất Excel còn ra
  đúng cột kiểu cũ Hạng mục/Đầu việc/Chi tiết thực hiện/Deadline/Trạng thái/Vướng mắc/Hướng giải quyết, lệch
  với bảng xem web/PDF – đã sửa theo yêu cầu người dùng "xuất báo cáo đúng chính xác các bảng này theo
  excel và PDF"): sheet "Đầu việc" đọc thẳng `pr.p._tasks` (đúng nguồn `planDetail()` dùng, không qua
  `pr.rows`/`rpBuildProject()` nữa) – cột khớp 1-1 với bảng web: No./Đầu việc/Trạng thái/Ưu tiên/Phụ trách/
  Thời gian(ngày) Theo thực tế+Theo đề xuất/4 cặp Bắt đầu-Kết thúc (HĐ gốc/HĐ điều chỉnh/Dự kiến/Thực tế)/
  Đánh giá. **`rpExportAssess(t)`** (hàm mới, `reports.js`) tính "Đánh giá" – LẶP LẠI đúng công thức đã viết
  ở `planTaskRow()`/`planMsTable()` (`plan.js`: `diff=actEnd−deadline`, 0→"✓ Đúng hạn", âm→"✓ Sớm N ngày",
  dương→"⚠ Trễ N ngày") vì `reports.js` không gọi hàm nội bộ của `plan.js` cho phần này (khác cách dùng
  thẳng `planDetail()`/`planGanttPanel()`… ở trên) – **đổi công thức "Đánh giá" ở 1 nơi thì phải đổi luôn cả
  2 nơi** (`plan.js` lẫn `rpExportAssess()` ở `reports.js`), không tự đồng bộ.
  **CẬP NHẬT TIẾP – Xuất Excel "Báo cáo dự án" gộp lại CHỈ CÒN 1 SHEET** (trước đó 2 sheet "Tổng quan"
  (bảng Chỉ số/Giá trị) + "Đầu việc" – theo yêu cầu người dùng "xuất chính xác bảng như thế này... không
  tách sheet"): `rpBuildProjectExport()` giờ trả về đúng 1 `sheets[0]` ("Đầu việc") mang thêm `pre` (mảng
  mới, mỗi phần tử là 1 dòng giá trị thô đặt TRƯỚC bảng trong CÙNG sheet) chứa 2 dòng tiêu đề/dòng phụ +
  dòng trống + 2 dòng KPI (nhãn/giá trị, đúng thứ tự dải `stat` trên web) + dòng trống, y hệt bố cục khối
  `#rp-print` (tiêu đề + dải KPI + bảng) đang hiện trên web/PDF, chỉ khác là PDF chụp ảnh còn Excel phải tự
  dựng lại từng dòng (ExcelJS không đọc được DOM). **`rpExportExcel()` (cơ chế xuất chung, dùng cho CẢ 3
  loại báo cáo – Báo cáo tuần/Báo cáo dự án/Báo cáo tổng hợp dự án) đã tổng quát hoá thêm `sh.pre`** – khi
  sheet có `pre`, dòng tiêu đề cột không còn cố định ở hàng 1 nữa (biến `hr = pre.length+1`): `ws.columns`
  chỉ còn dùng để đặt `key`/độ rộng (bỏ `header` – gán qua `ws.columns` luôn ghi header vào ĐÚNG hàng 1,
  không dời được), tiêu đề cột ghi tay vào `headerRow = ws.getRow(hr)` sau khi `pre` rows đã được
  `ws.addRow()` xong; mọi chỗ còn lại (tô màu đầu cột, viền 4 cạnh, `ySplit` đóng băng, vị trí `mergeCells`)
  đều tính lại theo `hr` thay vì số `1`/`2` cứng. Sheet KHÔNG có `pre` (Báo cáo tuần/Báo cáo tổng hợp dự án
  – vẫn tách sheet như cũ, người dùng chỉ yêu cầu đổi riêng Báo cáo dự án) hành vi y hệt trước, không đổi
  gì – `hr` tự về `1` khi `pre` rỗng/không có. Muốn gộp sheet cho báo cáo khác sau này, chỉ cần thêm `pre`
  vào đúng `sheets[i]` của hàm `rpBuild...Export()` tương ứng, không cần sửa `rpExportExcel()` thêm.
  **CẬP NHẬT TIẾP – tiêu đề cột bảng "Đầu việc" đổi sang 2 TẦNG gộp nhóm + màu navy/viền đen** (trước đó
  1 tầng phẳng, mỗi cột ghép sẵn tên nhóm vào nhãn kiểu "HĐ gốc - Bắt đầu", màu xanh lá mặc định – theo yêu
  cầu người dùng "tiêu đề xanh đúng cấu trúc như này và border màu đen", đối chiếu đúng cấu trúc 2 tầng của
  `planDetail()` trên web: 5 cột đơn No./Đầu việc/Trạng thái/Ưu tiên/Phụ trách gộp DỌC 2 hàng + 5 nhóm
  "Thời gian (ngày)"/4 cặp Kế hoạch (mỗi nhóm gộp NGANG tiêu đề nhóm, 2 cột con Bắt đầu/Kết thúc riêng) +
  cột đơn Đánh giá gộp dọc). `rpExportExcel()` tổng quát hoá thêm lần 2: `sh.head2` (mảng
  `[{key,label}|{group,sub:[{key,label},...]}]` theo đúng thứ tự cột) bật nhánh dựng tiêu đề 2 hàng bằng
  `ws.mergeCells()` (dọc cho cột đơn, ngang cho nhóm) thay cho 1 hàng đơn cũ; `sh.headBg`/`sh.headFg`/
  `sh.borderColor` (tuỳ chọn, ARGB) ghi đè màu nền/chữ tiêu đề + màu viền mặc định (`RP_XL_HEAD_BG` xanh lá
  nhạt/`RP_XL_BORDER` xanh lá viền, dùng cho các sheet khác không đổi). **`RP_PROJECT_HEAD2`** (hằng mới,
  `reports.js`, cạnh `rpBuildProjectExport()`) định nghĩa cấu trúc 2 tầng này 1 lần, `rpProjectHeadFlat()`
  duỗi phẳng ra để dựng `cols`/độ rộng cột như cũ – **`key` của cột lá PHẢI khác nhãn hiển thị** (nhãn
  "Bắt đầu"/"Kết thúc" lặp lại ở cả 4 nhóm Kế hoạch, dùng làm `key` sẽ đụng nhau) nên đổi hẳn sang tên
  trường `task` thật làm key (`hdStart`/`deadline`/`adjStart`/`adjEnd`/`expStart`/`expEnd`/`actStart`/
  `actEnd`/`daysActual`/`daysProposed`/`no`/`dv`/`status`/`pr`/`owner`/`assess`) – `rows` trong
  `rpBuildProjectExport()` cũng đổi theo đúng các key này (trước dùng thẳng nhãn hiển thị làm key, nay
  không còn hợp lệ do trùng). Màu `headBg:"FF1F4E78"`/`headFg:"FFFFFFFF"`/`borderColor:"FF000000"` – khớp
  đúng `.plan-grid-report` (tiêu đề navy/chữ trắng) trên web, viền đen theo đúng yêu cầu (khác viền xanh lá
  nhạt mặc định của các sheet/bảng khác, KHÔNG đổi màu viền chung `RP_XL_BORDER`).
  **CẬP NHẬT TIẾP – độ rộng cột ĐẶT TAY thay vì suy từ độ dài chữ tiêu đề** (xuất thử lần đầu bị lỗi: cột
  "Đầu việc" cắt cụt tên dài như "TỔNG THỜI GIAN THỰC HIỆN DỰ ÁN", các cột ngày bị Excel tự ngắt dòng giữa
  chuỗi dd/mm/yyyy kiểu "07/03/202"/"5" – vì mặc định chung `rpExportExcel()` suy độ rộng từ
  `c.header.length*1.3`, mà tiêu đề 2 tầng ở đây toàn nhãn ngắn "Bắt đầu"/"Kết thúc" nên cột luôn quá hẹp so
  với dữ liệu thật, bất kể cấu trúc tiêu đề đúng hay sai). Người dùng yêu cầu tham khảo cách 1 dự án Python/
  openpyxl khác (`D:\Documents\Code Web\pm_ngsi_project\backend\app\modules\reports\xlsx.py`,
  `Writer.__init__`) đặt tường minh 1 mảng độ rộng theo cột thay vì suy đoán – dự án đó khác hẳn stack
  (Python/openpyxl, FastAPI, mô hình dữ liệu khác – WBS/rủi ro/gói thầu, không có gì porting trực tiếp
  được), chỉ mượn ĐÚNG ý tưởng này. `rpExportExcel()` tổng quát hoá thêm: `c.width` tuỳ chọn trên từng phần
  tử `sh.cols` ghi đè độ rộng; không có thì vẫn rơi về suy từ tiêu đề như cũ (các sheet khác không đổi).
  **`RP_PROJECT_COL_WIDTH`** (hằng mới, `reports.js`, tra theo đúng `key` của `RP_PROJECT_HEAD2`) đặt độ
  rộng theo loại dữ liệu thật: `dv` (Đầu việc) 42, `status`/`owner` 16, các cột ngày (`hdStart`/`deadline`/…)
  12 (đủ cho `dd/mm/yyyy` 10 ký tự không ngắt dòng), `assess` 20, còn lại 8–12. Đổi độ rộng cột nào thì sửa
  thẳng bảng tra này, không cần đụng `rpExportExcel()`.
  **CẬP NHẬT TIẾP – Xuất PDF thật ra CÓ cần sửa**: "PDF tự khớp sẵn, không cần sửa gì" ở trên SAI – sau khi
  nhúng `planDetail(pr.p)` vào `#rp-print`, Xuất PDF (`rpExportPdf()`) bị hỏng/cắt cụt vì bảng đó mang theo
  2 đặc điểm chỉ dành cho XEM trên "Kế hoạch dự án"/"Báo cáo dự án", html2canvas (thư viện chụp PDF) không
  xử lý đúng: (1) `.plan-scroll{overflow:auto; max-height:72vh}` – html2canvas chỉ chụp đúng phần đang cuộn
  vào khung nhìn (~72vh) rồi dừng, cắt mất phần bảng còn lại nếu dài hơn; (2) `zoom:${planZoomLevel()}` trên
  `<table>` (CSS `zoom`, không chuẩn) – html2canvas không hỗ trợ, làm sai `getBoundingClientRect()` dùng để
  đo `rowRanges` (tránh ngắt trang giữa 1 hàng), tuỳ mức zoom đang chọn lúc xuất mà ra PDF hỏng/trống khác
  nhau. Sửa trong CHÍNH `onclone` đã có sẵn (không đụng DOM thật đang hiển thị): ép `.plan-scroll` về
  `max-height:none; overflow:visible`, `.plan-grid.tbl-wrap` về `overflow:visible`, mọi phần tử có `zoom`
  inline về `zoom:1`, và mở rộng danh sách ép `position:static` (vốn chỉ có `th`/`thead`) sang thêm
  `.plan-no`/`.plan-dv` (2 cột dính trái của `.plan-grid`, cùng lỗi sticky y hệt thead). Nhớ: BẤT KỲ bảng
  nào khác sau này nhúng vào `#rp-print` mà có cuộn riêng (`overflow:auto`+`max-height`) hoặc `zoom` CSS
  đều cần ép lại y hệt kiểu này trong `onclone`, không tự động hoạt động.
  **CẬP NHẬT TIẾP – lỗi THẬT SỰ làm Xuất PDF báo "Không tạo được file PDF" là lỗi KHÁC**, không phải 2 cái
  ở trên (2 cái đó có thật và vẫn cần sửa, nhưng không phải nguyên nhân gây đứng hẳn/báo lỗi) – đã dùng
  Playwright (headless Chromium, tạo tài khoản test tạm rồi khoá lại ngay sau khi xong) đăng nhập thật, mở
  đúng "Báo cáo dự án", bấm Xuất PDF, đọc `console.error` THẬT thay vì đoán, mới ra đúng nguyên nhân:
  html2canvas@1.4.1 có bộ phân tích CSS riêng, không hiểu hàm màu hiện đại `color-mix()` – gặp đúng
  `.pdetail{background:color-mix(in srgb, var(--paper) 55%, var(--surface))}` (`base.css`, khung ngoài
  `planDetail()` – nay luôn có trong `#rp-print` từ khi nhúng bảng đó vào Báo cáo dự án) thì ném lỗi
  "Attempting to parse an unsupported color function" và DỪNG HẲN, không tạo được canvas nào cả.
  **Lần sửa đầu SAI theo kiểu tinh vi, dễ tưởng đã xong**: nghĩ đọc `getComputedStyle().backgroundColor`
  rồi gán đè làm inline style trong bản sao là đủ ("để trình duyệt tự tính hộ màu cuối") – build/syntax
  không báo lỗi gì, nhưng chạy lại Playwright vẫn THẤY NGUYÊN lỗi cũ: Chromium hiện đại trả
  `getComputedStyle()` của 1 màu sinh từ `color-mix()` ở dạng hàm CSS Color 4 `color(srgb r g b)`, mà
  html2canvas CŨNG không hiểu cú pháp `color(...)` này – chỉ đổi từ 1 hàm màu lạ sang 1 hàm màu lạ khác,
  không giải quyết được gì (đã tự kiểm tra lại bằng Playwright + `getComputedStyle` trần trước khi vá lần
  2, không đoán suông). **Cách sửa ĐÚNG, đã xác nhận lại bằng Playwright thành công** (console in ra
  "Finished rendering", toast đổi thành "Đã xuất file PDF"): vẽ màu đó lên 1 `<canvas>` 1×1 rồi đọc lại
  bằng `getImageData()` – canvas luôn trả về đúng 4 số nguyên 0–255 (R,G,B,A) bất kể trình duyệt biểu diễn
  màu nội bộ kiểu gì, dựng lại thành chuỗi `rgb()`/`rgba()` kinh điển từ 4 số đó rồi mới gán làm inline –
  html2canvas chắc chắn đọc được dạng này. Áp dụng cho `background-color`/`color`/4 cạnh `border-*-color`
  của MỌI phần tử trong `#rp-print` (không chỉ `.pdetail`) để an toàn với mọi hàm màu hiện đại khác có thể
  gặp sau này (oklch/lab/color()…) mà không phải dò từng chỗ một mỗi lần đổi theme. **Bài học**: với lỗi
  parse màu/CSS kiểu này, ĐỪNG tin "đọc computed style rồi gán đè là xong" mà không tự kiểm tra lại
  `getComputedStyle()` thật sự trả về CHUỖI gì trên đúng trình duyệt/phiên bản Chromium đang chạy – các
  phiên bản khác nhau serialize màu khác nhau, suy đoán theo trực giác rất dễ sai mà vẫn tưởng đã sửa xong
  vì code chạy không báo lỗi cú pháp.
  **CẬP NHẬT TIẾP – lỗi THỨ BA, khác hẳn 2 lỗi màu/cuộn dọc ở trên**: sau khi bảng "Đầu việc" có thêm nhiều
  cột (4 cặp ngày, xem mục "tiêu đề cột 2 TẦNG" ở trên), người dùng báo "bảng pdf vẫn có lỗi không hiển thị
  hết nội dung" – ảnh chụp PDF chỉ thấy phần GIỮA/PHẢI của bảng (thiếu hẳn cột No./Đầu việc bên trái, thiếu
  cả vài thẻ KPI đầu dải). **Đã dùng Playwright đo trực tiếp** (không đoán): `.plan-scroll` phải cuộn ngang
  mới xem hết bảng (`scrollWidth 2058` > `clientWidth 1108`), và `html2canvas` log ra "element located at
  …with size 1184x6393" – ĐÚNG BẰNG kích thước khung nhìn `#rp-print` lúc CHƯA sửa, dù bảng thật rộng
  ~2050px. Kết luận: `overflow:visible` (đã set từ trước, xem lỗi cuộn dọc ở trên) chỉ NGỪNG CẮT HÌNH chứ
  KHÔNG làm khung chứa tự GIÃN RỘNG theo nội dung tràn – html2canvas chỉ chụp đúng
  `getBoundingClientRect()` của `#rp-print` tại thời điểm đo (không tự mở rộng theo con tràn ra ngoài), nên
  phần vượt quá luôn bị cắt, bất kể hướng cắt trái/phải phụ thuộc `.plan-scroll.scrollLeft` đang ở đâu lúc
  bấm "Xuất PDF" (test với `scrollLeft=0` cắt mất bên PHẢI của bảng; test với `scrollLeft=900` mô phỏng
  đúng tình huống người dùng gặp – cắt mất bên TRÁI, khớp đúng ảnh chụp họ gửi). **Sửa trong CHÍNH `onclone`
  đã có** (`rpExportPdf()`, `reports.js`): với mỗi `.plan-scroll`, reset `scrollLeft=0` TRƯỚC khi đổi
  `overflow` (để không phụ thuộc vị trí cuộn ngang hiện tại lúc bấm xuất – luôn xuất từ cột đầu tiên), rồi
  ép CẢ CHUỖI khung chứa (`.plan-scroll` → `.plan-grid.tbl-wrap` → `.panel-b` → chính `#rp-print`)
  `width:max-content; max-width:none` – mỗi khung tự co giãn khít theo bề rộng thật của nội dung con thay
  vì bị khoá theo bề rộng khung nhìn của panel. **Đã xác nhận lại bằng Playwright + `pdfjs-dist`/`node-canvas`
  (dựng ảnh PNG thật từ file PDF xuất ra, không chỉ đọc log)**: kích thước `#rp-print` được đo lại tăng từ
  `1184px` → `2132px` (khớp đúng bề rộng bảng thật), và cả 2 tình huống `scrollLeft=0`/`scrollLeft=900`
  trước khi bấm xuất đều cho RA CÙNG kích thước `2132px` (không còn phụ thuộc vị trí cuộn) – ảnh PDF dựng
  lại cho thấy đủ cả 7 thẻ KPI lẫn đủ 16 cột bảng từ No. tới Đánh giá. **Bài học**: `overflow:visible` một
  mình không đủ để "chụp hết nội dung tràn" bằng html2canvas – phải tự ép khung chứa GIÃN RỘNG theo đúng
  nội dung (`width:max-content`), không chỉ gỡ clip; nếu sau này gặp lại kiểu "PDF cắt mất 1 phần bảng
  rộng/cuộn ngang" ở chỗ khác trong `#rp-print`, áp dụng đúng cặp đôi này (reset `scrollLeft` + ép
  `width:max-content` suốt chuỗi tổ tiên tới `#rp-print`), không chỉ đổi `overflow`.
  **Nút "← Quay lại tổng quan"** (trang `ovDetailHeader()` cũ có, bị mất khi bỏ trang đó) đã thêm lại ở
  ngay thanh chọn dự án của `rpProjectContent()` (`reports.js`, cạnh nút "Xuất báo cáo") – dùng thẳng
  `data-act="godash"` có sẵn (giống nút "Xem tất cả" ở Dashboard, `exec-dashboard.js`: `S.view="dash";
  S.projTab="overview"`), không viết action riêng.
  **CẬP NHẬT CUỐI – đã GỘP LẠI THÀNH 1 TRANG "Dự án" DUY NHẤT, đảo ngược phần "đã bỏ hẳn" ở đầu mục này**:
  theo yêu cầu người dùng "kết hợp phần tổng quan và kế hoạch dự án lại làm 1 trang dự án... sẽ không còn
  trang dự án nữa" (ý: không còn kiểu 2 tab ngang "Tổng quan"/"Kế hoạch dự án" như trước đó) – `goplan`
  (`core/events.js`) KHÔNG còn nhảy sang "Báo cáo → Báo cáo dự án" nữa (hành vi mô tả ở đoạn trên đã hết
  hiệu lực), mà quay lại mở trang chi tiết CÙNG `view` "Dự án" (`S.view="dash"`, `project-overview.js`),
  chỉ khác state: `S.projOpenId` (THAY THẾ hẳn `S.projTab`/`S.ovDetailId` cũ – không dùng `S.projTab` nữa
  dù tên state trùng gợi nhớ phần lịch sử ở trên) + bắt buộc đặt kèm `S.planSel` (đọc bởi các nút
  `editp`/`delp`/`addtask`/`task` nằm BÊN TRONG `planDetail(p,true)`, không nhận `data-id` riêng). Cụ thể:
  - `viewProject()` (`project-overview.js`): có `S.projOpenId` → trả `ovDetailHeader(p) + planDetail(p,
    true)` (bảng ĐẦY ĐỦ, sửa/xoá được – giống đúng tab "Kế hoạch dự án" cũ); không có → trả bảng "Tổng
    quan" (`dashContent()`/`ovTable()`) kèm 2 nút **"Nhập Excel"/"+ Dự án mới"** dọn từ `planToolbar()` cũ
    sang ngay hàng lọc/tìm kiếm của `dashContent()`.
  - `ovDetailHeader(p)` **đã PHỤC HỒI** (không phải xoá hẳn như dòng cũ nói) – y hệt bản cũ trước khi bị
    xoá (thanh tóm tắt Dự án/Phụ trách/Tiến độ/Mốc tiếp theo + dải hạng mục + badge quá hạn/sắp hạn), chỉ
    đổi nút cuối từ "← Quay lại tổng quan" sang **"← Quay lại"** (`ACTIONS["ovback"]` cũng phục hồi,
    `S.projOpenId=null`).
  - `planContent()`/`planToolbar()` (`plan.js`, UI card xổ inline kiểu tab cũ) **không ai gọi tới nữa**
    nhưng vẫn giữ nguyên trong file (không xoá, đúng quy ước chung) – đừng tưởng đây là nơi sửa khi cần đổi
    trang "Dự án", code thật đang chạy nằm ở `project-overview.js`.
  - 3 panel Tiến độ theo tuần/Đầu việc khẩn cấp/Mốc thanh toán (dọn sang `rpProjectContent()` ở đoạn trên)
    **giữ nguyên vị trí đó** – KHÔNG dọn ngược lại trang "Dự án" này; trang "Dự án" chỉ dùng `planDetail(p,
    true)` (không có 3 panel, đúng y hệt `extra=true` từ trước tới nay).
  - Chỗ nào còn set `S.projTab="plan"`/`S.projTab="overview"` để điều hướng vào dự án (đã rà + sửa:
    `exec-dashboard.js`, 2 nút "Đi đến xử lý" trong popup xem thông báo) **phải đổi thành `S.projOpenId=
    pid`** (kèm `S.planSel=pid` nếu điều hướng thẳng tới mở `taskForm()`) – `S.projTab` không còn được
    `viewProject()` đọc nữa, set mà không set `S.projOpenId` sẽ mở nhầm về bảng Tổng quan thay vì trang
    chi tiết. Nếu phát hiện thêm chỗ nào khác còn set `S.projTab` khi điều hướng vào 1 dự án, sửa theo
    đúng khuôn này.
  - Bảng "Báo cáo dự án" (`rpProjectContent()`, menu "Báo cáo") **không đổi gì** – vẫn tách bạch hoàn toàn
    với trang "Dự án" ở đây, vẫn chọn dự án qua `<select>` riêng, vẫn gọi `planDetail(pr.p, false, true)`.
- **Tham khảo `ptkt-appv1` cho "giao diện dự án"** *(lịch sử – xem ghi chú cập nhật vị trí ngay trên)*: đã diff `plan.js`/`plan.css`/`project-overview.js` 2 bên
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
- **`planDetail(p, extra)`** (`plan.js`) *(mô tả cả nhánh `extra` falsy – nay không còn nơi gọi, xem ghi
  chú cập nhật vị trí ở trên)* – cùng 1 bảng đầu việc dùng chung ở 2 đường vào khác nhau, nay
  khác nhau về CỘT CUỐI BẢNG: `extra=true` (chỉ gọi từ tab "Kế hoạch dự án", `planContent()`) **THAY** cột
  "Đánh giá" bằng 2 cột **Cảnh báo** (`warnPills(t.warns)`, `core/ui.js` – Quá hạn/Sắp đến hạn/Ma sát cao…,
  rộng cố định `180px`) và **Note** (`t.note` – "Ghi chú của trưởng phòng", sửa qua `taskForm()`) – bỏ hẳn
  "Đánh giá" ở đây vì trùng ý với "Cảnh báo" (chỉ hẹp hơn: so `actEnd`/`deadline`, trong khi Cảnh báo bao
  quát hơn). `extra` để trống/`false` (gọi từ trang chi tiết 1 dự án mở ở tab "Tổng quan" –
  `ovDetailHeader(p)+planDetail(p)`, `project-overview.js`) thì **giữ nguyên cột "Đánh giá"**, KHÔNG có
  Cảnh báo/Note, giữ bảng gọn kiểu xem nhanh/báo cáo. Theo đúng yêu cầu người dùng: "Kế hoạch dự án" là
  bảng làm việc đầy đủ, "Tổng quan → bấm dự án" là bảng xem nhanh. `PLAN_COLS` (hằng số cột cơ bản, gồm cả
  "Đánh giá") cộng `+1` ngay trong `planDetail()` khi `extra` (16→17: bớt 1 "Đánh giá", thêm 2 Cảnh
  báo/Note) để tính đúng `colspan` dòng rỗng. `planTreeRows(p,{cols,extra})` truyền `extra` xuống
  `planTaskRow(t,i,lvl,p,extra)` – nơi nào tự viết `o.row` riêng (thay `planTaskRow` mặc định) mà không
  cần cột cuối này thì cứ bỏ qua tham số thứ 5, không bắt buộc dùng.
  **Màu tiêu đề bảng cũng tách theo `extra`** (`plan.css`): trang "Tổng quan → bấm dự án" (`extra` falsy)
  nhận thêm class `.plan-grid-report` trên khung ngoài (`plan.js`) → tiêu đề đổi sang `#1F4E78` (xanh navy
  đậm) nền/chữ trắng, đọc ĐÚNG bằng ExcelJS từ ô tiêu đề bảng "II. CÁC MỐC CHÍNH CỦA DỰ ÁN" ở sheet `Report`
  của file mẫu thật `Bao cao trien khai LB.NGSI-Viettel_Lydk.xlsx` (`D:\Documents\Code Web\Data_PM\`, ngoài
  repo) – **không phải** màu dải "CHÚ GIẢI GANTT" (xanh dương/tím/xanh lá/vàng/đỏ/cam) nằm phía trên bảng đó
  trong cùng sheet, dễ nhầm nếu chỉ nhìn ảnh chụp màn hình thay vì đọc file thật (đã đọc lại bằng script
  ExcelJS, không đoán theo mắt). Bảng "Kế hoạch dự án" (`extra=true`, không có class `.plan-grid-report`)
  giữ nguyên tiêu đề xanh lá `#D7E8C7` kiểu lưới Excel như cũ, không đổi.
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
  **CẬP NHẬT: `canAct` (biến quyết định có vẽ 3 nút này không) nay thêm điều kiện `extra &&`** – trước chỉ
  check `canManageProject(p)`, nghĩa là ai có quyền sửa dự án vẫn thấy 3 nút chèn/xoá dòng dù đang ở trang
  "Báo cáo dự án" (`planTaskRow(t,i,lvl,p,extra)` gọi từ `planDetail(pr.p,false,true)`, `reports.js` – xem
  "Khung mẫu"/"Bộ công thức sheet Report" ở trên) – trang đó là xem/xuất báo cáo, không phải chỗ sửa dữ
  liệu, theo phản hồi người dùng ("dù sao cũng không sửa được"). Giờ 3 nút chỉ hiện khi `extra=true` (tab
  "Kế hoạch dự án"); muốn chèn/xoá dòng vẫn làm bình thường ở đúng tab đó.
- **Form "Đầu việc" (`taskForm()`, `plan.js`) – ô textarea đầu tiên ĐỔI từ "Nội dung chi tiết" (`task.detail`)
  sang "Note" (`task.note`)**: theo yêu cầu người dùng, nội dung sửa ở ô này giờ là "note" (Ghi chú của
  trưởng phòng), không còn là mô tả tĩnh của đầu việc nữa. `task.detail` **không còn ô nhập** trong form
  (giữ nguyên giá trị cũ khi sửa đầu việc đã có – đọc từ `raw.detail`, không đụng tới – giống hệt cách
  `task.collab` đã làm trước đó), vẫn còn hiển thị ở 2 nơi cũ không đổi (`planTaskRow()` dòng phụ dưới tên
  đầu việc; `openInfo()` mục "Nội dung") nhưng từ nay chỉ là dữ liệu CŨ, không cập nhật thêm được qua UI.
  Ô "Note" mới **`disabled` với người không phải trưởng phòng/phó phòng** (`!S.canEdit`) – máy chủ chặn
  thật (`canWrite()`/PUT `projects`, `backend/server.js`: non-`FULL_ROLES` gửi gì cũng bị ghi đè lại giá
  trị `task.note` cũ) nên nếu không khoá ô này ở giao diện, nhân viên tưởng đã lưu note nhưng thực ra bị
  máy chủ âm thầm bỏ qua – khớp đúng cách `weekly-input.js` đã làm với field "mgrNote" (cùng ghi vào
  `task.note`, 2 đường nhập khác nhau nhưng chung 1 trường, không xung đột).
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
  kể trên. **Đã rẽ nhánh khỏi bản gốc 1 chỗ sau lần đồng bộ**: bề rộng cột sidebar đổi `196px`→`224px`
  (`.app`/`.side-head` ở `base.css`, + `max-width` nhãn menu `160px`→`188px`) để có chỗ cho mục menu xổ mục
  con (`.nav-sub`, xem mục "Cách mở rộng" → "Mục menu trái xổ ra mục con") không bị vỡ chữ – **đừng** copy
  đè lại đúng 196px từ `ptkt-appv1` nếu đồng bộ `base.css` tiếp, trừ khi `ptkt-appv1` cũng đã có nhu cầu
  tương tự và đổi theo.
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

## Tính lại lịch đầu việc theo công thức (`frontend/js/core/schedule.js`, biến `SCHED`) – ĐANG LÀM DẦN
Yêu cầu người dùng: sửa thời gian 1 đầu việc → bấm Lưu → hiện danh sách việc bị ảnh hưởng, chọn "Áp dụng
toàn bộ" / "Chỉ việc này" / "Hủy". Làm theo thứ tự đã thống nhất: (1) engine + test **[XONG]** → (2) form
nhập phụ thuộc + API preview/apply **[XONG]** → (3) modal xem trước **[XONG]** → (4) cảnh báo "Lệch lịch với
việc phụ thuộc" **[XONG]** → (5) "Nhập Excel" đọc công thức để tự gán phụ thuộc + nút gắn lại cho dự án cũ
**[XONG – nhưng 3 dự án thật CHƯA được gắn]**: người dùng tự bấm nút "Gắn phụ thuộc từ Excel" trên từng dự
án (cần đúng file Excel gốc trên máy họ), đã test trên BẢN SAO dự án BRCD rồi xoá.
- **Chuyển công thức Excel → `task.sched`**: `SCHED.fromExcel(rows)` (`core/schedule.js`, có test) – đầu vào
  là công thức + giá trị thô cột F..O từng dòng (`xlsSchedCells()`, `plan.js` – đọc `cell.formula` của ExcelJS
  để lấy cả công thức "shared" đã dịch đúng dòng). Mẫu nhận được ghi ở chú thích hàm; chọn phụ thuộc chung =
  phụ thuộc cùng bộ xuất hiện nhiều nhất, bộ khác đè riêng; ngày Kết thúc gõ tay → khoá. Công thức trỏ tới
  dòng KHÔNG thành đầu việc (No. trống – "Nhập Excel" bỏ các dòng này, vd 44 dòng ở file BRCD) → không gắn
  được, báo ở `stats.missing`. `SCHED.dropCycles()` bỏ phụ thuộc gây vòng (ưu tiên phụ thuộc trỏ lên tổ tiên).
- **Đọc dòng NGSI dùng chung**: `planXlsRows(wb)` + `planReadWorkbook(file)` (`plan.js`) – "Nhập Excel" và nút
  gắn lại khớp dòng ↔ đầu việc theo CÙNG 1 quy tắc lọc dòng. "Nhập Excel" dự án mới nay tự gắn `sched`.
- **Nút "Gắn phụ thuộc từ Excel"** (`data-act="schedxls"`, cạnh "Sửa thông tin" ở trang chi tiết dự án, chỉ
  `canManageProject`; xử lý ở `plan-schedule.js` – `schedAttachExcel()`/`schedAttachConfirm()`): khớp dòng
  với đầu việc theo No. + tên (tiến dần, không quay lại), xem trước thống kê (khớp bao nhiêu dòng, số liên kết
  FS/SS/FF/copy/khoá, dòng không khớp, công thức chưa hỗ trợ/trỏ tới dòng không có, số việc sẽ báo lệch lịch),
  lưu bằng PUT thường và CHỈ ghép trường `sched` vào bản dự án mới nhất (không đổi ngày).
- **Kiểm chứng trên dữ liệu thật** (dry-run 3 file + 3 dự án local): BRCD khớp 121/121, DLP 68/69 (dòng "F
  THANH TOÁN" không còn trên web), LB 08 87/87; 0 vòng; **0 việc lệch lịch sau khi gắn** (công thức tái hiện
  đúng 100% ngày đang lưu). Chưa hỗ trợ (giữ nguyên ngày): `N=M`, `O=L+G`, Kết thúc dòng nhóm = Kết thúc 1 dòng
  con cố định (`I57=I111`), `M=H+G`… (~35 ô/3 file). Sửa "1.2 Mở LC" trên bản sao lan truyền tới 28 việc, phần
  lớn là dòng nhóm lần đầu được tự tính ngày (trước đó trống "–") – đúng quy tắc "tự động tuỳ dòng".
- **Máy chủ** `POST /api/doc/projects/:id/schedule` (`backend/server.js`) – `{mode:"preview"|"apply", task,
  scope:"all"|"self", force, baseVersion}`, `task` = TOÀN BỘ đầu việc sau khi sửa ở form. Máy chủ `require`
  đúng `core/schedule.js` và TỰ TÍNH LẠI từ bản đang lưu (không tin client), tự suy trạng thái từng việc từ
  `weeks` (`taskStatusMap()`, cùng cách `derive()`), lọc `sched` qua `SCHED.sanitize()`, bỏ `note`/`eval` với
  nhân viên (giống PUT). Chặn ghi đè: `version` = sha1 nội dung tài liệu dự án lúc xem trước (`docVersion()`,
  không thêm cột CSDL), apply mà khác → 409 "xem trước lại". Đọc→kiểm→ghi chạy trong `withDocLock(path)`
  (khoá tuần tự trong bộ nhớ – máy chủ 1 tiến trình); PUT chung cũng đã bọc khoá này + lọc `task.sched`. Cả
  dự án là 1 bản ghi nên 1 lần upsert là nguyên tử. Vòng phụ thuộc → 422 kèm `taskIds`.
- **Lịch sử thay đổi**: bảng `audit` chỉ có `path` 255 ký tự nên chỉ ghi `action="schedule-all|self"`,
  `path="projects/<id>#<taskId>"`; chi tiết (ai, lúc nào, chọn toàn bộ/chỉ việc này, từng ô cũ→mới, bỏ qua,
  ghi chú khoá) lưu tài liệu `schedLog/<dự án>__<ms>` – CỐ Ý không thêm vào `RULES`/`COLLECTIONS` (nên không
  ai PUT/DELETE/GET qua API chung được, chỉ máy chủ ghi), riêng `/api/restore` cho phép giữ lại `schedLog`.
  Chưa có giao diện xem lại lịch sử này.
- **Giao diện** `frontend/js/views/plan-schedule.js` (nạp ngay sau `plan.js`): `schedSave()` (xem trước → không
  việc nào khác bị ảnh hưởng thì lưu luôn, có thì `schedPreviewModal()`), modal tự gắn lớp riêng vào `body`
  (z-index 35/36, KHÔNG dùng `#layer` vì form đầu việc đang mở trong đó; Esc bắt ở capture +
  `stopImmediatePropagation` để không đóng luôn form phía sau). Modal: dòng việc đang sửa nổi bật đầu tiên,
  còn lại gom theo nhóm cấp chữ cái/La Mã, chênh lệch đỏ (muộn hơn)/xanh (sớm hơn), mục "Không tự đổi" kèm
  lý do, báo ngày kết thúc dự án có đổi không. "Hủy" → đóng và MỞ LẠI form với giá trị trước khi sửa. Lưu
  xong nháy sáng các dòng đổi (`S.schedFlash`, lớp `.plan-flash` ở `planTaskRow()`).
- **`taskForm()`** (`plan.js`): thêm "Việc phụ thuộc" (`search`, nhãn theo `pathNo`), "Kiểu phụ thuộc",
  "Lệch (ngày)", "Cách tính ngày" cho HĐ/HĐ điều chỉnh/Dự kiến (Theo công thức | Nhập tay (khoá); "Khoá 1 ô"
  chỉ hiện khi đang khoá đúng 1 ô) kèm mô tả quy tắc riêng từng bộ (`schedRuleHint()` – form CHƯA có ô sửa
  quy tắc riêng, chỉ giữ nguyên), "Dòng nhóm" (Tự tính từ việc con | Có thời gian riêng – chỉ hiện với dòng
  có con). Dòng nhóm tự tính → khoá các ô ngày/Số ngày/phụ thuộc. CHỈ khi đổi ngày/Số ngày/phụ thuộc/khoá
  (`schedTouched()`) mới đi đường mới; sửa thứ khác vẫn `saveProject()` như cũ (đã thêm giữ `sched`).
  Có lệch lịch → khung vàng trong form + nút "Đồng bộ lại theo công thức" (`extraBtn` → `schedSync()`,
  `force:true`). Cảnh báo bảng: `derive()` thêm `["warn","Lệch lịch với việc phụ thuộc"]` từ `SCHED.drift()`.
- Đã kiểm thử thật bằng Playwright trên 1 dự án test tạm (đã xoá): 9 kịch bản (Áp dụng toàn bộ, Chỉ việc
  này + cảnh báo, Đồng bộ lại, Hủy, không ảnh hưởng thì lưu luôn, vòng phụ thuộc, dòng nhóm khoá ô, sửa
  thứ khác đi đường cũ, 409 khi dữ liệu đổi sau xem trước) – đều đạt.
- **Phát hiện ngoài phạm vi, CHƯA sửa**: `RULES.kpiReview = "server"` thực tế KHÔNG chặn được tài khoản
  `FULL_ROLES` vì `canWrite()` trả `true` cho `FULL_ROLES` trước khi xét rule – trưởng/phó phòng vẫn PUT/
  DELETE thẳng `kpiReview` được (khác mô tả ở mục KPI bên dưới). Sửa thì thêm `if (rule === "server")
  return false;` lên đầu `canWrite()` – chờ người dùng quyết.
- **Quy tắc lấy từ công thức thật của 3 file Excel** (`D:\Documents\Code Web\Data_PM\*.xlsx`, sheet NGSI –
  đã đếm toàn bộ ô bằng ExcelJS, không đoán): Kết thúc = Bắt đầu + Số ngày (`I=H+F`, `K=J+F`, `M=L+G`;
  `END_OFFSET=0` = "N ngày sau", người dùng đã chốt); F (`daysActual`) dùng cho HĐ + HĐ điều chỉnh, G
  (`daysProposed`) cho Dự kiến + Thực tế. Phụ thuộc giữa dòng luôn trong CÙNG bộ kế hoạch: FS (`H=I[trước]`,
  phổ biến nhất), SS (`H=H[trước]` – thường là con theo cha), lệch ngày (`L=M[trước]+2`, hiếm), FF (`H=I−F`
  với `I=I[khác]`, 6 ô). Giữa các bộ trong cùng dòng: copy (`J=H`, `L=H`/`L=J`, `N=L`, `O=M`). Việc trước có
  thể cách xa hàng trăm dòng và có dòng dùng việc trước KHÁC NHAU cho từng bộ → mô hình "dùng chung + cho đè
  riêng từng bộ". Dòng nhóm trong Excel KHÔNG nhất quán (có nhóm tự tính từ con, có nhóm có Số ngày riêng
  kiểu "từ trên xuống" như "F. Triển khai = 227 ngày") → người dùng chọn "tự động tuỳ dòng": nhóm KHÔNG có
  F/G → MIN/MAX của con (ghi luôn F/G + `sched.kind="summary"` để lần sau không bị hiểu nhầm thành "có Số
  ngày riêng"); nhóm CÓ F/G → việc thường.
- **Lưu ý nhãn**: cột F của Excel tên là "Theo Hợp đồng" nhưng web đang hiện nhãn "Theo thực tế" cho
  `daysActual` (`plan.js`/`reports.js`) – CHƯA đổi nhãn (chờ người dùng quyết), chỉ ghi nhận.
- **Phân cấp cha-con suy từ cột No. lúc chạy** (`SCHED.tree()`), KHÔNG lưu `parentId`, không sửa dữ liệu
  cũ – sửa No. là cấp đổi theo (người dùng chốt). Cấp: chữ cái 1 (trừ I/V/X – luôn là La Mã, cùng quy ước
  `msLetterNo()` ở `model.js`, đổi 1 nơi phải đổi cả 2) → La Mã 2 → `1` 3 → `1.1` 4 → … (`1.1.1.1` = 6, có
  thật trong dự án DLP). Cha = dòng gần nhất phía trên có cấp nhỏ hơn; No. trống/chữ tự do = con của dòng có
  số gần nhất phía trên và KHÔNG làm cha của dòng trống kế tiếp. Khác hẳn heuristic cũ đã bỏ (xem "Khung
  mẫu"): không đoán theo ngữ cảnh, số chấm quyết định cấp nên không mơ hồ.
- **Dữ liệu mới `task.sched`** (tuỳ chọn – việc cũ không có = không phụ thuộc, hành vi y như trước): `pred`/
  `type` (FS/SS/FF)/`lag` dùng chung 4 bộ; `plans.{hd|adj|exp|act}.start|end` ghi đè từng bộ (`dep`/`copy`/
  `dur` có `src`/`days`); `lock.{trường ngày}` = nhập tay, không bị lan truyền ghi đè; `kind`.
- **Engine chỉ tính lại phần BỊ ẢNH HƯỞNG** (`recalc(tasks, edit, opts)`): nút (việc|bộ) chỉ tính lại khi là
  bộ vừa sửa của việc đang sửa hoặc có đầu vào vừa ĐỔI GIÁ TRỊ, theo thứ tự topo → dữ liệu cũ lệch công thức
  không bị "sửa hộ". Form gửi cả bộ trường nên engine tự so với giá trị cũ, chỉ trường khác mới tính là sửa.
  Sửa Kết thúc ở bộ chủ của Số ngày (HĐ cho F, Dự kiến cho G) → tính lại Số ngày; sửa Kết thúc HĐ điều chỉnh
  → KHOÁ ô đó, KHÔNG đổi F (nếu không sửa ngày điều chỉnh sẽ kéo dịch luôn Kế hoạch theo HĐ gốc – lệch có chủ
  đích so với tài liệu yêu cầu, đã ghi chú để báo người dùng). Sửa tay Bắt đầu của việc đang có phụ thuộc →
  tự khoá ô đó (`notes` trả về để hiện cho người dùng biết). Thực tế: đã có giá trị = khoá; việc "Hoàn
  thành" (`opts.status`) không bao giờ đổi ngày thực tế; ô trống vẫn được điền theo quy tắc (hiện ở xem
  trước để người dùng chọn). `opts.scope="self"` = "Chỉ việc này" (bỏ cạnh `dep`, vẫn cập nhật dòng nhóm
  cha); `opts.force` = "Đồng bộ lại theo công thức"; `drift()` cho cảnh báo lệch lịch. Vòng phụ thuộc (kể cả
  con SS theo nhóm tự tính – nhóm lấy MIN của con nên thành vòng) → `{ok:false, error:{type:"cycle"}}`.
- **Ngày**: chuỗi `YYYY-MM-DD` quy về số ngày UTC trong `addDays`/`diffDays` riêng của file này (KHÔNG dùng
  `parse()` giờ địa phương của `utils.js`) – không lệch theo múi giờ; đổi sang ngày làm việc chỉ sửa 2 hàm đó.
- File chạy được cả Node (`require`) để máy chủ tính lại ở bước (2); nạp trong `index.html` ngay trước
  `model.js`. Test: `tests/schedule.test.js` bằng `node:test` có sẵn (repo không có framework test nào,
  người dùng chọn không cài thêm) – chạy `npm test`.

## Lệnh
- Máy cá nhân: `.env` đặt `DB_CLIENT=sqlite`, `DATA_DIR=./data`.
- Test engine tính lịch: `npm test` (`node --test`, không cần cài gì thêm).
- Chạy phát triển (tự khởi động lại khi sửa backend/server.js): `npm run dev` → http://127.0.0.1:3000
- Tạo tài khoản: `npm run user -- create`
- Kiểm tra cú pháp: `node --check backend/server.js` và `for f in frontend/js/**/*.js; do node --check "$f"; done`

## Triển khai
Máy chủ thật: mã ở `/opt/ptkt`, CSDL MariaDB `ptkt` (user `ptkt`@localhost), dịch vụ systemd `ptkt`, Nginx. Quy trình cập nhật: sao lưu (`deploy/backup.sh`) → chép mã mới vào `/opt/ptkt` (giữ `.env` và dữ liệu) → `npm ci --omit=dev` → `systemctl restart ptkt`. Luôn sao lưu trước khi cập nhật.

**NGSI-PMv1 (web này) đã triển khai thật trên CÙNG máy chủ** (`192.168.11.205`), cổng ngoài **8081** (thay
hẳn "PMIS" – hệ thống FastAPI của đội khác từng chạy ở cổng này, đã sao lưu đầy đủ trước khi gỡ – xem lịch
sử phiên làm việc nếu cần khôi phục): mã ở `/opt/ngsi`, CSDL MariaDB `ngsi` (user `ngsi`@localhost), dịch vụ
systemd `ngsi`, Nginx site `/etc/nginx/sites-available/ngsi` (proxy `8081` → Node nội bộ `127.0.0.1:3001`,
y hệt mẫu site `ptkt`/8080→3000). Mọi thứ dựng theo **đúng khuôn mẫu `ptkt`** ở trên, kể cả cơ chế cập nhật.
**Tên gọi tách hẳn khỏi `ptkt`** (yêu cầu người dùng, tránh nhầm "web Kỹ thuật"/"web PM" dù cùng công ty
NGSI, đứng cùng máy chủ): `package.json` (`name`/`description`), `README.md` (tiêu đề) đổi từ "ptkt"/"Phòng
Kỹ thuật" sang "ngsi-pm"/"Phòng Quản lý dự án"; `deploy/` có bản riêng cho app này – `deploy/ngsi.service`
(thay `deploy/ptkt.service` cũ, đã xoá), `deploy/nginx-ngsi.conf` (thay `deploy/nginx-ptkt.conf` cũ, đã
xoá), `deploy/post-receive`/`deploy/backup.sh` sửa thẳng nội dung sang `ngsi`/`/opt/ngsi`/port `8081`.
`deploy/check-ha.sh` và `deploy/nginx-ptkt-a10.conf` **giữ nguyên tên + nội dung ptkt** (mô tả cụm 2 máy
SERVER3/SERVER4 của riêng `ptkt`, `ngsi` chỉ chạy 1 máy, không có HA) – đã thêm dòng chú thích đầu file nói
rõ "chỉ dành cho ptkt, không áp dụng cho ngsi", không xoá vì có thể cần đối chiếu nếu `ngsi` lên HA sau này.
- **Git-push-to-deploy** (giống `ptkt`): bare repo `/opt/ngsi-repo.git` (user hệ thống `ngsi`, shell
  `/bin/bash`, khoá SSH riêng `~/.ssh/authorized_keys` của `ngsi`) + hook `hooks/post-receive` (bản sao của
  `deploy/post-receive` trong repo này – đã sửa sẵn `BRANCH="main"`/`TARGET="/opt/ngsi"`/restart `ngsi`,
  không cần tự đổi tay nữa). Máy cá nhân đã cấu hình sẵn: khoá riêng `~/.ssh/ngsi_deploy`, alias
  `Host ngsi-deploy` trong `~/.ssh/config` (trỏ `192.168.11.205`, user `ngsi`), git remote `ngsi` trỏ
  `ngsi-deploy:/opt/ngsi-repo.git`. Cập nhật mã: `git push ngsi main` – hook tự `checkout -f` vào
  `/opt/ngsi`, `npm ci --omit=dev`, restart dịch vụ (sudoers riêng `ngsi ALL=(root) NOPASSWD:
  /bin/systemctl restart ngsi`, không cần mật khẩu). `.env`/CSDL không hề bị đụng tới mỗi lần push.
  **Lỗi đã gặp 1 lần khi mới dựng**: hook ghi log qua `exec >>"$LOG"` với `LOG="/var/log/ngsi-deploy.log"`
  – file này **chưa tồn tại** lúc tạo hook, user `ngsi` không có quyền tự tạo file mới trong `/var/log`
  (thư mục root sở hữu) nên bước `exec` đầu tiên lỗi "Permission denied" và **toàn bộ hook dừng ngay lập
  tức** (không checkout/không restart gì cả) dù `git push` vẫn báo thành công bình thường (refs đã cập
  nhật ở bare repo, chỉ hook chạy sau đó mới hỏng) – dễ gây hiểu lầm "đã push nhưng server không đổi gì".
  Đã sửa: tạo sẵn `/var/log/ngsi-deploy.log` (chown `ngsi:ngsi`) 1 lần, không còn tái diễn cho các lần
  push sau. Nếu dựng thêm bare repo tương tự cho web khác, nhớ tạo sẵn file log trước (hoặc đổi hook không
  `exec` ra file log nữa) để tránh đúng lỗi này.
- Tài khoản quản trị đầu tiên của `ngsi` tạo qua `npm run user -- create` ngay sau khi seed CSDL lần đầu –
  không ghi lại thông tin đăng nhập ở đây (không commit bí mật vào repo); nếu quên, dùng `npm run user --
  reset-password` trên server (`cd /opt/ngsi && node --env-file=.env backend/scripts/manage-user.js
  reset-password`).
