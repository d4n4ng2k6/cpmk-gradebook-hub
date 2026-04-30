import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Target, Users, Calculator, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; kode_mk: string; nama_mk: string; kelas: string|null; tahun_ajaran: string|null; semester: string|null; prodi: string|null; prodi_id: string|null; }
interface CPL { id: string; kode: string; deskripsi: string; }
interface CPMK { id: string; cpl_id: string; kode: string; deskripsi: string; bobot: number; }
interface SubCPMK { id: string; cpmk_id: string; kode: string; deskripsi: string; bobot: number; }
interface Student { id: string; npm: string; nama: string; }
interface Enrollment { id: string; student: Student; }
interface CourseCpl { id?: string; cpl_id: string; bobot: number; }
interface ScoreRow { enrollment_id: string; sub_cpmk_id: string; nilai: number; }

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [subs, setSubs] = useState<SubCPMK[]>([]);
  const [courseCpls, setCourseCpls] = useState<CourseCpl[]>([]);
  const [activeSubIds, setActiveSubIds] = useState<Set<string>>(new Set());
  const [enrolls, setEnrolls] = useState<Enrollment[]>([]);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    const c = await supabase.from("courses").select("*").eq("id", id).single();
    if (!c.data) { setLoading(false); return; }
    setCourse(c.data as Course);
    const prodiId = (c.data as any).prodi_id;

    const [cplRes, ccplRes, enRes] = await Promise.all([
      prodiId ? supabase.from("cpl").select("*").eq("prodi_id", prodiId).order("kode") : Promise.resolve({ data: [] as any }),
      supabase.from("course_cpl").select("*").eq("course_id", id),
      supabase.from("enrollments").select("id, student:students(id,npm,nama)").eq("course_id", id),
    ]);
    setCpls((cplRes.data ?? []) as CPL[]);
    setCourseCpls(((ccplRes.data ?? []) as any[]).map((x) => ({ id: x.id, cpl_id: x.cpl_id, bobot: Number(x.bobot) })));
    setEnrolls((enRes.data ?? []) as any);

    const cplIds = (cplRes.data ?? []).map((x: any) => x.id);
    const cpmkRes = cplIds.length ? await supabase.from("cpmk").select("*").in("cpl_id", cplIds).order("kode") : { data: [] };
    setCpmks(((cpmkRes.data ?? []) as any[]).map((x) => ({ ...x, bobot: Number(x.bobot) })) as CPMK[]);

    const cpmkIds = (cpmkRes.data ?? []).map((x: any) => x.id);
    const subRes = cpmkIds.length ? await supabase.from("sub_cpmk").select("*").in("cpmk_id", cpmkIds).order("kode") : { data: [] };
    setSubs(((subRes.data ?? []) as any[]).map((x) => ({ ...x, bobot: Number(x.bobot) })) as SubCPMK[]);

    const csRes = await supabase.from("course_sub_cpmk").select("sub_cpmk_id").eq("course_id", id);
    setActiveSubIds(new Set((csRes.data ?? []).map((x: any) => x.sub_cpmk_id)));

    const enrollIds = (enRes.data ?? []).map((e: any) => e.id);
    if (enrollIds.length) {
      const sc = await supabase.from("sub_cpmk_scores").select("enrollment_id, sub_cpmk_id, nilai").in("enrollment_id", enrollIds);
      setScores(((sc.data ?? []) as any[]).map((s) => ({ ...s, nilai: Number(s.nilai) })));
    } else {
      setScores([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [id]);

  if (loading || !course) return <AppLayout><div className="text-muted-foreground">Memuat...</div></AppLayout>;

  return (
    <AppLayout>
      <Link to="/courses" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
      </Link>
      <div className="mb-6">
        <div className="text-sm font-medium text-primary">{course.kode_mk}</div>
        <h1 className="text-3xl font-bold tracking-tight">{course.nama_mk}</h1>
        <p className="text-muted-foreground mt-1">
          Kelas {course.kelas} • {course.semester} {course.tahun_ajaran} • {course.prodi}
        </p>
      </div>

      <Tabs defaultValue="setup">
        <TabsList className="mb-6">
          <TabsTrigger value="setup"><Target className="h-4 w-4 mr-2" />Pilih CPL & Sub-CPMK</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-2" />Mahasiswa</TabsTrigger>
          <TabsTrigger value="scores"><Calculator className="h-4 w-4 mr-2" />Input Nilai</TabsTrigger>
          <TabsTrigger value="rekap"><BarChart3 className="h-4 w-4 mr-2" />Rekap OBE</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <SetupTab courseId={course.id} cpls={cpls} cpmks={cpmks} subs={subs} courseCpls={courseCpls} activeSubIds={activeSubIds} reload={loadAll} />
        </TabsContent>
        <TabsContent value="students"><StudentsTab enrolls={enrolls} /></TabsContent>
        <TabsContent value="scores">
          <ScoresTab courseId={course.id} cpls={cpls} cpmks={cpmks} subs={subs} activeSubIds={activeSubIds} enrolls={enrolls} scores={scores} reload={loadAll} />
        </TabsContent>
        <TabsContent value="rekap">
          <RekapTab cpls={cpls} cpmks={cpmks} subs={subs} courseCpls={courseCpls} activeSubIds={activeSubIds} enrolls={enrolls} scores={scores} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

/* ---------- Setup: pilih CPL (+ bobot) & centang Sub-CPMK ---------- */
const SetupTab = ({ courseId, cpls, cpmks, subs, courseCpls, activeSubIds, reload }: any) => {
  const [ccplState, setCcplState] = useState<Record<string, number>>({});
  const [active, setActive] = useState<Set<string>>(new Set());

  useEffect(() => {
    const m: Record<string, number> = {};
    courseCpls.forEach((c: CourseCpl) => { m[c.cpl_id] = c.bobot; });
    setCcplState(m);
    setActive(new Set(activeSubIds));
  }, [courseCpls, activeSubIds]);

  const totalCplBobot = Object.values(ccplState).reduce((s, v) => s + Number(v || 0), 0);

  const toggleSub = (sid: string) => {
    const n = new Set(active);
    n.has(sid) ? n.delete(sid) : n.add(sid);
    setActive(n);
  };

  const save = async () => {
    // course_cpl: replace
    await supabase.from("course_cpl").delete().eq("course_id", courseId);
    const cplRows = Object.entries(ccplState).filter(([_, v]) => Number(v) > 0).map(([cpl_id, bobot]) => ({ course_id: courseId, cpl_id, bobot: Number(bobot) }));
    if (cplRows.length) {
      const { error } = await supabase.from("course_cpl").insert(cplRows);
      if (error) return toast.error(error.message);
    }
    // course_sub_cpmk: replace
    await supabase.from("course_sub_cpmk").delete().eq("course_id", courseId);
    const subRows = [...active].map((sub_cpmk_id) => ({ course_id: courseId, sub_cpmk_id }));
    if (subRows.length) {
      const { error } = await supabase.from("course_sub_cpmk").insert(subRows);
      if (error) return toast.error(error.message);
    }
    toast.success("Pengaturan tersimpan");
    reload();
  };

  if (cpls.length === 0) {
    return <Card className="p-6 text-muted-foreground">Belum ada CPL untuk prodi ini. Mintalah admin untuk menyiapkan CPL/CPMK/Sub-CPMK terlebih dahulu.</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">CPL yang Diampu Matakuliah Ini</h2>
            <p className="text-sm text-muted-foreground">Tetapkan bobot kontribusi tiap CPL dalam matakuliah ini (total 100%).</p>
          </div>
          <Badge variant={Math.abs(totalCplBobot - 100) < 0.01 ? "default" : "destructive"}>Total: {totalCplBobot}%</Badge>
        </div>
        <div className="space-y-3">
          {cpls.map((c: CPL) => (
            <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-2 font-medium text-primary">{c.kode}</div>
              <div className="col-span-8 text-sm text-muted-foreground line-clamp-1">{c.deskripsi || "—"}</div>
              <div className="col-span-2 relative">
                <Input type="number" placeholder="0" value={ccplState[c.id] ?? ""} onChange={(e) => setCcplState({ ...ccplState, [c.id]: Number(e.target.value) })} />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Pilih Sub-CPMK yang Dinilai</h2>
        <p className="text-sm text-muted-foreground mb-4">Centang Sub-CPMK yang akan dinilai pada matakuliah ini. Bobot sudah ditetapkan admin.</p>
        {cpls.map((cpl: CPL) => {
          const cpmksOfCpl = cpmks.filter((m: CPMK) => m.cpl_id === cpl.id);
          if (cpmksOfCpl.length === 0) return null;
          return (
            <div key={cpl.id} className="mb-6">
              <div className="font-semibold text-primary mb-2">{cpl.kode} — {cpl.deskripsi}</div>
              {cpmksOfCpl.map((m: CPMK) => {
                const subsOfCpmk = subs.filter((s: SubCPMK) => s.cpmk_id === m.id);
                return (
                  <div key={m.id} className="ml-4 mb-3">
                    <div className="text-sm font-medium mb-1">{m.kode} <span className="text-muted-foreground font-normal">({m.bobot}% dari CPL)</span> — {m.deskripsi}</div>
                    <div className="ml-4 space-y-1">
                      {subsOfCpmk.length === 0 && <div className="text-xs text-muted-foreground">Belum ada Sub-CPMK.</div>}
                      {subsOfCpmk.map((s: SubCPMK) => (
                        <label key={s.id} className="flex items-start gap-2 cursor-pointer text-sm">
                          <Checkbox checked={active.has(s.id)} onCheckedChange={() => toggleSub(s.id)} />
                          <span><span className="font-mono text-xs">{s.kode}</span> <span className="text-muted-foreground">({s.bobot}%)</span> — {s.deskripsi}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </Card>

      <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan Pengaturan</Button>
    </div>
  );
};

const StudentsTab = ({ enrolls }: { enrolls: Enrollment[] }) => (
  <Card className="p-6">
    <h2 className="text-lg font-semibold mb-4">Daftar Mahasiswa ({enrolls.length})</h2>
    <Table>
      <TableHeader><TableRow><TableHead className="w-12">No</TableHead><TableHead>NPM</TableHead><TableHead>Nama</TableHead></TableRow></TableHeader>
      <TableBody>
        {enrolls.map((e, i) => (
          <TableRow key={e.id}>
            <TableCell>{i + 1}</TableCell>
            <TableCell className="font-mono text-sm">{e.student.npm}</TableCell>
            <TableCell>{e.student.nama}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

/* ---------- Input nilai per Sub-CPMK ---------- */
const ScoresTab = ({ cpls, cpmks, subs, activeSubIds, enrolls, scores, reload }: any) => {
  const activeSubs = useMemo(
    () => (subs as SubCPMK[]).filter((s) => activeSubIds.has(s.id)),
    [subs, activeSubIds]
  );
  const [grid, setGrid] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    const g: Record<string, Record<string, number>> = {};
    enrolls.forEach((e: Enrollment) => { g[e.id] = {}; activeSubs.forEach((s) => g[e.id][s.id] = 0); });
    scores.forEach((s: ScoreRow) => { if (g[s.enrollment_id] && activeSubIds.has(s.sub_cpmk_id)) g[s.enrollment_id][s.sub_cpmk_id] = Number(s.nilai); });
    setGrid(g);
  }, [enrolls, activeSubs, scores, activeSubIds]);

  const setVal = (eid: string, sid: string, v: number) =>
    setGrid({ ...grid, [eid]: { ...grid[eid], [sid]: v } });

  const save = async () => {
    const rows = enrolls.flatMap((e: Enrollment) =>
      activeSubs.map((s) => ({ enrollment_id: e.id, sub_cpmk_id: s.id, nilai: grid[e.id]?.[s.id] ?? 0 }))
    );
    if (!rows.length) { toast.info("Tidak ada Sub-CPMK yang dipilih."); return; }
    const { error } = await supabase.from("sub_cpmk_scores").upsert(rows, { onConflict: "enrollment_id,sub_cpmk_id" });
    if (error) return toast.error(error.message);
    toast.success("Nilai tersimpan");
    reload();
  };

  if (activeSubs.length === 0) {
    return <Card className="p-6 text-muted-foreground">Pilih Sub-CPMK yang akan dinilai pada tab "Pilih CPL & Sub-CPMK" terlebih dahulu.</Card>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Input Nilai per Sub-CPMK</h2>
        <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan Nilai</Button>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>NPM</TableHead>
              <TableHead>Nama</TableHead>
              {activeSubs.map((s) => (
                <TableHead key={s.id} className="text-center">
                  <div className="font-mono text-xs">{s.kode}</div>
                  <div className="text-xs text-muted-foreground font-normal">{s.bobot}%</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolls.map((e: Enrollment, i: number) => (
              <TableRow key={e.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{e.student.npm}</TableCell>
                <TableCell className="whitespace-nowrap">{e.student.nama}</TableCell>
                {activeSubs.map((s) => (
                  <TableCell key={s.id}>
                    <Input
                      type="number" min={0} max={100}
                      className="w-20 mx-auto text-center"
                      value={grid[e.id]?.[s.id] ?? 0}
                      onChange={(ev) => setVal(e.id, s.id, Number(ev.target.value))}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

/* ---------- Rekap kumulatif ---------- */
const RekapTab = ({ cpls, cpmks, subs, courseCpls, activeSubIds, enrolls, scores }: any) => {
  const scoreMap = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    (scores as ScoreRow[]).forEach((s) => { (m[s.enrollment_id] ??= {})[s.sub_cpmk_id] = Number(s.nilai); });
    return m;
  }, [scores]);

  // CPMK score = weighted avg dari Sub-CPMK aktif (pakai bobot Sub di CPMK)
  const cpmkScore = (eid: string, cpmkId: string) => {
    const subsOfCpmk = (subs as SubCPMK[]).filter((s) => s.cpmk_id === cpmkId && activeSubIds.has(s.id));
    let num = 0, den = 0;
    subsOfCpmk.forEach((s) => {
      const w = Number(s.bobot);
      num += (scoreMap[eid]?.[s.id] ?? 0) * w;
      den += w;
    });
    return den > 0 ? num / den : 0;
  };

  // CPL score = weighted avg dari CPMK (pakai bobot CPMK di CPL)
  const cplScore = (eid: string, cplId: string) => {
    const cpmksOfCpl = (cpmks as CPMK[]).filter((m) => m.cpl_id === cplId);
    let num = 0, den = 0;
    cpmksOfCpl.forEach((m) => {
      const w = Number(m.bobot);
      const sc = cpmkScore(eid, m.id);
      if (w > 0) { num += sc * w; den += w; }
    });
    return den > 0 ? num / den : 0;
  };

  // Nilai akhir = weighted avg CPL pakai bobot di courseCpls
  const finalScore = (eid: string) => {
    let num = 0, den = 0;
    (courseCpls as CourseCpl[]).forEach((cc) => {
      const w = Number(cc.bobot);
      const sc = cplScore(eid, cc.cpl_id);
      if (w > 0) { num += sc * w; den += w; }
    });
    return den > 0 ? num / den : 0;
  };

  const activeCpls = (cpls as CPL[]).filter((c) => courseCpls.some((cc: CourseCpl) => cc.cpl_id === c.id));

  if (activeCpls.length === 0) return <Card className="p-6 text-muted-foreground">Belum ada CPL aktif.</Card>;

  // Stat per CPMK
  const allActiveCpmks = (cpmks as CPMK[]).filter((m) =>
    activeCpls.some((c) => c.id === m.cpl_id) &&
    (subs as SubCPMK[]).some((s) => s.cpmk_id === m.id && activeSubIds.has(s.id))
  );
  const stats = allActiveCpmks.map((m) => {
    const vals = enrolls.map((e: Enrollment) => cpmkScore(e.id, m.id));
    const avg = vals.length ? vals.reduce((s: number, v: number) => s + v, 0) / vals.length : 0;
    const tercapai = vals.filter((v: number) => v >= 60).length;
    return { cpmk: m, avg, tercapai, total: vals.length };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.cpmk.id} className="p-5">
            <div className="text-sm font-medium text-primary">{s.cpmk.kode}</div>
            <div className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.cpmk.deskripsi || "—"}</div>
            <div className="text-3xl font-bold">{s.avg.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Rata-rata • {s.tercapai}/{s.total} mahasiswa tercapai (≥60)
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Rekap Kumulatif per CPL & Mahasiswa</h2>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NPM</TableHead>
                <TableHead>Nama</TableHead>
                {activeCpls.map((c) => <TableHead key={c.id} className="text-center">{c.kode}</TableHead>)}
                <TableHead className="text-center">Nilai Akhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolls.map((e: Enrollment, i: number) => (
                <TableRow key={e.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{e.student.npm}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.student.nama}</TableCell>
                  {activeCpls.map((c) => {
                    const v = cplScore(e.id, c.id);
                    return (
                      <TableCell key={c.id} className="text-center">
                        <Badge variant={v >= 60 ? "default" : "destructive"} className="font-mono">{v.toFixed(1)}</Badge>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center font-bold">{finalScore(e.id).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default CourseDetail;
