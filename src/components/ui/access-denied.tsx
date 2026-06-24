import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-zinc-900/50 p-8 rounded-2xl border border-red-500/20 max-w-md w-full flex flex-col items-center shadow-2xl backdrop-blur-sm">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-zinc-400 mb-8 text-sm md:text-base">
          {message || "You must be an administrator to view this page. You do not have the required permissions."}
        </p>
        <Link 
          href="/" 
          className="w-full flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
