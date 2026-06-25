"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Video,
  MessageCircleQuestion,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  GraduationCap,
  ShieldCheck,
  FileText,
  X,
  Award,
  Ticket
} from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useAuth } from "./auth-provider";
import { PATHS } from "@/config/routes";

export function DashboardSidebar({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!user) return null;

  // Define navigation based on roles
  const getNavItems = () => {
    switch (user.role) {
      case "admin":
        return [
          { name: "System Overview", href: PATHS.DASHBOARD, icon: LayoutDashboard },
          { name: "User Management", href: PATHS.USERS.ROOT, icon: Users },
          { name: "Course Management", href: PATHS.COURSES.ROOT, icon: BookOpen },
          { name: "Blogs", href: "/blogs", icon: FileText },
          { name: "Issue Certificate", href: PATHS.CERTIFICATES.ISSUE, icon: Award },
          { name: "Coupons", href: "/coupons", icon: Ticket },
          { name: "Global Settings", href: PATHS.SETTINGS, icon: Settings },
        ];
      case "mentor":
        return [
          { name: "Mentor Dashboard", href: PATHS.DASHBOARD, icon: LayoutDashboard },
          { name: "My Mentees", href: PATHS.MENTEES, icon: Users },
          { name: "Q&A Review", href: PATHS.QA, icon: MessageCircleQuestion },
          { name: "Assignments", href: PATHS.ASSIGNMENTS, icon: FileText },
        ];
      case "student":
      default:
        return [
          { name: "My Dashboard", href: PATHS.DASHBOARD, icon: LayoutDashboard },
          { name: "Course Modules", href: PATHS.COURSES.ROOT, icon: BookOpen },
          { name: "Assignments", href: PATHS.ASSIGNMENTS, icon: FileText },
          { name: "Mentorship Q&A", href: PATHS.QA, icon: MessageCircleQuestion },
          { name: "Certificates", href: PATHS.CERTIFICATES.ROOT, icon: ShieldCheck },
        ];
    }
  };

  const navigation = getNavItems();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-50/50 dark:bg-black/80 z-40 lg:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-zinc-950 border-r border-zinc-800 text-zinc-300 transform transition-transform duration-300 ease-in-out lg:transition-none lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between px-6 ">
          <div className="inline-block text-right">
            {mounted && resolvedTheme === "dark" ? (
              <Image src="/logo-dark.png" alt="Prokodex" width={120} height={32} className="h-8 w-auto object-contain block" />
            ) : (
              <Image src="/logo-light.png" alt="Prokodex" width={120} height={32} className="h-8 w-auto object-contain block" />
            )}
            <span className="block mt-0.5 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-widest leading-none uppercase">PORTAL</span>
          </div>
          <button onClick={() => setIsOpen?.(false)} className="lg:hidden text-zinc-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen?.(false)}
                  className={`group flex items-center px-3 py-2 text-xs sm:text-[13px] lg:text-sm font-medium rounded-md transition-colors ${isActive
                      ? "bg-cyan-400 text-zinc-950 font-bold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-zinc-950" : "text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

      </div>
    </>
  );
}
