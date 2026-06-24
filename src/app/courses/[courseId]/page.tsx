"use client";

import { use, useState, useEffect } from "react";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, PlayCircle, Lock, Loader2, CheckCircle2 } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading course syllabus...</p>
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
    <div className="w-full pb-12 ">
      <Link href="/courses" className="inline-flex items-center text-xs sm:text-[13px] lg:text-sm text-zinc-400 hover:text-cyan-400 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">{course.title}</h1>
        </div>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">{course.description}</p>

        {!isEnrolled && (
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-4">
            <Lock className="w-6 h-6 text-zinc-500" />
            <div>
              <p className="text-white font-medium">You are not enrolled in this course.</p>
              <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Enroll to get full access to all curriculum materials.</p>
            </div>
            <button className="ml-auto px-4 py-2 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold font-medium rounded-lg transition-colors cursor-pointer">
              Enroll Now
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 sm:space-y-4">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-6">Course Syllabus</h2>

        {courseModules.length > 0 ? courseModules.map((module: any, mIdx: number) => {
          const moduleTopics = module.topics || [];
          const isExpanded = expandedModules[module.id];

          return (
            <div key={module.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-3 sm:p-5 bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Module {module.order}</span>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white text-left">{module.title}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-500 hidden sm:block">
                    {moduleTopics.length} {moduleTopics.length === 1 ? 'Topic' : 'Topics'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="divide-y divide-zinc-800 ">
                  {moduleTopics.length > 0 ? moduleTopics.map((topic: any, tIdx: number) => {
                    const isCompleted = user?.completedTopicIds?.includes(topic.id);
                    const isInProgress = user?.inProgressTopicIds?.includes(topic.id);
                    return (
                      <div key={topic.id} className="group relative">
                        <div className="p-3 sm:p-5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 font-medium text-[11px] sm:text-[13px] border border-zinc-700">
                              {tIdx + 1}
                            </div>
                            <div>
                              <h4 className={`text-sm sm:text-base lg:text-lg font-semibold flex items-center ${isEnrolled ? 'text-white group-hover:text-cyan-400' : 'text-zinc-300'} transition-colors`}>
                                {topic.title}
                                {isCompleted && <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />}
                              </h4>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] sm:text-[11px] lg:text-xs text-zinc-500">
                                {topic.video && <span className="flex items-center"><PlayCircle className="w-3.5 h-3.5 mr-1" /> {topic.video?.duration || "Video"}</span>}
                                {topic.mcqs?.length > 0 && <span>• {topic.mcqs.length} MCQs</span>}
                              </div>
                            </div>
                          </div>

                          {isEnrolled ? (
                            <Link
                              href={`/topic/${topic.id}`}
                              className="absolute inset-0 z-10 sm:static sm:z-auto sm:px-4 sm:py-2 sm:bg-zinc-800 sm:hover:bg-zinc-700 text-white text-[13px] font-medium sm:rounded-lg transition-colors flex items-center justify-center sm:justify-end"
                            >
                              <span className="hidden sm:inline">
                                {isCompleted ? "Review Topic" : isInProgress ? "Resume Learning" : "Start Learning"}
                              </span>
                            </Link>
                          ) : (
                            <Lock className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                      </div>
                    )
                  }) : (
                    <div className="p-4 sm:p-6 text-center text-zinc-500 text-[13px] italic">
                      No topics have been added to this module yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }) : (
          <div className="p-12 text-center border border-zinc-800 border-dashed rounded-xl text-zinc-500">
            Curriculum is currently being developed. Please check back later.
          </div>
        )}
      </div>
    </div>
  );
}
