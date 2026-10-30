#!/usr/bin/env node
// Copyright AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  verifyProvenance,
  verifyHiddenWatermarks,
  deriveOriginSeal,
} from './ags_provenance.js';
import {
  ABS_ORIGINAL_ROUTES,
  TEMPLATE_ARCHITECTURES,
  INTERVIEW_QUESTIONS,
  recommendArchitecture,
  buildHormoziOffer,
  generateVslScript,
} from './salepage_engine.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const cmd = process.argv[2] || 'help';

if (cmd === 'verify') {
  const prov = verifyProvenance(ROOT);
  const wm = verifyHiddenWatermarks(ROOT);
  const origin = deriveOriginSeal(ROOT);
  const result = {
    ok: Boolean(prov.ok && wm.ok && origin.validOrigin),
    provenance: prov,
    watermarks: wm,
    origin,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
} else if (cmd === 'wizard') {
  console.log('====================================================================');
  console.log('🚀 AGENTSEA AGS-SALEPAGES — INTERACTIVE CONVERSION WIZARD');
  console.log('====================================================================\n');
  console.log('📋 4 CÂU HỎI PHỎNG VẤN CHIẾN LƯỢC DÀNH CHO AI AGENT:\n');
  for (const q of INTERVIEW_QUESTIONS) {
    console.log(`  [Câu ${q.step}] ${q.question}`);
    console.log(`          💡 Gợi ý: ${q.hint}\n`);
  }
  console.log('📦 6 KIẾN TRÚC TRANG BÁN HÀNG CÓ SẴN TRONG REPO (`templates/`):\n');
  for (const arch of Object.values(TEMPLATE_ARCHITECTURES)) {
    console.log(`  • ${arch.id}: ${arch.title}`);
    console.log(`    Phù hợp: ${arch.bestFor.join(', ')}`);
  }
  console.log('\n🧭 24 ROUTE CHIẾN LƯỢC TRÍCH XUẤT TỪ ABS OS KIT:');
  console.log(`  Đã nạp ${ABS_ORIGINAL_ROUTES.length} routes (T01 -> T24).\n`);
  const sampleOffer = buildHormoziOffer({
    productName: 'Giải Chạy Bộ Phong Trào Run For Future 2026',
    priceVnd: 299000,
    anchorPriceVnd: 650000,
    dreamOutcome: 'Nhận trọn bộ Race-kit chuẩn giải chuyên nghiệp & mã BIB tự động qua VietQR',
  });
  console.log('💎 VÍ DỤ OFFER KHÔNG THỂ CHỐI TỪ (HORMOZI):');
  console.log(`  ${sampleOffer.summaryVi}\n`);
  const sampleVsl = generateVslScript({
    productName: 'Mini Event Ticketing Engine',
    targetAudience: 'ban tổ chức giải chạy bộ, giải Pickleball và sự kiện',
  });
  console.log(`🎬 VÍ DỤ KỊCH BẢN VSL (${sampleVsl.durationSeconds}s): Đã tạo ${sampleVsl.beats.length} nhịp chuyển đổi.`);
  console.log('\n👉 Mở dự án này bằng Claude Code / Antigravity / Cursor và gõ:');
  console.log('   "Hãy đọc HUONG-DAN-CHO-TRO-LY-AI.md và phỏng vấn tôi để dựng trang bán hàng!"');
} else {
  const rec = recommendArchitecture({ industry: cmd });
  console.log(
    JSON.stringify(
      {
        product: 'ags-salepages',
        upstream: 'https://github.com/teddiesloco/ags-salepages',
        commands: ['npm run wizard', 'npm run verify', 'npm run build:zip', 'npm test'],
        templatesCount: Object.keys(TEMPLATE_ARCHITECTURES).length,
        absRoutesCount: ABS_ORIGINAL_ROUTES.length,
        recommendedForInput: rec.id,
      },
      null,
      2
    )
  );
}
