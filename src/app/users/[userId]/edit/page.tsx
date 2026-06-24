"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/dashboard/auth-provider";
import { ArrowLeft, Edit, ShieldAlert, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { AccessDenied } from "@/components/ui/access-denied";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { coursesService } from "@/services/courses";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormInput, FormSelect } from "@/components/ui/form-field";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  role: z.enum(["student", "mentor", "admin"]),
  status: z.enum(["active", "pending", "inactive"]),
  plan: z.enum(["premium", "elite", "standard"]).optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const methods = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
      status: "active",
      plan: "premium",
    },
  });

  const { watch, handleSubmit, reset, formState: { errors } } = methods;
  const selectedRole = watch("role");

  const [assignedCourses, setAssignedProjects] = useState<string[]>([]);

  // Fetch the existing user data
  const { data: existingUser, isLoading: isLoadingUser, isError: isErrorUser } = useQuery({
    queryKey: ['users', resolvedParams.userId],
    queryFn: () => usersService.getUserById(resolvedParams.userId),
    enabled: user?.role === "admin" && !!resolvedParams.userId,
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesService.getCourses(),
    enabled: user?.role === "admin",
  });

  // Populate form when data loads
  useEffect(() => {
    if (existingUser) {
      reset({
        name: existingUser.name || "",
        email: existingUser.email || "",
        password: "", // Leave blank to not change
        role: (existingUser.role?.toLowerCase() || "student") as any,
        plan: (existingUser.plan?.toLowerCase() || "premium") as any,
        status: (existingUser.status?.toLowerCase() || "active") as any,
      });

      // Extract course IDs correctly depending on the role
      if (existingUser.role?.toLowerCase() === "student" && existingUser.enrolledCourseIds) {
        setAssignedProjects(existingUser.enrolledCourseIds);
      } else if (existingUser.role?.toLowerCase() === "mentor" && existingUser.assignedCourseIds) {
        setAssignedProjects(existingUser.assignedCourseIds);
      }
    }
  }, [existingUser, reset]);

  const updateMutation = useMutation({
    mutationFn: (userData: any) => usersService.updateUser(resolvedParams.userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => {
        router.push("/users");
      }, 1500);
    },
  });

  if (user?.role !== "admin") {
    return <AccessDenied />;
  }

  if (isLoadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading user details...</p>
      </div>
    );
  }

  if (isErrorUser || !existingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-lg md:text-2xl font-bold text-white mb-2">User Not Found</h1>
        <p className="text-zinc-400 mb-6">The user you are trying to edit does not exist or has been deleted.</p>
        <Link href="/users">
          <Button variant="secondary">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const handleCourseToggle = (courseId: string) => {
    setAssignedProjects(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const onSubmit = (data: UserFormValues) => {
    const updatedData: any = {
      name: data.name,
      email: data.email,
      role: data.role.toUpperCase(),
      plan: data.role === "student" ? data.plan : undefined,
      status: data.status,
      enrolledCourseIds: data.role === "student" ? assignedCourses : undefined,
      assignedCourseIds: data.role === "mentor" ? assignedCourses : undefined,
    };

    if (data.password && data.password.trim() !== "") {
      updatedData.password = data.password;
    }

    updateMutation.mutate(updatedData);
  };

  return (
    <div className="w-full pb-12 ">
      <Link href="/users" className="inline-flex items-center text-[13px] font-medium text-zinc-400 hover:text-cyan-400 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </Link>

      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold tracking-tight text-white mb-6 flex items-center">
          <Edit className="w-8 h-8 mr-3 text-cyan-400" />
          Edit User
        </h1>
        <p className="text-zinc-400">Update user details, roles, and course access.</p>
      </div>

      <Card className="p-8 relative">
        {updateMutation.isSuccess && (
          <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4 animate-bounce" />
            <h2 className="text-base font-bold text-white">User Updated!</h2>
            <p className="text-zinc-400 mt-2">Redirecting to user management...</p>
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {updateMutation.isError && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-900/50 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-[13px] text-red-200 leading-relaxed">
                  {(updateMutation.error as any)?.response?.data?.message || "Failed to update user. Please try again."}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput name="name" label="Full Name" placeholder="John Doe" />
              <FormInput name="email" label="Email Address" type="email" placeholder="john@example.com" />
              <FormInput name="password" label="New Password (Leave blank to keep current)" type="password" placeholder="••••••••" />

              <FormSelect
                name="role"
                label="Account Role"
                options={[
                  { label: "Student", value: "student" },
                  { label: "Mentor", value: "mentor" },
                  { label: "Administrator", value: "admin" }
                ]}
              />

              <FormSelect
                name="status"
                label="Account Status"
                options={[
                  { label: "Active", value: "active" },
                  { label: "Pending", value: "pending" },
                  { label: "Inactive", value: "inactive" }
                ]}
              />

              {selectedRole === "student" && (
                <FormSelect
                  name="plan"
                  label="Subscription Plan"
                  options={[
                    { label: "Premium Plan", value: "premium" },
                    { label: "Elite Plan", value: "elite" },
                    { label: "Standard Plan", value: "standard" }
                  ]}
                />
              )}
            </div>

            {(selectedRole === "student" || selectedRole === "mentor") && (
              <div className=" pt-8">
                <h3 className="text-sm font-semibold text-white mb-2">
                  {selectedRole === "student" ? "Enroll in Courses" : "Assign Projects to Mentor"}
                </h3>
                <p className="text-zinc-400 text-[13px] mb-4">
                  {selectedRole === "student" ? "Select the courses this user should have access to." : "Select the projects this mentor should oversee."}
                </p>

                {isLoadingCourses ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-cyan-500" /></div>
                ) : courses.length === 0 ? (
                  <p className="text-zinc-500 italic">No courses available. Create a course first.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course: any) => (
                      <label
                        key={course.id}
                        className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${assignedCourses.includes(course.id)
                          ? 'border-cyan-500 bg-cyan-500/5'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                          }`}
                      >
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-950"
                            checked={assignedCourses.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                          />
                        </div>
                        <div className="ml-3 text-[13px]">
                          <span className="font-medium text-white block">{course.title}</span>
                          <span className="text-zinc-500">{course.totalTopics || 0} Topics</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4  pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Card>
    </div>
  );
}
