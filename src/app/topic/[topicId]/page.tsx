"use client";

import { use } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle, FileText, MessageSquare, AlertCircle, Lock, Loader2 } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import { useAuth } from "@/components/dashboard/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { topicsService } from "@/services/topics";

export default function TopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  
  const { data: topic, isLoading } = useQuery({
    queryKey: ['topics', resolvedParams.topicId],
    queryFn: () => topicsService.getTopicById(resolvedParams.topicId),
    enabled: !!resolvedParams.topicId,
  });

  const isPremiumUser = user?.role !== 'student' || user?.plan === 'premium' || user?.plan === 'elite';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading topic...</p>
      </div>
    );
  }

  if (!topic) {
    notFound();
  }

  // RBAC Guard: Ensure students are enrolled
  if (user?.role === "student" && !user.enrolledCourseIds?.includes(topic.module?.courseId)) {
    return <AccessDenied message="You are not enrolled in the course that contains this topic." />;
  }

  return (
    <div className="w-full pb-12 ">
      <Link href={topic.module?.courseId ? `/courses/${topic.module.courseId}?expandedModule=${topic.moduleId}` : "/"} className="inline-flex items-center text-xs sm:text-[13px] lg:text-sm text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-cyan-400 uppercase tracking-wider">{topic.module?.title || "Module"}</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">{topic.title}</h1>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">{topic.description}</p>
      </div>

      <div className="bg-black rounded-xl overflow-hidden aspect-video border border-zinc-800 shadow-2xl mb-8 relative group">
        {isPremiumUser ? (
          topic.video?.videoUrl ? (
            <video
              className="w-full h-full object-cover"
              controls
              src={topic.video.videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10 text-zinc-500">
              No video available for this topic.
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
            <div className="text-center p-6 max-w-md relative z-20">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-lg">
                <Lock className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Premium Masterclass</h3>
              <p className="text-sm text-zinc-400 mb-6">Upgrade your plan to unlock high-quality video tutorials and deep-dive technical sessions.</p>
              <button className="px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)]">
                Upgrade to Premium
              </button>
            </div>
            {/* Background gradient to look like locked video */}
            <div
              className="absolute inset-0 w-full h-full opacity-20 -z-10 bg-gradient-to-br from-cyan-950 to-zinc-950"
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Next Steps</h2>

          <Link href={`/topic/${topic.id}/mcq`} className="flex items-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-800 transition-colors group">
            <div className="p-3 bg-zinc-950 text-cyan-400 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Take the Quiz</h3>
              <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Test your knowledge with multiple-choice questions.</p>
            </div>
          </Link>

          <Link href={`/topic/${topic.id}/interview`} className="flex items-center p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-800 transition-colors group">
            <div className="p-3 bg-zinc-950 text-cyan-400 rounded-lg mr-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">Interview Questions</h3>
              <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Practice common interview questions for this topic.</p>
            </div>
          </Link>
        </div>

        <div className="space-y-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Resources</h2>
          <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            {topic.pdfUrl || topic.cheatsheetUrl ? (
              <ul className="space-y-3">
                {topic.pdfUrl && (
                  <li>
                    <a href={topic.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-start text-xs sm:text-[13px] lg:text-sm text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer group">
                      <FileText className="w-4 h-4 mr-3 shrink-0 text-cyan-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span>Download Slides (PDF)</span>
                    </a>
                  </li>
                )}
                {topic.cheatsheetUrl && (
                  <li>
                    <a href={topic.cheatsheetUrl} target="_blank" rel="noopener noreferrer" className="flex items-start text-xs sm:text-[13px] lg:text-sm text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer group">
                      <FileText className="w-4 h-4 mr-3 shrink-0 text-cyan-500 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span>Topic Cheatsheet (PDF)</span>
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No resources available for this topic.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
