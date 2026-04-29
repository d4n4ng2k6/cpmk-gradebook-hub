import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Target, ListChecks, Users, Calculator, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; kode_mk: string; nama_mk: string; kelas: string|null; tahun_ajaran: string|null; semester: string|null; prodi: string|null; }
interface CPMK { id: string; kode: string; deskripsi: string; bobot: number; }
interface Component { id: string; nama: string; bobot: number; urutan: number; }
interface Mapping { id?: string; component_id: string; cpmk_id: string; kontribusi: number; }
interface Student { id: string; npm: string; nama: string; }
interface Enrollment { id: string; student: Student; }
interface Score { id?: string; enrollment_id: string; component_id: string; nilai: number; }

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [cpmk, setCpmk] = useState<CPMK[]>([]);
  const [comps, setComps] = useState<Component[]>([]);
  const [maps, setMaps] = useState<Mapping[]>([]);
  const [enrolls, setEnrolls] = useState<Enrollment[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    const [c, k, co, m, en, sc] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase.from("cpmk").select("*").eq("course_id", id).order("kode"),
      supabase.from("components").select("*").eq("course_id", id).order("urutan"),
      supabase.from("component_cpmk").select("*"),
      supabase.from("enrollments").select("id, student:students(id,npm,nama)").eq("course_id", id),
      supabase.from("scores").select("*"),
    ]);
    if (c.data) setCourse(c.data as any);
    setCpmk((k.data ?? []) as any);
    setComps((co.data ?? []) as any);
    const compIds = new Set((co.data ?? []).map((x: any) => x.id));
    setMaps(((m.data ?? []) as any[]).filter((x) => compIds.has(x.component_id)));
    setEnrolls((en.data ?? []) as any);
    const enrollIds = new Set((en.data ?? []).map((e: any) => e.id));
    setScores(((sc.data ?? []) as any[]).filter((s) => enrollIds.has(s.enrollment_id)));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [id]);

  if (loading || !course) {
    return <AppLayout><div className="text-muted-foreground">Memuat...</div></AppLayout>;
  }

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

      <Tabs defaultValue="cpmk">
        <TabsList className="mb-6">
          <TabsTrigger value="cpmk"><Target className="h-4 w-4 mr-2" />CPMK</TabsTrigger>
          <TabsTrigger value="components"><ListChecks className="h-4 w-4 mr-2" />Komponen & Mapping</TabsTrigger>
          <TabsTrigger value="students"><Users className="h-4 w-4 mr-2" />Mahasiswa</TabsTrigger>
          <TabsTrigger value="scores"><Calculator className="h-4 w-4 mr-2" />Input Nilai</TabsTrigger>
          <TabsTrigger value="rekap"><BarChart3 className="h-4 w-4 mr-2" />Rekap OBE</TabsTrigger>
        </TabsList>

        <TabsContent value="cpmk"><CpmkTab courseId={course.id} cpmk={cpmk} reload={loadAll} /></TabsContent>
        <TabsContent value="components"><ComponentsTab courseId={course.id} comps={comps} cpmk={cpmk} maps={maps} reload={loadAll} /></TabsContent>
        <TabsContent value="students"><StudentsTab enrolls={enrolls} /></TabsContent>
        <TabsContent value="scores"><ScoresTab comps={comps} enrolls={enrolls} scores={scores} reload={loadAll} /></TabsContent>
        <TabsContent value="rekap"><RekapTab cpmk={cpmk} comps={comps} maps={maps} enrolls={enrolls} scores={scores} /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

