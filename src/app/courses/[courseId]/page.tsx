"use client";

import { use, useState, useEffect } from "react";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, PlayCircle, Lock, Loader2, CheckCircle2, HelpCircle, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { coursesService } from "@/services/courses";

export default function CourseSyllabusPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', resolvedParams.courseId],
    queryFn: () => coursesService.getCourseById(resolvedParams.courseId),
    enabled: !!resolvedParams.courseId,
  });

  // Initialize all modules as closed by default
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Open the specific module if returning from a topic
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modId = params.get('expandedModule');
      if (modId) {
        setExpandedModules({ [modId]: true });
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs sm:text-sm text-zinc-400">Loading course syllabus...</p>
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const isEnrolled = user?.role === "admin" || user?.enrolledCourseIds?.includes(course.id);
  const courseModules = course.modules || [];
  const courseTopics = courseModules.flatMap((m: any) => m.topics || []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => prev[moduleId] ? {} : { [moduleId]: true });
  };

  return (
    <div className="w-full pb-8">
      <Link 
        href="/courses" 
        className="inline-flex items-center text-xs sm:text-[13px] text-zinc-400 hover:text-cyan-400 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
        Back to Courses
      </Link>

      <div className="mb-5 sm:mb-7">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-white">{course.title}</h1>
        </div>
        <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed max-w-3xl">{course.description}</p>

        {!isEnrolled && (
          <div className="mt-3.5 sm:mt-4 p-3.5 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-white">You are not enrolled in this course.</p>
                <p className="text-[11px] sm:text-xs text-zinc-400">Enroll to get full access to all curriculum materials.</p>
              </div>
            </div>
            <button className="h-8 sm:h-9 px-4 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 text-xs sm:text-[13px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto">
              Enroll Now
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white">Course Syllabus</h2>
          <span className="text-[11px] sm:text-xs text-zinc-500 font-medium">
            {courseModules.length} {courseModules.length === 1 ? 'Module' : 'Modules'} • {courseTopics.length} {courseTopics.length === 1 ? 'Topic' : 'Topics'}
          </span>
        </div>

        {courseModules.length > 0 ? courseModules.map((module: any) => {
          const moduleTopics = module.topics || [];
          const isExpanded = expandedModules[module.id];

          return (
            <div key={module.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 bg-zinc-950/60 hover:bg-zinc-800/40 transition-colors cursor-pointer text-left group"
              >
                {/* Title area (Full width on mobile/tab with chevron) */}
                <div className="flex items-start justify-between gap-3 w-full lg:w-auto flex-1 min-w-0">
                  <div className="flex flex-col items-start min-w-0 pr-2">
                    <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
                      Module {module.order}
                    </span>
                    <h3 className="text-xs sm:text-sm md:text-[15px] font-semibold text-white leading-snug break-words">
                      {module.title}
                    </h3>
                  </div>
                  {/* Chevron on top-right for mobile & tablet (< lg) */}
                  <div className="lg:hidden w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Second row on mobile/tab, inline right on desktop */}
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t border-zinc-800/60 lg:border-t-0 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    {module.pdfUrl && (
                      <a
                        href={module.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/70 text-cyan-400 hover:text-cyan-300 rounded-lg text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer"
                        title="Download Complete Module Notes (PDF)"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Module Notes (PDF)</span>
                      </a>
                    )}
                    <span className="text-[11px] sm:text-xs font-medium text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                      {moduleTopics.length} {moduleTopics.length === 1 ? 'Topic' : 'Topics'}
                    </span>
                  </div>

                  {/* Chevron for desktop (>= lg) */}
                  <div className="hidden lg:flex w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 items-center justify-center text-zinc-400 shrink-0 group-hover:text-white transition-colors">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="divide-y divide-zinc-800/70 border-t border-zinc-800/70">
                  {moduleTopics.length > 0 ? moduleTopics.map((topic: any, tIdx: number) => {
                    const isCompleted = user?.completedTopicIds?.includes(topic.id);
                    const isInProgress = user?.inProgressTopicIds?.includes(topic.id);
                    return (
                      <div key={topic.id} className="group px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 font-medium text-[11px] sm:text-xs border border-zinc-700/80">
                            {tIdx + 1}
                          </div>
                          <div className="min-w-0">
                            {isEnrolled ? (
                              <Link href={`/topic/${topic.id}`} className="block hover:underline">
                                <h4 className="text-xs sm:text-sm font-medium text-white hover:text-cyan-400 flex items-center gap-1.5 transition-colors truncate">
                                  <span className="truncate">{topic.title}</span>
                                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                </h4>
                              </Link>
                            ) : (
                              <h4 className="text-xs sm:text-sm font-medium text-zinc-400 flex items-center gap-1.5 truncate">
                                <span className="truncate">{topic.title}</span>
                              </h4>
                            )}
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1 text-[10px] sm:text-[11px] text-zinc-500">
                              {(topic.video || topic.videoUrl) && (
                                <span className="flex items-center">
                                  <PlayCircle className="w-3 h-3 mr-1 text-zinc-400" />
                                  {topic.video?.duration || "Video"}
                                </span>
                              )}
                              {topic.mcqs?.length > 0 && (
                                <span className="flex items-center">
                                  <HelpCircle className="w-3 h-3 mr-1 text-cyan-400/80" />
                                  {topic.mcqs.length} MCQs
                                </span>
                              )}
                              {((topic.interviewQs && topic.interviewQs.length > 0) || (topic.interviewQuestions && topic.interviewQuestions.length > 0)) && (
                                <span className="flex items-center">
                                  <MessageSquare className="w-3 h-3 mr-1 text-cyan-400/80" />
                                  {(topic.interviewQs || topic.interviewQuestions).length} Interview Qs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isEnrolled ? (
                          <Link
                            href={`/topic/${topic.id}`}
                            className="h-7 sm:h-8 px-2.5 sm:px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-cyan-400 text-[11px] sm:text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <span>
                              {isCompleted ? "Review" : isInProgress ? "Resume" : "Start"}
                            </span>
                            <span className="hidden sm:inline">
                              {isCompleted ? "Topic" : "Learning"}
                            </span>
                          </Link>
                        ) : (
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-zinc-800/60 flex items-center justify-center text-zinc-500 shrink-0">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="p-3.5 sm:p-4 text-center text-zinc-500 text-xs sm:text-[13px] italic">
                      No topics have been added to this module yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="p-8 sm:p-10 text-center border border-zinc-800 border-dashed rounded-xl text-zinc-500 text-xs sm:text-sm">
            Curriculum is currently being developed. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
}
