"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MentorshipQA, QAReply } from "@/types";
import { useAuth } from "@/components/dashboard/auth-provider";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { qaService } from "@/services/qa";
import { usersService } from "@/services/users";
import { MessageSquarePlus, Send, User, UserCircle2, ShieldCheck, CheckCircle2, BookOpen, ChevronDown, ImageIcon, X, Clock, Lock, Trash2, Loader2, Filter, AlertCircle } from "lucide-react";
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
    queryFn: ({ pageParam = 1 }) => qaService.getQAThreads(pageParam, 15),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && typeof lastPage === 'object' && 'hasMore' in lastPage) {
        return lastPage.hasMore ? (allPages ? allPages.length + 1 : 2) : undefined;
      }
      return undefined;
    },
    enabled: !!user,
    refetchInterval: 8000,
    refetchIntervalInBackground: false,
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'unresolved'>('all');

  const { data: mentees = [] } = useQuery({
    queryKey: ['my-mentees'],
    queryFn: () => usersService.getMyMentees(),
    enabled: user?.role === 'mentor' || user?.role === 'admin'
  });

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
  const [visibleDiscussionsCount, setVisibleDiscussionsCount] = useState(10);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleDiscussionsCount(10);
  }, [filterStudent, filterStatus]);

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



  const [readThreadTimestamps, setReadThreadTimestamps] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prokodex_qa_read_timestamps");
        if (saved) {
          setReadThreadTimestamps(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to parse read timestamps:", e);
      }
    }
  }, []);

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => {
      const isOpening = !prev[id];
      if (isOpening) {
        setReadThreadTimestamps(old => {
          const updated = { ...old, [id]: new Date().toISOString() };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("prokodex_qa_read_timestamps", JSON.stringify(updated));
            } catch (e) {
              console.error(e);
            }
          }
          return updated;
        });
        return { ...prev, [id]: true };
      }
      return { ...prev, [id]: false };
    });
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
    const courseId = selectedCourseId || user?.enrolledCourseIds?.[0] || (user as any)?.enrolledCourses?.[0]?.id;
    if (!courseId) {
      alert("No enrolled course found to associate your question with.");
      return;
    }

    createMutation.mutate({
      courseId,
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

  const studentsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    mentees.forEach((m: any) => {
      if (m.name) {
        map.set(m.id || m.name, { id: m.id || m.name, name: m.name });
      }
    });

    roleFilteredQaList.forEach((q: any) => {
      const studentId = q.student?.id || q.studentId;
      const studentName = q.student?.name || q.studentName;
      if (studentName) {
        const key = studentId || studentName;
        if (!map.has(key)) {
          map.set(key, { id: key, name: studentName });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [mentees, roleFilteredQaList]);

  const getStudentDiscussionCount = (studentId: string, studentName: string) => {
    return roleFilteredQaList.filter((q: any) => {
      const sId = q.student?.id || q.studentId || '';
      const sName = q.student?.name || q.studentName || '';
      return (studentId && sId === studentId) || (studentName && sName.toLowerCase() === studentName.toLowerCase());
    }).length;
  };

  const getStudentUnresolvedCount = (studentId: string, studentName: string) => {
    return roleFilteredQaList.filter((q: any) => {
      const sId = q.student?.id || q.studentId || '';
      const sName = q.student?.name || q.studentName || '';
      const matches = (studentId && sId === studentId) || (studentName && sName.toLowerCase() === studentName.toLowerCase());
      return matches && q.status === 'pending';
    }).length;
  };

  const studentScopedDiscussions = useMemo(() => {
    if (!filterStudent || filterStudent === 'all') return roleFilteredQaList;
    const t = filterStudent.trim().toLowerCase();
    return roleFilteredQaList.filter((q: any) => {
      const qStudentId = (q.studentId || q.student?.id || '').toLowerCase();
      const qStudentName = (q.student?.name || q.studentName || '').toLowerCase();
      return qStudentId === t || qStudentName === t || qStudentName.includes(t);
    });
  }, [roleFilteredQaList, filterStudent]);

  const totalAllCount = studentScopedDiscussions.length;
  const totalUnresolvedCount = studentScopedDiscussions.filter((q: any) => q.status === 'pending').length;

  const filteredDiscussions = useMemo(() => {
    if (filterStatus === 'unresolved') {
      return studentScopedDiscussions.filter((q: any) => q.status === 'pending');
    }
    return studentScopedDiscussions;
  }, [studentScopedDiscussions, filterStatus]);

  const filterStudentDisplayName = useMemo(() => {
    if (!filterStudent || filterStudent === 'all') return null;
    const found = studentsList.find(st => st.id === filterStudent || st.name.toLowerCase() === filterStudent.toLowerCase());
    if (found && found.name) return found.name;
    const qaMatch = roleFilteredQaList.find((q: any) => (q.studentId || q.student?.id) === filterStudent || (q.student?.name || q.studentName || '').toLowerCase() === filterStudent.toLowerCase());
    if (qaMatch && (qaMatch.student?.name || qaMatch.studentName)) {
      return qaMatch.student?.name || qaMatch.studentName;
    }
    return filterStudent;
  }, [filterStudent, studentsList, roleFilteredQaList]);

  const selectedStudentOptionValue = useMemo(() => {
    if (!filterStudent || filterStudent === 'all') return 'all';
    const found = studentsList.find(st => st.id === filterStudent || st.name.toLowerCase() === filterStudent.toLowerCase());
    return found ? (found.id || found.name) : filterStudent;
  }, [studentsList, filterStudent]);

  const handleStudentFilterChange = (val: string) => {
    const nextVal = val === 'all' ? null : val;
    setFilterStudent(nextVal);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextVal) {
        url.searchParams.set('student', nextVal);
      } else {
        url.searchParams.delete('student');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

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

  const enrolledCourses = (user as any)?.enrolledCourses || [];
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    if (!selectedCourseId) {
      if (user?.enrolledCourseIds?.[0]) {
        setSelectedCourseId(user.enrolledCourseIds[0]);
      } else if (enrolledCourses[0]?.id) {
        setSelectedCourseId(enrolledCourses[0].id);
      }
    }
  }, [user, enrolledCourses, selectedCourseId]);

  return (
    <div className="w-full pb-12 ">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">Mentorship Q&A</h1>
        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">
          {user?.role === "student" ? "Ask questions and get direct answers from your elite mentors." : "Review and answer questions from your assigned mentees."}
        </p>
      </div>

      {user?.role === "student" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 sm:p-5 mb-6 sm:mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-white flex items-center">
              <MessageSquarePlus className="w-4 h-4 mr-2 text-cyan-400" />
              Ask a new question
            </h2>
            {enrolledCourses.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Course:</span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer max-w-[220px] truncate"
                >
                  {enrolledCourses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <form onSubmit={questionForm.handleSubmit(handleAskQuestion)}>
            {newQuestionImages.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2.5">
                {newQuestionImages.map((img, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={img} alt="Attachment Preview" className="h-16 w-16 sm:h-18 sm:w-18 rounded-lg border border-zinc-700 object-cover" />
                    <button
                      onClick={() => setNewQuestionImages(prev => prev.filter((_, i) => i !== idx))}
                      type="button"
                      className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full border border-zinc-700 transition-colors cursor-pointer"
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
              className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-lg text-xs sm:text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all custom-scrollbar min-h-[90px] sm:min-h-[110px] leading-relaxed ${questionForm.formState.errors.question ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {questionForm.formState.errors.question && <p className="text-xs text-red-500 mt-1">{questionForm.formState.errors.question.message}</p>}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mt-2.5 pt-2.5 gap-2.5 sm:gap-0">
              <label className="w-full sm:w-auto cursor-pointer h-9 px-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-400/20 transition-all flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-[13px] font-medium" title="Attach screenshots">
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
                className="w-full sm:w-auto h-9 px-5 text-xs sm:text-[13px] font-semibold rounded-lg bg-cyan-400 text-zinc-950 hover:bg-cyan-500 transition-colors inline-flex justify-center items-center disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(8,145,178,0.2)]"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-2" />
                    Submit Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5">
        {/* Filter Controls Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 sm:p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          {/* Status Filter: All vs Unresolved */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                filterStatus === 'all' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800/80 text-zinc-400'
              }`}>
                {totalAllCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('unresolved')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filterStatus === 'unresolved'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {totalUnresolvedCount > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${totalUnresolvedCount > 0 ? 'bg-amber-500' : 'bg-zinc-600'}`}></span>
              </span>
              <span>Unresolved</span>
              {totalUnresolvedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {totalUnresolvedCount}
                </span>
              )}
            </button>
          </div>

          {/* Student Filter Dropdown (for Mentor / Admin) */}
          {(user?.role === 'mentor' || user?.role === 'admin') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1 shrink-0">
                <UserCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Student:
              </span>
              <div className="relative flex-1 sm:w-64">
                <select
                  value={selectedStudentOptionValue}
                  onChange={(e) => handleStudentFilterChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer truncate"
                >
                  <option value="all">
                    All Students ({roleFilteredQaList.length})
                  </option>
                  {studentsList.map((st) => {
                    const count = getStudentDiscussionCount(st.id, st.name);
                    const unres = getStudentUnresolvedCount(st.id, st.name);
                    return (
                      <option key={st.id || st.name} value={st.id || st.name}>
                        {st.name} {unres > 0 ? `(${unres} unresolved)` : `(${count})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {(filterStudent || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    handleStudentFilterChange('all');
                    setFilterStatus('all');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors shrink-0 cursor-pointer"
                  title="Reset filters"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white">
              {filterStatus === 'unresolved' ? 'Unresolved Doubts' : 'Recent Discussions'}
            </h2>
            <span className="text-xs text-zinc-500 font-medium">({filteredDiscussions.length})</span>
          </div>

          {filterStudent && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-cyan-950/50 border border-cyan-800/30 text-cyan-400 rounded-full text-xs font-medium shrink-0 animate-in fade-in zoom-in-95">
              <span>Student: <span className="font-semibold text-white">{filterStudentDisplayName || filterStudent}</span></span>
              <button
                onClick={() => handleStudentFilterChange('all')}
                className="hover:text-white transition-colors cursor-pointer ml-1 p-0.5 rounded-full hover:bg-cyan-900 flex items-center justify-center"
                title="Clear student filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-zinc-900/40 border border-zinc-800/80 rounded-xl">
            <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mb-3" />
            <p className="text-xs sm:text-sm text-zinc-400">Loading discussions...</p>
          </div>
        ) : displayedDiscussions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6">
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mb-1">
              {filterStatus === 'unresolved' ? "No unresolved doubts found" : "No discussions found"}
            </p>
            <p className="text-[11px] sm:text-xs text-zinc-500">
              {filterStatus === 'unresolved'
                ? (filterStudent ? `All questions from ${filterStudentDisplayName || 'this student'} are resolved!` : "All student doubts have been answered! Great work.")
                : (filterStudent ? `${filterStudentDisplayName || 'This student'} has not posted any questions yet.` : "Be the first to ask a doubt or question!")}
            </p>
          </div>
        ) : (
          displayedDiscussions.map((qa: any) => {
            const course = qa.course;
            const sortedReplies = qa.replies && qa.replies.length > 0
              ? [...qa.replies].sort((a: any, b: any) =>
                  new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime()
                )
              : [];
            const latestReply = sortedReplies[0];
            const hasNewReply = latestReply &&
              latestReply.authorId !== user?.id &&
              latestReply.author?.id !== user?.id &&
              (!readThreadTimestamps[qa.id] || new Date(latestReply.createdAt || latestReply.date || 0).getTime() > new Date(readThreadTimestamps[qa.id]).getTime());

            return (
              <div key={qa.id} className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl overflow-hidden transition-all duration-200">
                <div
                  className="p-3.5 sm:p-4.5 cursor-pointer hover:bg-zinc-800/40 transition-colors"
                  onClick={() => toggleAccordion(qa.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 sm:gap-3.5 flex-1 min-w-0">
                      <div className="flex-shrink-0 pt-0.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
                          <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-xs sm:text-[13px] md:text-sm font-semibold text-white">{qa.student?.name || 'Unknown Student'}</span>
                          
                          {/* New Reply Badge */}
                          {hasNewReply && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.3)] whitespace-nowrap">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                              </span>
                              <span>New Reply</span>
                            </span>
                          )}
                          {/* Status Badge */}
                          {qa.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-amber-500/10 text-amber-500 border border-amber-500/25 whitespace-nowrap shadow-sm">
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                              </span>
                              <span>Unresolved</span>
                            </span>
                          )}
                          {course && (
                            <span className="flex items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-400/15 px-1.5 py-0.5 rounded whitespace-nowrap">
                              <BookOpen className="w-3 h-3 mr-1 shrink-0 text-cyan-700 dark:text-cyan-400" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{course.title}</span>
                            </span>
                          )}
                          <span className="text-[10px] sm:text-[11px] text-zinc-500">• {formatQADateTime(qa.createdAt || qa.date || Date.now())}</span>
                          {!expandedIds[qa.id] && qa.replies && qa.replies.length > 0 && (
                            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                              {qa.replies.length} {qa.replies.length === 1 ? 'Reply' : 'Replies'}
                            </span>
                          )}
                        </div>
                        
                        {/* Only show message preview when accordion is collapsed */}
                        {!expandedIds[qa.id] && (
                          <>
                            <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-400 line-clamp-2 mt-0.5">
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
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {qa.imageUrls.map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Attached screenshot ${idx + 1}`}
                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg border border-zinc-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(img)}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 pt-1 text-zinc-500 flex items-center gap-1.5">
                      {(user?.role === 'admin' || user?.role === 'mentor') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setThreadToDelete(qa.id);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                          title="Delete Discussion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedIds[qa.id] ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedIds[qa.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
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
                              <div className="py-2.5 px-4 sm:px-5 flex items-center gap-3 border-b border-zinc-800/60 bg-transparent">
                                <div className="h-px bg-zinc-800/60 flex-1" />
                                {hasMoreMessages ? (
                                  <button
                                    onClick={() => setVisibleRepliesCount(prev => ({ ...prev, [qa.id]: showLimit + 5 }))}
                                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-955/40 border border-cyan-200 dark:border-cyan-800/40 cursor-pointer shadow-sm"
                                  >
                                    <span>View {allMessages.length - showLimit} older replies</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setVisibleRepliesCount(prev => ({ ...prev, [qa.id]: 3 }))}
                                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800/60 border border-zinc-700/60 cursor-pointer shadow-sm"
                                  >
                                    <span>Collapse to latest 3 replies</span>
                                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                                  </button>
                                )}
                                <div className="h-px bg-zinc-800/60 flex-1" />
                              </div>
                            )}

                            {/* List of Messages */}
                            <div className="divide-y divide-zinc-800/60 bg-zinc-950/30">
                              {displayedMessages.map((msg: any) => {
                                const isMentor = msg.authorRole === 'mentor' || msg.authorRole === 'admin';
                                const isCurrentUser = msg.author?.id === user?.id;

                                return (
                                  <div key={msg.id} className={`p-4 sm:p-5 ${msg.isQuestion ? 'bg-zinc-900/30' : isMentor ? 'bg-cyan-950/10' : ''}`}>
                                    <div className="flex items-start gap-3 sm:gap-3.5">
                                      <div className="flex-shrink-0 pt-0.5">
                                        {isMentor ? (
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                          </div>
                                        ) : (
                                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
                                            <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs sm:text-[13px] font-semibold text-white">
                                            {msg.authorName}
                                          </span>
                                          {msg.isQuestion ? (
                                            <span className="text-[10px] font-medium bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded border border-zinc-700">Author</span>
                                          ) : isMentor ? (
                                            <span className="text-[10px] font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 px-1.5 py-0.2 rounded flex items-center gap-1">
                                              <ShieldCheck className="w-3 h-3" /> Mentor
                                            </span>
                                          ) : null}
                                          <span className="text-[10px] sm:text-[11px] text-zinc-500 ml-auto">
                                            {formatQADateTime(msg.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-300 whitespace-pre-wrap">
                                          {msg.content}
                                        </p>
                                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                                          <div className="mt-3 flex flex-wrap gap-2">
                                            {msg.imageUrls.map((img: string, idx: number) => (
                                              <img
                                                key={idx}
                                                src={img}
                                                alt={`Attached ${idx + 1}`}
                                                className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg border border-zinc-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
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
                            </div>
                          </>
                        );
                      })()}

                      {/* Reply Input Box */}
                      <div className="p-3.5 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 pt-1 hidden sm:block">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
                              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <textarea
                              value={replyText[qa.id] || ""}
                              onChange={(e) => setReplyText(p => ({ ...p, [qa.id]: e.target.value }))}
                              placeholder="Write a response or follow-up question..."
                              rows={2}
                              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-xs sm:text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all resize-y min-h-[70px] custom-scrollbar"
                            />

                            {/* Image Previews */}
                            {replyImages[qa.id] && replyImages[qa.id].length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-2">
                                {replyImages[qa.id].map((b64, idx) => (
                                  <div key={idx} className="relative group">
                                    <img src={b64} alt={`Preview ${idx + 1}`} className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg border border-zinc-700 object-cover" />
                                    <button
                                      onClick={() => setReplyImages(p => ({ ...p, [qa.id]: p[qa.id].filter((_, i) => i !== idx) }))}
                                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2">
                                {/* Mentor status toggle */}
                                {(user?.role === 'mentor' || user?.role === 'admin') && (
                                  <button
                                    onClick={() => statusMutation.mutate({ threadId: qa.id, status: qa.status === 'answered' ? 'pending' : 'answered' })}
                                    className={`h-8 sm:h-9 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                      qa.status === 'answered'
                                        ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{qa.status === 'answered' ? 'Mark Unresolved' : 'Mark Resolved'}</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                                <label className="w-full sm:w-auto cursor-pointer h-9 px-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-100/50 dark:hover:bg-cyan-400/20 transition-all flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-[13px] font-medium" title="Attach screenshots">
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
                                  className="w-full sm:w-auto h-9 px-5 text-xs sm:text-[13px] font-semibold rounded-lg bg-cyan-400 text-zinc-950 hover:bg-cyan-500 transition-colors disabled:opacity-50 inline-flex justify-center items-center cursor-pointer shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                                >
                                  {replyMutation.isPending && replyMutation.variables?.threadId === qa.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
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
          })
        )}
      </div>

      {/* Intersection Observer target for infinite scrolling optimization */}
      <div ref={observerTarget} className="h-8 w-full flex items-center justify-center mt-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-[13px]">
            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading older discussions...</span>
          </div>
        )}
        {!hasNextPage && qaList.length > 0 && (
          <span className="text-zinc-500 text-xs sm:text-[13px]">All doubts loaded.</span>
        )}
      </div>

      {/* Discussions List Pagination Controls (Show more / Show less) */}
      {(hasMoreDiscussions || hasNextPage || visibleDiscussionsCount > 3) && (
        <div className="py-4 flex items-center justify-center gap-4 mt-2 border-t border-zinc-800/40">
          {(hasMoreDiscussions || hasNextPage) && (
            <button
              onClick={handleShowMoreDiscussions}
              disabled={isFetchingNextPage}
              className="text-xs sm:text-[13px] font-semibold text-cyan-400 hover:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/40 cursor-pointer shadow-sm disabled:opacity-55"
            >
              {isFetchingNextPage ? (
                <span>Loading older discussions...</span>
              ) : (
                <>
                  <span>Show more discussions {hasMoreDiscussions ? `(${filteredDiscussions.length - visibleDiscussionsCount} remaining)` : ''}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
          {visibleDiscussionsCount > 3 && (
            <button
              onClick={() => setVisibleDiscussionsCount(3)}
              className="text-xs sm:text-[13px] font-semibold text-zinc-400 hover:text-zinc-350 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/40 border border-zinc-800/60 cursor-pointer shadow-sm"
            >
              <span>Show less</span>
              <ChevronDown className="w-3.5 h-3.5 rotate-180" />
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
