"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/dashboard/auth-provider";
import { notificationService } from "@/services/notifications";
import { CheckCircle2, AlertTriangle, Info, Bell, Check, Trash2, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'all', user?.id],
    queryFn: () => notificationService.getNotifications(false),
    enabled: !!user,
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleMarkAsRead = (id: string) => {
    readMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    readAllMutation.mutate();
  };

  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setNotificationToDelete(id);
  };

  const confirmDelete = () => {
    if (!notificationToDelete) return;
    deleteMutation.mutate(notificationToDelete);
    setNotificationToDelete(null);
  };

  const getIconInfo = (type: string) => {
    switch (type) {
      case "success": return { icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: "bg-emerald-500/10", text: "text-emerald-400" };
      case "warning": return { icon: <AlertTriangle className="w-3.5 h-3.5" />, bg: "bg-amber-500/10", text: "text-amber-400" };
      case "alert": return { icon: <AlertTriangle className="w-3.5 h-3.5" />, bg: "bg-rose-500/10", text: "text-rose-400" };
      default: return { icon: <Info className="w-3.5 h-3.5" />, bg: "bg-cyan-950", text: "text-cyan-400" };
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-full pb-6">
      <div className="flex flex-row items-center justify-between gap-3 mb-3 sm:mb-4">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white flex items-center">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-cyan-400" />
            Notifications
          </h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
            Manage your alerts, course updates, and mentorship communications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={readAllMutation.isPending}
            className="inline-flex items-center justify-center h-7 sm:h-8 px-2.5 sm:px-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-[11px] sm:text-xs font-medium rounded-md sm:rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            {readAllMutation.isPending ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin text-cyan-400" />
            ) : (
              <Check className="w-3 h-3 mr-1" />
            )}
            <span>{readAllMutation.isPending ? "Marking..." : "Mark all read"}</span>
          </button>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg sm:rounded-xl overflow-hidden shadow-md">
        {isLoading ? (
          <div className="py-8 sm:py-10 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-spin mb-2" />
            <p className="text-xs text-zinc-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 sm:py-10 px-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-950 flex items-center justify-center mb-2.5 border border-zinc-800">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-600" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white mb-1">You're all caught up!</h2>
            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed max-w-sm">
              You don't have any notifications at the moment. When important updates happen, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {notifications.map((notification) => {
              const style = getIconInfo(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`py-2 px-2.5 sm:py-2.5 sm:px-3.5 flex items-start gap-2.5 sm:gap-3 transition-colors relative ${notification.isRead ? 'bg-zinc-900' : 'bg-cyan-950/10'
                    }`}
                >
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  )}

                  <div className={`shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center border border-white/5 ${style.bg} ${style.text} mt-0.5`}>
                    {style.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <h3 className={`text-xs sm:text-[13px] tracking-tight leading-snug ${notification.isRead ? 'text-zinc-300 font-medium' : 'text-white font-semibold'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap shrink-0">
                        {formatDateTime(notification.createdAt || (notification as any).date)}
                      </span>
                    </div>

                    <p className={`text-[11px] sm:text-xs leading-snug mb-1.5 ${notification.isRead ? 'text-zinc-400' : 'text-zinc-300'}`}>
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={readMutation.isPending && readMutation.variables === notification.id}
                          className="inline-flex items-center text-[10px] sm:text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {readMutation.isPending && readMutation.variables === notification.id ? (
                            <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-2.5 h-2.5 mr-1" />
                          )}
                          <span>{readMutation.isPending && readMutation.variables === notification.id ? "Marking..." : "Mark as read"}</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="inline-flex items-center text-[10px] sm:text-[11px] font-medium text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!notificationToDelete}
        onClose={() => setNotificationToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Notification"
        description="Are you sure you want to delete this notification? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
