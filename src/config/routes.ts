export const PATHS = {
  DASHBOARD: '/',
  LOGIN: '/login',
  PROFILE: '/profile',
  QA: '/qa',
  ASSIGNMENTS: '/assignments',
  NOTIFICATIONS: '/notifications',
  MENTEES: '/mentees',
  SETTINGS: '/settings',
  CERTIFICATES: {
    ROOT: '/certificates',
    ISSUE: '/issue-certificate',
    NEW: '/issue-certificate/new',
  },
  COURSES: {
    ROOT: '/courses',
    NEW: '/courses/new',
    VIEW: (id: string) => `/courses/${id}`,
    EDIT: (id: string) => `/courses/${id}/edit`,
  },
  USERS: {
    ROOT: '/users',
    NEW: '/users/new',
    EDIT: (id: string) => `/users/${id}/edit`,
  },
  TOPICS: {
    VIEW: (id: string) => `/topic/${id}`,
    INTERVIEW: (id: string) => `/topic/${id}/interview`,
    MCQ: (id: string) => `/topic/${id}/mcq`,
  }
};
