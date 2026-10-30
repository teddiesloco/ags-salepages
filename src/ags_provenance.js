// Copyright AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, createHmac } from 'node:crypto';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const AGS_PROVENANCE_CANARY = 'AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1';
export const AGS_OFFICIAL_UPSTREAM_REPO = 'https://github.com/teddiesloco/ags-salepages';
export const AGS_ZIP_EXTRA_HEADER_ID = 0x4741; // "AG" little-endian

const sha = value => createHash('sha256').update(value).digest('hex');

export function buildProvenanceManifest(rootDir = ROOT) {
  const names = [
    'LICENSE',
    'NOTICE',
    'README.md',
    'AGENTS.md',
    'CLAUDE.md',
    'CODEX.md',
    'GEMINI.md',
    '.cursorrules',
    'HUONG-DAN-CHO-TRO-LY-AI.md',
    'package.json',
  ];
  function walk(name) {
    const file = path.join(rootDir, name);
    if (!fs.existsSync(file)) return;
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(file).sort()) walk(`${name}/${child}`);
    } else if (stat.isFile()) {
      names.push(name);
    } else {
      throw new Error(`Provenance requires regular file: ${name}`);
    }
  }
  for (const dir of ['src', 'scripts', 'public', 'templates']) {
    if (fs.existsSync(path.join(rootDir, dir))) walk(dir);
  }
  const files = {};
  for (const name of [...new Set(names)].sort()) {
    const file = path.join(rootDir, name);
    if (fs.existsSync(file)) {
      if (!fs.lstatSync(file).isFile()) throw new Error(`Provenance requires regular file: ${name}`);
      files[name] = sha(fs.readFileSync(file));
    }
  }
  return { version: 1, product: 'ags-salepages', files, manifest_sha256: sha(JSON.stringify(files)) };
}

export function verifyProvenance(rootDir = ROOT, expectedManifest = null) {
  const actual = buildProvenanceManifest(rootDir);
  const saved = path.join(rootDir, 'config/ags-provenance-manifest.json');
  const expected = expectedManifest ?? (fs.existsSync(saved) ? JSON.parse(fs.readFileSync(saved, 'utf8')) : null);
  const tampered = [], missing = [];
  if (!expected) {
    return {
      ok: false,
      tampered,
      missing: ['config/ags-provenance-manifest.json'],
      manifest_sha256: actual.manifest_sha256,
    };
  }
  for (const [name, digest] of Object.entries(expected.files)) {
    if (!(name in actual.files)) missing.push(name);
    else if (actual.files[name] !== digest) tampered.push(name);
  }
  for (const name of Object.keys(actual.files)) {
    if (!(name in expected.files)) tampered.push(name);
  }
  return {
    ok: !tampered.length && !missing.length && actual.manifest_sha256 === expected.manifest_sha256,
    tampered: tampered.sort(),
    missing: missing.sort(),
    manifest_sha256: actual.manifest_sha256,
  };
}

export function provenanceHeaderValue(rootDir = ROOT) {
  return 'AgentSea/AGS-Salepages/v1/' + buildProvenanceManifest(rootDir).manifest_sha256.slice(0, 16);
}

// ── Multi-Layer Hidden AGS Watermark (Steganography & Forensic Attribution) ──
// Encodes ASCII payload into invisible zero-width Unicode characters:
// \u200B (bit 0), \u200C (bit 1), wrapped between \u2060 (word joiner) markers.
const ZW_ZERO = '\u200B';
const ZW_ONE = '\u200C';
const ZW_MARKER = '\u2060';
export const AGS_STEGO_PAYLOAD = 'AGS-WM:agentsea.vn:CANARY-AGS-SALEPAGES-V1';

export function encodeZeroWidthWatermark(payload = AGS_STEGO_PAYLOAD) {
  const bytes = Buffer.from(String(payload), 'utf8');
  let bits = '';
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) {
      bits += ((byte >> i) & 1) ? ZW_ONE : ZW_ZERO;
    }
  }
  return `${ZW_MARKER}${bits}${ZW_MARKER}`;
}

export function decodeZeroWidthWatermark(carrierText) {
  const text = String(carrierText ?? '');
  const start = text.indexOf(ZW_MARKER);
  if (start < 0) return null;
  const end = text.indexOf(ZW_MARKER, start + 1);
  if (end < 0) return null;
  const raw = text.slice(start + 1, end);
  const bits = [...raw].filter(ch => ch === ZW_ZERO || ch === ZW_ONE);
  if (bits.length < 8 || bits.length % 8 !== 0) return null;
  const out = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[i + b] === ZW_ONE ? 1 : 0);
    }
    out.push(byte);
  }
  return Buffer.from(out).toString('utf8');
}

export function embedZeroWidthWatermark(visibleText, payload = AGS_STEGO_PAYLOAD) {
  const clean = String(visibleText ?? '').replace(/\u2060[\u200B\u200C]+\u2060/g, '');
  return `${clean}${encodeZeroWidthWatermark(payload)}`;
}

