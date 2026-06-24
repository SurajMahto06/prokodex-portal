"use client";

import { useAuth } from "@/components/dashboard/auth-provider";
import { Users, ShieldAlert, MessageCircle, MoreVertical, FileText, Mail, Loader2 } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import Link from "next/link";

export default function MenteesPage() {
  const { user } = useAuth();
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const handleClose = () => setActiveDropdownId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  if (user?.role !== "mentor") {
    return <AccessDenied message="You must be a mentor to view this page." />;
  }

  const { data: mentees = [], isLoading } = useQuery({
    queryKey: ['my-mentees'],
    queryFn: () => usersService.getMyMentees(),
    enabled: user?.role === "mentor"
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="text-zinc-400">Loading mentees...</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 ">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-6 flex items-center">
          <Users className="w-8 h-8 mr-3 text-cyan-400" />
          My Mentees
        </h1>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Monitor progress and support your assigned students.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentees.length > 0 ? mentees.map((mentee: any) => (
          <div key={mentee.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 relative">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 font-bold text-xs sm:text-[13px] lg:text-sm shrink-0">
                  {mentee.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate" title={mentee.name}>{mentee.name || 'Unknown'}</h3>
                  <p className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500 truncate" title={mentee.email}>{mentee.email}</p>
                </div>
              </div>
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdownId(activeDropdownId === mentee.id ? null : mentee.id);
                  }}
                  className="text-zinc-500 hover:text-white p-1.5 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {activeDropdownId === mentee.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      href={`/assignments?student=${mentee.id}&course=${mentee.enrolledCourseIds?.[0] || ""}&action=assign`}
                      className="flex items-center gap-2 px-4 py-2 text-xs sm:text-[13px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      onClick={() => setActiveDropdownId(null)}
                    >
                      <FileText className="w-4 h-4 text-zinc-500" />
                      Assign Task
                    </Link>

                    <a
                      href={`mailto:${mentee.email}`}
                      className="flex items-center gap-2 px-4 py-2 text-xs sm:text-[13px] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                      onClick={() => setActiveDropdownId(null)}
                    >
                      <Mail className="w-4 h-4 text-zinc-500" />
                      Send Email
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-[13px] lg:text-sm">
                <span className="text-zinc-400">Overall Progress</span>
                <span className="text-cyan-400 font-bold">{mentee.progressPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${mentee.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center gap-4 min-w-0">
              <div className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500 flex flex-col min-w-0 flex-1">
                <span>Active Courses:</span>
                <span className="font-medium text-zinc-300 truncate" title={mentee.enrolledCourses?.map((c: any) => c.title).join(', ')}>
                  {mentee.enrolledCourses?.length > 0 
                    ? mentee.enrolledCourses.map((c: any) => c.title).join(', ') 
                    : "None"}
                </span>
              </div>
              <Link
                href={`/qa?student=${encodeURIComponent(mentee.name)}`}
                className="p-2 bg-zinc-800 hover:bg-cyan-600 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                title="Message Mentee"
              >
                <MessageCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )) : (
          <div className="col-span-full p-12 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500">You have no assigned mentees at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
