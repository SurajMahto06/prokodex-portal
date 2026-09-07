"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle2, X, BellDot, Trash2 } from "lucide-react";
import { useAuth } from "./auth-provider";
import { AppNotification } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PATHS } from "@/config/routes";

interface NotificationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationMenu({ isOpen, onClose }: NotificationMenuProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', 'dropdown', user?.id],
    queryFn: () => notificationService.getNotifications(true),
    enabled: !!user && isOpen,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => notificationService.clearAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('#notification-bell-btn')) {
        return; // Ignore if clicking the toggle button
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayedNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    readMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    readAllMutation.mutate();
  };

  const handleClearAll = () => {
    clearAllMutation.mutate();
  };

  const getIconInfo = (type: string) => {
    switch (type) {
      case "success": return { icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-emerald-500/10", text: "text-emerald-400" };
      case "warning": return { icon: <AlertTriangle className="w-4 h-4" />, bg: "bg-amber-500/10", text: "text-amber-400" };
      case "alert": return { icon: <AlertTriangle className="w-4 h-4" />, bg: "bg-rose-500/10", text: "text-rose-400" };
      default: return { icon: <Info className="w-4 h-4" />, bg: "bg-cyan-950", text: "text-cyan-400" };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          ref={menuRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-x-3 top-[64px] max-h-[calc(100dvh-85px)] sm:max-h-[460px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:w-[380px] bg-zinc-950 border border-zinc-800 shadow-[0_12px_40px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <h3 className="text-sm font-semibold text-white flex items-center tracking-tight">
              Notifications
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full"
                >
                  {unreadCount} New
                </motion.span>
              )}
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List - Capped at max 5 items with smooth internal scroll */}
          <div className="overflow-y-auto overflow-x-hidden max-h-[290px] sm:max-h-[320px] [scrollbar-width:thin] scrollbar-thumb-zinc-800 flex-1 relative">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 sm:p-10 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <BellDot className="w-6 h-6 text-zinc-500" />
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-white mb-1">You're all caught up!</p>
                <p className="text-[11px] sm:text-xs text-zinc-400">No new notifications right now.</p>
              </div>
            ) : (
              <motion.div layout className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {displayedNotifications.map((notification) => {
                    const style = getIconInfo(notification.type);
                    
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={notification.id} 
                        className={`group p-3.5 sm:p-4 flex gap-3 transition-colors duration-200 relative overflow-hidden ${
                          notification.isRead 
                            ? 'opacity-70 bg-transparent hover:bg-white/[0.02]' 
                            : 'bg-cyan-950/10 hover:bg-cyan-950/20'
                        }`}
                      >
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                        )}
                        
                        <div className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-white/5 shadow-sm transition-colors duration-300 ${style.bg} ${style.text}`}>
                          {style.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-0.5 relative">
                          <div className="flex items-start justify-between gap-2 mb-1 pr-6">
                            <p className={`text-xs sm:text-[13px] tracking-tight font-medium transition-colors duration-200 line-clamp-1 ${notification.isRead ? 'text-zinc-400' : 'text-white'}`}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium shrink-0 mt-0.5">
                              {formatTimeAgo(notification.createdAt || (notification as any).date)}
                            </span>
                          </div>
                          
                          <p className={`text-[11px] sm:text-xs leading-relaxed line-clamp-2 pr-6 transition-colors duration-200 ${notification.isRead ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {notification.message}
                          </p>
                          
                          {!notification.isRead && (
                            <button 
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="absolute top-0.5 right-0 text-cyan-500 hover:text-cyan-400 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center cursor-pointer bg-zinc-950/80 backdrop-blur-sm rounded-sm"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
          
          {/* Footer - Always pinned and accessible */}
          {notifications.length > 0 && (
            <div className="shrink-0 p-3 border-t border-white/5 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-between px-4 sm:px-5 gap-3">
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center cursor-pointer gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
                <button 
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-zinc-500 hover:text-red-400 transition-colors flex items-center cursor-pointer gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
              <Link 
                href={PATHS.NOTIFICATIONS} 
                onClick={onClose}
                className="text-[11px] sm:text-xs font-medium text-cyan-400/90 hover:text-cyan-300 transition-colors"
              >
                View all {notifications.length > 5 ? `(${notifications.length})` : ''}
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
