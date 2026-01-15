"use client";

import { ReactNode } from "react";
import { DashboardSidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <Header onMenuClick={()=>("")}/>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

