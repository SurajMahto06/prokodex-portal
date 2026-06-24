"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ShieldAlert, ArrowLeft, Image as ImageIcon, Save, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services/courses";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const newCourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

type NewCourseValues = z.infer<typeof newCourseSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<NewCourseValues>({
    resolver: zodResolver(newCourseSchema),
    defaultValues: { title: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (courseData: any) => coursesService.createCourse(courseData),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      // Wait a moment so the user sees the success state, then redirect to edit page (course management)
      setTimeout(() => {
        router.push(`/courses/${newCourse.id}/edit`);
      }, 1000);
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  const onSubmit = (data: NewCourseValues) => {
    if (!thumbnailFile) return;

    setIsSaving(true);
    setUploadError(null);

    // Directly use createMutation, coursesService handles FormData
    createMutation.mutate({
      title: data.title,
      description: data.description,
      thumbnailFile
    });
  };

  return (
    <div className="w-full pb-12 relative">
      <Link href="/courses" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course Management
      </Link>

      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6">
          Create New Course
        </h1>
        <p className="text-zinc-400">Define the core details of your new elite learning program.</p>
      </div>

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">

        {createMutation.isSuccess && (
          <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
            <h2 className="text-base font-bold text-white">Course Created!</h2>
            <p className="text-zinc-400 mt-2">Redirecting to course management...</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {(createMutation.isError || uploadError) && (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/50 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
              <p className="text-[13px] text-red-200 leading-relaxed">
                {uploadError || (createMutation.error as any)?.response?.data?.message || "Failed to create course. Please try again."}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Course Title</label>
            <input
              {...register("title")}
              type="text"
              placeholder="e.g. Advanced System Design"
              className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="What will students learn in this course? Provide a compelling overview."
              className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2 flex items-center">
              <ImageIcon className="w-4.5 h-4.5 mr-2" />
              Course Thumbnail (Image Upload)
            </label>
            <div className="border-2 border-dashed border-zinc-700 hover:border-cyan-500 bg-zinc-950 rounded-xl text-center transition-colors relative group overflow-hidden h-40 sm:h-48 flex items-center justify-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {previewUrl ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${previewUrl}')` }}>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <UploadCloud className="w-8 h-8 text-white mb-2" />
                    <p className="text-white font-medium text-xs sm:text-[13px]">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center p-4">
                  <UploadCloud className="w-12 h-12 text-zinc-500 group-hover:text-cyan-400 transition-colors mb-3" />
                  <p className="text-zinc-300 font-medium text-xs sm:text-[13px] mb-1">Click or drag image to upload</p>
                  <p className="text-zinc-500 text-[11px] sm:text-xs">JPG, PNG, WebP up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !thumbnailFile}
              className="flex items-center px-4 py-2 text-[13px] bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold font-medium rounded-lg transition-colors shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin mr-2" />
                  Uploading & Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Create Course
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
