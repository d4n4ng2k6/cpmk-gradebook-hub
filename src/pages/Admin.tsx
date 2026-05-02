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

export default Admin;
