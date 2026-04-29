import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, LayoutDashboard, BookOpen, LogOut, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { fullName, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const items = [
    { to: "/", label: "Dasbor", icon: LayoutDashboard },
    { to: "/courses", label: "Matakuliah", icon: BookOpen },
    { to: "/upload", label: "Impor Excel", icon: Upload },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-subtle">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-accent flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">Nilai OBE</div>
              <div className="text-xs text-sidebar-foreground/70">Capaian Mata Kuliah</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
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
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={async () => {
              await signOut();
              nav("/auth");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Keluar
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
};
