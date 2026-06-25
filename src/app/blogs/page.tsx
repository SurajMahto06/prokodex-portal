"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Blog {
  id: string;
  title: string;
  slug: string;
  author: string;
  isPublished: boolean;
  createdAt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBlogs = async () => {
    try {
      const res = await api.get("/blogs?publishedOnly=false");
      setBlogs(res.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = (id: string) => {
    setBlogToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/blogs/${blogToDelete}`);
      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete blog");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setBlogToDelete(null);
    }
  };

  // Client-side pagination logic
  const totalItems = blogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedBlogs = blogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-cyan-400" />
            Blogs Management
          </h1>
          <p className="text-xs sm:text-[13px] lg:text-sm text-zinc-400">Manage all your published and draft blog posts.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/blogs/create" tabIndex={-1}>
            <Button className="shrink-0">
              <Plus className="w-5 h-5 mr-1" />
              Create New Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-[13px] lg:text-sm text-zinc-400 min-w-[800px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950">
              <tr>
                <th scope="col" className="px-6 py-4 whitespace-nowrap w-16">S.No.</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Title</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Author</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Status</th>
                <th scope="col" className="px-6 py-4 whitespace-nowrap">Created Date</th>
                <th scope="col" className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-zinc-500 space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                      <p className="text-sm font-medium">Loading blogs...</p>
                    </div>
                  </td>
                </tr>
              ) : blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No blogs found. Create your first post!
                  </td>
                </tr>
              ) : (
                paginatedBlogs.map((blog, index) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={blog.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-medium">
                        {serialNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-white">{blog.title}</div>
                        <div className="text-xs text-zinc-500 mt-1">/{blog.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-300">
                        {blog.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {blog.isPublished ? (
                          <span className="flex items-center text-[10px] sm:text-[11px] lg:text-xs font-medium text-green-400">
                            <span className="w-2 h-2 rounded-full mr-2 bg-green-500"></span>
                            Published
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] sm:text-[11px] lg:text-xs font-medium text-amber-400">
                            <span className="w-2 h-2 rounded-full mr-2 bg-amber-500"></span>
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end items-center gap-1 whitespace-nowrap">
                        <Link href={`/blogs/${blog.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-cyan-400">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(blog.id)}
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

      {blogs.length > 0 && (
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
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBlogToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Blog"
        description="Are you sure you want to delete this blog? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
