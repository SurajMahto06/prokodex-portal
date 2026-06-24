"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ShieldAlert, Award, CheckCircle, ArrowLeft, Download, Loader2, Search } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import Link from "next/link";
import { generateCertificatePDF } from "@/lib/pdf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "@/services/courses";
import { usersService } from "@/services/users";
import { certificatesService } from "@/services/certificates";
import { useDebounce } from "@/hooks/use-debounce";

const certificateSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  studentId: z.string().min(1, "Student is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  dateOfIssue: z.string().min(1, "Issue date is required"),
});

type CertificateValues = z.infer<typeof certificateSchema>;

export default function NewIssueCertificatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [issuedCert, setIssuedCert] = useState<any>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [studentSearch, setStudentSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getCourses(),
    enabled: !!user && user.role === 'admin',
  });

  const { data: response, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'student', 'dropdown', debouncedStudentSearch],
    queryFn: () => usersService.getUsers({ role: 'student', per_page: 20, search: debouncedStudentSearch }),
    enabled: !!user && user.role === 'admin',
  });

  const users = response?.data || [];

  const issueMutation = useMutation({
    mutationFn: (data: { studentId: string; courseId: string; dateOfIssue: string; startDate?: string; endDate?: string }) =>
      certificatesService.issueCertificate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificates-admin'] });
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      setIssuedCert(data);
    }
  });

  const form = useForm<CertificateValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      courseId: "",
      studentId: "",
      startDate: new Date().toISOString().substring(0, 7),
      endDate: new Date().toISOString().substring(0, 7),
      dateOfIssue: new Date().toISOString().split('T')[0].substring(0, 7),
    },
  });

  const selectedCourseId = form.watch("courseId");

  const handleDownloadPDF = async () => {
    if (!issuedCert) return;
    setIsGeneratingPdf(true);
    try {
      await generateCertificatePDF(
        {
          studentName: issuedCert.student?.name || "Student",
          courseTitle: issuedCert.course?.title || "Course",
          issueDate: new Date(issuedCert.issueDate).toISOString().split('T')[0],
          certificateId: issuedCert.certificateId,
          startDate: issuedCert.startDate ? new Date(issuedCert.startDate).toISOString().split('T')[0] : undefined,
          endDate: issuedCert.endDate ? new Date(issuedCert.endDate).toISOString().split('T')[0] : undefined,
        },
        `Certificate-${issuedCert.certificateId}.pdf`
      );
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Filter students based on selected course
  const availableStudents = users.filter(
    (u) => !selectedCourseId || u.enrolledCourseIds?.includes(selectedCourseId)
  );

  const onSubmit = (data: CertificateValues) => {
    // We send a full date string for issueDate
    const issueDateStr = `${data.dateOfIssue}-01`;
    issueMutation.mutate({
      studentId: data.studentId,
      courseId: data.courseId,
      dateOfIssue: issueDateStr,
      startDate: `${data.startDate}-01`,
      endDate: `${data.endDate}-01`
    });
  };

  const handleReset = () => {
    setIssuedCert(null);
    setSelectedStudentName("");
    setStudentSearch("");
    form.reset({
      courseId: "",
      studentId: "",
      startDate: new Date().toISOString().substring(0, 7),
      endDate: new Date().toISOString().substring(0, 7),
      dateOfIssue: new Date().toISOString().split('T')[0].substring(0, 7),
    });
  };

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  if (isLoadingCourses || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-12 ">
      <Link href="/issue-certificate" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Certificates
      </Link>

      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6">
          Issue Certificate
        </h1>
        <p className="text-zinc-400">Securely generate and issue verifiable credentials to students who have completed their tracks.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl max-w-4xl">
        {issuedCert ? (
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center text-left mb-4 sm:mb-0">
              <CheckCircle className="w-12 h-12 text-emerald-400 mr-4 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-white">Certificate Successfully Issued</h2>
                <p className="text-zinc-400 text-sm mt-1">Generated ID: <span className="font-mono text-cyan-400 font-bold ml-1">{issuedCert.certificateId}</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/issue-certificate">
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer border border-zinc-700">
                  View List
                </button>
              </Link>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer border border-zinc-700"
              >
                Issue Another
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 text-[13px] font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(8,145,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Select Course / Track</label>
                <select
                  {...form.register("courseId")}
                  onChange={(e) => {
                    form.setValue("courseId", e.target.value);
                    form.setValue("studentId", ""); // Reset student on course change
                    setSelectedStudentName("");
                    setStudentSearch("");
                  }}
                  className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer ${form.formState.errors.courseId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                >
                  <option value="" disabled>-- Select a completed course --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
                {form.formState.errors.courseId && <p className="text-xs text-red-500 mt-1">{form.formState.errors.courseId.message}</p>}
              </div>

              <div ref={dropdownRef} className="relative">
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Select Student</label>
                <div
                  className={`relative flex items-center w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white transition-all ${!selectedCourseId ? 'opacity-50 cursor-not-allowed' : 'cursor-text'} ${form.formState.errors.studentId ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500 focus-within:ring-1' : 'border-zinc-800 focus-within:border-cyan-500 focus-within:ring-cyan-500 focus-within:ring-1'}`}
                  onClick={() => selectedCourseId && setIsDropdownOpen(true)}
                >
                  <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    disabled={!selectedCourseId}
                    placeholder={selectedStudentName || "-- Search & select an eligible student --"}
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setIsDropdownOpen(true);
                      if (selectedStudentName && e.target.value !== selectedStudentName) {
                        setSelectedStudentName("");
                        form.setValue("studentId", "");
                      }
                    }}
                    onFocus={() => selectedCourseId && setIsDropdownOpen(true)}
                    className="bg-transparent w-full focus:outline-none placeholder-zinc-500 disabled:cursor-not-allowed text-ellipsis"
                  />
                </div>

                {isDropdownOpen && selectedCourseId && (
                  <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {isLoadingUsers ? (
                      <div className="p-4 text-center text-zinc-400 text-sm flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching...
                      </div>
                    ) : availableStudents.length > 0 ? (
                      <ul className="py-1">
                        {availableStudents.map(student => (
                          <li
                            key={student.id}
                            className="px-4 py-2 text-[13px] text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                            onClick={() => {
                              form.setValue("studentId", student.id, { shouldValidate: true });
                              setSelectedStudentName(`${student.name} (${student.email})`);
                              setStudentSearch("");
                              setIsDropdownOpen(false);
                            }}
                          >
                            <span className="font-medium text-white block">{student.name}</span>
                            <span className="text-zinc-500 text-xs">{student.email}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-zinc-500 text-sm">
                        No eligible students found
                      </div>
                    )}
                  </div>
                )}
                {form.formState.errors.studentId && <p className="text-xs text-red-500 mt-1">{form.formState.errors.studentId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Start Month</label>
                  <input
                    type="month"
                    {...form.register("startDate")}
                    className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all [color-scheme:dark] ${form.formState.errors.startDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                  />
                  {form.formState.errors.startDate && <p className="text-xs text-red-500 mt-1">{form.formState.errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">End Month</label>
                  <input
                    type="month"
                    {...form.register("endDate")}
                    className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all [color-scheme:dark] ${form.formState.errors.endDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                  />
                  {form.formState.errors.endDate && <p className="text-xs text-red-500 mt-1">{form.formState.errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-medium text-zinc-300 mb-2">Month of Issue</label>
                <input
                  type="month"
                  {...form.register("dateOfIssue")}
                  className={`w-full px-4 py-2.5 bg-zinc-950 border rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all [color-scheme:dark] ${form.formState.errors.dateOfIssue ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'}`}
                />
                {form.formState.errors.dateOfIssue && <p className="text-xs text-red-500 mt-1">{form.formState.errors.dateOfIssue.message}</p>}
              </div>
            </div>

            {issueMutation.isError && (
              <p className="text-sm text-red-500 mt-4">Failed to issue certificate. Please try again.</p>
            )}

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={issueMutation.isPending}
                className="flex items-center px-6 py-2.5 text-[13px] bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(8,145,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {issueMutation.isPending ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Issue Credential
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
