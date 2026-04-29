// Parser untuk file Excel SpreadsheetML XML (.xls dengan format XML 2003)
// dari sistem akademik kampus.

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

export async function parseAcademicXls(file: File): Promise<ParsedCourse> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");

  const err = doc.querySelector("parsererror");
  if (err) throw new Error("File bukan format Excel XML 2003 yang dikenali.");

  // Header info: cari Row dimana Cell pertama berisi label
  const rows = Array.from(doc.getElementsByTagName("Row"));

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
    const cells = Array.from(r.getElementsByTagName("Cell"));
    if (cells.length < 3) continue;
    const first = textOf(cells[0]);
    if (labels.includes(first)) {
      // value typically in cell index 2 (after the ":" cell)
      meta[first] = textOf(cells[2]) || textOf(cells[1]);
    }
  }

  // Mahasiswa: baris setelah header tabel; kita identifikasi baris yang
  // cell[0] berupa angka (No.), cell[1] berupa NIM (12 digit), cell[3] nama
  const students: { npm: string; nama: string }[] = [];
  for (const r of rows) {
    const cells = Array.from(r.getElementsByTagName("Cell"));
    if (cells.length < 4) continue;
    const c0 = textOf(cells[0]);
    const c1 = textOf(cells[1]);
    const c3 = textOf(cells[3]);
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

function textOf(cell: Element): string {
  const data = cell.getElementsByTagName("Data")[0];
  return data?.textContent?.trim() ?? "";
}
