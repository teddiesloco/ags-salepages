// Copyright AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  AGS_STEGO_PAYLOAD,
  encodeZeroWidthWatermark,
  decodeZeroWidthWatermark,
  embedZeroWidthWatermark,
  deriveOriginSeal,
  verifyProvenance,
  verifyHiddenWatermarks,
  verifyZipArchiveSeal,
} from '../src/ags_provenance.js';
import {
  ABS_ORIGINAL_ROUTES,
  TEMPLATE_ARCHITECTURES,
  INTERVIEW_QUESTIONS,
  buildHormoziOffer,
  generateVslScript,
  recommendArchitecture,
  renderTemplatePage,
} from '../src/salepage_engine.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

test('7-Layer Anti-REA & Cryptographic Provenance Seal verifies intact repository and rejects debranding', () => {
  const encoded = encodeZeroWidthWatermark(AGS_STEGO_PAYLOAD);
  assert.equal(decodeZeroWidthWatermark(encoded), AGS_STEGO_PAYLOAD);

  const origin = deriveOriginSeal(ROOT);
  assert.equal(origin.validOrigin, true);
  assert.equal(origin.upstream, 'https://github.com/teddiesloco/ags-salepages');

  const wm = verifyHiddenWatermarks(ROOT);
  assert.equal(wm.ok, true, `Watermarks failed: ${JSON.stringify(wm)}`);
  assert.equal(wm.stego_roundtrip, true);
  assert.equal(wm.html_stego, true);
  assert.equal(wm.css_canary_token, true);
  assert.equal(wm.svg_vector_watermark, true);
  assert.equal(wm.png_binary_chunk, true);

  const prov = verifyProvenance(ROOT);
  assert.equal(prov.ok, true, `Manifest provenance failed: ${JSON.stringify(prov)}`);

  // Simulate unauthorized debranding in a temporary clone
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-salepages-tamper-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'stolen-kit', repository: { url: 'https://github.com/cloner/stolen-kit' } })
    );
    fs.writeFileSync(path.join(tmpDir, 'NOTICE'), 'Removed canary');
    fs.writeFileSync(path.join(tmpDir, 'LICENSE'), 'Removed canary');
    const tamperedOrigin = deriveOriginSeal(tmpDir);
    assert.equal(tamperedOrigin.validOrigin, false);
    assert.throws(
      () => renderTemplatePage({ templateId: '01-event-ticketing-sepay', rootDir: tmpDir }),
      /AGS_PROVENANCE_TAMPERED/
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Adaptive Interview Engine, Hormozi Offer Architect, and Smart VSL Selector work across all 6 templates & 24 ABS routes', () => {
  assert.equal(ABS_ORIGINAL_ROUTES.length, 24);
  assert.equal(Object.keys(TEMPLATE_ARCHITECTURES).length, 6);
  assert.equal(INTERVIEW_QUESTIONS.length, 4);

  // 1. Event ticketing (e.g. Marathon / Fun Run) -> 01-event-ticketing-sepay, needsVsl = false
  const marathonRec = recommendArchitecture({ industry: 'Giải chạy bộ Marathon 21km', goal: 'Bán vé cấp BIB' });
  assert.equal(marathonRec.id, '01-event-ticketing-sepay');
  assert.equal(marathonRec.needsVsl, false);

  // 2. Spa / Clinic / Resort -> 04-spa-clinic-resort-booking, needsVsl = false
  const spaRec = recommendArchitecture({ industry: 'Spa trị liệu & Nha khoa', goal: 'Đặt lịch hẹn' });
  assert.equal(spaRec.id, '04-spa-clinic-resort-booking');
  assert.equal(spaRec.needsVsl, false);

  // 3. Ecom Flash Sale -> 05-ecom-flash-sale-cod, needsVsl = false
  const ecomRec = recommendArchitecture({ industry: 'Mỹ phẩm & Thời trang', goal: 'Chốt đơn Flash Sale COD' });
  assert.equal(ecomRec.id, '05-ecom-flash-sale-cod');
  assert.equal(ecomRec.needsVsl, false);

  // 4. Showroom / Lead Magnet -> 06-showroom-portfolio-lead, needsVsl = false
  const showroomRec = recommendArchitecture({ industry: 'Showroom Nội Thất', goal: 'Tặng Ebook thu Lead' });
  assert.equal(showroomRec.id, '06-showroom-portfolio-lead');
  assert.equal(showroomRec.needsVsl, false);

  // 5. High-ticket B2B or user without video -> 03-longform-sales-letter, needsVsl = false
  const noVideoRec = recommendArchitecture({
    industry: 'Khóa học kinh doanh',
    goal: 'Bán hàng',
    hasVideoOrWillingToRecord: false,
  });
  assert.equal(noVideoRec.id, '03-longform-sales-letter');
  assert.equal(noVideoRec.needsVsl, false);

  // 6. Course / SaaS with video -> 02-vsl-conversion-funnel, needsVsl = true
  const vslRec = recommendArchitecture({
    industry: 'Khóa học AI Automation & SaaS',
    goal: 'Chuyển đổi qua Video',
    hasVideoOrWillingToRecord: true,
  });
  assert.equal(vslRec.id, '02-vsl-conversion-funnel');
  assert.equal(vslRec.needsVsl, true);

  // Hormozi Offer & VSL generator
  const offer = buildHormoziOffer({ productName: 'Vé Giải Chạy Run 2026', priceVnd: 299000, anchorPriceVnd: 600000 });
  assert.equal(offer.savingsVnd, 301000);
  assert.ok(offer.summaryVi.includes('299.000đ'));

  const vsl = generateVslScript({ productName: 'AI Sales Engine' });
  assert.equal(vsl.beats.length, 4);
});

test('All 6 Vietnamese templates pass Anti-AI-Slop rules, preserve steganography, and seal into dist/AGS-Salepages.zip', () => {
  for (const id of Object.keys(TEMPLATE_ARCHITECTURES)) {
    const htmlPath = path.join(ROOT, 'templates', id, 'index.html');
    assert.equal(fs.existsSync(htmlPath), true, `Missing template ${id}`);
    const content = fs.readFileSync(htmlPath, 'utf8');
    // Must not contain AI Slop purple #6366f1 or Inter font
    assert.equal(content.toLowerCase().includes('#6366f1'), false, `Template ${id} contains forbidden #6366f1`);
    assert.equal(/\bfont-family:[^;]*\bInter\b/i.test(content), false, `Template ${id} contains forbidden Inter font`);
    // Must carry zero-width watermark
    assert.equal(decodeZeroWidthWatermark(content), AGS_STEGO_PAYLOAD, `Template ${id} missing stego watermark`);
  }

  // Verify Google Apps Script SePay + BIB automation exists in template 01
  const gsPath = path.join(ROOT, 'templates/01-event-ticketing-sepay/google-apps-script-sepay.gs');
  assert.equal(fs.existsSync(gsPath), true);
  const gsContent = fs.readFileSync(gsPath, 'utf8');
  assert.ok(gsContent.includes('DA_THANH_TOAN') && gsContent.includes('bibNumber'));

  // Verify sealed ZIP archive
  const zipPath = path.join(ROOT, 'dist/AGS-Salepages.zip');
  if (fs.existsSync(zipPath)) {
    const prov = verifyProvenance(ROOT);
    const zipCheck = verifyZipArchiveSeal(zipPath, prov.manifest_sha256);
    assert.equal(zipCheck.ok, true, `ZIP seal verification failed: ${JSON.stringify(zipCheck)}`);
  }
});
