"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ArrowLeft, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { programsService, Program, ProgramInput, SyllabusItem } from "@/services/programs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const ICON_OPTIONS = [
  "Code2", "Server", "Database", "Smartphone", "LayoutTemplate",
  "BrainCircuit", "Cloud", "MonitorSmartphone", "Globe", "Palette",
  "TrendingUp", "Briefcase", "Shield", "Layers", "Terminal"
];

interface ProgramFormProps {
  defaultValues?: Program;
  mode: "create" | "edit";
}

export function ProgramForm({ defaultValues, mode }: ProgramFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [duration, setDuration] = useState(defaultValues?.duration ?? "");
  const [iconName, setIconName] = useState(defaultValues?.iconName ?? "Code2");
  const [isPublished, setIsPublished] = useState(defaultValues?.isPublished ?? true);
  const [order, setOrder] = useState(defaultValues?.order ?? 0);
  const [highlights, setHighlights] = useState<string[]>(
    (defaultValues?.highlights as string[]) ?? [""]
  );
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(
    (defaultValues?.syllabus as SyllabusItem[]) ?? [{ period: "", topic: "" }]
  );

  const mutation = useMutation({
    mutationFn: async (data: ProgramInput) => {
      if (mode === "create") {
        return programsService.createProgram(data);
      } else {
        return programsService.updateProgram(defaultValues!.id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(mode === "create" ? "Program created!" : "Program updated!");
      router.push("/programs");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !duration) {
      toast.error("Title, description and duration are required");
      return;
    }
    mutation.mutate({
      title,
      description,
      duration,
      iconName,
      highlights: highlights.filter(Boolean),
      syllabus: syllabus.filter(s => s.period || s.topic),
      isPublished,
      order,
    });
  };

  // Highlights helpers
  const addHighlight = () => setHighlights([...highlights, ""]);
  const updateHighlight = (i: number, val: string) => {
    const updated = [...highlights];
    updated[i] = val;
    setHighlights(updated);
  };
  const removeHighlight = (i: number) => setHighlights(highlights.filter((_, idx) => idx !== i));

  // Syllabus helpers
  const addSyllabusItem = () => setSyllabus([...syllabus, { period: "", topic: "" }]);
  const updateSyllabus = (i: number, field: keyof SyllabusItem, val: string) => {
    const updated = [...syllabus];
    updated[i] = { ...updated[i], [field]: val };
    setSyllabus(updated);
  };
  const removeSyllabusItem = (i: number) => setSyllabus(syllabus.filter((_, idx) => idx !== i));

  const inputCls = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition";

  return (
    <form onSubmit={handleSubmit} className="w-full pb-12">
      <Link href="/programs" className="inline-flex items-center text-[13px] text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Program Management
      </Link>
      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-2">
          {mode === "create" ? "Create New Program" : `Edit: ${defaultValues?.title}`}
        </h1>
        <p className="text-zinc-400">Fill in the details for the internship program.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Basic Info</h2>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Program Title *</label>
              <input className={inputCls} placeholder="e.g. Frontend Development" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description *</label>
              <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Describe what students will learn..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duration *</label>
                <input className={inputCls} placeholder="e.g. 3 Months" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Display Order</label>
                <input type="number" className={inputCls} value={order} onChange={e => setOrder(parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </Card>

          {/* Syllabus */}
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Syllabus (What You'll Learn)</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Define duration period, topic title, and detailed description of what is taught.</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="border-zinc-700 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 gap-1 shrink-0 self-start sm:self-auto" onClick={addSyllabusItem}>
                <Plus className="w-3.5 h-3.5" /> Add Module
              </Button>
            </div>
            
            <div className="space-y-4 pt-2">
              {syllabus.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3 relative group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 shrink-0">
                        Module {i + 1}
                      </span>
                      <input
                        className={`${inputCls} w-36 text-xs font-medium`}
                        placeholder="e.g. Month 1"
                        value={item.period}
                        onChange={e => updateSyllabus(i, "period", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 h-8 gap-1.5 shrink-0"
                      onClick={() => removeSyllabusItem(i)}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Delete Row</span>
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Topic Title *</label>
                      <input
                        className={`${inputCls} font-medium`}
                        placeholder="e.g. Core JavaScript & React Fundamentals"
                        value={item.topic}
                        onChange={e => updateSyllabus(i, "topic", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">Detailed Description (What is taught in this module)</label>
                      <textarea
                        className={`${inputCls} resize-none text-xs text-zinc-300`}
                        rows={2}
                        placeholder="e.g. ES6+ features, DOM manipulation, React Components, Custom Hooks, and State Management..."
                        value={item.description || ""}
                        onChange={e => updateSyllabus(i, "description", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Highlights / Tags */}
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Highlights / Tech Tags</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Technology badges displayed directly on the program card on the website.</p>
              </div>
              <Button type="button" size="sm" variant="outline" className="border-zinc-700 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 gap-1 shrink-0 self-start sm:self-auto" onClick={addHighlight}>
                <Plus className="w-3.5 h-3.5" /> Add Tag
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className={`${inputCls} flex-1 text-xs`}
                    placeholder='e.g. "React.js", "Node.js"'
                    value={h}
                    onChange={e => updateHighlight(i, e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 h-9 shrink-0" onClick={() => removeHighlight(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Settings</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Published</span>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublished ? "bg-cyan-500" : "bg-zinc-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublished ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <p className="text-xs text-zinc-500">{isPublished ? "Visible on the website" : "Hidden from website"}</p>
          </Card>

          {/* Icon picker */}
          <Card className="bg-zinc-900 border-zinc-800 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Icon</h2>
            <div className="grid grid-cols-3 gap-2">
              {ICON_OPTIONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setIconName(icon)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all truncate ${
                    iconName === icon
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">Selected: <span className="text-cyan-400">{iconName}</span></p>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#ffffff] font-bold h-11"
          >
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              mode === "create" ? "Create Program" : "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
