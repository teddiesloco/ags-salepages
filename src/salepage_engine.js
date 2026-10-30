// Copyright AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveOriginSeal, embedZeroWidthWatermark } from './ags_provenance.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

// 24 Original Page-Template Routes extracted from ABS OS KIT
export const ABS_ORIGINAL_ROUTES = Object.freeze([
  { id: 'T01', name: 'Proof-first service', fit: 'Consulting/agency', spine: 'proof → problem → method → CTA', style: 'editorial, restrained', templateId: '03-longform-sales-letter' },
  { id: 'T02', name: 'Outcome-first service', fit: 'Clear transformation offer', spine: 'outcome → mechanism → scope → CTA', style: 'high-contrast, focused', templateId: '03-longform-sales-letter' },
  { id: 'T03', name: 'Expert authority', fit: 'Coach/creator', spine: 'viewpoint → proof → offer → FAQ', style: 'warm editorial', templateId: '02-vsl-conversion-funnel' },
  { id: 'T04', name: 'Workshop/event ticketing', fit: 'Marathon/Pickleball/Webinar/Offline event', spine: 'promise → distance/tier → VietQR SePay → BIB ticket', style: 'energetic calendar-led', templateId: '01-event-ticketing-sepay' },
  { id: 'T05', name: 'Application funnel', fit: 'High-ticket service', spine: 'qualification → fit → process → apply', style: 'premium minimal', templateId: '03-longform-sales-letter' },
  { id: 'T06', name: 'Lead magnet', fit: 'Checklist/report/template', spine: 'pain → quick win → preview → capture', style: 'utility-first', templateId: '06-showroom-portfolio-lead' },
  { id: 'T07', name: 'Product launch', fit: 'New digital product', spine: 'reveal → demo → benefits → buy', style: 'product-led motion', templateId: '02-vsl-conversion-funnel' },
  { id: 'T08', name: 'Course enrollment', fit: 'Cohort/course', spine: 'result → curriculum → proof → enroll', style: 'structured learning', templateId: '02-vsl-conversion-funnel' },
  { id: 'T09', name: 'Membership', fit: 'Community/subscription', spine: 'belonging → cadence → benefits → join', style: 'social/ambient', templateId: '02-vsl-conversion-funnel' },
  { id: 'T10', name: 'SaaS waitlist', fit: 'Early software', spine: 'job-to-be-done → UI preview → waitlist', style: 'technical clean', templateId: '06-showroom-portfolio-lead' },
  { id: 'T11', name: 'SaaS pricing', fit: 'Mature software', spine: 'value → plans → comparison → CTA', style: 'decisive grid', templateId: '02-vsl-conversion-funnel' },
  { id: 'T12', name: 'AI tool', fit: 'AI workflow product', spine: 'before/after workflow → demo → trust', style: 'luminous technical', templateId: '02-vsl-conversion-funnel' },
  { id: 'T13', name: 'Ecommerce hero', fit: 'One hero product', spine: 'desire → product proof → purchase', style: 'tactile commerce', templateId: '05-ecom-flash-sale-cod' },
  { id: 'T14', name: 'Ecommerce bundle', fit: 'Kit/multi-item offer', spine: 'bundle value → contents → savings → buy', style: 'catalog modular', templateId: '05-ecom-flash-sale-cod' },
  { id: 'T15', name: 'Beauty/wellness', fit: 'Spa/Clinic/Routine/Service', spine: 'concern → ritual → proof → book', style: 'soft premium', templateId: '04-spa-clinic-resort-booking' },
  { id: 'T16', name: 'Food/local', fit: 'Restaurant/F&B', spine: 'craving → menu → location → order', style: 'warm sensory', templateId: '04-spa-clinic-resort-booking' },
  { id: 'T17', name: 'Real estate & Resort', fit: 'Property/Resort/Villa', spine: 'property story → specs → tour CTA', style: 'cinematic editorial', templateId: '04-spa-clinic-resort-booking' },
  { id: 'T18', name: 'Professional firm', fit: 'Legal/finance/B2B', spine: 'risk → credibility → process → consult', style: 'institutional calm', templateId: '03-longform-sales-letter' },
  { id: 'T19', name: 'Community race & cause', fit: 'Fun run/charity event', spine: 'stakes → route → impact → register', style: 'human documentary', templateId: '01-event-ticketing-sepay' },
  { id: 'T20', name: 'Portfolio studio & Showroom', fit: 'Design/furniture/auto showroom', spine: 'selected work → approach → contact', style: 'gallery-led', templateId: '06-showroom-portfolio-lead' },
  { id: 'T21', name: 'Personal portfolio', fit: 'Creator/freelancer', spine: 'thesis → work → services → contact', style: 'personal editorial', templateId: '06-showroom-portfolio-lead' },
  { id: 'T22', name: 'Comparison/alternative', fit: 'Switch/migration offer', spine: 'old cost → new path → compare → switch', style: 'contrast-led', templateId: '03-longform-sales-letter' },
  { id: 'T23', name: 'FAQ rescue page', fit: 'Objection-heavy offer', spine: 'questions → answers → proof → CTA', style: 'utility clarity', templateId: '03-longform-sales-letter' },
  { id: 'T24', name: 'Long-form direct response', fit: 'High-consideration offer', spine: 'hook → story → mechanism → proof → offer → CTA', style: 'narrative scrolling', templateId: '03-longform-sales-letter' },
]);

