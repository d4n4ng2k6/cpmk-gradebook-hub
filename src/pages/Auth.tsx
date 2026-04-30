import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(72),
  fullName: z.string().trim().min(2, "Nama wajib diisi").max(120).optional(),
  nidn: z.string().trim().max(30).optional(),
});

const Auth = () => {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nidn, setNidn] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = schema.safeParse({
        email,
        password,
        fullName: tab === "signup" ? fullName : undefined,
        nidn: tab === "signup" ? nidn : undefined,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Berhasil masuk");
        nav("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        // update nidn pada profil setelah trigger membuatnya
        if (data.user && nidn) {
          await supabase.from("profiles").update({ nidn, full_name: fullName }).eq("id", data.user.id);
        }
        toast.success("Akun berhasil dibuat");
        nav("/");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-primary items-center justify-center mb-4 shadow-elegant">
            <GraduationCap className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Nilai OBE</h1>
          <p className="text-muted-foreground mt-1">Sistem Penilaian Berbasis Capaian Mata Kuliah</p>
        </div>
        <Card className="p-6 shadow-elegant">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <form onSubmit={submit} className="space-y-4">
              {tab === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Budi Santoso" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nidn">NIDN (opsional)</Label>
                    <Input id="nidn" value={nidn} onChange={(e) => setNidn(e.target.value)} placeholder="0712345678" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                {loading ? "Memproses..." : tab === "login" ? "Masuk" : "Buat Akun"}
              </Button>
            </form>
          </Tabs>
          <div className="mt-6 pt-4 border-t text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary underline"
              onClick={async () => {
                setLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke("seed-admin");
                  if (error) throw error;
                  toast.success(`Admin siap. Email: ${data.email} / Password: ${data.password}`, { duration: 10000 });
                  setEmail(data.email);
                  setPassword(data.password);
                  setTab("login");
                } catch (e: any) {
                  toast.error(e.message ?? "Gagal membuat admin");
                } finally { setLoading(false); }
              }}
            >
              Buat / reset akun admin default
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
