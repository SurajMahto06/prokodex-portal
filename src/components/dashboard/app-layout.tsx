"use client";

import { useEffect, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "./auth-provider";
import { DashboardSidebar } from "./sidebar";
import { NotificationMenu } from "./notification-menu";
import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ThemeToggle } from "./theme-toggle";
import { PATHS } from "@/config/routes";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'dropdown', user?.id],
    queryFn: () => notificationService.getNotifications(true),
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;


  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user && pathname !== PATHS.LOGIN) {
      router.push(PATHS.LOGIN);
    } else if (user && pathname === PATHS.LOGIN) {
      router.push(PATHS.DASHBOARD);
    }
  }, [user, pathname, router]);

  // If on login page, just render the content without sidebar
  if (pathname === PATHS.LOGIN) {
    return (
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        {children}
      </main>
    );
  }

  // Prevent flash of content while redirecting to login
  if (!user) {
    return null;
  }

  return (
    <>
      <DashboardSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
        <header className="h-16 shrink-0 px-4 lg:px-8 flex items-center justify-between lg:justify-end bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="inline-block lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2 mr-2 align-top inline-flex"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="inline-block text-right">
              {mounted && resolvedTheme === "dark" ? (
                <Image src="/logo-dark.png" alt="Prokodex" width={80} height={20} className="h-5 sm:h-6 w-auto object-contain block" />
              ) : (
                <Image src="/logo-light.png" alt="Prokodex" width={80} height={20} className="h-5 sm:h-6 w-auto object-contain block" />
              )}
              <span className="block mt-0.5 text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium tracking-widest leading-none">PORTAL</span>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 ml-auto">
            <ThemeToggle />
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                onMouseDown={(e) => e.stopPropagation()}
                className={`cursor-pointer text-zinc-400 hover:text-cyan-400 transition-colors relative ${isNotificationMenuOpen ? 'text-cyan-400' : ''}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[9px] font-bold text-white min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border border-zinc-950 shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationMenu
                isOpen={isNotificationMenuOpen}
                onClose={() => setIsNotificationMenuOpen(false)}
              />
            </div>

            <div className="h-6 w-px bg-zinc-800"></div>

            <Link href={PATHS.PROFILE} className="relative group shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border border-zinc-700 group-hover:border-cyan-500 group-hover:ring-2 group-hover:ring-cyan-500/20 transition-all object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-cyan-400 text-zinc-950 shadow-md flex items-center justify-center text-cyan-400 font-bold group-hover:border-cyan-500 group-hover:bg-cyan-900 group-hover:ring-2 group-hover:ring-cyan-500/20 transition-all">
                  {user.name.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 relative">
          {children}
        </main>
      </div>
    </>
  );
}
