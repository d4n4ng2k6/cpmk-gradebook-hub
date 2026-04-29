import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Course {
  id: string;
  kode_mk: string;
  nama_mk: string;
  kelas: string | null;
  tahun_ajaran: string | null;
  semester: string | null;
  prodi: string | null;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("id, kode_mk, nama_mk, kelas, tahun_ajaran, semester, prodi")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setCourses(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Matakuliah dihapus");
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matakuliah</h1>
          <p className="text-muted-foreground mt-1">Daftar matakuliah yang Anda ampu.</p>
        </div>
        <Link to="/upload">
          <Button className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />Tambah dari Excel</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Memuat...</div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-1">Belum ada matakuliah</h3>
          <p className="text-muted-foreground mb-4">Impor file Excel kampus untuk memulai.</p>
          <Link to="/upload">
            <Button className="bg-gradient-primary">Impor Excel</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Card key={c.id} className="p-5 hover:shadow-elegant transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus matakuliah?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus semua CPMK, komponen, mahasiswa terdaftar, dan nilai. Tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(c.id)} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <Link to={`/courses/${c.id}`}>
                <div className="text-xs font-medium text-primary mb-1">{c.kode_mk}</div>
                <h3 className="font-semibold text-lg leading-snug mb-2 line-clamp-2">{c.nama_mk}</h3>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  <div>Kelas {c.kelas} • {c.semester} {c.tahun_ajaran}</div>
                  <div className="line-clamp-1">{c.prodi}</div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Courses;
