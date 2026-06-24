export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    COMPLETE_TOPIC: '/auth/me/complete-topic',
  },
  ME: {
    MENTEES: '/me/mentees',
    MENTORS: '/me/mentors',
    COURSES: '/me/courses',
  },
  USERS: {
    ROOT: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  COURSES: {
    ROOT: '/courses',
    BY_ID: (id: string) => `/courses/${id}`,
  },
  MODULES: {
    ROOT: '/modules',
    BY_ID: (id: string) => `/modules/${id}`,
  },
  TOPICS: {
    ROOT: '/topics',
    BY_ID: (id: string) => `/topics/${id}`,
  },
  ASSIGNMENTS: {
    ROOT: '/assignments',
    BY_ID: (id: string) => `/assignments/${id}`,
  },
  UPLOAD: {
    ROOT: '/upload',
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    PDF: '/upload/pdf',
    DOCUMENT: '/upload/document',
  },
  CERTIFICATES: {
    ROOT: '/certificates',
    BY_ID: (id: string) => `/certificates/${id}`,
    VERIFY: (id: string) => `/certificates/verify/${id}`,
    ISSUE: '/certificates/issue',
  },
  STATS: {
    ROOT: '/stats',
  }
};