export const TEMPLATE_ARCHITECTURES = Object.freeze({
  '01-event-ticketing-sepay': {
    id: '01-event-ticketing-sepay',
    title: 'Mini Event Ticketing Engine (Giải Chạy Bộ / Pickleball / Workshop + SePay VietQR + Google Sheets)',
    category: 'event_ticketing',
    bestFor: ['Giải chạy Marathon/Trail/Fun Run', 'Giải Pickleball/Bóng đá', 'Vé Workshop/Hội thảo/Concert', 'Sự kiện nội bộ công ty'],
    features: ['Chọn cự ly/hạng vé & size áo', 'Tự sinh VietQR SePay đúng cú pháp', 'Google Apps Script tự đổi trạng thái & cấp mã BIB', '0% phí sàn trung gian'],
  },
  '02-vsl-conversion-funnel': {
    id: '02-vsl-conversion-funnel',
    title: 'VSL Conversion Funnel (Trang Video Bán Hàng + Value Stack Hormozi)',
    category: 'vsl_funnel',
    bestFor: ['Khóa học Online', 'Coaching 1-1', 'Phần mềm SaaS / AI Tool', 'Sản phẩm số'],
    features: ['Khung Video 16:9 tập trung', 'Kịch bản VSL 4 nhịp đi kèm', 'Bảng cộng dồn giá trị quà tặng (Value Stack)', 'Thanh toán VietQR & Zalo'],
  },
  '03-longform-sales-letter': {
    id: '03-longform-sales-letter',
    title: 'Long-form Direct-Response Sales Letter (8 Khối Bất Biến ABS OS)',
    category: 'longform_sales',
    bestFor: ['Dịch vụ High-Ticket', 'Tư vấn doanh nghiệp B2B', 'Giải pháp trọn gói DFY', 'Bất động sản'],
    features: ['Đủ 8 khối bán hàng chuẩn tâm lý người Việt', '3 tình huống nỗi đau có giờ giấc', 'Đối thoại xử lý 3 câu chê giá', 'Cam kết đảo ngược rủi ro'],
  },
  '04-spa-clinic-resort-booking': {
    id: '04-spa-clinic-resort-booking',
    title: 'Spa, Clinic & Resort Luxury Booking (Đặt Lịch Hẹn & Giữ Phòng)',
    category: 'booking_service',
    bestFor: ['Spa / Thẩm mỹ viện', 'Nha khoa / Phòng khám', 'Resort / Villa / Homestay', 'Nhà hàng Fine Dining'],
    features: ['Thẩm mỹ Warm Editorial sang trọng', 'Bảng chọn liệu trình / hạng phòng minh bạch', 'Chọn ngày giờ giữ chỗ', 'Đẩy lịch hẹn thẳng về Zalo'],
  },
  '05-ecom-flash-sale-cod': {
    id: '05-ecom-flash-sale-cod',
    title: 'E-commerce Flash Sale & Combo Builder (Chốt Đơn Nhanh COD + VietQR)',
    category: 'ecommerce',
    bestFor: ['Thời trang / Mỹ phẩm', 'Đồ gia dụng / Công nghệ', 'Thực phẩm / Đặc sản', 'Quà tặng doanh nghiệp'],
    features: ['Bảng chọn Combo mua nhiều giảm sâu', 'Đồng hồ đếm ngược Flash Sale', 'Form đặt hàng 3 ô tối ưu Mobile', 'Ưu đãi giảm thêm khi quét VietQR'],
  },
  '06-showroom-portfolio-lead': {
    id: '06-showroom-portfolio-lead',
    title: 'Showroom, Portfolio & HVCO Lead Magnet (Trưng Bày & Thu Phễu Khách Hàng)',
    category: 'showroom_lead',
    bestFor: ['Showroom Nội thất / Ô tô', 'Studio Kiến trúc / Thiết kế', 'Chuyên gia / Agency Portfolio', 'Tặng Ebook / Báo cáo thu Lead'],
    features: ['Bố cục Gallery Clean-Room sắc nét', 'Hộp khóa nhận báo giá / tài liệu (Lead Gate)', 'Tự động tải tài liệu & dẫn vào Nhóm Zalo VIP', 'Chuẩn SEO & Mobile-first'],
  },
});

