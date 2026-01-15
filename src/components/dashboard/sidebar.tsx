"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter 
} from "@/components/ui/sidebar";
import { 
  Home, 
  Glasses, 
  ShoppingCart, 
  Users, 
  BarChart2, 
  Settings, 
  Menu 
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function DashboardSidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Produtos",
      icon: Glasses,
      href: "/dashboard/produtos",
      active: pathname === "/dashboard/produtos",
    },
    {
      label: "Vendas",
      icon: ShoppingCart,
      href: "/dashboard/vendas",
      active: pathname === "/dashboard/vendas",
    },
    {
      label: "Clientes",
      icon: Users,
      href: "/dashboard/clientes",
      active: pathname === "/dashboard/clientes",
    },
    {
      label: "Relatórios",
      icon: BarChart2,
      href: "/dashboard/relatorios",
      active: pathname === "/dashboard/relatorios",
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/dashboard/configuracoes",
      active: pathname === "/dashboard/configuracoes",
    },
  ];

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <div className="p-6">
            <h2 className="text-2xl font-bold">Óculos Store</h2>
            <p className="text-muted-foreground">Dashboard Administrativo</p>
          </div>
          <nav className="flex flex-col gap-2 px-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                  route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <Sidebar className={"hidden md:flex"}>
        <SidebarHeader>
          <div className="p-2">
        <h2 className="text-2xl font-bold">Óculos Store</h2>
        <p className="text-muted-foreground">Dashboard Administrativo</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav className="flex flex-col gap-2 px-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
          route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <route.icon className="h-5 w-5" />
            {route.label}
          </Link>
        ))}
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2 text-xs text-muted-foreground">
        © 2025 Óculos Store
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

