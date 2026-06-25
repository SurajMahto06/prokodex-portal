"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    coverImage: "",
    author: "",
    isPublished: true,
  });

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        // Find the blog from list (lazy way since we don't have getBlogById, or we can fetch by slug if we know it)
        // Wait, the API only has getBlogBySlug. For admin, we should really have getBlogById. 
        // Let's just fetch all and find it (fine for now)
        const res = await api.get(`/blogs?publishedOnly=false`);
        const blog = res.data.find((b: any) => b.id === id);

        if (blog) {
          // Since getBlogs doesn't return content (to save bandwidth), we need to fetch by slug to get full content
          const fullRes = await api.get(`/blogs/${blog.slug}`);
          setFormData({
            title: fullRes.data.title,
            slug: fullRes.data.slug,
            content: fullRes.data.content,
            coverImage: fullRes.data.coverImage || "",
            author: fullRes.data.author,
            isPublished: fullRes.data.isPublished,
          });
        } else {
          toast.error("Blog not found");
          router.push("/blogs");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load blog");
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) fetchBlog();
  }, [id, router]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, title, slug });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await api.post("/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, coverImage: res.data.url });
      toast.success("Image uploaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error("Title, Slug, and Content are required");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/blogs/${id}`, formData);
      toast.success("Blog updated successfully!");
      router.push("/blogs");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update blog");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-10 text-center text-zinc-400">Loading blog data...</div>;
  }

  return (
    <div className="w-full pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/blogs" className="text-zinc-400 hover:text-white transition">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Edit Blog Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[13px] text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[13px] text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Author</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-[13px] text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Cover Image</label>
          {formData.coverImage ? (
            <div className="relative w-full h-64 rounded-md overflow-hidden border border-zinc-800 group">
              <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <label className="cursor-pointer bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md backdrop-blur-sm text-white font-medium">
                  Change Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          ) : (
            <div className="w-full h-40 border-2 border-dashed border-zinc-800 rounded-md flex flex-col items-center justify-center text-zinc-400 bg-zinc-950 hover:bg-zinc-900 transition">
              <ImageIcon size={32} className="mb-2" />
              <span className="text-sm">{uploadingImage ? "Uploading..." : "Click to upload cover image"}</span>
              <input type="file" className="absolute opacity-0 w-full h-40 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
            </div>
          )}
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <label className="block text-sm font-medium text-zinc-300 mb-2">Content</label>
          <RichTextEditor
            value={formData.content}
            onChange={(val) => setFormData({ ...formData, content: val })}
          />
        </div>

        <div className="flex items-center justify-between bg-zinc-900 p-6 rounded-xl border border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-zinc-300 font-medium text-[13px]">Published</span>
          </label>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? "Saving..." : <><Save size={18} /> Update Blog Post</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
