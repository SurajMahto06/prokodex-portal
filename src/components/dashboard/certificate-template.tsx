import React from "react";
import { QRCodeCanvas } from "qrcode.react";

export interface CertificateTemplateProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  certificateId: string;
}

export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ studentName, courseTitle, issueDate, certificateId }, ref) => {
    const verifyUrl = `https://prokodex.in/verify?id=${certificateId}`;

    return (
      <div
        ref={ref}
        className="w-[1123px] h-[794px] bg-[#ffffff] relative overflow-hidden flex flex-col items-center text-[#111827]"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Certificate Background Elements - Extremely Elaborate Borders */}

        {/* Outer thick navy border */}
        <div className="absolute inset-0 border-[20px] border-[#0f172a] m-6 pointer-events-none" />

        {/* Inner thick gold border */}
        <div className="absolute inset-0 border-[6px] border-[#d4af37] m-[34px] pointer-events-none" />

        {/* Innermost thin navy border */}
        <div className="absolute inset-0 border-[1px] border-[#0f172a] m-[44px] pointer-events-none" />

        {/* Corner Decorations */}
        <div className="absolute top-[40px] left-[40px] w-8 h-8 border-t-[4px] border-l-[4px] border-[#d4af37] z-10" />
        <div className="absolute top-[40px] right-[40px] w-8 h-8 border-t-[4px] border-r-[4px] border-[#d4af37] z-10" />
        <div className="absolute bottom-[40px] left-[40px] w-8 h-8 border-b-[4px] border-l-[4px] border-[#d4af37] z-10" />
        <div className="absolute bottom-[40px] right-[40px] w-8 h-8 border-b-[4px] border-r-[4px] border-[#d4af37] z-10" />

        {/* Faded Background Pattern / Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border-[20px] border-[#000000] flex items-center justify-center">
            <span className="text-[200px] font-black text-[#000000]" style={{ fontFamily: "Georgia, serif" }}>PK</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="z-10 flex flex-col items-center w-full h-full pt-16 pb-14 px-32 justify-between">

          {/* Header - Formal & Traditional */}
          <div className="flex flex-col items-center w-full mt-4">
            <h1 className="text-[64px] font-bold uppercase text-[#0f172a]" style={{ fontFamily: "'Times New Roman', Times, serif", letterSpacing: "8px" }}>
              Certificate
            </h1>
            <h2 className="text-[20px] uppercase text-[#d4af37] font-semibold tracking-[12px] mt-2" style={{ fontFamily: "Arial, sans-serif" }}>
              Of Achievement
            </h2>
          </div>

          {/* Body Section */}
          <div className="flex flex-col items-center w-full flex-grow justify-center mt-2">
            <p className="text-[#4b5563] text-2xl mb-8 italic" style={{ fontFamily: "Georgia, serif" }}>
              This is to proudly certify that
            </p>

            <div className="my-2 w-full flex justify-center pb-2">
              <h2
                className="text-[80px] font-normal text-[#0f172a] capitalize border-b-[3px] border-[#d4af37] px-20 inline-block"
                style={{ fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive" }}
              >
                {studentName}
              </h2>
            </div>

            <div className="text-center max-w-3xl mt-10">
              <p className="text-[24px] text-[#374151] leading-relaxed italic" style={{ fontFamily: "Georgia, serif" }}>
                Has successfully completed the comprehensive internship program <br />and demonstrated outstanding excellence as a:
              </p>
              <h3 className="text-[36px] font-bold text-[#0f172a] mt-6 tracking-[0.1em] uppercase" style={{ fontFamily: "Arial, sans-serif" }}>
                {courseTitle}
              </h3>
            </div>
          </div>

          {/* Footer Grid - Signatures, Seal, Verification */}
          <div className="w-full flex justify-between items-end mt-4 px-8 pb-4">

            {/* Left Signature */}
            <div className="flex flex-col items-center text-center w-64 pb-2">
              <div className="mb-2 w-full border-b-[2px] border-[#000000] flex justify-center pb-2 relative h-20">
                <span
                  className="text-5xl text-[#0f172a] absolute bottom-1"
                  style={{ fontFamily: "'Brush Script MT', cursive", transform: "rotate(-2deg)" }}
                >
                  S. Mahto
                </span>
              </div>
              <p className="text-[16px] font-bold text-[#111827] uppercase tracking-widest mt-2" style={{ fontFamily: "Arial, sans-serif" }}>Suraj Mahto</p>
              <p className="text-[13px] text-[#6b7280] font-semibold uppercase tracking-widest mt-1" style={{ fontFamily: "Arial, sans-serif" }}>Chief Executive Officer</p>
            </div>

            {/* Center Golden Seal & Synchronous QR Canvas */}
            <div className="flex flex-col items-center justify-center relative mb-6">
              <div className="w-[150px] h-[150px] rounded-full border-[6px] border-[#d4af37] flex items-center justify-center bg-[#ffffff] relative z-10 shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <QRCodeCanvas value={verifyUrl} size={94} bgColor="#ffffff" fgColor="#0f172a" level="H" includeMargin={true} />
              </div>
              <div className="absolute -bottom-5 bg-[#0f172a] text-[#d4af37] text-[11px] uppercase font-bold px-6 py-1.5 tracking-[0.3em] z-20 border-[1px] border-[#d4af37]">
                Verified
              </div>
            </div>

            {/* Right Signature */}
            <div className="flex flex-col items-center text-center w-64 pb-2">
              <div className="mb-2 w-full border-b-[2px] border-[#000000] flex justify-center pb-2 relative h-20">
                <span
                  className="text-5xl text-[#0f172a] absolute bottom-1"
                  style={{ fontFamily: "'Brush Script MT', cursive", transform: "rotate(3deg)" }}
                >
                  A. Sharma
                </span>
              </div>
              <p className="text-[16px] font-bold text-[#111827] uppercase tracking-widest mt-2" style={{ fontFamily: "Arial, sans-serif" }}>Arun Sharma</p>
              <p className="text-[13px] text-[#6b7280] font-semibold uppercase tracking-widest mt-1" style={{ fontFamily: "Arial, sans-serif" }}>Head of Engineering</p>
            </div>

          </div>

          <div className="absolute bottom-6 w-full flex justify-between px-[75px] text-[12px] text-[#9ca3af] tracking-widest uppercase font-bold" style={{ fontFamily: "Arial, sans-serif" }}>
            <p>Date: {issueDate}</p>
            <p>Credential ID: {certificateId}</p>
          </div>
        </div>
      </div>
    );
  }
);
CertificateTemplate.displayName = "CertificateTemplate";