export const INTERVIEW_QUESTIONS = Object.freeze([
  {
    step: 1,
    id: 'offer_and_pricing',
    question: 'Bạn đang bán sản phẩm, dịch vụ hay vé sự kiện gì? Giá bao nhiêu và khách nhận được kết quả cụ thể gì?',
    hint: 'Ví dụ: Giải chạy Fun Run 299k tặng áo + huy chương; hoặc Khóa học AI 1.990k giúp tiết kiệm 2 giờ/ngày.',
  },
  {
    step: 2,
    id: 'pain_and_objections',
    question: 'Khách hàng đang gặp nỗi đau nào khó chịu nhất và 3 câu họ hay dùng để chê/từ chối mua là gì?',
    hint: 'Ví dụ: Sợ không có thời gian, sợ khó dùng, sợ chuyển khoản xong không ai hỗ trợ.',
  },
  {
    step: 3,
    id: 'architecture_and_taste',
    question: 'Bạn muốn dùng kiến trúc trang nào trong 6 mẫu (01 Bán vé sự kiện, 02 Video VSL, 03 Thư bán hàng 8 khối, 04 Đặt lịch Spa/Resort, 05 Ecom Flash Sale, 06 Showroom/Thu Lead)?',
    hint: 'Nếu chưa rõ, AI sẽ tự động chọn kiến trúc tối ưu nhất theo ngành của bạn.',
  },
  {
    step: 4,
    id: 'payment_and_zalo',
    question: 'Khi khách bấm nút chốt đơn, bạn muốn thu tiền qua VietQR SePay (kèm Google Sheets), điền form COD hay mở thẳng Zalo?',
    hint: 'Cung cấp mã ngân hàng (VD: MB, VCB), số tài khoản và SĐT Zalo của bạn để gắn thẳng vào trang.',
  },
]);

export function assertValidRepoOrigin(rootDir = ROOT) {
  const origin = deriveOriginSeal(rootDir);
  if (!origin.validOrigin) {
    throw new Error(
      'AGS_PROVENANCE_TAMPERED: Repository origin seal invalid. Please fork directly from https://github.com/teddiesloco/ags-salepages and preserve NOTICE & LICENSE.'
    );
  }
  return origin;
}

export function buildHormoziOffer({
  productName = 'Giải Pháp Cốt Lõi',
  priceVnd = 499000,
  anchorPriceVnd = null,
  dreamOutcome = 'Đạt kết quả rõ ràng ngay trong tuần đầu tiên',
  timeDelay = 'Triển khai trong 15 phút',
  effortRequired = 'Làm theo mẫu có sẵn, không cần biết kỹ thuật',
  bonuses = [
    { title: 'Quà tặng #1: Bộ Checklist & Mẫu Thực Hành Nhanh', valueVnd: 500000 },
    { title: 'Quà tặng #2: Vé tham gia Nhóm Zalo Hỗ Trợ Thực Chiến', valueVnd: 1000000 },
  ],
  guarantee = 'Cam kết đồng hành hỗ trợ 1-1 cho đến khi ra kết quả thực tế.',
  scarcity = 'Giới hạn 50 suất ưu đãi trong đợt mở đăng ký này.',
} = {}) {
  const numPrice = Number(priceVnd) || 0;
  const bonusTotal = bonuses.reduce((sum, b) => sum + (Number(b.valueVnd) || 0), 0);
  const computedAnchor = Number(anchorPriceVnd) || Math.max(numPrice * 3, numPrice + bonusTotal);
  const savingsVnd = Math.max(0, computedAnchor - numPrice);
  const savingsPercent = computedAnchor > 0 ? Math.round((savingsVnd / computedAnchor) * 100) : 0;

  return {
    productName,
    priceVnd: numPrice,
    anchorPriceVnd: computedAnchor,
    savingsVnd,
    savingsPercent,
    valueEquation: {
      dreamOutcome,
      perceivedLikelihood: 'Bằng chứng thực tế & Quy trình từng bước',
      timeDelay,
      effortRequired,
    },
    bonuses,
    guarantee,
    scarcity,
    summaryVi: `Đầu tư ${numPrice.toLocaleString('vi-VN')}đ (Tổng giá trị ${computedAnchor.toLocaleString('vi-VN')}đ — Tiết kiệm ${savingsPercent}%) để đạt: ${dreamOutcome}.`,
  };
}

