"use client";

import { useState } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { Presentation, Plus, Edit3, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { programsService, Program } from "@/services/programs";
import toast from "react-hot-toast";

export default function ProgramsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [programToDelete, setProgramToDelete] = useState<{ id: string; title: string } | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: () => programsService.getPrograms(false),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsService.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      setProgramToDelete(null);
      toast.success("Program deleted successfully");
    },
    onError: () => toast.error("Failed to delete program"),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      programsService.updateProgram(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program updated");
    },
    onError: () => toast.error("Failed to update program"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-12 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <Presentation className="w-8 h-8 mr-3 text-cyan-400" />
            Available Programs
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">
            Manage internship programs shown on the website.
          </p>
        </div>
        <Link href="/programs/new" tabIndex={-1}>
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Program
          </Button>
        </Link>
      </div>

      {programs.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
          <Presentation className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Programs Yet</h3>
          <p className="text-zinc-500 mb-6">Add your first available program to display on the website.</p>
          <Link href="/programs/new">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold">
              <Plus className="w-4 h-4 mr-2" /> Create First Program
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {programs.map((program: Program) => (
            <Card key={program.id} className="bg-zinc-900 border-zinc-800 p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{program.title}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Duration: {program.duration}</p>
                </div>
                <Badge
                  className={`shrink-0 text-xs font-semibold ${program.isPublished
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-700/50 text-zinc-400 border-zinc-600"
                    }`}
                >
                  {program.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{program.description}</p>

              <div className="text-xs text-zinc-500">
                {program.syllabus?.length ?? 0} syllabus items · {program.highlights?.length ?? 0} highlights
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-zinc-800">
                <Link href={`/programs/${program.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  title={program.isPublished ? "Unpublish" : "Publish"}
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600"
                  onClick={() => togglePublishMutation.mutate({ id: program.id, isPublished: !program.isPublished })}
                  disabled={togglePublishMutation.isPending}
                >
                  {program.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 text-red-400 hover:text-red-300 hover:border-red-800"
                  onClick={() => setProgramToDelete({ id: program.id, title: program.title })}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!programToDelete}
        onClose={() => setProgramToDelete(null)}
        onConfirm={() => programToDelete && deleteMutation.mutate(programToDelete.id)}
        isLoading={deleteMutation.isPending}
        title="Delete Program?"
        description={`Are you sure you want to delete "${programToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Program"
      />
    </div>
  );
}
