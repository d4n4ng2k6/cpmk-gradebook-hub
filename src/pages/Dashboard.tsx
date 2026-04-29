import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Target, Upload } from "lucide-react";

const Dashboard = () => {
  const { fullName } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, cpmk: 0 });

  useEffect(() => {
    (async () => {
      const [c, s, k] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
        supabase.from("cpmk").select("id", { count: "exact", head: true }),
      ]);
      setStats({ courses: c.count ?? 0, students: s.count ?? 0, cpmk: k.count ?? 0 });
    })();
  }, []);

  const cards = [
    { label: "Matakuliah", value: stats.courses, icon: BookOpen, color: "bg-gradient-primary" },
    { label: "Total Mahasiswa Terdaftar", value: stats.students, icon: Users, color: "bg-gradient-accent" },
    { label: "CPMK Terdefinisi", value: stats.cpmk, icon: Target, color: "bg-success" },
  ];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Selamat datang, {fullName || "Dosen"} 👋</h1>
        <p className="text-muted-foreground mt-1">Ringkasan aktivitas penilaian berbasis OBE Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="p-6 hover:shadow-elegant transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="text-3xl font-bold mt-2">{c.value}</div>
              </div>
              <div className={`h-12 w-12 rounded-xl ${c.color} flex items-center justify-center`}>
                <c.icon className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Mulai cepat</h2>
        <p className="text-muted-foreground mb-4">
          Impor daftar mahasiswa dari berkas Excel akademik kampus untuk membuat matakuliah baru secara otomatis.
        </p>
        <Link to="/upload">
          <Button className="bg-gradient-primary">
            <Upload className="h-4 w-4 mr-2" /> Impor file Excel
          </Button>
        </Link>
      </Card>
    </AppLayout>
  );
};

export default Dashboard;
