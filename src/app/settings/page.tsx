"use client";

import { useAuth } from "@/components/dashboard/auth-provider";
import { Settings as SettingsIcon, ShieldAlert, Save, Globe, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    enabled: user?.role === "admin",
  });

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      platformName: "",
      supportEmail: "",
      maintenanceMode: false,
    }
  });

  useEffect(() => {
    if (settings) {
      reset({
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        maintenanceMode: settings.maintenanceMode,
      });
    }
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
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
      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-cyan-400" />
          Global Settings
        </h1>
        <p className="text-zinc-400">Manage platform-wide configuration and preferences.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 relative">
        {updateMutation.isSuccess && (
          <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-white">Settings Saved!</h2>
            <button
              type="button"
              onClick={() => updateMutation.reset()}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Section 1 */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 flex items-center gap-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Platform Details</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">Platform Name</label>
              <input
                {...register("platformName")}
                type="text"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-zinc-300 mb-1.5">Support Email</label>
              <input
                {...register("supportEmail")}
                type="email"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-6 flex items-center gap-3">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Access Control</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">Maintenance Mode</p>
                <p className="text-[13px] text-zinc-500">Disable login for non-admin users.</p>
              </div>
              <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  {...register("maintenanceMode")}
                  type="checkbox"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-zinc-500 appearance-none cursor-pointer transition-transform checked:border-cyan-500 checked:translate-x-6"
                />
                <div className="toggle-label block overflow-hidden h-6 rounded-full bg-zinc-800 cursor-pointer"></div>
              </div>
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-cyan-400 hover:bg-cyan-500 text-zinc-950 font-bold text-[13px] rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
