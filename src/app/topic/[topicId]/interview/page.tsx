"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lightbulb, UserCheck, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { topicsService } from "@/services/topics";
import { authService } from "@/services/auth";

export default function InterviewPage({ params }: { params: Promise<{ topicId: string }> }) {
  const resolvedParams = use(params);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topics', resolvedParams.topicId],
    queryFn: () => topicsService.getTopicById(resolvedParams.topicId),
    enabled: !!resolvedParams.topicId,
  });

  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading interview prep...</p>
      </div>
    );
  }

  if (!topic) return notFound();

  const questions = topic.interviewQs || topic.interviewQuestions || [];
  const allQuestionsAnswered = questions.length > 0 && questions.every((q: any) => answers[q.id] && answers[q.id].trim() !== "");

  const toggleHint = (questionId: string) => {
    setRevealedHints(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleComplete = async () => {
    if (!allQuestionsAnswered && questions.length > 0) return;

    try {
      setIsCompleting(true);
      await authService.completeTopic(topic.id);
      // Invalidate user query to refetch progress percentage and completed topics
      await queryClient.invalidateQueries({ queryKey: ['auth-user'] });

      // Navigate back to course syllabus
      if (topic.module?.courseId) {
        router.push(`/courses/${topic.module.courseId}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to complete topic:", error);
      setIsCompleting(false);
    }
  };

  return (
    <div className="w-full pb-12">
      <Link href={`/topic/${topic.id}`} className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {topic.title}
      </Link>

      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6">Interview Prep: {topic.title}</h1>
        <p className="text-zinc-400">Practice answering these common interview questions related to the topic. Write down your answers or practice them out loud.</p>
      </div>

      <div className="space-y-6">
        {questions?.length > 0 ? questions.map((q: any, index: number) => (
          <div key={q.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400 text-zinc-950 flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <h3 className="text-sm font-semibold text-white pt-1">{q.question}</h3>
            </div>

            <div className="pl-12">
              <textarea
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="Type your practice answer here..."
              />

              <div>
                <button
                  onClick={() => toggleHint(q.id)}
                  className="flex items-center text-[13px] text-cyan-400 hover:text-cyan-300 transition-colors mt-2"
                >
                  <Lightbulb className="w-4 h-4 mr-1.5" />
                  {revealedHints[q.id] ? "Hide Hints" : "Show Hints"}
                </button>

                {revealedHints[q.id] && (
                  <div className="mt-3 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                    <ul className="list-disc pl-5 space-y-1 text-[13px] text-zinc-400">
                      {(() => {
                        let hintsList: string[] = [];
                        if (Array.isArray(q.hints)) {
                          hintsList = q.hints;
                        } else if (typeof q.hints === 'string') {
                          try { hintsList = JSON.parse(q.hints); } catch (e) { }
                        }

                        if (!Array.isArray(hintsList)) hintsList = [];

                        return hintsList.map((hint, hIndex) => (
                          <li key={hIndex}>{hint}</li>
                        ));
                      })()}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
            No interview questions available yet.
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleComplete}
          disabled={isCompleting || (questions.length > 0 && !allQuestionsAnswered)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center cursor-pointer 
            ${(questions.length > 0 && !allQuestionsAnswered) || isCompleting
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-cyan-400 text-zinc-950 hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.3)]'}`}
        >
          {isCompleting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UserCheck className="w-5 h-5 mr-2" />}
          {isCompleting ? "Completing..." : "Complete Topic"}
        </button>
      </div>
    </div>
  );
}
