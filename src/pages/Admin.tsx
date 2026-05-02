import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Building2, Target, ListTree, ListChecks, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RTooltip } from "recharts";

interface Prodi { id: string; kode: string; nama: string; jenjang: string | null; }
interface CPL { id: string; prodi_id: string; kode: string; deskripsi: string; }
interface CPMK { id: string; cpl_id: string; kode: string; deskripsi: string; bobot: number; }
interface SubCPMK { id: string; cpmk_id: string; kode: string; deskripsi: string; bobot: number; }

const Admin = () => {
  const { role, loading } = useAuth();
  if (!loading && role !== "admin") return <Navigate to="/" replace />;
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Administrasi OBE</h1>
        <p className="text-muted-foreground mt-1">Kelola Prodi, CPL, CPMK, dan Sub-CPMK master.</p>
      </div>
      <Tabs defaultValue="prodi">
        <TabsList className="mb-6 w-full grid grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="prodi"><Building2 className="h-4 w-4 mr-2" />Prodi</TabsTrigger>
          <TabsTrigger value="cpl"><Target className="h-4 w-4 mr-2" />CPL</TabsTrigger>
          <TabsTrigger value="cpmk"><ListTree className="h-4 w-4 mr-2" />CPMK</TabsTrigger>
          <TabsTrigger value="sub"><ListChecks className="h-4 w-4 mr-2" />Sub-CPMK</TabsTrigger>
          <TabsTrigger value="report"><BarChart3 className="h-4 w-4 mr-2" />Laporan CPL</TabsTrigger>
        </TabsList>
        <TabsContent value="prodi"><ProdiTab /></TabsContent>
        <TabsContent value="cpl"><CplTab /></TabsContent>
        <TabsContent value="cpmk"><CpmkTab /></TabsContent>
        <TabsContent value="sub"><SubTab /></TabsContent>
        <TabsContent value="report"><ReportTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

const ProdiTab = () => {
  const [items, setItems] = useState<Prodi[]>([]);
  const load = async () => {
    const { data } = await supabase.from("prodi").select("*").order("kode");
    setItems((data ?? []) as Prodi[]);
  };
  useEffect(() => { load(); }, []);
  const upd = (i: number, p: Partial<Prodi>) => { const n = [...items]; n[i] = { ...n[i], ...p }; setItems(n); };
  const add = () => setItems([...items, { id: `new-${Date.now()}`, kode: "", nama: "", jenjang: "S1" }]);
  const remove = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("prodi").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, x) => x !== i));
  };
  const save = async () => {
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { error } = await supabase.from("prodi").insert({ kode: it.kode, nama: it.nama, jenjang: it.jenjang });
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("prodi").update({ kode: it.kode, nama: it.nama, jenjang: it.jenjang }).eq("id", it.id);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("Prodi tersimpan"); load();
  };
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Program Studi</h2>
      <div className="space-y-3">
        {items.map((p, i) => (
          <div key={p.id} className="grid grid-cols-12 gap-2 md:gap-3 items-center">
            <Input className="col-span-4 md:col-span-2" placeholder="Kode" value={p.kode} onChange={(e) => upd(i, { kode: e.target.value })} />
            <Input className="col-span-12 md:col-span-7 order-3 md:order-none" placeholder="Nama Prodi" value={p.nama} onChange={(e) => upd(i, { nama: e.target.value })} />
            <Input className="col-span-6 md:col-span-2" placeholder="Jenjang" value={p.jenjang ?? ""} onChange={(e) => upd(i, { jenjang: e.target.value })} />
            <Button size="icon" variant="ghost" className="col-span-2 md:col-span-1 justify-self-end" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" />Tambah</Button>
        <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan</Button>
      </div>
    </Card>
  );
};

const CplTab = () => {
  const [prodi, setProdi] = useState<Prodi[]>([]);
  const [pid, setPid] = useState<string>("");
  const [items, setItems] = useState<CPL[]>([]);
  useEffect(() => { supabase.from("prodi").select("*").order("kode").then(({ data }) => setProdi((data ?? []) as Prodi[])); }, []);
  useEffect(() => {
    if (!pid) return;
    supabase.from("cpl").select("*").eq("prodi_id", pid).order("kode").then(({ data }) => setItems((data ?? []) as CPL[]));
  }, [pid]);
  const upd = (i: number, p: Partial<CPL>) => { const n = [...items]; n[i] = { ...n[i], ...p }; setItems(n); };
  const add = () => setItems([...items, { id: `new-${Date.now()}`, prodi_id: pid, kode: `CPL-${items.length + 1}`, deskripsi: "" }]);
  const remove = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("cpl").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, x) => x !== i));
  };
  const save = async () => {
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { error } = await supabase.from("cpl").insert({ prodi_id: pid, kode: it.kode, deskripsi: it.deskripsi });
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("cpl").update({ kode: it.kode, deskripsi: it.deskripsi }).eq("id", it.id);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("CPL tersimpan");
    const { data } = await supabase.from("cpl").select("*").eq("prodi_id", pid).order("kode");
    setItems((data ?? []) as CPL[]);
  };
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Capaian Pembelajaran Lulusan</h2>
      <div className="mb-4 max-w-md">
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Pilih Prodi" /></SelectTrigger>
          <SelectContent>{prodi.map((p) => <SelectItem key={p.id} value={p.id}>{p.kode} — {p.nama}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {pid && <>
        <div className="space-y-3">
          {items.map((c, i) => (
            <div key={c.id} className="grid grid-cols-12 gap-2 md:gap-3 items-center">
              <Input className="col-span-4 md:col-span-2" value={c.kode} onChange={(e) => upd(i, { kode: e.target.value })} />
              <Input className="col-span-12 md:col-span-9 order-3 md:order-none" placeholder="Deskripsi CPL" value={c.deskripsi} onChange={(e) => upd(i, { deskripsi: e.target.value })} />
              <Button size="icon" variant="ghost" className="col-span-8 md:col-span-1 justify-self-end" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" />Tambah CPL</Button>
          <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan</Button>
        </div>
      </>}
    </Card>
  );
};

const CpmkTab = () => {
  const [prodi, setProdi] = useState<Prodi[]>([]);
  const [pid, setPid] = useState<string>("");
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [cplId, setCplId] = useState<string>("");
  const [items, setItems] = useState<CPMK[]>([]);
  useEffect(() => { supabase.from("prodi").select("*").order("kode").then(({ data }) => setProdi((data ?? []) as Prodi[])); }, []);
  useEffect(() => {
    if (!pid) { setCpls([]); setCplId(""); return; }
    supabase.from("cpl").select("*").eq("prodi_id", pid).order("kode").then(({ data }) => setCpls((data ?? []) as CPL[]));
  }, [pid]);
  useEffect(() => {
    if (!cplId) return;
    supabase.from("cpmk").select("*").eq("cpl_id", cplId).order("kode").then(({ data }) => setItems((data ?? []) as CPMK[]));
  }, [cplId]);
  const total = items.reduce((s, x) => s + Number(x.bobot || 0), 0);
  const upd = (i: number, p: Partial<CPMK>) => { const n = [...items]; n[i] = { ...n[i], ...p }; setItems(n); };
  const add = () => setItems([...items, { id: `new-${Date.now()}`, cpl_id: cplId, kode: `CPMK-${items.length + 1}`, deskripsi: "", bobot: 0 }]);
  const remove = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("cpmk").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, x) => x !== i));
  };
  const save = async () => {
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { error } = await supabase.from("cpmk").insert({ cpl_id: cplId, kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot });
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("cpmk").update({ kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot }).eq("id", it.id);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("CPMK tersimpan");
    const { data } = await supabase.from("cpmk").select("*").eq("cpl_id", cplId).order("kode");
    setItems((data ?? []) as CPMK[]);
  };
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">CPMK (per CPL)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-w-2xl">
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Pilih Prodi" /></SelectTrigger>
          <SelectContent>{prodi.map((p) => <SelectItem key={p.id} value={p.id}>{p.kode} — {p.nama}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cplId} onValueChange={setCplId} disabled={!pid}>
          <SelectTrigger><SelectValue placeholder="Pilih CPL" /></SelectTrigger>
          <SelectContent>{cpls.map((c) => <SelectItem key={c.id} value={c.id}>{c.kode}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {cplId && <>
        <div className="flex justify-end mb-2">
          <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "destructive"}>Total bobot dalam CPL: {total}%</Badge>
        </div>
        <div className="space-y-3">
          {items.map((c, i) => (
            <div key={c.id} className="grid grid-cols-12 gap-2 md:gap-3 items-center">
              <Input className="col-span-4 md:col-span-2" value={c.kode} onChange={(e) => upd(i, { kode: e.target.value })} />
              <Input className="col-span-12 md:col-span-7 order-4 md:order-none" placeholder="Deskripsi CPMK" value={c.deskripsi} onChange={(e) => upd(i, { deskripsi: e.target.value })} />
              <div className="col-span-6 md:col-span-2 relative">
                <Input type="number" value={c.bobot} onChange={(e) => upd(i, { bobot: Number(e.target.value) })} />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
              </div>
              <Button size="icon" variant="ghost" className="col-span-2 md:col-span-1 justify-self-end" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" />Tambah CPMK</Button>
          <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan</Button>
        </div>
      </>}
    </Card>
  );
};

const SubTab = () => {
  const [prodi, setProdi] = useState<Prodi[]>([]);
  const [pid, setPid] = useState<string>("");
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [cplId, setCplId] = useState<string>("");
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [cpmkId, setCpmkId] = useState<string>("");
  const [items, setItems] = useState<SubCPMK[]>([]);
  useEffect(() => { supabase.from("prodi").select("*").order("kode").then(({ data }) => setProdi((data ?? []) as Prodi[])); }, []);
  useEffect(() => {
    if (!pid) return;
    supabase.from("cpl").select("*").eq("prodi_id", pid).order("kode").then(({ data }) => setCpls((data ?? []) as CPL[]));
  }, [pid]);
  useEffect(() => {
    if (!cplId) return;
    supabase.from("cpmk").select("*").eq("cpl_id", cplId).order("kode").then(({ data }) => setCpmks((data ?? []) as CPMK[]));
  }, [cplId]);
  useEffect(() => {
    if (!cpmkId) return;
    supabase.from("sub_cpmk").select("*").eq("cpmk_id", cpmkId).order("kode").then(({ data }) => setItems((data ?? []) as SubCPMK[]));
  }, [cpmkId]);
  const total = items.reduce((s, x) => s + Number(x.bobot || 0), 0);
  const upd = (i: number, p: Partial<SubCPMK>) => { const n = [...items]; n[i] = { ...n[i], ...p }; setItems(n); };
  const add = () => setItems([...items, { id: `new-${Date.now()}`, cpmk_id: cpmkId, kode: `Sub-${items.length + 1}`, deskripsi: "", bobot: 0 }]);
  const remove = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("sub_cpmk").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, x) => x !== i));
  };
  const save = async () => {
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { error } = await supabase.from("sub_cpmk").insert({ cpmk_id: cpmkId, kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot });
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("sub_cpmk").update({ kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot }).eq("id", it.id);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("Sub-CPMK tersimpan");
    const { data } = await supabase.from("sub_cpmk").select("*").eq("cpmk_id", cpmkId).order("kode");
    setItems((data ?? []) as SubCPMK[]);
  };
  return (
    <Card className="p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-4">Sub-CPMK (per CPMK)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Pilih Prodi" /></SelectTrigger>
          <SelectContent>{prodi.map((p) => <SelectItem key={p.id} value={p.id}>{p.kode} — {p.nama}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cplId} onValueChange={setCplId} disabled={!pid}>
          <SelectTrigger><SelectValue placeholder="Pilih CPL" /></SelectTrigger>
          <SelectContent>{cpls.map((c) => <SelectItem key={c.id} value={c.id}>{c.kode}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cpmkId} onValueChange={setCpmkId} disabled={!cplId}>
          <SelectTrigger><SelectValue placeholder="Pilih CPMK" /></SelectTrigger>
          <SelectContent>{cpmks.map((c) => <SelectItem key={c.id} value={c.id}>{c.kode}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {cpmkId && <>
        <div className="flex justify-end mb-2">
          <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "destructive"}>Total bobot dalam CPMK: {total}%</Badge>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <Table>
            <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Deskripsi</TableHead><TableHead className="w-32">Bobot</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell><Input value={s.kode} onChange={(e) => upd(i, { kode: e.target.value })} /></TableCell>
                  <TableCell><Input value={s.deskripsi} onChange={(e) => upd(i, { deskripsi: e.target.value })} /></TableCell>
                  <TableCell><Input type="number" value={s.bobot} onChange={(e) => upd(i, { bobot: Number(e.target.value) })} /></TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" />Tambah Sub-CPMK</Button>
          <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan</Button>
        </div>
      </>}
    </Card>
  );
};

interface StudentRow { id: string; npm: string; nama: string; }
interface ReportData {
  student: StudentRow;
  cplScores: Record<string, number>; // cpl_id -> 0..100
  avg: number;
}

const ReportTab = () => {
  const [prodi, setProdi] = useState<Prodi[]>([]);
  const [pid, setPid] = useState<string>("");
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [rows, setRows] = useState<ReportData[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("prodi").select("*").order("kode").then(({ data }) => setProdi((data ?? []) as Prodi[])); }, []);

  useEffect(() => {
    if (!pid) { setCpls([]); setRows([]); setSelected(""); return; }
    (async () => {
      setLoading(true);
      try {
        const { data: cplData } = await supabase.from("cpl").select("*").eq("prodi_id", pid).order("kode");
        const cplList = (cplData ?? []) as CPL[];
        setCpls(cplList);
        if (cplList.length === 0) { setRows([]); return; }

        // Load all CPMK and Sub-CPMK for these CPLs
        const cplIds = cplList.map(c => c.id);
        const { data: cpmkData } = await supabase.from("cpmk").select("*").in("cpl_id", cplIds);
        const cpmkList = (cpmkData ?? []) as CPMK[];
        const cpmkIds = cpmkList.map(c => c.id);
        const { data: subData } = cpmkIds.length
          ? await supabase.from("sub_cpmk").select("*").in("cpmk_id", cpmkIds)
          : { data: [] as SubCPMK[] };
        const subList = (subData ?? []) as SubCPMK[];

        // Courses for this prodi
        const { data: courseData } = await supabase.from("courses").select("id").eq("prodi_id", pid);
        const courseIds = (courseData ?? []).map((c: any) => c.id);
        if (courseIds.length === 0) { setRows([]); return; }

        // course_cpl mappings (weights per course)
        const { data: ccplData } = await supabase.from("course_cpl").select("*").in("course_id", courseIds);
        const ccpl = (ccplData ?? []) as { course_id: string; cpl_id: string; bobot: number }[];

        // Enrollments + students
        const { data: enrData } = await supabase.from("enrollments").select("id, course_id, student_id").in("course_id", courseIds);
        const enrollments = (enrData ?? []) as { id: string; course_id: string; student_id: string }[];
        const studentIds = Array.from(new Set(enrollments.map(e => e.student_id)));
        if (studentIds.length === 0) { setRows([]); return; }
        const { data: studData } = await supabase.from("students").select("*").in("id", studentIds);
        const students = (studData ?? []) as StudentRow[];

        // Sub-CPMK scores
        const enrollmentIds = enrollments.map(e => e.id);
        const { data: scoreData } = enrollmentIds.length
          ? await supabase.from("sub_cpmk_scores").select("*").in("enrollment_id", enrollmentIds)
          : { data: [] as any[] };
        const scores = (scoreData ?? []) as { enrollment_id: string; sub_cpmk_id: string; nilai: number }[];

        // Build helpers
        const subById = new Map(subList.map(s => [s.id, s]));
        const cpmkById = new Map(cpmkList.map(c => [c.id, c]));
        const subsByCpmk = new Map<string, SubCPMK[]>();
        subList.forEach(s => { const a = subsByCpmk.get(s.cpmk_id) ?? []; a.push(s); subsByCpmk.set(s.cpmk_id, a); });
        const cpmksByCpl = new Map<string, CPMK[]>();
        cpmkList.forEach(c => { const a = cpmksByCpl.get(c.cpl_id) ?? []; a.push(c); cpmksByCpl.set(c.cpl_id, a); });
        const enrById = new Map(enrollments.map(e => [e.id, e]));

        // For each (student, course), gather sub_cpmk scores keyed by sub_cpmk_id
        // student -> course -> Map<sub_cpmk_id, nilai>
        const perStudentCourse = new Map<string, Map<string, Map<string, number>>>();
        scores.forEach(sc => {
          const e = enrById.get(sc.enrollment_id); if (!e) return;
          let byCourse = perStudentCourse.get(e.student_id);
          if (!byCourse) { byCourse = new Map(); perStudentCourse.set(e.student_id, byCourse); }
          let m = byCourse.get(e.course_id);
          if (!m) { m = new Map(); byCourse.set(e.course_id, m); }
          m.set(sc.sub_cpmk_id, Number(sc.nilai) || 0);
        });

        // Course CPL weights map: course -> cpl -> bobot
        const ccplMap = new Map<string, Map<string, number>>();
        ccpl.forEach(x => {
          let m = ccplMap.get(x.course_id);
          if (!m) { m = new Map(); ccplMap.set(x.course_id, m); }
          m.set(x.cpl_id, Number(x.bobot) || 0);
        });

        const computeCplScoreInCourse = (subScores: Map<string, number>, cplId: string): number | null => {
          const cpmks = cpmksByCpl.get(cplId) ?? [];
          let cplNum = 0, cplDen = 0;
          for (const cpmk of cpmks) {
            const subs = subsByCpmk.get(cpmk.id) ?? [];
            let num = 0, den = 0;
            for (const s of subs) {
              if (subScores.has(s.id)) {
                const w = Number(s.bobot) || 0;
                num += (subScores.get(s.id) as number) * w;
                den += w;
              }
            }
            if (den > 0) {
              const cpmkScore = num / den;
              const w = Number(cpmk.bobot) || 0;
              cplNum += cpmkScore * w;
              cplDen += w;
            }
          }
          return cplDen > 0 ? cplNum / cplDen : null;
        };

        const result: ReportData[] = students.map(stu => {
          const byCourse = perStudentCourse.get(stu.id) ?? new Map();
          const cplScores: Record<string, number> = {};
          for (const cpl of cplList) {
            // Weighted average across courses (weight = course_cpl.bobot)
            let num = 0, den = 0;
            for (const [courseId, subScores] of byCourse.entries()) {
              const courseCplWeight = ccplMap.get(courseId)?.get(cpl.id) ?? 0;
              if (courseCplWeight <= 0) continue;
              const v = computeCplScoreInCourse(subScores, cpl.id);
              if (v == null) continue;
              num += v * courseCplWeight;
              den += courseCplWeight;
            }
            cplScores[cpl.id] = den > 0 ? num / den : 0;
          }
          const vals = Object.values(cplScores).filter(v => v > 0);
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { student: stu, cplScores, avg };
        }).sort((a, b) => a.student.npm.localeCompare(b.student.npm));

        setRows(result);
        if (result.length && !selected) setSelected(result[0].student.id);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  const selectedRow = rows.find(r => r.student.id === selected);
  const radarData = selectedRow ? cpls.map(c => ({
    cpl: c.kode,
    nilai: Math.round((selectedRow.cplScores[c.id] ?? 0) * 100) / 100,
    fullMark: 100,
  })) : [];

  const exportCsv = () => {
    if (!rows.length) return;
    const header = ["NPM", "Nama", ...cpls.map(c => c.kode), "Rata-rata"];
    const lines = [header.join(",")];
    rows.forEach(r => {
      const row = [r.student.npm, `"${r.student.nama.replace(/"/g, '""')}"`,
        ...cpls.map(c => (r.cplScores[c.id] ?? 0).toFixed(2)),
        r.avg.toFixed(2)];
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `laporan-cpl-${pid}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Laporan Capaian Pembelajaran Lulusan per Mahasiswa</h2>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>Ekspor CSV</Button>
      </div>
      <div className="mb-4 max-w-md">
        <Select value={pid} onValueChange={setPid}>
          <SelectTrigger><SelectValue placeholder="Pilih Prodi" /></SelectTrigger>
          <SelectContent>{prodi.map((p) => <SelectItem key={p.id} value={p.id}>{p.kode} — {p.nama}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Memuat data…</p>}

      {pid && !loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Belum ada data mahasiswa atau penilaian untuk prodi ini.</p>
      )}

      {pid && rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NPM</TableHead>
                  <TableHead>Nama</TableHead>
                  {cpls.map(c => <TableHead key={c.id} className="text-right">{c.kode}</TableHead>)}
                  <TableHead className="text-right">Rata²</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow
                    key={r.student.id}
                    onClick={() => setSelected(r.student.id)}
                    data-state={selected === r.student.id ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs">{r.student.npm}</TableCell>
                    <TableCell>{r.student.nama}</TableCell>
                    {cpls.map(c => (
                      <TableCell key={c.id} className="text-right tabular-nums">
                        {(r.cplScores[c.id] ?? 0).toFixed(1)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-semibold tabular-nums">{r.avg.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <div className="mb-3">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Pilih mahasiswa" /></SelectTrigger>
                <SelectContent>
                  {rows.map(r => <SelectItem key={r.student.id} value={r.student.id}>{r.student.npm} — {r.student.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedRow && (
              <Card className="p-4 bg-gradient-subtle">
                <div className="mb-2">
                  <div className="font-semibold">{selectedRow.student.nama}</div>
                  <div className="text-xs text-muted-foreground font-mono">{selectedRow.student.npm}</div>
                </div>
                <div className="w-full" style={{ height: 360 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="cpl" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Radar
                        name="Capaian"
                        dataKey="nilai"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                      <RTooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-muted-foreground text-center">
                  Rata-rata capaian: <span className="font-semibold text-foreground">{selectedRow.avg.toFixed(2)}</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default Admin;