export function generateVslScript({
  productName = 'Giải Pháp Chuyển Đổi Số',
  targetAudience = 'chủ doanh nghiệp và người kinh doanh tự do',
  painPoint = 'mất hàng giờ mỗi ngày trả lời khách thủ công nhưng vẫn rớt đơn',
  mechanismName = 'Hệ thống Tự động hóa 3 Bước',
  dreamOutcome = 'tự động thu lead, chốt đơn và chăm sóc khách 24/7',
  priceVnd = 499000,
  guarantee = 'Hỗ trợ cài đặt tận tay cho đến khi chạy mượt',
  ctaText = 'Bấm nút đăng ký ngay bên dưới video này',
} = {}) {
  return {
    durationSeconds: 120,
    beats: [
      {
        beat: '1. HOOK (0s - 10s) — Phá vỡ sự chú ý',
        script: `Nếu bạn là ${targetAudience} và đang mệt mỏi vì ${painPoint}, thì 2 phút tiếp theo trong video này sẽ giúp bạn ${dreamOutcome} mà không cần thuê thêm nhân sự hay biết lập trình.`,
      },
      {
        beat: '2. PROBLEM & AGITATION (10s - 40s) — Xoáy sâu nỗi đau thật',
        script: `Hãy nhìn vào thực tế: Mỗi ngày bạn tốn bao nhiêu thời gian để làm đi làm lại những việc thủ công? Khách hỏi lúc 10 giờ đêm không kịp trả lời là hôm sau họ đã mua của đối thủ. Càng cố làm tay, bạn càng kiệt sức mà doanh thu vẫn giậm chân tại chỗ.`,
      },
      {
        beat: '3. HERO MECHANISM (40s - 80s) — Đòn bẩy giải pháp mới',
        script: `Đó là lý do chúng tôi đóng gói "${productName}" dựa trên cơ chế ${mechanismName}. Thay vì tự mò mẫm từ đầu, bạn có sẵn toàn bộ khung chuẩn: khách vào trang hiểu ngay giá trị, tự quét mã thanh toán và dữ liệu đổ thẳng về bảng quản lý của bạn chỉ trong vài giây.`,
      },
      {
        beat: '4. IRRESISTIBLE OFFER & CTA (80s - 120s) — Chốt đơn không rủi ro',
        script: `Hôm nay, bạn không cần bỏ ra hàng chục triệu đồng thuê thiết kế. Toàn bộ gói "${productName}" kèm quà tặng thực chiến chỉ có mức phí ưu đãi ${Number(priceVnd).toLocaleString('vi-VN')}đ, đi kèm cam kết: ${guarantee}. ${ctaText} để nhận quyền truy cập ngay lập tức!`,
      },
    ],
  };
}

