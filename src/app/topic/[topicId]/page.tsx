"use client";

import { use } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle, FileText, MessageSquare, AlertCircle, Lock, Loader2, HelpCircle } from "lucide-react";
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

  const cleanDescription = (topic.description || "").replace(/(&nbsp;|\u00a0)/g, " ");

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
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start mt-6 sm:mt-8">
        <div className="flex-1 min-w-0 w-full space-y-6">
          <div className="p-4 sm:p-5 md:p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden">
            <div
              className="[word-break:normal] break-words text-[13px] sm:text-sm md:text-base text-zinc-300 leading-relaxed [&>*:first-child]:mt-0 [&>p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 sm:[&_ul]:pl-6 [&_ul]:my-2.5 sm:[&_ul]:my-3 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 sm:[&_ol]:pl-6 [&_ol]:my-2.5 sm:[&_ol]:my-3 [&_ol]:space-y-1 [&_li]:mb-0.5 [&_li]:leading-normal sm:[&_li]:leading-relaxed [&_li>p]:my-0 [&_li>p]:mb-0 [&_li>p]:inline [&_li>ul]:my-1 [&_li>ol]:my-1 [&>pre]:bg-[#0d1117] [&>pre]:p-3.5 sm:[&>pre]:p-5 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:border [&>pre]:border-zinc-800 [&>pre]:text-zinc-300 [&>pre]:text-xs sm:[&>pre]:text-sm [&>pre]:mb-6 [&>pre]:shadow-inner [&>pre]:max-w-full [&>h1]:text-xl sm:[&>h1]:text-2xl md:[&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-3 [&>h1]:mt-6 sm:[&>h1]:mt-8 [&>h2]:text-lg sm:[&>h2]:text-xl md:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mb-2.5 sm:[&>h2]:mb-3 [&>h2]:mt-5 sm:[&>h2]:mt-6 [&>h3]:text-base sm:[&>h3]:text-lg md:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mb-2 [&>h3]:mt-4 sm:[&>h3]:mt-5 [&>a]:text-cyan-400 [&>a]:hover:underline [&>a]:break-all [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:pl-3.5 sm:[&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-zinc-400 [&>blockquote]:mb-5 [&>blockquote]:bg-zinc-900/30 [&>blockquote]:py-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_iframe]:max-w-full [&_iframe]:rounded-xl [&_:not(pre)>code]:bg-zinc-800/80 [&_:not(pre)>code]:text-cyan-300 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:text-xs sm:[&_:not(pre)>code]:text-sm [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:break-all"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          </div>
        </div>

        <div className="w-full xl:w-[340px] 2xl:w-[360px] shrink-0 grid sm:grid-cols-2 xl:grid-cols-1 gap-6 xl:gap-8 xl:sticky xl:top-8 self-start">
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Next Steps</h2>

            <Link href={`/topic/${topic.id}/mcq`} className="flex items-center p-3 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-800 transition-colors group">
              <div className="p-2.5 sm:p-3 bg-zinc-950 text-cyan-400 rounded-lg mr-3 sm:mr-4 group-hover:scale-110 transition-transform shrink-0">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] sm:text-sm lg:text-base font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">Take the Quiz</h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                  {topic.mcqs?.length > 0 ? `${topic.mcqs.length} MCQs available` : "Test your knowledge with MCQs."}
                </p>
              </div>
            </Link>

            <Link href={`/topic/${topic.id}/interview`} className="flex items-center p-3 sm:p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-cyan-800 transition-colors group">
              <div className="p-2.5 sm:p-3 bg-zinc-950 text-cyan-400 rounded-lg mr-3 sm:mr-4 group-hover:scale-110 transition-transform shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] sm:text-sm lg:text-base font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">Interview Prep</h3>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                  {((topic.interviewQs || topic.interviewQuestions)?.length || 0) > 0
                    ? `${(topic.interviewQs || topic.interviewQuestions).length} Questions available`
                    : "Practice common questions."}
                </p>
              </div>
            </Link>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Resources</h2>
            <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
              {topic.module?.pdfUrl ? (
                <ul className="space-y-3 sm:space-y-3.5">
                  <li>
                    <a
                      href={topic.module.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start text-xs sm:text-[13px] text-zinc-300 hover:text-cyan-400 transition-colors cursor-pointer group"
                    >
                      <FileText className="w-4 h-4 mr-2.5 shrink-0 text-cyan-400 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <span className="font-semibold text-white block group-hover:text-cyan-400 transition-colors">
                          {topic.module?.title ? `${topic.module.title} Notes` : "Module Notes"} (PDF)
                        </span>
                        <span className="text-[11px] text-zinc-500">Complete Chapter Guide</span>
                      </div>
                    </a>
                  </li>
                </ul>
              ) : (
                <p className="text-xs sm:text-[13px] text-zinc-500 text-center py-2">
                  No resources uploaded for this module yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
