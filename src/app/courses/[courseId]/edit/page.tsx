"use client";

import { use, useState, useEffect } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ShieldAlert, ArrowLeft, Plus, UploadCloud, Video, HelpCircle, MessageSquare, Trash2, Save, CheckCircle2, Edit, FolderPlus, GripVertical, FileText, BookOpen, Edit3, X, Loader2 } from "lucide-react";
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

export default function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', resolvedParams.courseId],
    queryFn: () => coursesService.getCourseById(resolvedParams.courseId),
    enabled: !!resolvedParams.courseId,
  });

  const [isEditingCourseInfo, setIsEditingCourseInfo] = useState(false);
  const [courseThumbnailFile, setCourseThumbnailFile] = useState<File | null>(null);

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
    mutationFn: (data: any) => coursesService.updateCourse(resolvedParams.courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] }); // Invalidate global list to show new thumbnail
      setIsEditingCourseInfo(false);
    }
  });

  const handleUpdateCourseInfo = courseInfoForm.handleSubmit((data: CourseInfoValues) => {
    updateCourseMutation.mutate({
      title: data.title,
      description: data.description,
      thumbnailFile: courseThumbnailFile
    });
  });

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const createModuleMutation = useMutation({
    mutationFn: (data: { courseId: string; title: string; order: number }) => modulesService.createModule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] }); // Update counts on main page
      setIsAddingModule(false);
      setNewModuleTitle("");
    }
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => modulesService.deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setModuleToDelete(null);
    }
  });

  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const handleDeleteModule = (moduleId: string) => {
    setModuleToDelete(moduleId);
  };

  const createTopicMutation = useMutation({
    mutationFn: (data: any) => topicsService.createTopic(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsAddingTopic(false);
      setEditingTopicId(null);
      setActiveModuleId(null);
      // Reset form
      setTitle(""); setDescription(""); setVideoFile(null); setPdfFile(null); setCheatsheetFile(null);
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      setInterviewQs([{ question: "", hints: "" }]);
    }
  });

  const updateTopicMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => topicsService.updateTopic(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsAddingTopic(false);
      setEditingTopicId(null);
      setActiveModuleId(null);
      // Reset form
      setTitle(""); setDescription(""); setVideoFile(null); setPdfFile(null); setCheatsheetFile(null);
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
      setInterviewQs([{ question: "", hints: "" }]);
    }
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: string) => topicsService.deleteTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setTopicToDelete(null);
    }
  });

  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);

  const handleDeleteTopic = (topicId: string) => {
    setTopicToDelete(topicId);
  };

  const updateModuleMutation = useMutation({
    mutationFn: (data: { id: string, title: string }) => modulesService.updateModule(data.id, { title: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', resolvedParams.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditingModuleId(null);
      setEditingModuleTitle("");
    }
  });

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");

  // Topic Editor State
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [cheatsheetFile, setCheatsheetFile] = useState<File | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);

  // Pre-upload state (upload on file select)
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [videoUploadedUrl, setVideoUploadedUrl] = useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [pdfUploadedUrl, setPdfUploadedUrl] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  const [cheatsheetUploadProgress, setCheatsheetUploadProgress] = useState<number | null>(null);
  const [cheatsheetUploadedUrl, setCheatsheetUploadedUrl] = useState<string | null>(null);
  const [cheatsheetUploadError, setCheatsheetUploadError] = useState<string | null>(null);

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
    } catch (err: any) {
      setVideoUploadError(err?.response?.data?.message || 'Video upload failed');
      setVideoUploadProgress(null);
    }
  };

  // Handle PDF file selection → immediately start uploading
  const handlePdfSelect = async (file: File | null) => {
    if (!file) return;
    setPdfFile(file);
    setPdfUploadProgress(0);
    setPdfUploadError(null);
    setPdfUploadedUrl(null);
    try {
      const url = await topicsService.uploadPdf(file, (percent) => {
        setPdfUploadProgress(percent);
      });
      setPdfUploadedUrl(url);
      setPdfUploadProgress(100);
    } catch (err: any) {
      setPdfUploadError(err?.response?.data?.message || 'PDF upload failed');
      setPdfUploadProgress(null);
    }
  };

  // Handle Cheatsheet selection → immediately start uploading using PDF endpoint
  const handleCheatsheetSelect = async (file: File | null) => {
    if (!file) return;
    setCheatsheetFile(file);
    setCheatsheetUploadProgress(0);
    setCheatsheetUploadError(null);
    setCheatsheetUploadedUrl(null);
    try {
      const url = await topicsService.uploadPdf(file, (percent) => {
        setCheatsheetUploadProgress(percent);
      });
      setCheatsheetUploadedUrl(url);
      setCheatsheetUploadProgress(100);
    } catch (err: any) {
      setCheatsheetUploadError(err?.response?.data?.message || 'Cheatsheet upload failed');
      setCheatsheetUploadProgress(null);
    }
  };

  // MCQ State
  const [mcqs, setMcqs] = useState<MCQInput[]>([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);

  // Interview Q State
  const [interviewQs, setInterviewQs] = useState<InterviewQInput[]>([{ question: "", hints: "" }]);

  // Form Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  if (isLoading) return <div className="text-white p-8">Loading course details...</div>;
  if (!course) return <div className="text-white p-8">Course not found.</div>;

  const modules = course.modules || [];

  const handleSaveModule = () => {
    if (!newModuleTitle.trim()) return;
    createModuleMutation.mutate({
      courseId: course.id,
      title: newModuleTitle,
      order: modules.length + 1
    });
  };

  const handleSaveTopic = () => {
    if (!activeModuleId) return;

    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Topic title is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!videoFile && !editingTopicId) newErrors.videoFile = "Video file is required.";

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

    if (!pdfFile && !cheatsheetFile && !editingTopicId) {
      newErrors.attachments = "Please upload at least one attachment (PDF or Cheatsheet).";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Formatting MCQs
    const formattedMcqs = mcqs.filter(m => m.question).map((m, i) => {
      const optionIds = ['o0', 'o1', 'o2', 'o3'];
      return {
        id: `q-${Date.now()}-${i}`,
        question: m.question,
        options: m.options.map((opt, j) => ({ id: optionIds[j], text: opt || `Option ${j + 1}` })),
        correctOptionId: optionIds[m.correctIndex],
        explanation: "Explanation"
      };
    });

    const formattedIQs = interviewQs.filter(iq => iq.question).map(iq => ({
      question: iq.question,
      hints: iq.hints.split(",").map(h => h.trim())
    }));

    // If editingTopicId exists, we update
    if (editingTopicId) {
      updateTopicMutation.mutate({
        id: editingTopicId,
        payload: {
          title: title || "Untitled Topic",
          description: description || "",
          videoUrl: videoUploadedUrl || undefined,
          pdfUrl: pdfUploadedUrl || undefined,
          cheatsheetUrl: cheatsheetUploadedUrl || undefined,
          videoFile: !videoUploadedUrl ? videoFile : undefined,
          pdfFile: !pdfUploadedUrl ? pdfFile : undefined,
          cheatsheetFile: !cheatsheetUploadedUrl ? cheatsheetFile : undefined,
          mcqs: JSON.stringify(formattedMcqs),
          interviewQuestions: JSON.stringify(formattedIQs)
        }
      });
    } else {
      createTopicMutation.mutate({
        courseId: course.id,
        moduleId: activeModuleId,
        title: title || "Untitled Topic",
        description: description || "",
        videoUrl: videoUploadedUrl || undefined,
        pdfUrl: pdfUploadedUrl || undefined,
        cheatsheetUrl: cheatsheetUploadedUrl || undefined,
        videoFile: !videoUploadedUrl ? videoFile : undefined,
        pdfFile: !pdfUploadedUrl ? pdfFile : undefined,
        cheatsheetFile: !cheatsheetUploadedUrl ? cheatsheetFile : undefined,
        mcqs: JSON.stringify(formattedMcqs),
        interviewQuestions: JSON.stringify(formattedIQs)
      });
    }
  };

  const handleEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setActiveModuleId(topic.moduleId);
    setTitle(topic.title);
    setDescription(topic.description);
    setPdfUploadedUrl(topic.pdfUrl || "");
    setCheatsheetUploadedUrl(topic.cheatsheetUrl || "");
    setVideoUploadedUrl(topic.video?.videoUrl || "");

    if (topic.mcqs && topic.mcqs.length > 0) {
      setMcqs(topic.mcqs.map((m: any) => ({
        question: m.question,
        options: m.options.map((o: any) => o.text),
        correctIndex: 0 // Would need to calculate properly
      })));
    } else {
      setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    }

    if (topic.interviewQs && topic.interviewQs.length > 0) {
      setInterviewQs(topic.interviewQs.map((iq: any) => ({
        question: iq.question,
        hints: iq.hints.join(", ")
      })));
    } else {
      setInterviewQs([{ question: "", hints: "" }]);
    }

    setErrors({});
    setIsAddingTopic(true);
  };

  const openNewTopicEditor = (moduleId: string) => {
    setTitle(""); setDescription(""); setVideoFile(null); setEditingTopicId(null);
    setPdfFile(null); setCheatsheetFile(null);
    setVideoUploadProgress(null); setVideoUploadedUrl(null); setVideoUploadError(null);
    setPdfUploadProgress(null); setPdfUploadedUrl(null); setPdfUploadError(null);
    setCheatsheetUploadProgress(null); setCheatsheetUploadedUrl(null); setCheatsheetUploadError(null);
    setMcqs([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
    setInterviewQs([{ question: "", hints: "" }]);
    setErrors({});
    setActiveModuleId(moduleId);
    setIsAddingTopic(true);
  };

  if (isAddingTopic) {
    const parentModule = modules.find((m: CourseModule) => m.id === activeModuleId);
    return (
      <div className="w-full pb-12  animate-in fade-in">
        <button onClick={() => setIsAddingTopic(false)} className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </button>
        <div className="mb-6">
          <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1 block">Adding to: {parentModule?.title}</span>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white flex items-center">
            {editingTopicId ? "Edit Topic" : "Create New Topic"}
          </h1>
        </div>

        <Card className="p-4 sm:p-6 sm:p-8 space-y-12">
          {/* 1. Basic Info */}
          <section>
            <h2 className="text-base font-bold text-white mb-6 -800 pb-2">1. Topic Details</h2>
            <div className="grid gap-6">
              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Topic Title</label>
                <Input value={title} onChange={e => { setTitle(e.target.value); if (errors.title) setErrors({ ...errors, title: "" }); }} type="text" placeholder="e.g. Intro to Next.js" className={errors.title ? "border-red-500" : ""} />
                {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Description</label>
                <Textarea value={description} onChange={e => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: "" }); }} rows={3} placeholder="What will students learn in this topic?" className={errors.description ? "border-red-500" : ""} />
                {errors.description && <p className="text-red-500 text-xs mt-1.5">{errors.description}</p>}
              </div>
            </div>
          </section>

          {/* 2. Video Upload */}
          <section>
            <h2 className="text-base font-bold text-white mb-6 -800 pb-2 flex items-center">
              <Video className="w-5 h-5 mr-2 text-cyan-400" />
              2. Video Content
            </h2>
            {errors.videoFile && <p className="text-red-500 text-xs mb-3">{errors.videoFile}</p>}
            <div className={`border-2 border-dashed ${videoUploadError ? "border-red-500 bg-red-500/5" : videoUploadedUrl ? "border-green-500/50 bg-green-950/10" : errors.videoFile ? "border-red-500 bg-red-500/5" : "border-zinc-700 hover:border-cyan-500 bg-zinc-950"} rounded-xl p-10 text-center transition-colors relative group`}>
              {/* Hide file input while uploading */}
              {videoUploadProgress === null || videoUploadedUrl ? (
                <input
                  type="file"
                  accept="video/mp4,video/x-m4v,video/*"
                  onChange={(e) => { handleVideoSelect(e.target.files?.[0] || null); if (errors.videoFile) setErrors({ ...errors, videoFile: "" }); }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              ) : null}

              {/* State: Upload complete */}
              {videoUploadedUrl ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-white font-medium text-xs sm:text-[13px]">{videoFile?.name}</p>
                  <p className="text-green-400 text-[11px] sm:text-xs mt-1">✅ Uploaded to cloud — Save will be instant!</p>
                </div>
              ) : videoUploadProgress !== null && !videoUploadError ? (
                /* State: Uploading with progress */
                <div className="flex flex-col items-center w-full">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
                  <p className="text-white font-medium text-xs sm:text-[13px] mb-1">{videoFile?.name}</p>
                  <p className="text-cyan-400 text-[11px] sm:text-xs mb-3">Uploading to cloud... {videoUploadProgress}%</p>
                  <div className="w-full max-w-sm bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-zinc-500 text-[10px] mt-2">Please wait, do not close this page</p>
                </div>
              ) : videoUploadError ? (
                /* State: Upload error */
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium text-xs sm:text-[13px]">{videoUploadError}</p>
                  <p className="text-zinc-500 text-[11px] sm:text-xs mt-1">Click to try again</p>
                </div>
              ) : (
                /* State: No file selected */
                <div className="flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-zinc-500 group-hover:text-cyan-400 transition-colors mb-3" />
                  <p className="text-zinc-300 font-medium text-xs sm:text-[13px] mb-1">Click or drag video to upload</p>
                  <p className="text-zinc-500 text-[11px] sm:text-xs">MP4, WebM up to 1GB — uploads immediately</p>
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
              <button onClick={() => setMcqs([...mcqs, { question: "", options: ["", "", "", ""], correctIndex: 0 }])} className="text-[13px] text-cyan-400 hover:text-cyan-300 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </button>
            </div>

            {errors.mcqs && <p className="text-red-500 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">{errors.mcqs}</p>}

            <div className="space-y-6">
              {mcqs.map((mcq, qIdx) => (
                <div key={qIdx} className="bg-zinc-950 border border-zinc-800 p-4 sm:p-6 rounded-xl relative">
                  {mcqs.length > 1 && (
                    <button onClick={() => setMcqs(mcqs.filter((_, i) => i !== qIdx))} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="mb-4 pr-8">
                    <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">Question {qIdx + 1}</label>
                    <Input
                      value={mcq.question}
                      onChange={e => { const newMcqs = [...mcqs]; newMcqs[qIdx].question = e.target.value; setMcqs(newMcqs); }}
                      type="text" placeholder="e.g. What is the Virtual DOM?"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {mcq.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={mcq.correctIndex === oIdx}
                          onChange={() => { const newMcqs = [...mcqs]; newMcqs[qIdx].correctIndex = oIdx; setMcqs(newMcqs); }}
                          className="w-4 h-4 text-cyan-600 bg-zinc-800 border-zinc-700 focus:ring-cyan-600 focus:ring-2 cursor-pointer"
                        />
                        <Input
                          value={opt}
                          onChange={e => { const newMcqs = [...mcqs]; newMcqs[qIdx].options[oIdx] = e.target.value; setMcqs(newMcqs); }}
                          type="text" placeholder={`Option ${oIdx + 1}`} className="flex-1"
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
              <button onClick={() => setInterviewQs([...interviewQs, { question: "", hints: "" }])} className="text-[13px] text-cyan-400 hover:text-cyan-300 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </button>
            </div>

            {errors.interviewQs && <p className="text-red-500 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">{errors.interviewQs}</p>}

            <div className="space-y-4">
              {interviewQs.map((iq, i) => (
                <div key={i} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex gap-4 items-start relative">
                  <div className="flex-1 space-y-3 pr-8">
                    <Input
                      value={iq.question}
                      onChange={e => { const newIQs = [...interviewQs]; newIQs[i].question = e.target.value; setInterviewQs(newIQs); }}
                      type="text" placeholder="Interview Question (e.g. Explain Context API vs Redux)"
                    />
                    <Input
                      value={iq.hints}
                      onChange={e => { const newIQs = [...interviewQs]; newIQs[i].hints = e.target.value; setInterviewQs(newIQs); }}
                      type="text" placeholder="Hints (comma separated)"
                    />
                  </div>
                  {interviewQs.length > 1 && (
                    <button onClick={() => setInterviewQs(interviewQs.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-zinc-500 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 5. Attachments */}
          <section>
            <div className="flex items-center justify-between  pb-2 mb-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <FileText className="w-5 h-5 mr-2 text-cyan-400" />
                5. Attachments & Cheatsheets
              </h2>
            </div>

            {errors.attachments && <p className="text-red-500 text-xs mb-4 p-3 bg-red-500/10 rounded-lg">{errors.attachments}</p>}

            <div className="grid gap-6 md:grid-cols-2">
              <div className={`border-2 border-dashed ${pdfUploadedUrl ? "border-green-500/50 bg-green-950/10" : errors.attachments ? "border-red-500 bg-red-500/5" : "border-zinc-700 hover:border-cyan-500 bg-zinc-950"} rounded-xl p-8 text-center transition-colors relative group`}>
                {(pdfUploadProgress === null || pdfUploadedUrl) && (
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => { handlePdfSelect(e.target.files?.[0] || null); if (errors.attachments) setErrors({ ...errors, attachments: "" }); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                )}
                {pdfUploadedUrl ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-white font-medium text-[13px] truncate w-full px-4">{pdfFile?.name || pdfUploadedUrl?.split('/').pop()}</p>
                    <p className="text-green-400 text-[11px] mt-1">✅ Uploaded to cloud</p>
                  </div>
                ) : pdfUploadProgress !== null && !pdfUploadError ? (
                  <div className="flex flex-col items-center w-full">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                    <p className="text-white font-medium text-[13px]">{pdfFile?.name}</p>
                    <p className="text-cyan-400 text-[11px] mt-1">Uploading... {pdfUploadProgress}%</p>
                    <div className="w-full max-w-[200px] bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pdfUploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="w-10 h-10 text-zinc-500 group-hover:text-cyan-400 transition-colors mb-2" />
                    <p className="text-zinc-300 font-medium text-[13px] mb-1">Upload PDF Note</p>
                    <p className="text-zinc-500 text-[11px]">.pdf format — uploads immediately</p>
                  </div>
                )}
              </div>

              <div className={`border-2 border-dashed ${cheatsheetUploadedUrl ? "border-green-500/50 bg-green-950/10" : errors.attachments ? "border-red-500 bg-red-500/5" : "border-zinc-700 hover:border-cyan-500 bg-zinc-950"} rounded-xl p-8 text-center transition-colors relative group`}>
                {(cheatsheetUploadProgress === null || cheatsheetUploadedUrl) && (
                  <input
                    type="file"
                    accept=".pdf,.md,.txt"
                    onChange={(e) => { handleCheatsheetSelect(e.target.files?.[0] || null); if (errors.attachments) setErrors({ ...errors, attachments: "" }); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                )}
                {cheatsheetUploadedUrl ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
                    <p className="text-white font-medium text-[13px] truncate w-full px-4">{cheatsheetFile?.name || cheatsheetUploadedUrl?.split('/').pop()}</p>
                    <p className="text-green-400 text-[11px] mt-1">✅ Uploaded to cloud</p>
                  </div>
                ) : cheatsheetUploadProgress !== null && !cheatsheetUploadError ? (
                  <div className="flex flex-col items-center w-full">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                    <p className="text-white font-medium text-[13px]">{cheatsheetFile?.name}</p>
                    <p className="text-cyan-400 text-[11px] mt-1">Uploading... {cheatsheetUploadProgress}%</p>
                    <div className="w-full max-w-[200px] bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${cheatsheetUploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <BookOpen className="w-10 h-10 text-zinc-500 group-hover:text-cyan-400 transition-colors mb-2" />
                    <p className="text-zinc-300 font-medium text-[13px] mb-1">Upload Cheatsheet</p>
                    <p className="text-zinc-500 text-[11px]">.pdf, .md, .txt — uploads immediately</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-6 ">
            <button onClick={() => setIsAddingTopic(false)} className="px-4 py-2 text-[13px] bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSaveTopic}
              disabled={createTopicMutation.isPending || updateTopicMutation.isPending || (videoUploadProgress !== null && !videoUploadedUrl && !videoUploadError) || (pdfUploadProgress !== null && !pdfUploadedUrl && !pdfUploadError) || (cheatsheetUploadProgress !== null && !cheatsheetUploadedUrl && !cheatsheetUploadError)}
              className="inline-flex items-center justify-center px-4 py-2 text-[13px] bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold font-medium rounded-lg transition-colors shadow-[0_0_20px_rgba(8,145,178,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createTopicMutation.isPending || updateTopicMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : ((videoUploadProgress !== null && !videoUploadedUrl && !videoUploadError) || (pdfUploadProgress !== null && !pdfUploadedUrl && !pdfUploadError) || (cheatsheetUploadProgress !== null && !cheatsheetUploadedUrl && !cheatsheetUploadError)) ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wait for upload...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {editingTopicId ? "Update Topic" : "Save Topic"}</>
              )}
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pb-12  animate-in fade-in">
      <Link href="/courses" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course Overview
      </Link>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2 flex items-center">
            {course.title}
            <button onClick={() => setIsEditingCourseInfo(true)} className="ml-3 p-1.5 text-zinc-400 hover:text-cyan-400 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
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
          <button onClick={() => setIsEditingCourseInfo(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-white mb-4">Edit Course Information</h3>
          <form onSubmit={handleUpdateCourseInfo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
              <Input {...courseInfoForm.register("title")} className={courseInfoForm.formState.errors.title ? "border-red-500" : ""} />
              {courseInfoForm.formState.errors.title && <p className="text-xs text-red-500 mt-1">{courseInfoForm.formState.errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <Textarea {...courseInfoForm.register("description")} className={courseInfoForm.formState.errors.description ? "border-red-500" : ""} />
              {courseInfoForm.formState.errors.description && <p className="text-xs text-red-500 mt-1">{courseInfoForm.formState.errors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Update Thumbnail (Optional)</label>
              <input type="file" accept="image/*" onChange={e => setCourseThumbnailFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-950 file:text-cyan-400 hover:file:bg-cyan-900" />
            </div>
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAddingModule && (
        <div className="bg-zinc-900 border border-cyan-900/50 rounded-xl p-4 sm:p-6 mb-8 shadow-lg">
          <h3 className="text-sm font-semibold text-white mb-4">Create New Module</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              autoFocus
              value={newModuleTitle}
              onChange={e => setNewModuleTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveModule()}
              placeholder="e.g. Module 3: State Management"
              className="flex-1"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsAddingModule(false)} className="px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors text-xs sm:text-[13px] cursor-pointer">Cancel</button>
              <button onClick={handleSaveModule} className="px-6 py-2 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold font-medium rounded-lg transition-colors cursor-pointer text-xs sm:text-[13px]">Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {modules.length > 0 ? modules.map((module: any, mIdx: number) => {
          const moduleTopics = module.topics || [];
          return (
            <div key={module.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-zinc-950/50 p-4 sm:p-5 flex items-center justify-between -800">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-zinc-600 cursor-grab" />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">Module {mIdx + 1}</span>
                    {editingModuleId === module.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          autoFocus
                          value={editingModuleTitle}
                          onChange={(e) => setEditingModuleTitle(e.target.value)}
                          className="h-8 text-sm max-w-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateModuleMutation.mutate({ id: module.id, title: editingModuleTitle })}
                          disabled={!editingModuleTitle.trim() || updateModuleMutation.isPending}
                          className="bg-cyan-500 hover:bg-cyan-600 text-zinc-950"
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingModuleId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <h2 className="text-base font-bold text-white">{module.title}</h2>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingModuleId(module.id); setEditingModuleTitle(module.title); }} className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors" title="Edit Module">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeleteModule(module.id)} disabled={deleteModuleMutation.isPending} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" title="Delete Module">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-3 bg-zinc-900">
                {moduleTopics.length > 0 ? moduleTopics.map((topic: any, tIdx: number) => (
                  <div key={topic.id} className="group bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center justify-between hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center font-medium text-[13px]">
                        {tIdx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">{topic.title}</h3>
                        <div className="flex gap-3 mt-1 text-xs text-zinc-500">
                          {topic.video && <span className="flex items-center"><Video className="w-3.5 h-3.5 mr-1" /> Video Included</span>}
                          {topic.mcqs?.length > 0 && <span className="flex items-center"><HelpCircle className="w-3.5 h-3.5 mr-1" /> {topic.mcqs.length} MCQs</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditTopic(topic)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors" title="Edit Topic">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteTopic(topic.id)} disabled={deleteTopicMutation.isPending} className="p-2 bg-zinc-800 hover:bg-red-900 hover:text-red-300 text-zinc-400 rounded-lg transition-colors" title="Delete Topic">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-4 sm:p-6 text-[13px] text-zinc-500 italic border border-dashed border-zinc-800 rounded-lg">
                    No topics in this module. Click "Add Topic" to create one.
                  </div>
                )}

                <button
                  onClick={() => openNewTopicEditor(module.id)}
                  className="w-full mt-3 flex items-center justify-center p-3 border border-dashed border-zinc-700 hover:border-cyan-800 hover:bg-cyan-950/20 text-zinc-400 hover:text-cyan-400 rounded-lg transition-colors text-[13px] font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic to {module.title.split(":")[0]}
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="p-16 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <FolderPlus className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-sm font-semibold text-white mb-2">Your curriculum is empty</h3>
            <p className="text-zinc-500 mb-6">Start by creating your first module to organize your course content.</p>
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
        onConfirm={() => moduleToDelete && deleteModuleMutation.mutate(moduleToDelete)}
        title="Delete Module"
        description="Are you sure you want to delete this module and all its topics? This action cannot be undone."
        isLoading={deleteModuleMutation.isPending}
      />

      <ConfirmModal
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        onConfirm={() => topicToDelete && deleteTopicMutation.mutate(topicToDelete)}
        title="Delete Topic"
        description="Are you sure you want to delete this topic? This action cannot be undone."
        isLoading={deleteTopicMutation.isPending}
      />
    </div>
  );
}