export function recommendArchitecture({
  industry = '',
  goal = '',
  priceVnd = 0,
  hasVideoOrWillingToRecord = null,
} = {}) {
  assertValidRepoOrigin();
  const text = `${industry} ${goal}`.toLowerCase();
  const price = Number(priceVnd) || 0;

  if (/chạy bộ|marathon|trail|fun run|pickleball|sự kiện|workshop|vé|ticket|bib|concert/.test(text)) {
    const arch = TEMPLATE_ARCHITECTURES['01-event-ticketing-sepay'];
    return {
      ...arch,
      needsVsl: false,
      vslAdvice: 'Không cần quay VSL. Khách mua vé sự kiện/giải chạy cần bảng cự ly/hạng vé rõ ràng, thông tin Race-kit và quét mã VietQR nhận BIB ngay.',
    };
  }
  if (/spa|clinic|nha khoa|thẩm mỹ|resort|villa|homestay|đặt lịch|nhà hàng|f&b/.test(text)) {
    const arch = TEMPLATE_ARCHITECTURES['04-spa-clinic-resort-booking'];
    return {
      ...arch,
      needsVsl: false,
      vslAdvice: 'Không bắt buộc VSL. Ngành dịch vụ/nghỉ dưỡng chuyển đổi tốt nhất bằng hình ảnh không gian thực tế, bảng giá minh bạch và form đặt lịch giữ chỗ 1 chạm.',
    };
  }
  if (/thời trang|mỹ phẩm|gia dụng|đặc sản|vật lý|cod|combo|flash sale|shop/.test(text)) {
    const arch = TEMPLATE_ARCHITECTURES['05-ecom-flash-sale-cod'];
    return {
      ...arch,
      needsVsl: false,
      vslAdvice: 'Không cần VSL dài. Khách mua hàng vật lý lướt điện thoại chỉ cần ảnh sản phẩm sắc nét, bảng chọn Combo giảm giá và form đặt hàng nhanh 30 giây.',
    };
  }
  if (/showroom|nội thất|ô tô|portfolio|ebook|tài liệu|lead|quà tặng/.test(text)) {
    const arch = TEMPLATE_ARCHITECTURES['06-showroom-portfolio-lead'];
    return {
      ...arch,
      needsVsl: false,
      vslAdvice: 'Không cần VSL. Trang trưng bày/thu Lead cần bố cục Gallery sang trọng và hộp nhận báo giá/tài liệu tức thì.',
    };
  }
  if (/b2b|tư vấn|doanh nghiệp|bất động sản|high-ticket|dài|8 khối/.test(text) || hasVideoOrWillingToRecord === false) {
    const arch = TEMPLATE_ARCHITECTURES['03-longform-sales-letter'];
    return {
      ...arch,
      needsVsl: Boolean(hasVideoOrWillingToRecord === true && price >= 2000000),
      vslAdvice:
        hasVideoOrWillingToRecord === false
          ? 'Bạn chưa có video nên dùng Thư Bán Hàng 8 Khối (Long-form Text) là tối ưu nhất: chữ viết sắc bén tự thuyết phục khách từ đầu đến cuối mà không cần quay dựng.'
          : 'Dùng cấu trúc 8 Khối chuẩn mực; nếu sau này muốn tăng thêm niềm tin có thể gắn kèm 1 video ngắn giới thiệu.',
    };
  }

  const arch = TEMPLATE_ARCHITECTURES['02-vsl-conversion-funnel'];
  return {
    ...arch,
    needsVsl: true,
    vslAdvice: 'Sản phẩm đào tạo/SaaS/chuyển đổi cao rất hợp có 1 video ngắn 2 phút (VSL) trên đầu trang để tạo niềm tin nhanh. Nếu bạn chưa kịp quay, có thể ẩn khung video và dùng ngay bảng Value Stack + 8 khối chữ bên dưới.',
  };
}

export function renderTemplatePage({
  templateId = '01-event-ticketing-sepay',
  replacements = {},
  outputDir = null,
  rootDir = ROOT,
} = {}) {
  const origin = assertValidRepoOrigin(rootDir);
  if (!(templateId in TEMPLATE_ARCHITECTURES)) {
    throw new Error(`Unknown templateId: ${templateId}`);
  }
  const srcDir = path.join(rootDir, 'templates', templateId);
  const htmlFile = path.join(srcDir, 'index.html');
  if (!fs.existsSync(htmlFile)) {
    throw new Error(`Template HTML missing: ${htmlFile}`);
  }
  let html = fs.readFileSync(htmlFile, 'utf8');
  for (const [key, val] of Object.entries(replacements)) {
    const token = `{{${key}}}`;
    html = html.split(token).join(String(val));
  }
  const watermarkedHtml = embedZeroWidthWatermark(html);

  if (outputDir) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), watermarkedHtml, 'utf8');
    const gsFile = path.join(srcDir, 'google-apps-script-sepay.gs');
    if (fs.existsSync(gsFile)) {
      fs.copyFileSync(gsFile, path.join(outputDir, 'google-apps-script-sepay.gs'));
    }
  }

  return {
    templateId,
    originSeal: origin.seal,
    html: watermarkedHtml,
  };
}
