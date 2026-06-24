"use client";

import { useAuth } from "@/components/dashboard/auth-provider";
import { ShieldCheck, Download, Award, ShieldAlert, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AccessDenied } from "@/components/ui/access-denied";
import { certificatesService } from "@/services/certificates";
import { generateCertificatePDF } from "@/lib/pdf";
import { useState } from "react";

export default function CertificatesPage() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesService.getCertificates(),
    enabled: !!user && user.role === 'student',
  });

  const certificates = response?.data || [];

  if (user?.role !== "student") {
    return <AccessDenied message="You must be a student to view certificates." />;
  }

  const handleDownloadPDF = async (cert: any) => {
    setDownloadingId(cert.id);
    try {
      await generateCertificatePDF(
        {
          studentName: user?.name || "Student",
          courseTitle: cert.course?.title || "Course",
          issueDate: new Date(cert.issueDate).toISOString().split('T')[0],
          certificateId: cert.certificateId,
          startDate: cert.startDate ? new Date(cert.startDate).toISOString().split('T')[0] : undefined,
          endDate: cert.endDate ? new Date(cert.endDate).toISOString().split('T')[0] : undefined,
        },
        `Certificate-${cert.certificateId}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-12 ">
      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6 flex items-center">
          <ShieldCheck className="w-8 h-8 mr-3 text-cyan-400" />
          My Certificates
        </h1>
        <p className="text-zinc-400">View and download your earned credentials.</p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 group">
              <div className="aspect-[1.4/1] bg-cyan-950/20 border border-cyan-900/50 rounded-lg flex items-center justify-center relative overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"></div>
                <Award className="w-24 h-24 text-cyan-400/50 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-8 text-center px-2">
                  <p className="text-cyan-400 font-serif text-[11px] md:text-[13px] tracking-widest uppercase">Prokodex Academy</p>
                  <p className="text-white text-[12px] md:text-[13px] mt-2 line-clamp-1">{cert.course?.title}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-white mb-1 truncate" title={cert.course?.title}>{cert.course?.title} Certification</h3>
              <p className="text-[13px] text-zinc-400 mb-4">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
              
              <button 
                onClick={() => handleDownloadPDF(cert)}
                disabled={downloadingId === cert.id}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingId === cert.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {downloadingId === cert.id ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-16 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Award className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-base font-bold text-white mb-2">No Certificates Yet</h2>
          <p className="text-zinc-400">Complete a course track to earn your first certification.</p>
        </div>
      )}
    </div>
  );
}
