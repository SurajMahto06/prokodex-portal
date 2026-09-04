"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { programsService } from "@/services/programs";
import { ProgramForm } from "../../program-form";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function EditProgramPage() {
  const { programId } = useParams<{ programId: string }>();

  const { data: program, isLoading } = useQuery({
    queryKey: ["programs", programId],
    queryFn: () => programsService.getProgramById(programId),
    enabled: !!programId,
  });

  if (isLoading) {
    return (
      <div className="w-full pb-12 relative">
        <Link href="/programs" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Program Management
        </Link>
        <div className="mb-8">
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2">
            Loading...
          </h1>
          <p className="text-zinc-400">Fetching program details.</p>
        </div>
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="w-full pb-12 relative">
        <Link href="/programs" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Program Management
        </Link>
        <div className="mb-8">
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2">
            Not Found
          </h1>
          <p className="text-zinc-400">This program does not exist.</p>
        </div>
        <div className="flex items-center justify-center h-[40vh] text-zinc-400">
          Program not found.
        </div>
      </div>
    );
  }

  return <ProgramForm mode="edit" defaultValues={program} />;
}
