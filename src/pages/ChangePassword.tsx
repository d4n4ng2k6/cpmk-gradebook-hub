import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ChangePassword() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password minimal 6 karakter");
    if (pw !== pw2) return toast.error("Konfirmasi password tidak sama");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password berhasil diubah");
    setPw(""); setPw2("");
    nav("/");
  };

  return (
    <AppLayout>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-6">Ubah Password</h1>
        <Card>
          <CardHeader><CardTitle>Password Baru</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Password Baru</Label>
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
              </div>
              <div>
                <Label>Konfirmasi Password</Label>
                <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
