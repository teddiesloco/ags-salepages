/**
 * AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
 * BỘ BACKEND 0 ĐỒNG: GOOGLE APPS SCRIPT + GOOGLE SHEETS + SEPAY VIETQR WEBHOOK
 * Dùng cho: Giải chạy bộ (Marathon/Trail/Fun Run), Giải Pickleball, Bán vé Workshop/Sự kiện.
 *
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT:
 * 1. Tạo 1 file Google Sheets mới, đặt tên Sheet đầu tiên là: DanhSachVDV
 * 2. Tạo dòng tiêu đề (Hàng 1) gồm 12 cột (A -> L):
 *    A: ThoiGian | B: MaDon | C: SoBIB | D: CuLy | E: SoTien | F: HoTen | G: SDT | H: Email | I: SizeAo | J: NhomMau | K: CLB | L: TrangThai
 * 3. Vào Tiện ích mở rộng (Extensions) -> Apps Script -> Dán toàn bộ code này vào.
 * 4. Bấm Triển khai (Deploy) -> Tệp triển khai mới (New deployment) -> Ứng dụng Web (Web App):
 *    - Thực thi dưới dạng: Tôi (Me)
 *    - Ai có quyền truy cập: Bất kỳ ai (Anyone)
 * 5. Copy URL Web App:
 *    - Dán vào biến GOOGLE_SCRIPT_WEBAPP_URL trong file index.html
 *    - Đồng thời dán vào mục Webhook URL trên trang quản trị SePay (https://my.sepay.vn)
 */

const SHEET_NAME = 'DanhSachVDV';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'ThoiGian', 'MaDon', 'SoBIB', 'CuLy', 'SoTien',
        'HoTen', 'SDT', 'Email', 'SizeAo', 'NhomMau', 'CLB', 'TrangThai'
      ]);
    }

    const body = JSON.parse(e.postData.contents || '{}');

    // LUỒNG 1: Người đăng ký điền form từ Landing Page
    if (body.action === 'register_runner') {
      sheet.appendRow([
        new Date(),
        body.orderCode || '',
        body.bibNumber || '',
        body.tier || '',
        Number(body.amount || 0),
        body.fullName || '',
        "'" + String(body.phone || ''),
        body.email || '',
        body.shirtSize || '',
        body.bloodType || '',
        body.club || '',
        'CHO_THANH_TOAN'
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'registered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // LUỒNG 2: Webhook từ SePay bắn về khi khách quét mã VietQR chuyển khoản thành công
    const transferContent = String(body.content || body.description || '').toUpperCase();
    const transferAmount = Number(body.transferAmount || body.amount || 0);

    if (transferContent && transferAmount > 0) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const orderCode = String(rows[i][1] || '').toUpperCase();
        const expectedAmount = Number(rows[i][4] || 0);
        const currentStatus = String(rows[i][11] || '');

        if (orderCode && transferContent.indexOf(orderCode) !== -1 && transferAmount >= expectedAmount && currentStatus !== 'DA_THANH_TOAN') {
          sheet.getRange(i + 1, 12).setValue('DA_THANH_TOAN');
          const bibNumber = rows[i][2];
          const runnerName = rows[i][5];
          const runnerEmail = rows[i][7];
          const tier = rows[i][3];

          // Tự động gửi Email vé điện tử kèm mã QR Check-in nhận túi Race-kit
          if (runnerEmail) {
            const ticketQr = 'https://quickchart.io/qr?size=260&text=' + encodeURIComponent('TICKET:' + orderCode + '|BIB:' + bibNumber + '|NAME:' + runnerName);
            MailApp.sendEmail({
              to: runnerEmail,
              subject: '[XÁC NHẬN VÉ & SỐ BIB #' + bibNumber + '] Đăng ký thành công cự ly ' + tier,
              htmlBody:
                '<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e2e2da;border-radius:16px;">' +
                '<h2 style="color:#1f6f3d;">Chúc mừng ' + runnerName + ' đã đăng ký thành công!</h2>' +
                '<p>Hệ thống đã nhận được thanh toán của bạn. Dưới đây là thông tin Vận Động Viên chính thức:</p>' +
                '<ul>' +
                '<li><strong>Mã đơn:</strong> ' + orderCode + '</li>' +
                '<li><strong>Số BIB chính thức:</strong> <span style="font-size:20px;font-weight:bold;color:#ea580c;">#' + bibNumber + '</span></li>' +
                '<li><strong>Cự ly / Hạng vé:</strong> ' + tier + '</li>' +
                '<li><strong>Size áo:</strong> ' + rows[i][8] + '</li>' +
                '</ul>' +
                '<p>Vui lòng đưa mã QR Ticket bên dưới tại quầy Check-in để nhận túi Race-Kit (Áo, BIB, Huy chương):</p>' +
                '<img src="' + ticketQr + '" alt="QR Ticket" style="display:block;margin:16px 0;" />' +
                '<p style="font-size:12px;color:#666;">Hệ thống vé tự động bởi AgentSea AGS-Salepages (agentsea.vn)</p>' +
                '</div>'
            });
          }

          return ContentService.createTextOutput(JSON.stringify({ ok: true, matchedOrder: orderCode, bib: bibNumber }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'ignored' }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
