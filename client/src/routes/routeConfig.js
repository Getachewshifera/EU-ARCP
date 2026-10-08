// Purpose: Shared route path and access configuration.
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyOtp: '/verify-otp',
  resetPassword: '/reset-password',
  registrationStatus: '/registration-status',
  materials: '/materials',
  admin: '/admin',
  student: '/student',
  lecturer: '/lecturer',
}

export const roleRoutes = {
  admin: routes.admin,
  student: routes.student,
  lecturer: routes.lecturer,
}
