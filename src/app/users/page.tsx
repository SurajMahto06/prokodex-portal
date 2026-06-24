"use client";

import { useState } from "react";
import { useAuth } from "@/components/dashboard/auth-provider";
import { Users as UsersIcon, Search, ShieldAlert, Edit, Trash2, Plus, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { coursesService } from "@/services/courses";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader } from "@/components/ui/loader";
import { downloadCSV } from "@/lib/export";

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: response, isLoading: isLoadingUsers, isFetching } = useQuery({
    queryKey: ['users', currentPage, itemsPerPage, debouncedSearchQuery],
    queryFn: () => usersService.getUsers({ page: currentPage, per_page: itemsPerPage, search: debouncedSearchQuery }),
    enabled: user?.role === "admin",
    staleTime: 0, // Always refetch on pagination/search change
  });

  const usersList = response?.data || [];
  const totalItems = response?.total || 0;
  const totalPages = response?.totalPages || 0;

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getCourses(),
    enabled: user?.role === "admin",
  });

  const isLoading = isLoadingUsers || isLoadingCourses;

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
  });

  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setUserToDelete(id);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportUsers = async () => {
    try {
      setIsExporting(true);
      // Fetch all users
      const response = await usersService.getUsers({ paginate: 'false', search: debouncedSearchQuery });
      const allUsers = response.data || [];
      
      // Format data for Excel
      const exportData = allUsers.map((u: any) => {
        const enrolledTitles = (u.enrolledCourseIds || []).map((id: string) => courses.find((c: any) => c.id === id)?.title || `Unknown Course (${id})`).join(', ');
        const assignedTitles = (u.assignedCourseIds || []).map((id: string) => courses.find((c: any) => c.id === id)?.title || `Unknown Course (${id})`).join(', ');

        return {
          "ID": u.id,
          "Name": u.name,
          "Email": u.email,
          "Role": u.role,
          "Plan": u.plan || "none",
          "Status": u.status || "active",
          "Progress Percentage": u.progressPercentage,
          "Enrolled Courses": enrolledTitles,
          "Assigned Courses (Mentor)": assignedTitles,
          "Created At": new Date(u.createdAt).toLocaleString(),
        };
      });

      downloadCSV(exportData, `Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error("Error exporting users:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getCourseBadges = (courseIds: string[] | undefined, role: string) => {
    if (!courseIds || courseIds.length === 0) return <span className="text-zinc-600 italic text-[10px] sm:text-[11px] lg:text-xs">None</span>;

    const count = courseIds.length;
    const label = role === 'mentor' ? 'Assigned' : 'Enrolled';
    const activeCourses = courseIds.map(id => courses.find((c: any) => c.id === id) || { id, title: `Course ${id.substring(0, 4)}...` }).filter(Boolean);

    return (
      <div className="relative group inline-block">
        <span className={`text-[10px] sm:text-[11px] lg:text-xs font-medium px-2 py-1 rounded-md cursor-help ${role === 'mentor'
          ? 'bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 border'
          : 'bg-cyan-100 border-cyan-200 text-cyan-700 dark:bg-cyan-950/30 dark:border-cyan-900/50 dark:text-cyan-400 border'
          }`}>
          {count} {label}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-xs bg-white text-zinc-800 dark:bg-zinc-800 dark:text-white text-[10px] sm:text-[11px] lg:text-xs rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 z-50 p-3">
          <div className="font-semibold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider text-[10px]">{label} {role === 'mentor' ? 'Projects' : 'Courses'}:</div>
          <div className="flex flex-wrap gap-1.5">
            {activeCourses.map((course: any) => (
              <span key={course.id} className="bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap">
                {course.title}
              </span>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white dark:border-t-zinc-800"></div>
        </div>
      </div>
    );
  };

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  return (
    <div className="w-full pb-12 ">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-6 flex items-center">
            <UsersIcon className="w-8 h-8 mr-3 text-cyan-400" />
            User Management
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Manage students, mentors, and administrators.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <Input
              type="text"
              className="md:w-64 pl-10"
              placeholder="Search users..."
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
            onClick={handleExportUsers}
            disabled={isExporting || usersList.length === 0}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export Excel
          </Button>
          <Link href="/users/new" tabIndex={-1}>
            <Button className="shrink-0">
              <Plus className="w-5 h-5 mr-1" />
              Add User
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
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Name</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Email</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Role</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Plan</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Status</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Courses / Projects</th>
                <th scope="col" className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {isFetching || isLoadingUsers ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <Loader text="Loading users..." />
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                usersList.map((u: any, index: number) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-medium">
                        {serialNumber}
                      </td>
                      <td className="px-6 py-4 font-medium text-white flex items-center whitespace-nowrap">
                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-400 font-bold mr-3 shrink-0 uppercase">
                          {(u.name || "?").charAt(0)}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={u.role === 'admin' ? 'admin' : u.role === 'mentor' ? 'mentor' : 'default'} className="capitalize">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.role === "student" ? (
                          <Badge variant={u.plan === 'elite' ? 'elite' : u.plan === 'premium' ? 'premium' : 'outline'} className="uppercase tracking-wider">
                            {u.plan || 'none'}
                          </Badge>
                        ) : (
                          <span className="text-zinc-600 text-[10px] sm:text-[11px] lg:text-xs italic">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center text-[10px] sm:text-[11px] lg:text-xs font-medium capitalize ${u.status === 'active' ? 'text-green-600 dark:text-green-400' :
                          u.status === 'inactive' ? 'text-red-600 dark:text-red-400' :
                            'text-yellow-600 dark:text-yellow-400'
                          }`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${u.status === 'active' ? 'bg-green-500' :
                            u.status === 'inactive' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                          {u.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span className="text-[10px] sm:text-[11px] lg:text-xs font-medium text-zinc-500">All Access</span>
                        ) : u.role === 'mentor' ? (
                          getCourseBadges(u.assignedCourseIds, u.role)
                        ) : (
                          getCourseBadges(u.enrolledCourseIds, u.role)
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-1 whitespace-nowrap">
                        <Link href={`/users/${u.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
                          disabled={deleteMutation.isPending || u.id === user.id}
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

      {usersList.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        />
      )}

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
