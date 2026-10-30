#!/usr/bin/env node
// Copyright AgentSea · AGS-Salepages (agentsea.vn) :: CANARY-AGS-SALEPAGES-V1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProvenanceManifest } from '../src/ags_provenance.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const allow = [
  'src',
  'scripts',
  'public',
  'templates',
  'test',
  'config/ags-provenance-manifest.json',
  'package.json',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'CODEX.md',
  'GEMINI.md',
  '.cursorrules',
  'HUONG-DAN-CHO-TRO-LY-AI.md',
  'LICENSE',
  'NOTICE',
];

const forbidden = name =>
  name
    .split('/')
    .some(
      p =>
        ['data', 'node_modules', '.git', 'dist', 'output', '.evidence', '__pycache__'].includes(p) ||
        (p.startsWith('.env') && p !== '.env.example') ||
        /\.sqlite|\.(db|pem|key|pyc)$/i.test(p)
    );

const files = [];
function walk(name) {
  if (forbidden(name)) return;
  const full = path.join(root, name);
  if (!fs.existsSync(full)) return;
  const stat = fs.lstatSync(full);
  if (stat.isSymbolicLink()) throw new Error(`Release rejects symlink: ${name}`);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(full).sort()) walk(`${name}/${child}`);
  } else if (stat.isFile()) {
    files.push(name);
  }
}

for (const name of allow) {
  if (name !== 'config/ags-provenance-manifest.json') walk(name);
}

const manifest = buildProvenanceManifest(root);
fs.mkdirSync(path.join(root, 'config'), { recursive: true });
fs.writeFileSync(path.join(root, 'config/ags-provenance-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
walk('config/ags-provenance-manifest.json');
files.sort();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const extraPayload = Buffer.from(`AGS1:${manifest.manifest_sha256.slice(0, 16)}`, 'ascii');
const extraField = Buffer.alloc(4 + extraPayload.length);
extraField.writeUInt16LE(0x4741, 0); // Header ID 0x4741 ("AG")
extraField.writeUInt16LE(extraPayload.length, 2);
extraPayload.copy(extraField, 4);

const locals = [],
  central = [];
let offset = 0;

for (const name of files) {
  const filename = Buffer.from(name);
  const data = fs.readFileSync(path.join(root, name));
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(33, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(filename.length, 26);
  local.writeUInt16LE(extraField.length, 28);

  const entry = Buffer.alloc(46);
  entry.writeUInt32LE(0x02014b50);
  entry.writeUInt16LE(0x314, 4);
  entry.writeUInt16LE(20, 6);
  entry.writeUInt16LE(0x800, 8);
  entry.writeUInt16LE(33, 14);
  entry.writeUInt32LE(crc, 16);
  entry.writeUInt32LE(data.length, 20);
  entry.writeUInt32LE(data.length, 24);
  entry.writeUInt16LE(filename.length, 28);
  entry.writeUInt16LE(extraField.length, 30);
  entry.writeUInt32LE(((name.endsWith('.sh') || name.endsWith('.command') ? 0o100755 : 0o100644) * 65536) >>> 0, 38);
  entry.writeUInt32LE(offset, 42);

  locals.push(local, filename, extraField, data);
  central.push(entry, filename, extraField);
  offset += local.length + filename.length + extraField.length + data.length;
}

const directory = Buffer.concat(central);
const comment = Buffer.from(`AgentSea:AGS-Salepages:v1:${manifest.manifest_sha256}`);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(comment.length, 20);

const zipBuffer = Buffer.concat([...locals, directory, end, comment]);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/AGS-Salepages.zip'), zipBuffer);
console.log(`dist/AGS-Salepages.zip: ${files.length} files; provenance ${manifest.manifest_sha256}`);
