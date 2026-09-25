/**
 * Minimal ZIP builder (stored entries, no compression) — dependency-free.
 *
 * Used to package install bundles for agent harnesses. Entries are stored
 * uncompressed so we don't need a deflate implementation; SKILL.md files
 * are tiny, so the size cost is negligible.
 */

export interface ZipEntry {
  /** Forward-slash path inside the archive, e.g. ".claude/skills/foo/SKILL.md". */
  path: string;
  content: string | Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();

/** Build a .zip Blob from a list of path → content entries. */
export function createZipBlob(entries: ZipEntry[]): Blob {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  interface Record {
    name: Uint8Array;
    crc: number;
    size: number;
    offset: number;
  }
  const records: Record[] = [];

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data =
      typeof entry.content === "string"
        ? encoder.encode(entry.content)
        : entry.content;
    const crc = crc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); // local file header signature
    lh.setUint16(4, 20, true); // version needed to extract
    lh.setUint16(6, 0x0800, true); // flags: UTF-8 filenames
    lh.setUint16(8, 0, true); // method: stored
    lh.setUint16(10, 0, true); // mod time
    lh.setUint16(12, 0x21, true); // mod date (1980-01-01)
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true); // extra field length

    chunks.push(new Uint8Array(lh.buffer), name, data);
    records.push({ name, crc, size: data.length, offset });
    offset += 30 + name.length + data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const r of records) {
    const rec = new Uint8Array(46 + r.name.length);
    const ch = new DataView(rec.buffer);
    ch.setUint32(0, 0x02014b50, true); // central directory signature
    ch.setUint16(4, 20, true); // version made by
    ch.setUint16(6, 20, true); // version needed
    ch.setUint16(8, 0x0800, true); // flags: UTF-8
    ch.setUint16(10, 0, true); // method: stored
    ch.setUint16(12, 0, true); // mod time
    ch.setUint16(14, 0x21, true); // mod date
    ch.setUint32(16, r.crc, true);
    ch.setUint32(20, r.size, true);
    ch.setUint32(24, r.size, true);
    ch.setUint16(28, r.name.length, true);
    ch.setUint16(30, 0, true); // extra field length
    ch.setUint16(32, 0, true); // comment length
    ch.setUint16(34, 0, true); // disk number
    ch.setUint16(36, 0, true); // internal attrs
    ch.setUint32(38, 0, true); // external attrs
    ch.setUint32(42, r.offset, true); // local header offset
    rec.set(r.name, 46);
    central.push(rec);
    centralSize += rec.length;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); // end of central directory signature
  end.setUint16(8, records.length, true);
  end.setUint16(10, records.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, centralOffset, true);
  end.setUint16(20, 0, true); // comment length

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], {
    type: "application/zip",
  });
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
