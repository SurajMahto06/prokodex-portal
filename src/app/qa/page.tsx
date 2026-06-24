"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MentorshipQA, QAReply } from "@/types";
import { useAuth } from "@/components/dashboard/auth-provider";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { qaService } from "@/services/qa";
import { MessageSquarePlus, Send, UserCircle2, ShieldCheck, CheckCircle2, BookOpen, ChevronDown, ImageIcon, X, Clock, Lock, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const questionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters long"),
});

type QuestionValues = z.infer<typeof questionSchema>;

export default function QAPortal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);

  const formatQADateTime = (dateString: string | Date) => {
    const d = new Date(dateString);
    const datePart = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${datePart} | ${timePart}`;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['qaThreads', 'infinite', user?.id],
    queryFn: ({ pageParam = 1 }) => qaService.getQAThreads(pageParam, 5),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && typeof lastPage === 'object' && 'hasMore' in lastPage) {
        return lastPage.hasMore ? (allPages ? allPages.length + 1 : 2) : undefined;
      }
      return undefined;
    },
    enabled: !!user
  });

  const qaList = useMemo(() => {
    return data
      ? data.pages.flatMap((page: any) => {
        if (Array.isArray(page)) return page;
        return page.threads || [];
      })
      : [];
  }, [data]);

  const [newQuestionImages, setNewQuestionImages] = useState<string[]>([]);
  const [filterStudent, setFilterStudent] = useState<string | null>(null);

  const questionForm = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { question: "" },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const student = params.get('student');
      if (student) {
        setFilterStudent(student);
      }
    }
  }, []);

  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyImages, setReplyImages] = useState<Record<string, string[]>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleRepliesCount, setVisibleRepliesCount] = useState<Record<string, number>>({});
  const [visibleDiscussionsCount, setVisibleDiscussionsCount] = useState(3);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);



  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => prev[id] ? {} : { [id]: true });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64s: string[]) => void) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const base64s = await Promise.all(promises);
    callback(base64s);
  };

  const createMutation = useMutation({
    mutationFn: (data: { courseId: string; question: string; imageUrls?: string[] }) => qaService.createQAThread(data),
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['qaThreads'] });
      questionForm.reset();
      setNewQuestionImages([]);
      setExpandedIds(prev => ({ ...prev, [newEntry.id]: true }));
    }
  });

  const statusMutation = useMutation({
    mutationFn: (data: { threadId: string; status: 'pending' | 'answered' }) => qaService.updateStatus(data.threadId, data.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qaThreads'] })
  });

  const replyMutation = useMutation({
    mutationFn: (data: { threadId: string; content: string; imageUrls?: string[] }) => qaService.addReply(data.threadId, { content: data.content, imageUrls: data.imageUrls }),
    onSuccess: (newReply, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qaThreads'] });
      setReplyText(prev => ({ ...prev, [variables.threadId]: "" }));
      setReplyImages(prev => ({ ...prev, [variables.threadId]: [] }));

      if (user?.role === 'mentor' || user?.role === 'admin') {
        statusMutation.mutate({ threadId: variables.threadId, status: 'answered' });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (threadId: string) => qaService.deleteQAThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qaThreads'] });
      setDeleteModalOpen(false);
      setThreadToDelete(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to delete discussion thread.");
    }
  });

  const handleAskQuestion = (data: QuestionValues) => {
    createMutation.mutate({
      courseId: user?.enrolledCourseIds?.[0] || "course-fullstack", // Should ideally be selected by user
      question: data.question,
      imageUrls: newQuestionImages.length > 0 ? newQuestionImages : undefined
    });
  };

  const handleReply = (qaId: string) => {
    const replyContent = replyText[qaId] || "";
    const replyImgs = replyImages[qaId];
    if ((!replyContent.trim() && (!replyImgs || replyImgs.length === 0)) || !user) return;

    replyMutation.mutate({
      threadId: qaId,
      content: replyContent,
      imageUrls: replyImgs && replyImgs.length > 0 ? replyImgs : undefined
    });
  };

  const roleFilteredQaList = useMemo(() => {
    if (user?.role === 'student') {
      return qaList.filter((q: any) => q.studentId === user.id || q.student?.id === user.id);
    }
    return qaList;
  }, [qaList, user]);

  const filteredDiscussions = useMemo(() => {
    return roleFilteredQaList.filter((q: any) => !filterStudent || (q.student?.name || q.studentName || '').toLowerCase().includes(filterStudent.toLowerCase()));
  }, [roleFilteredQaList, filterStudent]);

  const displayedDiscussions = useMemo(() => {
    return filteredDiscussions.slice(0, visibleDiscussionsCount);
  }, [filteredDiscussions, visibleDiscussionsCount]);

  const hasMoreDiscussions = filteredDiscussions.length > visibleDiscussionsCount;

  const handleShowMoreDiscussions = () => {
    if (hasMoreDiscussions) {
      setVisibleDiscussionsCount(prev => prev + 5);
    } else if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      setVisibleDiscussionsCount(prev => prev + 5);
    }
  };

  const isPremiumUser = user?.role !== 'student' || user?.plan === 'premium' || user?.plan === 'elite';

  if (!isPremiumUser) {
    return (
      <div className="w-full pb-12 ">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-6">Mentorship Q&A</h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">
            Ask questions and get direct answers from your elite mentors.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative shadow-2xl min-h-[400px] flex items-center justify-center">
          <div className="text-center p-6 max-w-md relative z-20">
            <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-lg">
              <Lock className="w-8 h-8 text-cyan-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Mentorship Access Locked</h3>
            <p className="text-sm text-zinc-400 mb-6">The Mentorship Q&A portal is an exclusive feature. Upgrade to Premium or Elite to get direct answers from top tech mentors.</p>
            <button className="px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)]">
              Upgrade Plan
            </button>
          </div>

          {/* Blurred Background effect representing Q&A feed */}
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center p-8 gap-4 opacity-30 select-none" aria-hidden="true">
            <div className="w-full max-w-3xl h-32 bg-zinc-800 rounded-xl blur-[2px]"></div>
            <div className="w-full max-w-3xl h-48 bg-zinc-800 rounded-xl blur-[2px]"></div>
            <div className="w-full max-w-3xl h-24 bg-zinc-800 rounded-xl blur-[2px]"></div>
          </div>
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm z-10"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12 ">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-6">Mentorship Q&A</h1>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">
          {user?.role === "student" ? "Ask questions and get direct answers from your elite mentors." : "Review and answer questions from your assigned mentees."}
        </p>
      </div>

      {user?.role === "student" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-10 shadow-xl">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white mb-4 flex items-center">
            <MessageSquarePlus className="w-4 h-4 mr-2 text-cyan-400" />
            Ask a new question
          </h2>
          <form onSubmit={questionForm.handleSubmit(handleAskQuestion)}>
            {newQuestionImages.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-3">
                {newQuestionImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={img} alt="Attachment Preview" className="h-20 w-20 rounded-lg border border-zinc-700 object-cover" />
                    <button
                      onClick={() => setNewQuestionImages(prev => prev.filter((_, i) => i !== idx))}
                      type="button"
                      className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full border border-zinc-700 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              {...questionForm.register("question")}
              placeholder="Describe your doubt in detail. Mention the topic or code snippet if relevant..."
              className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-xs sm:text-[13px] lg:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all custom-scrollbar min-h-[120px] sm:min-h-[150px] leading-relaxed ${questionForm.formState.errors.question ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {questionForm.formState.errors.question && <p className="text-xs text-red-500 mt-1">{questionForm.formState.errors.question.message}</p>}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-3 pt-3 gap-3 sm:gap-0">
              <label className="w-full sm:w-auto cursor-pointer px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-400/20 transition-all flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-[13px] lg:text-sm font-medium" title="Attach screenshots">
                <ImageIcon className="w-4 h-4" />
                <span>Attach Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, (base64s) => setNewQuestionImages(prev => [...prev, ...base64s]))}
                />
              </label>
              <button
                type="submit"
                disabled={!questionForm.watch("question")?.trim() || createMutation.isPending}
                className="w-full sm:w-auto px-6 py-2 text-xs sm:text-[13px] lg:text-sm font-semibold rounded-lg bg-cyan-400 text-zinc-950 hover:bg-cyan-500 transition-colors inline-flex justify-center items-center disabled:opacity-50 cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Recent Discussions</h2>
          {filterStudent && (
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-800/30 text-cyan-400 rounded-full text-xs sm:text-[13px] font-medium shrink-0 animate-in fade-in zoom-in-95">
              <span>Mentee: <span className="font-semibold text-white">{filterStudent}</span></span>
              <button
                onClick={() => {
                  setFilterStudent(null);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('student');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5 rounded-full hover:bg-cyan-900 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {displayedDiscussions.map((qa: any) => {
          const course = qa.course;
          
          return (
            <div key={qa.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200">
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => toggleAccordion(qa.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <UserCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-1">
                        <span className="text-sm sm:text-base lg:text-lg font-semibold text-white">{qa.student?.name || 'Unknown Student'}</span>
                        {/* Status Badge */}
                        {qa.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/25 whitespace-nowrap shadow-sm">
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            <span>Unresolved</span>
                          </span>
                        )}
                        {course && (
                          <span className="flex items-center text-[10px] sm:text-[11px] lg:text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-400/15 px-2 py-0.5 rounded whitespace-nowrap">
                            <BookOpen className="w-3 h-3 mr-1 shrink-0 text-cyan-700 dark:text-cyan-400" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{course.title}</span>
                          </span>
                        )}
                        <span className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500">• {formatQADateTime(qa.createdAt || qa.date || Date.now())}</span>
                        {!expandedIds[qa.id] && qa.replies && qa.replies.length > 0 && (
                          <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                            {qa.replies.length} {qa.replies.length === 1 ? 'Reply' : 'Replies'}
                          </span>
                        )}
                      </div>
                      
                      {/* Only show message preview when accordion is collapsed */}
                      {!expandedIds[qa.id] && (
                        <>
                          <p className="text-xs sm:text-[13px] lg:text-sm leading-relaxed text-zinc-400 line-clamp-2 mt-1">
                            {qa.replies && qa.replies.length > 0 ? (
                              <span>
                                {(() => {
                                  const sorted = [...qa.replies].sort((a: any, b: any) =>
                                    new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
                                  );
                                  return `${sorted[0].author?.name || 'User'}: ${sorted[0].content}`;
                                })()}
                              </span>
                            ) : (
                              qa.question
                            )}
                          </p>
                          {qa.imageUrls && qa.imageUrls.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {qa.imageUrls.map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Attached screenshot ${idx + 1}`}
                                  className="h-20 w-20 rounded-lg border border-zinc-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(img)}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 pt-1 text-zinc-500 flex items-center gap-2">
                    {(user?.role === 'admin' || user?.role === 'mentor') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreadToDelete(qa.id);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-850/80 rounded transition-colors cursor-pointer"
                        title="Delete Discussion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedIds[qa.id] ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {expandedIds[qa.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden flex flex-col"
                  >
                    {(() => {
                      const allMessages = [
                        {
                          id: 'question-' + qa.id,
                          content: qa.question,
                          createdAt: qa.createdAt || qa.date || Date.now(),
                          imageUrls: qa.imageUrls,
                          author: qa.student,
                          authorRole: 'student',
                          authorName: qa.student?.name || 'Unknown Student',
                          isQuestion: true
                        },
                        ...(qa.replies || []).map((r: any) => ({
                          id: r.id,
                          content: r.content,
                          createdAt: r.createdAt || r.date || Date.now(),
                          imageUrls: r.imageUrls,
                          author: r.author,
                          authorRole: r.author?.role?.toLowerCase() || r.authorRole,
                          authorName: r.author?.name || r.authorName,
                          isQuestion: false
                        }))
                      ].sort((a: any, b: any) =>
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      );

                      const showLimit = visibleRepliesCount[qa.id] || 3;
                      const startIndex = Math.max(0, allMessages.length - showLimit);
                      const displayedMessages = allMessages.slice(startIndex);
                      const hasMoreMessages = allMessages.length > showLimit;

                      return (
                        <>
                          {/* Toggle for Older Replies (rendered at the top of replies) */}
                          {(hasMoreMessages || showLimit > 3) && (
                            <div className="py-4 px-6 flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-900/50 bg-transparent">
                              <div className="h-px bg-zinc-200 dark:bg-zinc-800/60 flex-1" />
                              {hasMoreMessages ? (
                                <button
                                  onClick={() => setVisibleRepliesCount(prev => ({ ...prev, [qa.id]: showLimit + 5 }))}
                                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-955/40 border border-cyan-200 dark:border-cyan-800/40 cursor-pointer shadow-sm"
                                >
                                  <span>View {allMessages.length - showLimit} older replies</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setVisibleRepliesCount(prev => ({ ...prev, [qa.id]: 3 }))}
                                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-955/40 border border-cyan-200 dark:border-cyan-800/40 cursor-pointer shadow-sm"
                                >
                                  <span>Collapse replies</span>
                                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                </button>
                              )}
                              <div className="h-px bg-zinc-200 dark:bg-zinc-800/60 flex-1" />
                            </div>
                          )}

                          {/* Chronological Message Flow (Original Question + Replies) */}
                          {displayedMessages.map((msg: any) => {
                            const isMentor = msg.authorRole === 'mentor' || msg.authorRole === 'admin';
                            const isQuestion = msg.isQuestion;
                            return (
                              <div key={msg.id} className="bg-zinc-950 p-4 sm:p-6 border-b border-zinc-900/50">
                                <div className="flex items-start gap-3 sm:gap-4">
                                  <div className={`flex-shrink-0 ${isMentor ? 'text-cyan-500' : 'text-zinc-500'}`}>
                                    {isMentor ? <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" /> : <UserCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center flex-wrap gap-2 mb-2 sm:mb-1">
                                      <span className={`text-xs sm:text-[13px] lg:text-sm font-semibold ${isQuestion ? 'text-cyan-400' : isMentor ? 'text-cyan-400' : 'text-zinc-300'}`}>
                                        {msg.authorName}
                                      </span>
                                      {isMentor && <CheckCircle2 className="w-4 h-4 text-cyan-500" />}
                                      <span className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500">• {formatQADateTime(msg.createdAt)}</span>
                                    </div>
                                    <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.imageUrls.map((img: string, idx: number) => (
                                          <img
                                            key={idx}
                                            src={img}
                                            alt={`Attached screenshot ${idx + 1}`}
                                            className="h-20 w-20 rounded-lg border border-zinc-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setSelectedImage(img)}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Reply Input Box (Positioned at the very bottom of the conversation thread) */}
                    <div className="bg-zinc-950 p-4 sm:p-6 border-t border-zinc-900/50">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0">
                          {user?.role === 'mentor' ? <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500 mt-1" /> : <UserCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500 mt-1" />}
                        </div>
                        <div className="flex-1">
                          {replyImages[qa.id] && replyImages[qa.id].length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-3">
                              {replyImages[qa.id].map((img, idx) => (
                                <div key={idx} className="relative inline-block">
                                  <img src={img} alt="Attachment Preview" className="h-16 w-16 rounded-lg border border-zinc-800 object-cover" />
                                  <button
                                    onClick={() => setReplyImages(p => ({ ...p, [qa.id]: p[qa.id].filter((_, i) => i !== idx) }))}
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full border border-zinc-700 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <textarea
                            value={replyText[qa.id] || ""}
                            onChange={(e) => setReplyText({ ...replyText, [qa.id]: e.target.value })}
                            placeholder={(qa.replies && qa.replies.length > 0) ? "Write a reply..." : (user?.role === 'mentor' ? "Type your reply to the student here..." : "Add more context to your question...")}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 text-xs sm:text-[13px] lg:text-sm text-zinc-300 focus:outline-none focus:border-cyan-500 transition-all min-h-[120px] sm:min-h-[150px] mb-3 leading-relaxed custom-scrollbar"
                          />
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4 mt-2">
                            {user?.role === "student" && !(qa.replies && qa.replies.length > 0) ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20 text-[10px] sm:text-[11px] lg:text-xs font-medium shrink-0">
                                <Clock className="w-3.5 h-3.5 animate-pulse shrink-0" />
                                <span className="whitespace-nowrap">Waiting for mentor reply...</span>
                              </div>
                            ) : <div className="hidden sm:block"></div>}

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                              <label className="w-full sm:w-auto cursor-pointer px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-400/20 transition-all flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-[13px] lg:text-sm font-medium" title="Attach screenshots">
                                <ImageIcon className="w-4 h-4" />
                                <span>Attach Images</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(e, (base64s) => setReplyImages(p => ({ ...p, [qa.id]: [...(p[qa.id] || []), ...base64s] })))}
                                />
                              </label>
                              <button
                                onClick={() => handleReply(qa.id)}
                                disabled={!replyText[qa.id]?.trim() || (replyMutation.isPending && replyMutation.variables?.threadId === qa.id)}
                                className="w-full sm:w-auto px-6 py-2 text-xs sm:text-[13px] lg:text-sm font-semibold rounded-lg bg-cyan-400 text-zinc-950 hover:bg-cyan-500 transition-colors disabled:opacity-50 inline-flex justify-center items-center"
                              >
                                {replyMutation.isPending && replyMutation.variables?.threadId === qa.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Posting...
                                  </>
                                ) : (
                                  "Post Reply"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Intersection Observer target for infinite scrolling optimization */}
      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-6">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading older discussions...</span>
          </div>
        )}
        {!hasNextPage && qaList.length > 0 && (
          <span className="text-zinc-500 text-xs sm:text-sm">All doubts loaded.</span>
        )}
      </div>

      {/* Discussions List Pagination Controls (Show more / Show less) */}
      {(hasMoreDiscussions || hasNextPage || visibleDiscussionsCount > 3) && (
        <div className="py-6 flex items-center justify-center gap-6 mt-4 border-t border-zinc-800/40">
          {(hasMoreDiscussions || hasNextPage) && (
            <button
              onClick={handleShowMoreDiscussions}
              disabled={isFetchingNextPage}
              className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-800/40 cursor-pointer shadow-md disabled:opacity-55"
            >
              {isFetchingNextPage ? (
                <span>Loading older discussions...</span>
              ) : (
                <>
                  <span>Show more discussions {hasMoreDiscussions ? `(${filteredDiscussions.length - visibleDiscussionsCount} remaining)` : ''}</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
          {visibleDiscussionsCount > 3 && (
            <button
              onClick={() => setVisibleDiscussionsCount(3)}
              className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-350 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900/40 border border-zinc-800/60 cursor-pointer shadow-md"
            >
              <span>Show less</span>
              <ChevronDown className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-4 right-4 sm:top-8 sm:right-8 text-zinc-400 hover:text-white bg-zinc-900/80 rounded-full p-2 transition-colors z-[110] cursor-pointer"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Fullscreen Attachment"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setThreadToDelete(null);
        }}
        onConfirm={() => {
          if (threadToDelete) {
            deleteMutation.mutate(threadToDelete);
          }
        }}
        title="Delete Discussion"
        description="Are you sure you want to delete this discussion thread? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
