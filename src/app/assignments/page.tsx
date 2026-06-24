"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { FileText, Check, X, ExternalLink, Plus, BookOpen, User as UserIcon, Calendar, Clock, Upload, GitBranch, Download, Trash2, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { usersService } from "@/services/users";
import { coursesService } from "@/services/courses";
import { Assignment } from "@/types";
import { assignmentsService } from "@/services/assignments";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "@/components/ui/loader";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'review' | 'assign'>('review');
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['assignments', currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: () => assignmentsService.getAssignments({ page: currentPage, per_page: itemsPerPage, search: debouncedSearchQuery }),
    enabled: !!user,
    staleTime: 0, // Always refetch on pagination/search change
  });

  const assignments = response?.data || [];
  const totalItems = response?.total || 0;
  const totalPagesServer = response?.totalPages || 0;

  // Form State for Mentor Assigning
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Form State for Student Submitting
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const student = params.get('student');
      const course = params.get('course');
      const action = params.get('action');
      if (student) setSelectedStudentId(student);
      if (course) setSelectedCourseId(course);
      if (action === 'assign' || student) setActiveTab('assign');
    }
  }, []);

  // Derived Data — from API
  const { data: mentorMentees = [] } = useQuery({
    queryKey: ['myMentees'],
    queryFn: () => usersService.getMyMentees(),
    enabled: !!user && user.role !== 'student'
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getCourses(),
    enabled: !!user
  });

  if (!user) return null;

  // Filter students based on selected course
  const availableStudents = selectedCourseId
    ? mentorMentees.filter((m: any) => m.enrolledCourseIds?.includes(selectedCourseId))
    : [];


  const submitMutation = useMutation({
    mutationFn: (data: { id: string, repoUrl?: string, fileName?: string, fileUrl?: string }) => assignmentsService.submitAssignment(data.id, { repoUrl: data.repoUrl, fileName: data.fileName, fileUrl: data.fileUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSubmittingId(null);
      setRepoUrl("");
      setSelectedFile(null);
    }
  });

  const assignMutation = useMutation({
    mutationFn: (data: Partial<Assignment>) => assignmentsService.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setSelectedStudentId("");
      setSelectedCourseId("");
      setAssignmentTitle("");
      setAssignmentDesc("");
      setDueDate("");
      setActiveTab('review');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, status: string }) => assignmentsService.updateAssignment(data.id, { status: data.status as any }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assignmentsService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setAssignmentToDelete(null);
    }
  });


  // Student Actions
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingId || !repoUrl || !selectedFile) return;

    let fileUrl = "";
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      const res = await api.post(API_ENDPOINTS.UPLOAD.DOCUMENT, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fileUrl = res.data.url;
    } catch (error) {
      console.error('File upload failed:', error);
      // In a real app, show a toast error here
      return;
    }

    submitMutation.mutate({ id: submittingId, repoUrl, fileName: selectedFile.name, fileUrl });
  };

  // Mentor Actions
  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId || !assignmentTitle) return;
    assignMutation.mutate({
      studentId: selectedStudentId,
      courseId: selectedCourseId,
      title: assignmentTitle,
      description: assignmentDesc,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
    });
  };


  const handleReview = (id: string, action: 'approved' | 'rejected') => {
    updateMutation.mutate({ id, status: action });
  };

  const handleDelete = (id: string) => {
    setAssignmentToDelete(id);
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_submission': return <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">Pending</Badge>;
      case 'submitted': return <Badge variant="warning" className="uppercase tracking-wider text-[10px]">Needs Review</Badge>;
      case 'approved': return <Badge variant="success" className="uppercase tracking-wider text-[10px]">Approved</Badge>;
      case 'rejected': return <Badge variant="danger" className="uppercase tracking-wider text-[10px]">Rejected</Badge>;
      default: return null;
    }
  };

  // Render Student View
  if (user.role === "student") {
    const myAssignments = assignments;

    return (
      <div className="w-full pb-12 ">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-cyan-400" />
            My Assignments
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Complete and submit your assigned project work.</p>
        </div>

        <div className="grid gap-6">
          {myAssignments.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
              No assignments yet.
            </div>
          ) : (
            myAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
                {assignment.status === 'pending_submission' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                )}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
                      <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">{assignment.title}</h2>
                      {getStatusBadge(assignment.status)}
                    </div>

                    {/* Short Description */}
                    <div className="bg-zinc-950/50 rounded-xl p-4 mb-5 border border-zinc-800/50">
                      <div className="overflow-hidden relative">
                        <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {assignment.description.length > 150
                            ? assignment.description.slice(0, 150) + " "
                            : assignment.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setViewDetailsId(assignment.id)}
                        className="text-cyan-400 text-[10px] sm:text-[11px] lg:text-xs font-medium hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                      >
                        Show more
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-[10px] sm:text-[11px] lg:text-xs font-medium text-zinc-500">
                      <span className="flex items-center"><BookOpen className="w-3.5 h-3.5 mr-1" /> {assignment.course?.title || 'Unknown Course'}</span>
                      {assignment.dueDate && (
                        <span className="flex items-center text-rose-400/80"><Calendar className="w-3.5 h-3.5 mr-1" /> Due Date: {formatDate(assignment.dueDate)}</span>
                      )}
                      <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Assigned: {formatTimeAgo(assignment.assignedAt)}</span>
                      {assignment.submittedAt && (
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-cyan-400/70" /> Submitted: {formatTimeAgo(assignment.submittedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 md:mt-0">
                    {assignment.repoUrl && (
                      <a href={assignment.repoUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-[13px] lg:text-sm font-medium rounded-lg transition-colors">
                        View Code <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    )}
                    {assignment.status === 'pending_submission' && (
                      <button
                        onClick={() => setSubmittingId(assignment.id)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold text-xs sm:text-[13px] lg:text-sm rounded-lg transition-colors cursor-pointer"
                      >
                        Submit Project
                      </button>
                    )}
                  </div>
                </div>


              </div>
            ))
          )}
        </div>

        {myAssignments.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesServer}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        )}

        {/* Submission Modal */}
        {submittingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-50/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setSubmittingId(null)} />
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
              <form onSubmit={handleStudentSubmit} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-6 pb-4 ">
                  <div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1">Submit Final Project</h3>
                    <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Provide your repository link and project files.</p>
                  </div>
                  <button type="button" onClick={() => setSubmittingId(null)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors cursor-pointer shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-2 flex items-center">
                      <GitBranch className="w-4 h-4 mr-2 text-zinc-500" /> GitHub Repository Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/your-username/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-2 flex items-center">
                      <Upload className="w-4 h-4 mr-2 text-zinc-500" /> Upload Project ZIP
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-900 hover:bg-zinc-800 hover:border-cyan-500 transition-all">
                      <div className="flex flex-col items-center justify-center px-4">
                        <Upload className="w-6 h-6 text-zinc-500 mb-2" />
                        <span className="text-xs sm:text-[13px] lg:text-sm text-zinc-300 font-medium truncate max-w-[250px]">{selectedFile ? selectedFile.name : "Click to select a .zip file"}</span>
                      </div>
                      <input type="file" accept=".zip,.rar,.tar.gz" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} required />
                    </label>
                  </div>

                  <div className="pt-4 /50 mt-2">
                    <button type="submit" disabled={!repoUrl || !selectedFile || submitMutation.isPending} className="w-full px-6 py-3.5 bg-cyan-400 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-400 text-zinc-950 font-bold text-xs sm:text-[13px] lg:text-sm rounded-lg transition-colors flex justify-center items-center cursor-pointer">
                      {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      {submitMutation.isPending ? "Submitting..." : "Confirm Submission"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Details Modal */}
        {viewDetailsId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-50/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => setViewDetailsId(null)}
            />
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 sm:p-6  shrink-0">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-cyan-400" />
                  Project Details
                </h2>
                <button
                  onClick={() => setViewDetailsId(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {assignments.find(a => a.id === viewDetailsId)?.description}
                </p>
              </div>
              <div className="p-4  shrink-0 flex justify-end bg-zinc-900/50 rounded-b-2xl">
                <button
                  onClick={() => setViewDetailsId(null)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-[13px] lg:text-sm font-medium rounded-lg transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Mentor View
  const mentorAssignments = assignments;

  return (
    <div className="w-full pb-12 ">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-cyan-400" />
            Assignment Management
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Assign tasks and review student project submissions.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          {activeTab === 'review' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          {/* Tabs */}
          <div className="inline-flex bg-zinc-900 p-1 border border-zinc-800 rounded-lg">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 text-xs sm:text-[13px] lg:text-sm font-medium rounded-md transition-all ${activeTab === 'review' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Review Submissions
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-4 py-2 text-xs sm:text-[13px] lg:text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'assign' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              <Plus className="w-4 h-4 mr-1" /> New Assignment
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'assign' ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl max-w-2xl">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-6  pb-4">Assign New Project</h2>
          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-1.5">Select Course Scope</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedStudentId(""); // Reset student when course changes
                }}
                required
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none"
              >
                <option value="">-- Choose Course First --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-1.5">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
                disabled={!selectedCourseId}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selectedCourseId ? (availableStudents.length > 0 ? "-- Choose Mentee --" : "No mentees enrolled in this course") : "-- Select a course above --"}</option>
                {availableStudents.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-1.5">Assignment Title</label>
              <input
                type="text"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                required
                placeholder="e.g. Build a React Shopping Cart"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-1.5">Description / Requirements</label>
              <textarea
                value={assignmentDesc}
                onChange={(e) => setAssignmentDesc(e.target.value)}
                required
                rows={10}
                placeholder="Provide comprehensive assignment details, technical requirements, and acceptance criteria here..."
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y custom-scrollbar"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-[13px] lg:text-sm font-medium text-zinc-300 mb-1.5">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs sm:text-[13px] lg:text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={assignMutation.isPending} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold text-xs sm:text-[13px] lg:text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {assignMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {assignMutation.isPending ? "Assigning..." : "Assign to Student"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs sm:text-[13px] lg:text-sm text-zinc-400 min-w-[800px]">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950  whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap w-16">S.No.</th>
                    <th className="px-6 py-4 whitespace-nowrap">Student</th>
                    <th className="px-6 py-4 whitespace-nowrap">Assignment Details</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {isFetching || isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <Loader text="Loading assignments..." />
                      </td>
                    </tr>
                  ) : mentorAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 whitespace-nowrap">
                        No assignments found. Use the 'New Assignment' tab to create one.
                      </td>
                    </tr>
                  ) : (
                    mentorAssignments.map((assignment, index) => {
                      const studentName = assignment.student?.name || 'Unknown';
                      const courseName = assignment.course?.title || 'Unknown';
                      const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;

                      return (
                        <tr key={assignment.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap text-zinc-500 font-medium">
                            {serialNumber}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="font-medium text-white flex items-center">
                              <UserIcon className="w-4 h-4 mr-2 text-zinc-500" />
                              {studentName}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-white font-medium mb-1">{assignment.title}</div>
                            <div className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-500 flex items-center gap-3 mt-1 whitespace-nowrap">
                              <span className="flex items-center"><BookOpen className="w-3 h-3 mr-1" /> {courseName}</span>
                              {assignment.dueDate && (
                                <span className="flex items-center text-rose-400/80"><Calendar className="w-3 h-3 mr-1" /> Due {formatDate(assignment.dueDate)}</span>
                              )}
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Assigned {formatTimeAgo(assignment.assignedAt)}</span>
                              {assignment.submittedAt && (
                                <span className="flex items-center"><Check className="w-3 h-3 mr-1 text-cyan-400/70" /> Submitted {formatTimeAgo(assignment.submittedAt)}</span>
                              )}
                            </div>

                            {/* Submission Artifacts Moved Here for Better UX */}
                            {(assignment.repoUrl || assignment.fileName) && (
                              <div className="mt-4 flex items-center gap-4 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/50 w-fit whitespace-nowrap">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Submitted Work:</span>
                                {assignment.repoUrl && (
                                  <a href={assignment.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors">
                                    <GitBranch className="w-3.5 h-3.5 mr-1.5" /> GitHub Repository
                                  </a>
                                )}
                                {assignment.fileName && (
                                  assignment.fileUrl ? (
                                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors">
                                      <Download className="w-3.5 h-3.5 mr-1.5" /> {assignment.fileName}
                                    </a>
                                  ) : (
                                    <div className="inline-flex items-center text-zinc-400 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                                      <Download className="w-3.5 h-3.5 mr-1.5" /> {assignment.fileName}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {getStatusBadge(assignment.status)}
                          </td>
                          <td className="px-6 py-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {assignment.status === 'submitted' && (
                                <>
                                  <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                                  <button
                                    onClick={() => handleReview(assignment.id, 'approved')}
                                    className="text-emerald-500 hover:text-emerald-400 p-1.5 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20" title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReview(assignment.id, 'rejected')}
                                    className="text-rose-500 hover:text-rose-400 p-1.5 transition-colors bg-rose-500/10 hover:bg-rose-500/20 rounded-md border border-rose-500/20" title="Reject / Request Changes"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                              <button
                                onClick={() => handleDelete(assignment.id)}
                                className="text-zinc-500 hover:text-rose-500 p-1.5 transition-colors hover:bg-rose-500/10 rounded-md"
                                title="Delete Assignment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {mentorAssignments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesServer}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!assignmentToDelete}
        onClose={() => setAssignmentToDelete(null)}
        onConfirm={() => {
          if (assignmentToDelete) {
            deleteMutation.mutate(assignmentToDelete);
          }
        }}
        title="Delete Assignment"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete Assignment"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