export function deriveOriginSeal(rootDir = ROOT) {
  const pkgPath = path.join(rootDir, 'package.json');
  const noticePath = path.join(rootDir, 'NOTICE');
  const licensePath = path.join(rootDir, 'LICENSE');
  let pkgName = '', repoUrl = '';
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkgName = String(pkg.name || '');
    repoUrl = String(pkg.repository?.url || '');
  } catch {}
  const noticeHasCanary = fs.existsSync(noticePath) && fs.readFileSync(noticePath, 'utf8').includes('CANARY-AGS-SALEPAGES-V1');
  const licenseHasCanary = fs.existsSync(licensePath) && fs.readFileSync(licensePath, 'utf8').includes('CANARY-AGS-SALEPAGES-V1');
  const keyMaterial = `${AGS_PROVENANCE_CANARY}|${pkgName}|${AGS_OFFICIAL_UPSTREAM_REPO}`;
  const seal = createHmac('sha256', keyMaterial)
    .update(noticeHasCanary && licenseHasCanary ? 'AGS_SEAL_OK' : 'TAMPERED')
    .digest('hex')
    .slice(0, 32);
  const validOrigin =
    pkgName === 'ags-salepages' &&
    repoUrl.includes('teddiesloco/ags-salepages') &&
    noticeHasCanary &&
    licenseHasCanary;
  return { validOrigin, seal, upstream: AGS_OFFICIAL_UPSTREAM_REPO };
}

export function verifyPngBinaryWatermark(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return buf.includes(Buffer.from('AgentSea::AGS-Salepages::CANARY-AGS-SALEPAGES-V1', 'latin1'));
  } catch {
    return false;
  }
}

export function verifyZipArchiveSeal(zipPath, expectedManifestSha = null) {
  try {
    const buf = fs.readFileSync(zipPath);
    if (buf.readUInt32LE(0) !== 0x04034b50) return { ok: false, reason: 'not_a_zip' };
    const extraLen = buf.readUInt16LE(28);
    const fnameLen = buf.readUInt16LE(26);
    const extraStart = 30 + fnameLen;
    const hasExtraHeader = extraLen >= 12 && buf.readUInt16LE(extraStart) === AGS_ZIP_EXTRA_HEADER_ID;
    const tail = buf.subarray(-140).toString('utf8');
    const hasEocd = expectedManifestSha
      ? tail.endsWith(`AgentSea:AGS-Salepages:v1:${expectedManifestSha}`)
      : tail.includes('AgentSea:AGS-Salepages:v1:');
    return { ok: Boolean(hasExtraHeader && hasEocd), extra_header_0x4741: hasExtraHeader, eocd_comment: hasEocd };
  } catch {
    return { ok: false, reason: 'zip_missing_or_unreadable' };
  }
}

export function verifyHiddenWatermarks(rootDir = ROOT) {
  const encoded = encodeZeroWidthWatermark(AGS_STEGO_PAYLOAD);
  const decoded = decodeZeroWidthWatermark(encoded);
  const stegoRoundtripOk = decoded === AGS_STEGO_PAYLOAD;

  const htmlPath = path.join(rootDir, 'templates/01-event-ticketing-sepay/index.html');
  const cssPath = path.join(rootDir, 'public/ags-tokens.css');
  const svgPath = path.join(rootDir, 'public/icons/agentsea-mark.svg');
  const pngPath = path.join(rootDir, 'public/icons/icon-192.png');

  const htmlStego = fs.existsSync(htmlPath) ? decodeZeroWidthWatermark(fs.readFileSync(htmlPath, 'utf8')) : null;
  const cssHasCanary = fs.existsSync(cssPath) && fs.readFileSync(cssPath, 'utf8').includes('--ags-wm-canary');
  const svgHasWatermark = fs.existsSync(svgPath) && fs.readFileSync(svgPath, 'utf8').includes('CANARY-AGS-SALEPAGES-V1');
  const pngHasChunk = verifyPngBinaryWatermark(pngPath);
  const origin = deriveOriginSeal(rootDir);

  return {
    ok: Boolean(
      stegoRoundtripOk &&
      htmlStego === AGS_STEGO_PAYLOAD &&
      cssHasCanary &&
      svgHasWatermark &&
      pngHasChunk &&
      origin.validOrigin
    ),
    stego_roundtrip: stegoRoundtripOk,
    html_stego: htmlStego === AGS_STEGO_PAYLOAD,
    css_canary_token: cssHasCanary,
    svg_vector_watermark: svgHasWatermark,
    png_binary_chunk: pngHasChunk,
    origin_seal_valid: origin.validOrigin,
    origin_seal: origin.seal,
    official_upstream: origin.upstream,
    canary: AGS_PROVENANCE_CANARY,
  };
}
