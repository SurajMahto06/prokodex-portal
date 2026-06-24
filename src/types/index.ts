export type Role = "admin" | "mentor" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  plan?: "premium" | "elite" | "standard" | "none";
  status?: "active" | "inactive" | "pending";
  // Student specific
  enrolledCourseIds?: string[];
  progressPercentage?: number;
  completedTopicIds?: string[];
  inProgressTopicIds?: string[];
  // Mentor specific
  assignedCourseIds?: string[];
  menteeIds?: string[];
  mentees?: any[];
  mentors?: any[];
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
}

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  hints: string[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface Topic {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  mcqs: MCQQuestion[];
  interviewQuestions: InterviewQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalTopics: number;
  topics?: string[]; // Topic IDs
}

export interface QAReply {
  id: string;
  authorName?: string;
  authorRole?: "student" | "mentor" | "admin";
  author?: { id: string; name: string; avatarUrl?: string; role?: string };
  content: string;
  date?: string;
  createdAt?: string | Date;
  imageUrls?: string[];
}

export interface MentorshipQA {
  id: string;
  studentName?: string;
  student?: { id: string; name: string; avatarUrl?: string; role?: string };
  courseId: string;
  course?: { id: string; title: string };
  question: string;
  imageUrls?: string[];
  replies: QAReply[];
  status: "pending" | "answered";
  date?: string;
  createdAt?: string | Date;
}

export interface AppNotification {
  id: string;
  userId: string | 'all'; // 'all' for system-wide, or specific user ID
  targetRole?: Role; // If userId is 'all', restrict by role
  title: string;
  message: string;
  isRead: boolean;
  date: string;
  type: 'info' | 'success' | 'warning' | 'alert';
}

export interface Assignment {
  id: string;
  studentId: string;
  mentorId: string;
  courseId: string;
  title: string;
  description: string;
  status: 'pending_submission' | 'submitted' | 'approved' | 'rejected';
  repoUrl?: string;
  fileName?: string;
  fileUrl?: string;
  assignedAt: string;
  dueDate?: string;
  submittedAt?: string;
  // Populated by API includes
  student?: { id: string; name: string; email?: string; avatarUrl?: string };
  course?: { id: string; title: string };
  mentor?: { id: string; name: string; email?: string; avatarUrl?: string };
}

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  certificateId: string;
  issueDate: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

