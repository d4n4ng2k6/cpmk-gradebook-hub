import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { parseAcademicXls, ParsedCourse } from "@/lib/excelParser";
import { toast } from "sonner";

const UploadExcel = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [parsed, setParsed] = useState<ParsedCourse | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const result = await parseAcademicXls(file);
      if (!result.kode_mk || result.students.length === 0) {
        toast.error("Tidak menemukan data MK / mahasiswa pada file.");
        return;
      }
      setParsed(result);
      toast.success(`Terbaca: ${result.students.length} mahasiswa`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const doImport = async () => {
    if (!parsed || !user) return;
    setImporting(true);
    try {
      // 1. Insert course
      const { data: course, error: ce } = await supabase
        .from("courses")
        .insert({
          lecturer_id: user.id,
          kode_mk: parsed.kode_mk,
          nama_mk: parsed.nama_mk,
          kelas: parsed.kelas,
          tahun_ajaran: parsed.tahun_ajaran,
          semester: parsed.semester,
          prodi: parsed.prodi,
          jenjang: parsed.jenjang,
        })
        .select()
        .single();
      if (ce) throw ce;

      // 2. Upsert students
      const { data: existing } = await supabase
        .from("students")
        .select("id, npm")
        .in("npm", parsed.students.map((s) => s.npm));
      const existingMap = new Map(existing?.map((s) => [s.npm, s.id]) ?? []);

      const toInsert = parsed.students.filter((s) => !existingMap.has(s.npm));
      if (toInsert.length > 0) {
        const { data: inserted, error: ie } = await supabase
          .from("students")
          .insert(toInsert.map((s) => ({ npm: s.npm, nama: s.nama })))
          .select("id, npm");
        if (ie) throw ie;
        inserted?.forEach((s) => existingMap.set(s.npm, s.id));
      }

      // 3. Enrollments
      const enrollments = parsed.students.map((s) => ({
        course_id: course.id,
        student_id: existingMap.get(s.npm)!,
      }));
      const { error: ee } = await supabase.from("enrollments").insert(enrollments);
      if (ee) throw ee;

      // 4. Default CPMK & komponen
      const { data: cpmkRows } = await supabase.from("cpmk").insert([
        { course_id: course.id, kode: "CPMK-1", deskripsi: "Capaian 1", bobot: 50 },
        { course_id: course.id, kode: "CPMK-2", deskripsi: "Capaian 2", bobot: 50 },
      ]).select();
      const { data: compRows } = await supabase.from("components").insert([
        { course_id: course.id, nama: "Tugas", bobot: 20, urutan: 1 },
        { course_id: course.id, nama: "UTS", bobot: 35, urutan: 2 },
        { course_id: course.id, nama: "UAS", bobot: 45, urutan: 3 },
      ]).select();

      // map default: setiap komponen 100% ke CPMK-1
      if (cpmkRows && compRows) {
        await supabase.from("component_cpmk").insert(
          compRows.map((c) => ({ component_id: c.id, cpmk_id: cpmkRows[0].id, kontribusi: 100 }))
        );
      }

      toast.success("Matakuliah berhasil diimpor!");
      nav(`/courses/${course.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Impor dari Excel</h1>
        <p className="text-muted-foreground mt-1">
          Unggah berkas .xls daftar nilai dari sistem akademik kampus. Sistem akan mengekstrak info matakuliah dan daftar mahasiswa.
        </p>
      </div>

      <Card className="p-8">
        <label className="block border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-secondary/40 transition-colors">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <div className="font-medium mb-1">Klik untuk memilih file</div>
          <div className="text-sm text-muted-foreground">Format .xls (Excel XML 2003) dari sistem akademik</div>
          <input
            type="file"
            accept=".xls,.xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>

        {parsed && (
          <Card className="p-6 mt-6 bg-secondary/40">
            <div className="flex items-center gap-3 mb-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold text-lg">{parsed.kode_mk} — {parsed.nama_mk}</div>
                <div className="text-sm text-muted-foreground">
                  Kelas {parsed.kelas} • {parsed.semester} {parsed.tahun_ajaran} • {parsed.prodi}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-success mb-4">
              <CheckCircle2 className="h-4 w-4" />
              {parsed.students.length} mahasiswa siap diimpor
            </div>
            <div className="max-h-48 overflow-auto rounded-md bg-background border p-3 text-sm mb-4">
              {parsed.students.slice(0, 10).map((s) => (
                <div key={s.npm} className="flex justify-between py-1 border-b last:border-0">
                  <span className="font-mono text-xs">{s.npm}</span>
                  <span>{s.nama}</span>
                </div>
              ))}
              {parsed.students.length > 10 && (
                <div className="text-center text-muted-foreground text-xs pt-2">
                  ...dan {parsed.students.length - 10} mahasiswa lainnya
                </div>
              )}
            </div>
            <Button onClick={doImport} disabled={importing} className="bg-gradient-primary">
              {importing ? "Mengimpor..." : "Konfirmasi & Impor"}
            </Button>
          </Card>
        )}
      </Card>
    </AppLayout>
  );
};

export default UploadExcel;
