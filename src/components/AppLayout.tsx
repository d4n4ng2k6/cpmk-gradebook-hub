import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GraduationCap, LayoutDashboard, BookOpen, LogOut, Upload, Shield, KeyRound, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { fullName, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const items = [
    { to: "/", label: "Dasbor", icon: LayoutDashboard },
    { to: "/courses", label: "Matakuliah", icon: BookOpen },
    { to: "/upload", label: "Impor Excel", icon: Upload },
    ...(role === "admin" ? [{ to: "/admin", label: "Administrasi", icon: Shield }] : []),
  ];

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <div className="font-bold text-base leading-tight">Nilai OBE</div>
            <div className="text-xs text-sidebar-foreground/70">Capaian Mata Kuliah</div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-sm font-medium truncate">{fullName || "Pengguna"}</div>
        <div className="text-xs text-sidebar-foreground/60 capitalize mb-3">{role}</div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mb-2 text-sidebar-foreground hover:bg-sidebar-accent/60"
          onClick={() => { onNavigate?.(); nav("/change-password"); }}
        >
          <KeyRound className="h-4 w-4 mr-2" /> Ubah Password
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={async () => {
            onNavigate?.();
            await signOut();
            nav("/auth");
          }}
        >
          <LogOut className="h-4 w-4 mr-2" /> Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gradient-subtle">
      <aside className="hidden md:flex w-64 flex-shrink-0">
        <SidebarContent />
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-background/90 backdrop-blur border-b">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-accent flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-semibold text-sm">Nilai OBE</span>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};
