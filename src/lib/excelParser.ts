// Parser untuk file Excel SpreadsheetML XML 2003 dari sistem akademik kampus.
// File ini terkadang mengandung entity tidak valid (mis. `&gt=` di formula),
// jadi kita pakai pendekatan regex yang toleran daripada DOMParser ketat.

export interface ParsedCourse {
  kode_mk: string;
  nama_mk: string;
  kelas: string;
  tahun_ajaran: string;
  semester: string;
  prodi: string;
  jenjang: string;
  students: { npm: string; nama: string }[];
}

interface RawRow {
  cells: string[]; // text content per Cell, urut sesuai kemunculan (tanpa skip Index)
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseRows(xml: string): RawRow[] {
  const rows: RawRow[] = [];
  const rowRe = /<Row\b[^>]*>([\s\S]*?)<\/Row>/gi;
  const cellRe = /<Cell\b[^>]*>([\s\S]*?)<\/Cell>/gi;
  const dataRe = /<Data\b[^>]*>([\s\S]*?)<\/Data>/i;

  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml))) {
    const inner = rm[1];
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(inner))) {
      const dm = dataRe.exec(cm[1]);
      cells.push(dm ? decodeEntities(dm[1]).trim() : "");
    }
    rows.push({ cells });
  }
  return rows;
}

export async function parseAcademicXls(file: File): Promise<ParsedCourse> {
  const text = await file.text();

  if (!/<Workbook[\s>]/i.test(text) && !/<Worksheet[\s>]/i.test(text)) {
    throw new Error(
      "File tidak dikenali. Gunakan berkas .xls dari sistem akademik (format Excel XML 2003)."
    );
  }

  const rows = parseRows(text);

  const meta: Record<string, string> = {};
  const labels = [
    "Tahun Ajaran",
    "Semester",
    "Jenjang Studi",
    "Program Studi",
    "Kelas Kuliah",
    "Kode MK",
    "Mata Kuliah",
  ];

  for (const r of rows) {
    if (r.cells.length < 2) continue;
    const first = r.cells[0];
    if (labels.includes(first)) {
      // Nilai biasanya di cell ke-3 (setelah ":"). Ambil cell non-kosong pertama setelah index 0.
      const val = r.cells.slice(1).find((c) => c && c !== ":") ?? "";
      meta[first] = val;
    }
  }

  const students: { npm: string; nama: string }[] = [];
  for (const r of rows) {
    if (r.cells.length < 4) continue;
    const [c0, c1, , c3] = r.cells;
    if (/^\d+$/.test(c0) && /^\d{6,}$/.test(c1) && c3) {
      students.push({ npm: c1, nama: c3.trim() });
    }
  }

  return {
    kode_mk: meta["Kode MK"] ?? "",
    nama_mk: meta["Mata Kuliah"] ?? "",
    kelas: meta["Kelas Kuliah"] ?? "",
    tahun_ajaran: meta["Tahun Ajaran"] ?? "",
    semester: meta["Semester"] ?? "",
    prodi: meta["Program Studi"] ?? "",
    jenjang: meta["Jenjang Studi"] ?? "",
    students,
  };
}
