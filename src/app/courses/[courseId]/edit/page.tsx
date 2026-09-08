"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import {
  ShieldAlert,
  ArrowLeft,
  Plus,
  UploadCloud,
  Video,
  HelpCircle,
  MessageSquare,
  Trash2,
  Save,
  CheckCircle2,
  Edit,
  FolderPlus,
  GripVertical,
  FileText,
  BookOpen,
  Edit3,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { AccessDenied } from "@/components/ui/access-denied";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services/courses";
import { modulesService } from "@/services/modules";
import { topicsService } from "@/services/topics";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "code-block"],
    ["clean"],
  ],
};

const courseInfoSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type CourseInfoValues = z.infer<typeof courseInfoSchema>;

// Basic mocks for curriculum until we wire them up next
import { CourseModule, Topic } from "@/types";

interface MCQInput {
  question: string;
  options: string[];
  correctIndex: number;
}

interface InterviewQInput {
  question: string;
  hints: string;
}

export default function CourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["courses", resolvedParams.courseId],
    queryFn: () => coursesService.getCourseById(resolvedParams.courseId),
    enabled: !!resolvedParams.courseId,
  });

  const [isEditingCourseInfo, setIsEditingCourseInfo] = useState(false);
  const [courseThumbnailFile, setCourseThumbnailFile] = useState<File | null>(
    null,
  );
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);

  const handleThumbnailChange = (file: File | null) => {
    setCourseThumbnailFile(file);
    if (file) {
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    } else {
      setThumbnailPreviewUrl(null);
    }
  };

  const courseInfoForm = useForm<CourseInfoValues>({
    resolver: zodResolver(courseInfoSchema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (course) {
      courseInfoForm.reset({
        title: course.title,
        description: course.description,
      });
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: (data: any) =>
      coursesService.updateCourse(resolvedParams.courseId, data),
    onSuccess: (updatedCourse: any) => {
      const freshTimestamp = updatedCourse?.updatedAt || new Date().toISOString();
      // Immediately update course cache so UI re-renders with fresh thumbnail right away
      queryClient.setQueryData(["courses", resolvedParams.courseId], (old: any) => {
        if (!old) return updatedCourse;
        return {
          ...old,
          ...updatedCourse,
          modules: old.modules || updatedCourse?.modules,
          updatedAt: freshTimestamp,
        };
      });
      // Immediately update global courses list cache
      queryClient.setQueryData(["courses"], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((c: any) =>
          c.id === resolvedParams.courseId
            ? { ...c, ...updatedCourse, updatedAt: freshTimestamp }
            : c
        );
      });
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsEditingCourseInfo(false);
      setCourseThumbnailFile(null);
      setThumbnailPreviewUrl(null);
    },
  });

  const handleUpdateCourseInfo = courseInfoForm.handleSubmit(
    (data: CourseInfoValues) => {
      updateCourseMutation.mutate({
        title: data.title,
        description: data.description,
        thumbnailFile: courseThumbnailFile,
      });
    },
  );

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const createModuleMutation = useMutation({
    mutationFn: (data: { courseId: string; title: string; order: number }) =>
      modulesService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] }); // Update counts on main page
      setIsAddingModule(false);
      setNewModuleTitle("");
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => modulesService.deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setModuleToDelete(null);
    },
  });

  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const handleDeleteModule = (moduleId: string) => {
    setModuleToDelete(moduleId);
  };

  const createTopicMutation = useMutation({
    mutationFn: (data: any) => topicsService.createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsAddingTopic(false);
      setEditingTopicId(null);
      setActiveModuleId(null);
      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoUploadedUrl(null);
      setVideoUploadProgress(null);
      setVideoUploadError(null);
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      setInterviewQs([{ question: "", hints: "" }]);
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      topicsService.updateTopic(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setIsAddingTopic(false);
      setEditingTopicId(null);
      setActiveModuleId(null);
      // Reset form
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoUploadedUrl(null);
      setVideoUploadProgress(null);
      setVideoUploadError(null);
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      setInterviewQs([{ question: "", hints: "" }]);
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: string) => topicsService.deleteTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setTopicToDelete(null);
    },
  });

  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  const handleDeleteTopic = (topicId: string) => {
    setTopicToDelete(topicId);
  };

  const updateModuleMutation = useMutation({
    mutationFn: (data: { id: string; title?: string; pdfUrl?: string | null }) =>
      modulesService.updateModule(data.id, {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.pdfUrl !== undefined && { pdfUrl: data.pdfUrl }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["courses", resolvedParams.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      setEditingModuleId(null);
      setEditingModuleTitle("");
    },
  });

  const [uploadingModulePdfId, setUploadingModulePdfId] = useState<string | null>(null);
  const [modulePdfProgress, setModulePdfProgress] = useState<number | null>(null);

  const handleModulePdfSelect = async (moduleId: string, file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }
    setUploadingModulePdfId(moduleId);
    setModulePdfProgress(0);
    try {
      const url = await topicsService.uploadPdf(file, (percent) => {
        setModulePdfProgress(percent);
      });
      await updateModuleMutation.mutateAsync({
        id: moduleId,
        pdfUrl: url,
      });
      toast.success("Module PDF uploaded successfully!");
    } catch (err: any) {
      console.error("Failed to upload module PDF", err);
      toast.error(err?.response?.data?.message || "Failed to upload module PDF");
    } finally {
      setUploadingModulePdfId(null);
      setModulePdfProgress(null);
    }
  };

  const handleRemoveModulePdf = async (moduleId: string) => {
    try {
      await updateModuleMutation.mutateAsync({
        id: moduleId,
        pdfUrl: null,
      });
      toast.success("Module PDF removed");
    } catch (err: any) {
      toast.error("Failed to remove module PDF");
    }
  };

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  // Accordion state for modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const current = prev[moduleId] !== undefined ? prev[moduleId] : true;
      return {
        ...prev,
        [moduleId]: !current,
      };
    });
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    modules.forEach((m: any) => {
      allExpanded[m.id] = true;
    });
    setExpandedModules(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    modules.forEach((m: any) => {
      allCollapsed[m.id] = false;
    });
    setExpandedModules(allCollapsed);
  };

  // Topic Editor State
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // Pre-upload state (upload on file select)
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(
    null,
  );
  const [videoUploadedUrl, setVideoUploadedUrl] = useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  // Handle video file selection → immediately start uploading
  const handleVideoSelect = async (file: File | null) => {
    if (!file) return;
    setVideoFile(file);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setVideoUploadedUrl(null);
    try {
      const url = await topicsService.uploadVideo(file, (percent) => {
        setVideoUploadProgress(percent);
      });
      setVideoUploadedUrl(url);
      setVideoUploadProgress(100);
      toast.success("Video uploaded successfully!");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Video upload failed";
      setVideoUploadError(msg);
      setVideoUploadProgress(null);
      toast.error(msg);
    }
  };

  // MCQ State
  const [mcqs, setMcqs] = useState<MCQInput[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0 },
  ]);

  // Interview Q State
  const [interviewQs, setInterviewQs] = useState<InterviewQInput[]>([
    { question: "", hints: "" },
  ]);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-xs sm:text-sm text-zinc-400">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <p className="text-sm sm:text-base font-semibold text-white mb-2">Course not found</p>
        <Link href="/courses" className="text-xs sm:text-sm text-cyan-400 hover:underline">
          &larr; Back to Course Overview
        </Link>
      </div>
    );
  }

  const modules = course.modules || [];

  const handleSaveModule = () => {
    if (!newModuleTitle.trim() || createModuleMutation.isPending) return;
    createModuleMutation.mutate({
      courseId: course.id,
      title: newModuleTitle.trim(),
      order: modules.length + 1,
    });
  };

  const handleSaveTopic = () => {
    if (!activeModuleId) return;

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Topic title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";

    const mcqErrors: string[] = [];
    mcqs.forEach((mcq, idx) => {
      if (!mcq.question.trim()) mcqErrors.push(`Q${idx + 1} needs a question.`);
    });
    if (mcqErrors.length > 0) newErrors.mcqs = mcqErrors.join(" ");

    const iqErrors: string[] = [];
    interviewQs.forEach((iq, idx) => {
      if (!iq.question.trim()) iqErrors.push(`IQ${idx + 1} needs a question.`);
      if (!iq.hints.trim()) iqErrors.push(`IQ${idx + 1} needs hints.`);
    });
    if (iqErrors.length > 0) newErrors.interviewQs = iqErrors.join(" ");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Formatting MCQs
    const formattedMcqs = mcqs
      .filter((m) => m.question)
      .map((m, i) => {
        const optionIds = ["o0", "o1", "o2", "o3"];
        return {
          id: `q-${Date.now()}-${i}`,
          order: i + 1,
          question: m.question,
          options: m.options.map((opt, j) => ({
            id: optionIds[j],
            order: j + 1,
            text: opt || `Option ${j + 1}`,
          })),
          correctOptionId: optionIds[m.correctIndex],
          explanation: "Explanation",
        };
      });

    const formattedIQs = interviewQs
      .filter((iq) => iq.question)
      .map((iq, i) => {
        let parsedHints: string[] = [];
        const rawHints = iq.hints || "";
        if (rawHints.includes("\n")) {
          parsedHints = rawHints.split("\n").map((h: string) => h.trim()).filter(Boolean);
        } else if (rawHints.includes(";")) {
          parsedHints = rawHints.split(";").map((h: string) => h.trim()).filter(Boolean);
        } else if (rawHints.trim()) {
          parsedHints = [rawHints.trim()];
        }
        return {
          order: i + 1,
          question: iq.question,
          hints: parsedHints,
        };
      });

    const cleanTopicDesc = (description || "").replace(/(&nbsp;|\u00a0)/g, " ");

    // If editingTopicId exists, we update
    if (editingTopicId) {
      updateTopicMutation.mutate({
        id: editingTopicId,
        payload: {
          title: title || "Untitled Topic",
          description: cleanTopicDesc,
          videoUrl: videoUploadedUrl || undefined,
          videoFile: !videoUploadedUrl ? videoFile : undefined,
          mcqs: JSON.stringify(formattedMcqs),
          interviewQuestions: JSON.stringify(formattedIQs),
        },
      });
    } else {
      createTopicMutation.mutate({
        courseId: course.id,
        moduleId: activeModuleId,
        title: title || "Untitled Topic",
        description: cleanTopicDesc,
        videoUrl: videoUploadedUrl || undefined,
        videoFile: !videoUploadedUrl ? videoFile : undefined,
        mcqs: JSON.stringify(formattedMcqs),
        interviewQuestions: JSON.stringify(formattedIQs),
      });
    }
  };

  const handleEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setActiveModuleId(topic.moduleId);
    setTitle(topic.title);
    setDescription(topic.description);
    setVideoUploadedUrl(topic.video?.videoUrl || "");

    if (topic.mcqs && topic.mcqs.length > 0) {
      const sortedMcqs = [...topic.mcqs].sort(
        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0),
      );
      setMcqs(
        sortedMcqs.map((m: any) => {
          const sortedOptions = m.options
            ? [...m.options].sort(
              (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0),
            )
            : [];
          const correctIndex = sortedOptions.findIndex(
            (o: any) => o.id === m.correctOptionId,
          );
          return {
            question: m.question,
            options: sortedOptions.map((o: any) => o.text),
            correctIndex: correctIndex >= 0 ? correctIndex : 0,
          };
        }),
      );
    } else {
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    }

    if (topic.interviewQs && topic.interviewQs.length > 0) {
      const sortedIQs = [...topic.interviewQs].sort((a: any, b: any) => {
        if (
          a.order !== undefined &&
          b.order !== undefined &&
          a.order !== b.order
        ) {
          return (a.order ?? 0) - (b.order ?? 0);
        }
        const numA = parseInt(a.question?.match(/^(\d+)\./)?.[1] || "0", 10);
        const numB = parseInt(b.question?.match(/^(\d+)\./)?.[1] || "0", 10);
        if (numA && numB) return numA - numB;
        return 0;
      });
      setInterviewQs(
        sortedIQs.map((iq: any) => {
          let hintsStr = "";
          if (Array.isArray(iq.hints)) {
            const merged: string[] = [];
            iq.hints.forEach((h: string) => {
              const trimmed = (h || "").trim();
              if (!trimmed) return;
              if (merged.length > 0 && /^[a-z]/.test(trimmed)) {
                merged[merged.length - 1] += `, ${trimmed}`;
              } else {
                merged.push(trimmed);
              }
            });
            hintsStr = merged.join("\n");
          } else {
            hintsStr = iq.hints || "";
          }
          return {
            question: iq.question,
            hints: hintsStr,
          };
        }),
      );
    } else {
      setInterviewQs([{ question: "", hints: "" }]);
    }

    setErrors({});
    setIsAddingTopic(true);
  };

  const openNewTopicEditor = (moduleId: string) => {
    setTitle("");
    setDescription("");
    setVideoFile(null);
    setEditingTopicId(null);
    setVideoUploadProgress(null);
    setVideoUploadedUrl(null);
    setVideoUploadError(null);
    setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    setInterviewQs([{ question: "", hints: "" }]);
    setErrors({});
    setActiveModuleId(moduleId);
    setIsAddingTopic(true);
  };

  if (isAddingTopic) {
    const parentModule = modules.find(
      (m: CourseModule) => m.id === activeModuleId,
    );
    return (
      <div className="w-full pb-12  animate-in fade-in">
        <button
          onClick={() => setIsAddingTopic(false)}
          className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </button>
        <div className="mb-6">
          <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1 block">
            Adding to: {parentModule?.title}
          </span>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center">
            {editingTopicId ? "Edit Topic" : "Create New Topic"}
          </h1>
        </div>

        <Card className="p-4 sm:p-6 sm:p-8 space-y-12">
          {/* 1. Basic Info */}
          <section>
            <h2 className="text-base font-bold text-white mb-6 -800 pb-2">
              1. Topic Details
            </h2>
            <div className="grid gap-6">
              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">
                  Topic Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors({ ...errors, title: "" });
                  }}
                  type="text"
                  placeholder="e.g. Intro to Next.js"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <div className={`bg-white text-black rounded-lg overflow-hidden ${errors.description ? "border-2 border-red-500" : ""}`}>
                  <ReactQuill
                    theme="snow"
                    value={description}
                    onChange={(val) => {
                      setDescription(val);
                      if (errors.description) setErrors({ ...errors, description: "" });
                    }}
                    modules={quillModules}
                    placeholder="What will students learn in this topic?"
                  />
                </div>
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 2. Video Upload */}
          <section>
            <div className="flex items-center justify-between pb-2 mb-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <Video className="w-5 h-5 mr-2 text-cyan-400" />
                2. Video Content
              </h2>
              <span className="text-xs font-normal text-zinc-500 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/50">
                Optional
              </span>
            </div>
            {errors.videoFile && (
              <p className="text-red-500 text-xs mb-3">{errors.videoFile}</p>
            )}
            <div
              className={`border-2 border-dashed ${videoUploadError ? "border-red-500 bg-red-500/5" : videoUploadedUrl ? "border-green-500/50 bg-green-950/10" : errors.videoFile ? "border-red-500 bg-red-500/5" : "border-zinc-700 hover:border-cyan-500 bg-zinc-950"} rounded-xl p-10 text-center transition-colors relative group`}
            >
              {/* Hide file input while uploading */}
              {videoUploadProgress === null || videoUploadedUrl ? (
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={(e) => {
                    handleVideoSelect(e.target.files?.[0] || null);
                    if (errors.videoFile)
                      setErrors({ ...errors, videoFile: "" });
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              ) : null}

              {/* State: Upload complete */}
              {videoUploadedUrl ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-white font-medium text-xs sm:text-[13px]">
                    {videoFile?.name || "Video Attached"}
                  </p>
                  <p className="text-green-400 text-[11px] sm:text-xs mt-1">
                    ✅ Uploaded to cloud — Save will be instant!
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoUploadedUrl(null);
                      setVideoFile(null);
                      setVideoUploadProgress(null);
                    }}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline z-10 cursor-pointer"
                  >
                    Remove Video
                  </button>
                </div>
              ) : videoUploadProgress !== null && !videoUploadError ? (
                /* State: Uploading with progress */
                <div className="flex flex-col items-center w-full">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                  <p className="text-white font-medium text-xs sm:text-[13px] mb-1">
                    {videoFile?.name}
                  </p>
                  <p className="text-cyan-400 text-[11px] sm:text-xs mb-3">
                    Uploading to cloud... {videoUploadProgress}%
                  </p>
                  <div className="w-full max-w-sm bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-2">
                    Please wait, do not close this page
                  </p>
                </div>
              ) : videoUploadError ? (
                /* State: Upload error */
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium text-xs sm:text-[13px]">
                    {videoUploadError}
                  </p>
                  <p className="text-zinc-500 text-[11px] sm:text-xs mt-1">
                    Click to try again
                  </p>
                </div>
              ) : (
                /* State: No file selected */
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-zinc-500 group-hover:text-cyan-400 transition-colors mb-3" />
                  <p className="text-zinc-300 font-medium text-xs sm:text-[13px] mb-1">
                    Click or drag video to upload (Optional)
                  </p>
                  <p className="text-zinc-500 text-[11px] sm:text-xs">
                    MP4, WebM up to 1GB — leave empty if not needed
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 3. MCQs */}
          <section>
            <div className="flex items-center justify-between -800 pb-2 mb-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-cyan-400" />
                3. Multiple Choice Questions
              </h2>
              <button
                onClick={() =>
                  setMcqs([
                    ...mcqs,
                    {
                      question: "",
                      options: ["", "", "", ""],
                      correctIndex: 0,
                    },
                  ])
                }
                className="text-[13px] text-cyan-400 hover:text-cyan-300 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </button>
            </div>

            {errors.mcqs && (
              <p className="text-red-500 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">
                {errors.mcqs}
              </p>
            )}

            <div className="space-y-6">
              {mcqs.map((mcq, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-zinc-950 border border-zinc-800 p-4 sm:p-6 rounded-xl relative"
                >
                  {mcqs.length > 1 && (
                    <button
                      onClick={() => setMcqs(mcqs.filter((_, i) => i !== qIdx))}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="mb-4 pr-8">
                    <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">
                      Question {qIdx + 1}
                    </label>
                    <Input
                      value={mcq.question}
                      onChange={(e) => {
                        const newMcqs = [...mcqs];
                        newMcqs[qIdx].question = e.target.value;
                        setMcqs(newMcqs);
                      }}
                      type="text"
                      placeholder="e.g. What is the Virtual DOM?"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {mcq.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={mcq.correctIndex === oIdx}
                          onChange={() => {
                            const newMcqs = [...mcqs];
                            newMcqs[qIdx].correctIndex = oIdx;
                            setMcqs(newMcqs);
                          }}
                          className="w-4 h-4 text-cyan-600 bg-zinc-800 border-zinc-700 focus:ring-cyan-600 focus:ring-2 cursor-pointer"
                        />
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const newMcqs = [...mcqs];
                            newMcqs[qIdx].options[oIdx] = e.target.value;
                            setMcqs(newMcqs);
                          }}
                          type="text"
                          placeholder={`Option ${oIdx + 1}`}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Interview Questions */}
          <section>
            <div className="flex items-center justify-between -800 pb-2 mb-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-cyan-400" />
                4. Interview Questions
              </h2>
              <button
                onClick={() =>
                  setInterviewQs([...interviewQs, { question: "", hints: "" }])
                }
                className="text-[13px] text-cyan-400 hover:text-cyan-300 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </button>
            </div>

            {errors.interviewQs && (
              <p className="text-red-500 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">
                {errors.interviewQs}
              </p>
            )}

            <div className="space-y-4">
              {interviewQs.map((iq, i) => (
                <div
                  key={i}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex gap-4 items-start relative"
                >
                  <div className="flex-1 space-y-3 pr-8">
                    <Input
                      value={iq.question}
                      onChange={(e) => {
                        const newIQs = [...interviewQs];
                        newIQs[i].question = e.target.value;
                        setInterviewQs(newIQs);
                      }}
                      type="text"
                      placeholder="Interview Question (e.g. Explain Context API vs Redux)"
                    />
                    <Textarea
                      value={iq.hints}
                      onChange={(e) => {
                        const newIQs = [...interviewQs];
                        newIQs[i].hints = e.target.value;
                        setInterviewQs(newIQs);
                      }}
                      rows={2}
                      placeholder="Hints / Key points (press Enter for multiple bullet points, or write full explanation sentence)"
                      className="text-xs sm:text-[13px]"
                    />
                  </div>
                  {interviewQs.length > 1 && (
                    <button
                      onClick={() =>
                        setInterviewQs(
                          interviewQs.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-4 right-4 text-zinc-500 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
            <button
              onClick={() => setIsAddingTopic(false)}
              disabled={createTopicMutation.isPending || updateTopicMutation.isPending}
              className="px-4 py-2 text-[13px] bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTopic}
              disabled={
                createTopicMutation.isPending ||
                updateTopicMutation.isPending ||
                (videoUploadProgress !== null &&
                  !videoUploadedUrl &&
                  !videoUploadError)
              }
              className="inline-flex items-center justify-center px-5 py-2 text-[13px] bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(8,145,178,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTopicMutation.isPending ||
                updateTopicMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : videoUploadProgress !== null &&
                !videoUploadedUrl &&
                !videoUploadError ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wait for upload...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingTopicId ? "Update Topic" : "Save Topic"}
                </>
              )}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pb-12  animate-in fade-in">
      <Link
        href="/courses"
        className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course Overview
      </Link>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2 flex items-center">
            {course.title}
            <button
              onClick={() => setIsEditingCourseInfo(true)}
              className="ml-3 p-1.5 text-zinc-400 hover:text-cyan-400 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </h1>
          <p className="text-zinc-400">Curriculum Builder</p>
        </div>
        <button
          onClick={() => setIsAddingModule(true)}
          className="flex items-center justify-center px-4 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors w-full sm:w-auto"
        >
          <FolderPlus className="w-5 h-5 mr-2 text-cyan-400" />
          Add New Module
        </button>
      </div>

      {isEditingCourseInfo && (
        <Card className="p-6 mb-8 border-cyan-900/50 relative">
          <button
            onClick={() => setIsEditingCourseInfo(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-white mb-4">
            Edit Course Information
          </h3>
          <form onSubmit={handleUpdateCourseInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Title
              </label>
              <Input
                {...courseInfoForm.register("title")}
                className={
                  courseInfoForm.formState.errors.title ? "border-red-500" : ""
                }
              />
              {courseInfoForm.formState.errors.title && (
                <p className="text-xs text-red-500 mt-1">
                  {courseInfoForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Description
              </label>
              <Textarea
                {...courseInfoForm.register("description")}
                className={
                  courseInfoForm.formState.errors.description
                    ? "border-red-500"
                    : ""
                }
              />
              {courseInfoForm.formState.errors.description && (
                <p className="text-xs text-red-500 mt-1">
                  {courseInfoForm.formState.errors.description.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Course Thumbnail
              </label>
              {(thumbnailPreviewUrl || course.thumbnail) && (
                <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 relative mb-3 group">
                  <img
                    src={thumbnailPreviewUrl || `${course.thumbnail}${course.updatedAt ? `?t=${new Date(course.updatedAt).getTime()}` : ''}`}
                    alt="Course Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  {thumbnailPreviewUrl && (
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-cyan-400 text-zinc-950 font-bold text-xs shadow-md">
                      New Thumbnail Selected
                    </div>
                  )}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={updateCourseMutation.isPending}
                onChange={(e) =>
                  handleThumbnailChange(e.target.files?.[0] || null)
                }
                className="w-full text-xs sm:text-[13px] text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900 cursor-pointer disabled:opacity-50"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Recommended 16:9 ratio. Choose a new image file to update.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={updateCourseMutation.isPending} className="inline-flex items-center">
                {updateCourseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAddingModule && (
        <div className="bg-zinc-900 border border-cyan-900/50 rounded-xl p-4 sm:p-6 mb-8 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4">
            Create New Module
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              autoFocus
              value={newModuleTitle}
              disabled={createModuleMutation.isPending}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !createModuleMutation.isPending && handleSaveModule()}
              placeholder="e.g. Module 3: State Management"
              className="flex-1"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsAddingModule(false)}
                disabled={createModuleMutation.isPending}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-xs sm:text-[13px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModule}
                disabled={createModuleMutation.isPending || !newModuleTitle.trim()}
                className="inline-flex items-center justify-center px-6 py-2 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold font-medium rounded-lg transition-colors cursor-pointer text-xs sm:text-[13px] disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
              >
                {createModuleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {modules.length > 0 && (
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-xs sm:text-[13px] text-zinc-400 font-medium">
              {modules.length} {modules.length === 1 ? "Module" : "Modules"} • {modules.reduce((acc: number, m: any) => acc + (m.topics?.length || 0), 0)} Topics
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="text-zinc-400 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-zinc-400 hover:text-cyan-400 transition-colors font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}

        {modules.length > 0 ? (
          modules.map((module: any, mIdx: number) => {
            const moduleTopics = module.topics || [];
            const isExpanded = expandedModules[module.id] ?? true;

            return (
              <div
                key={module.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors hover:border-zinc-700/80"
              >
                <div
                  onClick={() => {
                    if (editingModuleId !== module.id) {
                      toggleModule(module.id);
                    }
                  }}
                  className="bg-zinc-950/60 hover:bg-zinc-950/90 transition-colors p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 w-full md:w-auto">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="text-zinc-600 hover:text-zinc-400 shrink-0 cursor-grab"
                      title="Reorder module"
                    >
                      <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase tracking-wider">
                          Module {mIdx + 1}
                        </span>
                        <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">
                          • {moduleTopics.length} {moduleTopics.length === 1 ? "Topic" : "Topics"}
                        </span>
                      </div>

                      {editingModuleId === module.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2 mt-1"
                        >
                          <Input
                            autoFocus
                            value={editingModuleTitle}
                            disabled={updateModuleMutation.isPending}
                            onChange={(e) =>
                              setEditingModuleTitle(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editingModuleTitle.trim() && !updateModuleMutation.isPending) {
                                updateModuleMutation.mutate({
                                  id: module.id,
                                  title: editingModuleTitle.trim(),
                                });
                              }
                            }}
                            className="h-8 text-xs sm:text-sm flex-1 min-w-[180px]"
                          />
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateModuleMutation.mutate({
                                  id: module.id,
                                  title: editingModuleTitle.trim(),
                                })
                              }
                              disabled={
                                !editingModuleTitle.trim() ||
                                updateModuleMutation.isPending
                              }
                              className="bg-cyan-500 hover:bg-cyan-600 text-zinc-950 text-xs px-2.5 h-8 inline-flex items-center"
                            >
                              {updateModuleMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={updateModuleMutation.isPending}
                              onClick={() => setEditingModuleId(null)}
                              className="text-xs px-2 h-8"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <h2 className="text-sm sm:text-base font-bold text-white break-words">
                          {module.title}
                        </h2>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-between md:justify-end pt-2 md:pt-0 border-t border-zinc-800/60 md:border-t-0 w-full md:w-auto">
                    {/* Module PDF Notes badge / upload button */}
                    {module.pdfUrl ? (
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/70 border border-cyan-800/60 rounded-md text-[11px] text-cyan-300">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <a href={module.pdfUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">
                          Notes PDF
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveModulePdf(module.id)}
                          className="text-zinc-500 hover:text-red-400 ml-1 cursor-pointer p-0.5 rounded hover:bg-zinc-800 transition-colors"
                          title="Remove PDF"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : uploadingModulePdfId === module.id ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/60 border border-cyan-700/80 rounded-md text-[11px] text-cyan-300"
                      >
                        <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                        <span className="font-semibold whitespace-nowrap">Uploading {modulePdfProgress ?? 0}%</span>
                        <div className="w-12 bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700 ml-0.5">
                          <div
                            className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${modulePdfProgress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <label
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 rounded-md text-[11px] text-zinc-300 hover:text-cyan-300 cursor-pointer transition-colors"
                        title="Upload Module Notes / Handbook (PDF)"
                      >
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Add Module PDF</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            handleModulePdfSelect(module.id, f);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(module.id);
                        setEditingModuleTitle(module.title);
                      }}
                      className="p-1.5 sm:p-2 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
                      title="Edit Module"
                    >
                      <Edit className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}
                      disabled={deleteModuleMutation.isPending}
                      className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-zinc-800/80 flex items-center justify-center text-zinc-400 ml-1">
                      <ChevronDown
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-3.5 sm:p-5 space-y-3 bg-zinc-900 border-t border-zinc-800/70">
                    {moduleTopics.length > 0 ? (
                      moduleTopics.map((topic: any, tIdx: number) => (
                        <div
                          key={topic.id}
                          className="group bg-zinc-950 border border-zinc-800 rounded-lg p-3 sm:p-4 flex items-center justify-between hover:border-zinc-700 transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-medium text-xs sm:text-[13px] shrink-0">
                              {tIdx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors truncate sm:whitespace-normal">
                                {topic.title}
                              </h3>
                              <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 text-[11px] sm:text-xs text-zinc-500">
                                {topic.video && (
                                  <span className="flex items-center">
                                    <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-cyan-400/80" /> Video
                                  </span>
                                )}
                                {topic.mcqs?.length > 0 && (
                                  <span className="flex items-center">
                                    <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-cyan-400/80" />{" "}
                                    {topic.mcqs.length} MCQs
                                  </span>
                                )}
                                {((topic.interviewQs && topic.interviewQs.length > 0) || (topic.interviewQuestions && topic.interviewQuestions.length > 0)) && (
                                  <span className="flex items-center">
                                    <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-cyan-400/80" />{" "}
                                    {(topic.interviewQs || topic.interviewQuestions).length} Interview Qs
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTopic(topic);
                              }}
                              className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                              title="Edit Topic"
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTopic(topic.id);
                              }}
                              disabled={deleteTopicMutation.isPending}
                              className="p-1.5 sm:p-2 bg-zinc-800 hover:bg-red-900 hover:text-red-300 text-zinc-400 rounded-lg transition-colors"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 sm:p-6 text-[13px] text-zinc-500 italic border border-dashed border-zinc-800 rounded-lg">
                        No topics in this module. Click "Add Topic" to create one.
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewTopicEditor(module.id);
                      }}
                      className="w-full mt-3 flex items-center justify-center p-2.5 sm:p-3 border border-dashed border-zinc-700 hover:border-cyan-800 hover:bg-cyan-950/20 text-zinc-400 hover:text-cyan-400 rounded-lg transition-colors text-xs sm:text-[13px] font-medium cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Topic to {module.title.split(":")[0]}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <FolderPlus className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">
              Your curriculum is empty
            </h3>
            <p className="text-zinc-500 mb-6">
              Start by creating your first module to organize your course
              content.
            </p>
            <button
              onClick={() => setIsAddingModule(true)}
              className="inline-flex items-center px-3 py-1.5 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold text-xs sm:text-[13px] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Module
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!moduleToDelete}
        onClose={() => setModuleToDelete(null)}
        onConfirm={() =>
          moduleToDelete && deleteModuleMutation.mutate(moduleToDelete)
        }
        title="Delete Module"
        description="Are you sure you want to delete this module and all its topics? This action cannot be undone."
        isLoading={deleteModuleMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        onConfirm={() =>
          topicToDelete && deleteTopicMutation.mutate(topicToDelete)
        }
        title="Delete Topic"
        description="Are you sure you want to delete this topic? This action cannot be undone."
        isLoading={deleteTopicMutation.isPending}
      />
    </div>
  );
}
