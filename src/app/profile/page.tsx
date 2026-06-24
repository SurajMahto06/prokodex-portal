"use client";

import { useAuth } from "@/components/dashboard/auth-provider";
import { User as UserIcon, Mail, Shield, LogOut, Award, BookOpen, Clock, Activity, Edit2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { settingsService } from "@/services/settings";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const { data: mentors = [], isLoading: isLoadingMentors } = useQuery({
    queryKey: ['my-mentors'],
    queryFn: () => usersService.getMyMentors(),
    enabled: user?.role === "student"
  });

  const { data: mentees = [], isLoading: isLoadingMentees } = useQuery({
    queryKey: ['my-mentees'],
    queryFn: () => usersService.getMyMentees(),
    enabled: user?.role === "mentor"
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="w-full pb-12 ">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
          <UserIcon className="w-8 h-8 mr-3 text-cyan-400" />
          My Profile
        </h1>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400 leading-relaxed">
          Manage your personal information, active plans, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-8 text-center  relative bg-gradient-to-b from-cyan-950/20 to-transparent">


              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cyan-950 border-4 border-cyan-900/50 text-cyan-400 text-3xl font-bold mb-4 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1">{user.name}</h2>
              <p className="text-xs sm:text-[13px] lg:text-sm text-cyan-400 capitalize font-medium mb-3">{user.role} Account</p>

              <Badge variant="success" className="px-3 py-1 text-xs">
                <Activity className="w-3 h-3 mr-1.5" />
                Active Status
              </Badge>
            </div>

            <div className="p-4 sm:p-6 space-y-4 bg-zinc-950/50">
              <div className="flex items-center text-xs sm:text-[13px] lg:text-sm">
                <Mail className="w-4 h-4 text-zinc-500 mr-3 shrink-0" />
                <span className="text-zinc-300 truncate">{user.email}</span>
              </div>
            </div>

            {/* Support Info */}
            {settings?.supportEmail && user.role !== 'admin' && (
              <div className="p-4 sm:p-6 bg-zinc-950/80 border-t border-zinc-800/50">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-zinc-500 text-[10px] sm:text-[11px] lg:text-xs font-medium uppercase tracking-wider mb-2">Need Help? Contact Support</span>
                  <a href={`mailto:${settings.supportEmail}`} className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors text-xs sm:text-[13px] lg:text-sm font-medium">
                    <Mail className="w-4 h-4 mr-2" />
                    {settings.supportEmail}
                  </a>
                </div>
              </div>
            )}

            {/* Logout Button directly below profile info */}
            <div className="p-4 sm:p-6 bg-zinc-950 border-t border-zinc-800/50">
              <button
                onClick={handleLogout}
                className="w-full flex justify-center items-center px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs sm:text-[13px] lg:text-sm font-medium rounded-lg transition-colors border border-red-500/20 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Stats */}
        <div className="lg:col-span-2 space-y-8">

          {/* Section: Plan Details (if student) */}
          {user.role === "student" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-6 ">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center">
                  <Award className="w-5 h-5 text-cyan-400 mr-2" />
                  Subscription Plan
                </h3>
              </div>
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="text-xs sm:text-[13px] lg:text-sm text-zinc-400 mb-1">Current Plan</div>
                  <div className="text-2xl font-bold text-white capitalize flex items-center">
                    {user.plan || "None"}
                    {user.plan === "elite" && (
                      <Badge variant="elite" className="ml-3 text-[10px] uppercase tracking-wider px-2 py-0.5">
                        Pro
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Activity Snapshot */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 ">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center">
                <Activity className="w-5 h-5 text-cyan-400 mr-2" />
                Account Overview
              </h3>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.role === "student" && (
                <>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <BookOpen className="w-4 h-4 mr-2" /> Enrolled Courses
                    </div>
                    <div className="text-2xl font-bold text-white">{user.enrolledCourseIds?.length || 0}</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <Clock className="w-4 h-4 mr-2" /> Course Progress
                    </div>
                    <div className="text-2xl font-bold text-white">{user.progressPercentage || 0}%</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <UserIcon className="w-4 h-4 mr-2" /> Assigned Mentors
                    </div>
                    {isLoadingMentors ? (
                      <div className="text-zinc-500 flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <div className="text-base font-bold text-white truncate" title={mentors.map((m: any) => m.name).join(', ') || "None"}>
                        {mentors.length > 0
                          ? mentors.map((m: any) => m.name).join(', ')
                          : "None"}
                      </div>
                    )}
                  </div>
                </>
              )}
              {user.role === "mentor" && (
                <>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <BookOpen className="w-4 h-4 mr-2" /> Assigned Projects
                    </div>
                    <div className="text-2xl font-bold text-white">{user.assignedCourseIds?.length || 0}</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <UserIcon className="w-4 h-4 mr-2" /> Active Mentees
                    </div>
                    {isLoadingMentees ? (
                      <div className="text-zinc-500 flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-white">{mentees.length || 0}</div>
                    )}
                  </div>
                </>
              )}
              {user.role === "admin" && (
                <>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <Shield className="w-4 h-4 mr-2" /> Admin Access
                    </div>
                    <div className="text-base font-bold text-emerald-400">Full System</div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-center text-zinc-400 text-xs sm:text-[13px] lg:text-sm mb-2">
                      <Clock className="w-4 h-4 mr-2" /> Session Active
                    </div>
                    <div className="text-base font-bold text-white">Yes</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
