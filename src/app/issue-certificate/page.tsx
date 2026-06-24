"use client";

import { useState } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ShieldAlert, Award, Search, Plus, Trash2, Eye, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { generateCertificatePDF } from "@/lib/pdf";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesService } from "@/services/certificates";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "@/components/ui/loader";
import { downloadCSV } from "@/lib/export";

export default function IssueCertificatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewCertificate, setViewCertificate] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: response, isLoading, isFetching } = useQuery({
    queryKey: ['certificates-admin', currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: () => certificatesService.getCertificates({ page: currentPage, per_page: itemsPerPage, search: debouncedSearchQuery }),
    enabled: !!user && user.role === 'admin',
    staleTime: 0, // Always refetch on pagination/search change
  });

  const certificates = response?.data || [];
  const totalItems = response?.total || 0;
  const totalPages = response?.totalPages || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificatesService.revokeCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates-admin'] });
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      setDeleteConfirmId(null);
    }
  });

  const handleDownloadPDF = async () => {
    if (!viewCertificate) return;
    setIsGeneratingPdf(true);
    try {
      await generateCertificatePDF(
        {
          studentName: viewCertificate.student?.name || "Unknown",
          courseTitle: viewCertificate.course?.title || "Unknown",
          issueDate: new Date(viewCertificate.issueDate).toISOString().split('T')[0],
          certificateId: viewCertificate.certificateId,
          startDate: viewCertificate.startDate ? new Date(viewCertificate.startDate).toISOString().split('T')[0] : undefined,
          endDate: viewCertificate.endDate ? new Date(viewCertificate.endDate).toISOString().split('T')[0] : undefined,
        },
        `Certificate-${viewCertificate.certificateId}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportCertificates = async () => {
    try {
      setIsExporting(true);
      // Fetch all certificates
      const response = await certificatesService.getCertificates({ paginate: 'false', search: debouncedSearchQuery });
      const allCerts = response.data || [];
      
      // Format data for Excel
      const exportData = allCerts.map((cert: any) => ({
        "ID": cert.id,
        "Certificate ID": cert.certificateId,
        "Student Name": cert.student?.name || "Unknown",
        "Student Email": cert.student?.email || "Unknown",
        "Course/Track": cert.course?.title || "Unknown",
        "Issue Date": new Date(cert.issueDate).toLocaleDateString(),
        "Start Date": cert.startDate ? new Date(cert.startDate).toLocaleDateString() : "",
        "End Date": cert.endDate ? new Date(cert.endDate).toLocaleDateString() : "",
      }));

      downloadCSV(exportData, `Certificates_Export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error("Error exporting certificates:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleView = (cert: any) => {
    setViewCertificate(cert);
  };

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }



  return (
    <div className="w-full pb-12 ">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-6 flex items-center">
            <Award className="w-8 h-8 mr-3 text-cyan-400" />
            Issued Certificates
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Manage all verifiable credentials issued to students.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <Input
              type="text"
              className="md:w-64 pl-10"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button 
            variant="outline" 
            className="shrink-0 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            onClick={handleExportCertificates}
            disabled={isExporting || certificates.length === 0}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Excel
          </Button>
          <Link href="/issue-certificate/new" tabIndex={-1}>
            <Button className="shrink-0 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 font-bold shadow-[0_0_15px_rgba(8,145,178,0.3)]">
              <Plus className="w-5 h-5 mr-1" />
              Issue Certificate
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-[13px] lg:text-sm text-zinc-400 min-w-[800px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950 ">
              <tr>
                <th scope="col" className="px-6 py-4 whitespace-nowrap w-16">S.No.</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Certificate ID</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Student Name</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Course / Track</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Issue Date</th>
                <th scope="col" className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isFetching || isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader text="Loading certificates..." />
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No certificates found.
                  </td>
                </tr>
              ) : (
                certificates.map((cert: any, index: number) => {
                  const student = cert.student;
                  const course = cert.course;
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;

                  return (
                    <tr key={cert.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-medium">
                        {serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-cyan-400 font-medium">{cert.certificateId}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white flex items-center whitespace-nowrap">
                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-400 font-bold mr-3 shrink-0">
                          {student?.name?.charAt(0) || "?"}
                        </div>
                        {student?.name || "Unknown Student"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course?.title || "Unknown Course"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-1 whitespace-nowrap">
                        <Button
                          onClick={() => handleView(cert)}
                          variant="ghost"
                          size="icon"
                          title="View Certificate"
                        >
                          <Eye className="w-4 h-4 text-zinc-400 hover:text-cyan-400 transition-colors" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(cert.id)}
                          variant="ghost"
                          size="icon"
                          title="Revoke Certificate"
                          className="hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {certificates.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        />
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Revoke Certificate</h3>
            <p className="text-sm text-zinc-400 mb-6">Are you sure you want to permanently revoke this certificate? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(239,68,68,0.3)] disabled:opacity-50 flex items-center"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {viewCertificate && (() => {
        const student = viewCertificate.student;
        const course = viewCertificate.course;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <Award className="w-6 h-6 text-cyan-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Certificate Details</h3>
                </div>
                <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Secure & Verified
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">Certificate ID</p>
                  <p className="font-mono text-cyan-400 font-medium text-lg">{viewCertificate.certificateId}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">Issued To</p>
                  <p className="text-white font-medium text-[15px]">{student?.name || "Unknown Student"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">Course / Track</p>
                  <p className="text-zinc-300 text-[14px]">{course?.title || "Unknown Course"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider mb-1">Date of Issue</p>
                  <p className="text-zinc-300 text-[14px]">{new Date(viewCertificate.issueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setViewCertificate(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg transition-colors border border-zinc-700"
                >
                  Close
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="w-full flex items-center justify-center py-2.5 bg-cyan-500 hover:bg-cyan-600 text-zinc-950 text-[13px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPdf ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
