"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/dashboard/auth-provider";
import { notificationService } from "@/services/notifications";
import { CheckCircle2, AlertTriangle, Info, Bell, Check, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
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
      case "success": return { icon: <CheckCircle2 className="w-5 h-5" />, bg: "bg-emerald-500/10", text: "text-emerald-400" };
      case "warning": return { icon: <AlertTriangle className="w-5 h-5" />, bg: "bg-amber-500/10", text: "text-amber-400" };
      case "alert": return { icon: <AlertTriangle className="w-5 h-5" />, bg: "bg-rose-500/10", text: "text-rose-400" };
      default: return { icon: <Info className="w-5 h-5" />, bg: "bg-cyan-950", text: "text-cyan-400" };
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
    <div className="w-full pb-12 ">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <Bell className="w-8 h-8 mr-3 text-cyan-400" />
            Notifications
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400 leading-relaxed">
            Manage your alerts, course updates, and mentorship communications.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[13px] font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-zinc-950 flex items-center justify-center mb-4 border border-zinc-800">
              <Bell className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white mb-2">You're all caught up!</h2>
            <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400 leading-relaxed max-w-sm">
              You don't have any notifications at the moment. When important updates happen, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {notifications.map((notification) => {
              const style = getIconInfo(notification.type);
              
              return (
                <div 
                  key={notification.id} 
                  className={`p-6 flex flex-col sm:flex-row sm:items-start gap-4 transition-colors relative ${
                    notification.isRead ? 'bg-zinc-900' : 'bg-cyan-950/10'
                  }`}
                >
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                  )}
                  
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 shadow-sm ${style.bg} ${style.text}`}>
                    {style.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className={`text-sm sm:text-base lg:text-lg tracking-tight ${notification.isRead ? 'text-zinc-300 font-medium' : 'text-white font-bold'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500 font-medium whitespace-nowrap">
                        {formatDateTime(notification.createdAt || (notification as any).date)}
                      </span>
                    </div>
                    
                    <p className={`text-xs sm:text-[13px] lg:text-sm leading-relaxed mb-4 ${notification.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {!notification.isRead && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex items-center text-xs sm:text-[13px] lg:text-sm font-semibold text-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Mark as read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(notification.id)}
                        className="inline-flex items-center text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
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
      />
    </div>
  );
}