/* --------- CPMK Tab --------- */
const CpmkTab = ({ courseId, cpmk, reload }: { courseId: string; cpmk: CPMK[]; reload: () => void }) => {
  const [items, setItems] = useState<CPMK[]>(cpmk);
  useEffect(() => setItems(cpmk), [cpmk]);
  const total = items.reduce((s, c) => s + Number(c.bobot || 0), 0);

  const update = (i: number, patch: Partial<CPMK>) => {
    const next = [...items]; next[i] = { ...next[i], ...patch }; setItems(next);
  };
  const add = () => setItems([...items, { id: `new-${Date.now()}`, kode: `CPMK-${items.length + 1}`, deskripsi: "", bobot: 0 }]);
  const remove = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("cpmk").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, idx) => idx !== i));
  };
  const save = async () => {
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { error } = await supabase.from("cpmk").insert({ course_id: courseId, kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot });
        if (error) return toast.error(error.message);
      } else {
        const { error } = await supabase.from("cpmk").update({ kode: it.kode, deskripsi: it.deskripsi, bobot: it.bobot }).eq("id", it.id);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("CPMK tersimpan");
    reload();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Capaian Pembelajaran Mata Kuliah</h2>
          <p className="text-sm text-muted-foreground">Tetapkan CPMK dan bobot kontribusinya pada nilai akhir.</p>
        </div>
        <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "destructive"}>Total bobot: {total}%</Badge>
      </div>
      <div className="space-y-3">
        {items.map((c, i) => (
          <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
            <Input className="col-span-2" value={c.kode} onChange={(e) => update(i, { kode: e.target.value })} />
            <Input className="col-span-7" placeholder="Deskripsi capaian" value={c.deskripsi} onChange={(e) => update(i, { deskripsi: e.target.value })} />
            <div className="col-span-2 relative">
              <Input type="number" value={c.bobot} onChange={(e) => update(i, { bobot: Number(e.target.value) })} />
              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={add}><Plus className="h-4 w-4 mr-2" />Tambah CPMK</Button>
        <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan</Button>
      </div>
    </Card>
  );
};

/* --------- Components + Mapping Tab --------- */
const ComponentsTab = ({ courseId, comps, cpmk, maps, reload }: { courseId: string; comps: Component[]; cpmk: CPMK[]; maps: Mapping[]; reload: () => void }) => {
  const [items, setItems] = useState<Component[]>(comps);
  const [mapState, setMapState] = useState<Record<string, Record<string, number>>>({}); // compId -> cpmkId -> %
  useEffect(() => {
    setItems(comps);
    const m: Record<string, Record<string, number>> = {};
    comps.forEach((c) => { m[c.id] = {}; cpmk.forEach((k) => { m[c.id][k.id] = 0; }); });
    maps.forEach((mp) => { if (m[mp.component_id]) m[mp.component_id][mp.cpmk_id] = Number(mp.kontribusi); });
    setMapState(m);
  }, [comps, cpmk, maps]);

  const totalBobot = items.reduce((s, c) => s + Number(c.bobot || 0), 0);

  const add = () => setItems([...items, { id: `new-${Date.now()}`, nama: "Baru", bobot: 0, urutan: items.length + 1 }]);
  const removeComp = async (i: number) => {
    const it = items[i];
    if (!it.id.startsWith("new-")) {
      const { error } = await supabase.from("components").delete().eq("id", it.id);
      if (error) return toast.error(error.message);
    }
    setItems(items.filter((_, idx) => idx !== i));
  };
  const update = (i: number, patch: Partial<Component>) => { const n = [...items]; n[i] = { ...n[i], ...patch }; setItems(n); };

  const saveAll = async () => {
    // simpan komponen
    const idMap: Record<string, string> = {};
    for (const it of items) {
      if (it.id.startsWith("new-")) {
        const { data, error } = await supabase.from("components").insert({ course_id: courseId, nama: it.nama, bobot: it.bobot, urutan: it.urutan }).select().single();
        if (error) return toast.error(error.message);
        idMap[it.id] = data.id;
      } else {
        const { error } = await supabase.from("components").update({ nama: it.nama, bobot: it.bobot, urutan: it.urutan }).eq("id", it.id);
        if (error) return toast.error(error.message);
        idMap[it.id] = it.id;
      }
    }
    // hapus existing mapping lalu insert ulang
    const compIds = Object.values(idMap);
    if (compIds.length) {
      await supabase.from("component_cpmk").delete().in("component_id", compIds);
      const rows: Mapping[] = [];
      for (const oldId of Object.keys(mapState)) {
        const newId = idMap[oldId] ?? oldId;
        for (const ck of Object.keys(mapState[oldId])) {
          const v = mapState[oldId][ck];
          if (v > 0) rows.push({ component_id: newId, cpmk_id: ck, kontribusi: v });
        }
      }
      if (rows.length) {
        const { error } = await supabase.from("component_cpmk").insert(rows);
        if (error) return toast.error(error.message);
      }
    }
    toast.success("Komponen & mapping tersimpan");
    reload();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Komponen Penilaian</h2>
            <p className="text-sm text-muted-foreground">Misal: Tugas, Kuis, UTS, UAS, Praktikum.</p>
          </div>
          <Badge variant={Math.abs(totalBobot - 100) < 0.01 ? "default" : "destructive"}>Total bobot: {totalBobot}%</Badge>
        </div>
        <div className="space-y-3">
          {items.map((c, i) => (
            <div key={c.id} className="grid grid-cols-12 gap-3 items-center">
              <Input className="col-span-2" type="number" value={c.urutan} onChange={(e) => update(i, { urutan: Number(e.target.value) })} />
              <Input className="col-span-7" value={c.nama} onChange={(e) => update(i, { nama: e.target.value })} />
              <div className="col-span-2 relative">
                <Input type="number" value={c.bobot} onChange={(e) => update(i, { bobot: Number(e.target.value) })} />
                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeComp(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={add} className="mt-4"><Plus className="h-4 w-4 mr-2" />Tambah Komponen</Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-1">Pemetaan Komponen → CPMK</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Berapa persen tiap komponen berkontribusi ke masing-masing CPMK. Total per baris harus 100%.
        </p>
        {cpmk.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tetapkan CPMK terlebih dahulu pada tab CPMK.</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Komponen</TableHead>
                  {cpmk.map((k) => <TableHead key={k.id} className="text-center">{k.kode}</TableHead>)}
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => {
                  const row = mapState[c.id] ?? {};
                  const total = Object.values(row).reduce((s, v) => s + Number(v || 0), 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nama}</TableCell>
                      {cpmk.map((k) => (
                        <TableCell key={k.id}>
                          <Input
                            type="number"
                            className="w-20 mx-auto"
                            value={row[k.id] ?? 0}
                            onChange={(e) => {
                              const next = { ...mapState };
                              next[c.id] = { ...next[c.id], [k.id]: Number(e.target.value) };
                              setMapState(next);
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Badge variant={Math.abs(total - 100) < 0.01 ? "default" : "destructive"}>{total}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Button onClick={saveAll} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan Semua</Button>
    </div>
  );
};

/* --------- Students Tab --------- */
const StudentsTab = ({ enrolls }: { enrolls: Enrollment[] }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Daftar Mahasiswa ({enrolls.length})</h2>
    </div>
    <Table>
      <TableHeader>
        <TableRow><TableHead className="w-12">No</TableHead><TableHead>NPM</TableHead><TableHead>Nama</TableHead></TableRow>
      </TableHeader>
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

/* --------- Scores Tab --------- */
const ScoresTab = ({ comps, enrolls, scores, reload }: { comps: Component[]; enrolls: Enrollment[]; scores: Score[]; reload: () => void }) => {
  const [grid, setGrid] = useState<Record<string, Record<string, number>>>({}); // enrollId -> compId -> nilai

  useEffect(() => {
    const g: Record<string, Record<string, number>> = {};
    enrolls.forEach((e) => { g[e.id] = {}; comps.forEach((c) => g[e.id][c.id] = 0); });
    scores.forEach((s) => { if (g[s.enrollment_id]) g[s.enrollment_id][s.component_id] = Number(s.nilai); });
    setGrid(g);
  }, [comps, enrolls, scores]);

  const setVal = (eid: string, cid: string, v: number) => {
    setGrid({ ...grid, [eid]: { ...grid[eid], [cid]: v } });
  };

  const computeFinal = (eid: string) => {
    return comps.reduce((s, c) => s + (Number(grid[eid]?.[c.id] || 0) * Number(c.bobot)) / 100, 0);
  };

  const save = async () => {
    const rows = enrolls.flatMap((e) =>
      comps.map((c) => ({ enrollment_id: e.id, component_id: c.id, nilai: grid[e.id]?.[c.id] ?? 0 }))
    );
    const { error } = await supabase.from("scores").upsert(rows, { onConflict: "enrollment_id,component_id" });
    if (error) return toast.error(error.message);
    toast.success("Nilai tersimpan");
    reload();
  };

  if (comps.length === 0) return <Card className="p-6 text-muted-foreground">Tetapkan komponen penilaian terlebih dahulu.</Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Input Nilai per Komponen</h2>
        <Button onClick={save} className="bg-gradient-primary"><Save className="h-4 w-4 mr-2" />Simpan Nilai</Button>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>NPM</TableHead>
              <TableHead>Nama</TableHead>
              {comps.map((c) => (
                <TableHead key={c.id} className="text-center">
                  <div>{c.nama}</div>
                  <div className="text-xs text-muted-foreground font-normal">{c.bobot}%</div>
                </TableHead>
              ))}
              <TableHead className="text-center">Akhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolls.map((e, i) => (
              <TableRow key={e.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{e.student.npm}</TableCell>
                <TableCell className="whitespace-nowrap">{e.student.nama}</TableCell>
                {comps.map((c) => (
                  <TableCell key={c.id}>
                    <Input
                      type="number" min={0} max={100}
                      className="w-20 mx-auto text-center"
                      value={grid[e.id]?.[c.id] ?? 0}
                      onChange={(ev) => setVal(e.id, c.id, Number(ev.target.value))}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center font-semibold">{computeFinal(e.id).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

/* --------- Rekap OBE Tab --------- */
const RekapTab = ({ cpmk, comps, maps, enrolls, scores }: { cpmk: CPMK[]; comps: Component[]; maps: Mapping[]; enrolls: Enrollment[]; scores: Score[] }) => {
  const scoreMap = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    scores.forEach((s) => { (m[s.enrollment_id] ??= {})[s.component_id] = Number(s.nilai); });
    return m;
  }, [scores]);

  const mapByComp = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    maps.forEach((mp) => { (m[mp.component_id] ??= {})[mp.cpmk_id] = Number(mp.kontribusi); });
    return m;
  }, [maps]);

  // CPMK score per mahasiswa: sum over component (nilai * bobotKomp/100 * kontribusi/100) lalu dibagi sum(bobotKomp*kontribusi/100)/100
  const cpmkScore = (eid: string, cpmkId: string) => {
    let num = 0, den = 0;
    comps.forEach((c) => {
      const k = mapByComp[c.id]?.[cpmkId] ?? 0;
      if (k <= 0) return;
      const w = (Number(c.bobot) * k) / 100;
      num += (scoreMap[eid]?.[c.id] ?? 0) * w;
      den += w;
    });
    return den > 0 ? num / den : 0;
  };

  const finalScore = (eid: string) =>
    comps.reduce((s, c) => s + ((scoreMap[eid]?.[c.id] ?? 0) * Number(c.bobot)) / 100, 0);

  // Statistik per CPMK
  const stats = cpmk.map((k) => {
    const vals = enrolls.map((e) => cpmkScore(e.id, k.id));
    const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const tercapai = vals.filter((v) => v >= 60).length;
    return { cpmk: k, avg, tercapai, total: vals.length };
  });

  if (cpmk.length === 0) return <Card className="p-6 text-muted-foreground">Tetapkan CPMK terlebih dahulu.</Card>;

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
        <h2 className="text-lg font-semibold mb-4">Rekap Nilai per CPMK & Mahasiswa</h2>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NPM</TableHead>
                <TableHead>Nama</TableHead>
                {cpmk.map((k) => <TableHead key={k.id} className="text-center">{k.kode}</TableHead>)}
                <TableHead className="text-center">Nilai Akhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolls.map((e, i) => (
                <TableRow key={e.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{e.student.npm}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.student.nama}</TableCell>
                  {cpmk.map((k) => {
                    const v = cpmkScore(e.id, k.id);
                    return (
                      <TableCell key={k.id} className="text-center">
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
