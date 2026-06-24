"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/dashboard/auth-provider";
import { couponsService } from "@/services/coupons";
import { Coupon } from "@/types";
import { Card } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Plus, Ticket, Trash2, Edit, Check, X, Percent, IndianRupee, Loader2 } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function CouponsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ type: 'flat', value: 0, isActive: true });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponsService.getCoupons(),
    enabled: user?.role === 'admin'
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => couponsService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsCreateOpen(false);
      setNewCoupon({ type: 'flat', value: 0, isActive: true });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => couponsService.updateCoupon(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setDeleteModalOpen(false);
      setCouponToDelete(null);
    }
  });

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader text="Loading coupons..." /></div>;
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.value) return;
    createMutation.mutate(newCoupon);
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-cyan-400" />
            Coupon Management
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Create and manage discount codes for the checkout process.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {isCreateOpen && (
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <h2 className="text-lg font-bold text-white mb-4">Create New Coupon</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Coupon Code</label>
              <input
                required
                type="text"
                placeholder="e.g. SUMMER50"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                value={newCoupon.code || ''}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
              <select
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                value={newCoupon.type}
                onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as 'flat' | 'percentage' })}
              >
                <option value="flat">Flat Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Value</label>
              <input
                required
                type="number"
                min="1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                value={newCoupon.value || ''}
                onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 flex justify-center items-center bg-cyan-500 hover:bg-cyan-400 text-black font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons?.map((coupon) => (
          <Card key={coupon.id} className="p-5 flex flex-col justify-between border-l-4" style={{ borderLeftColor: coupon.isActive ? '#06b6d4' : '#52525b' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-wider">{coupon.code}</h3>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-400">
                  {coupon.type === 'flat' ? <IndianRupee className="w-4 h-4 text-green-400" /> : <Percent className="w-4 h-4 text-purple-400" />}
                  <span className="font-bold text-white">{coupon.type === 'flat' && '₹'}{coupon.value}</span> {coupon.type === 'flat' ? 'Off' : '% Off'}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${coupon.isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                {coupon.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="flex gap-2 mt-4 pt-4">
              <button
                onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
              >
                {coupon.isActive ? <><X className="w-3.5 h-3.5" /> Disable</> : <><Check className="w-3.5 h-3.5 text-cyan-400" /> Enable</>}
              </button>
              <button
                onClick={() => {
                  setCouponToDelete(coupon.id);
                  setDeleteModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {(!coupons || coupons.length === 0) && !isLoading && (
          <div className="col-span-full p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No coupons created yet. Click "Create Coupon" to add one.
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCouponToDelete(null);
        }}
        onConfirm={() => {
          if (couponToDelete) {
            deleteMutation.mutate(couponToDelete);
          }
        }}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
