// Purpose: Declares the client URL routes and their page components.
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import AcademicStructure from '../pages/admin/AcademicStructure.jsx'
import ActivityLogs from '../pages/admin/ActivityLogs.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import Categories from '../pages/admin/Categories.jsx'
import Groups from '../pages/admin/Groups.jsx'
import Materials from '../pages/admin/Materials.jsx'
import RegistrationRequests from '../pages/admin/RegistrationRequests.jsx'
import Reports from '../pages/admin/Reports.jsx'
import SystemSettings from '../pages/admin/SystemSettings.jsx'
import Universities from '../pages/admin/Universities.jsx'
import Users from '../pages/admin/Users.jsx'
import LecturerChangePassword from '../pages/lecturer/ChangePassword.jsx'
import LecturerGroupDetails from '../pages/lecturer/GroupDetails.jsx'
import LecturerGroups from '../pages/lecturer/Groups.jsx'
import LecturerDashboard from '../pages/lecturer/LecturerDashboard.jsx'
import LecturerMaterialDetails from '../pages/lecturer/MaterialDetails.jsx'
import LecturerMaterials from '../pages/lecturer/Materials.jsx'
import LecturerMyMaterials from '../pages/lecturer/MyMaterials.jsx'
import LecturerNotifications from '../pages/lecturer/Notifications.jsx'
import LecturerPrivateMessages from '../pages/lecturer/PrivateMessages.jsx'
import LecturerProfile from '../pages/lecturer/Profile.jsx'
import LecturerUploadMaterial from '../pages/lecturer/UploadMaterial.jsx'
import ForgotPassword from '../pages/public/ForgotPassword.jsx'
import Home from '../pages/public/Home.jsx'
import Login from '../pages/public/Login.jsx'
import PublicMaterialDetails from '../pages/public/MaterialDetails.jsx'
import PublicMaterials from '../pages/public/Materials.jsx'
import Register from '../pages/public/Register.jsx'
import RegistrationStatus from '../pages/public/RegistrationStatus.jsx'
import ResetPassword from '../pages/public/ResetPassword.jsx'
import VerifyOTP from '../pages/public/VerifyOTP.jsx'
import StudentChangePassword from '../pages/student/ChangePassword.jsx'
import StudentGroupDetails from '../pages/student/GroupDetails.jsx'
import StudentGroups from '../pages/student/Groups.jsx'
import StudentMaterialDetails from '../pages/student/MaterialDetails.jsx'
import StudentMaterials from '../pages/student/Materials.jsx'
import StudentMyMaterials from '../pages/student/MyMaterials.jsx'
import StudentNotifications from '../pages/student/Notifications.jsx'
import StudentPrivateMessages from '../pages/student/PrivateMessages.jsx'
import StudentProfile from '../pages/student/Profile.jsx'
import StudentDashboard from '../pages/student/StudentDashboard.jsx'
import StudentUploadMaterial from '../pages/student/UploadMaterial.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'

function NotFound() {
  return (
    <main className="container py-5 text-center">
      <h1>Page not found</h1>
      <p className="text-secondary">This address does not match an available page.</p>
      <Link className="btn btn-primary" to="/">Return home</Link>
    </main>
  )
}

function AdminArea() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['admin']}>
        <AdminLayout />
      </RoleRoute>
    </ProtectedRoute>
  )
}

function StudentArea() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['student']}>
        <DashboardLayout role="student" />
      </RoleRoute>
    </ProtectedRoute>
  )
}

function LecturerArea() {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={['lecturer']}>
        <DashboardLayout role="lecturer" />
      </RoleRoute>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/materials" element={<PublicMaterials />} />
        <Route path="/materials/:id" element={<PublicMaterialDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/registration-status" element={<RegistrationStatus />} />

        <Route path="/admin" element={<AdminArea />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="registrations" element={<RegistrationRequests />} />
          <Route path="universities" element={<Universities />} />
          <Route path="academic" element={<AcademicStructure />} />
          <Route path="categories" element={<Categories />} />
          <Route path="materials" element={<Materials />} />
          <Route path="groups" element={<Groups />} />
          <Route path="reports" element={<Reports />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>

        <Route path="/student" element={<StudentArea />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="materials" element={<StudentMaterials />} />
          <Route path="materials/:id" element={<StudentMaterialDetails />} />
          <Route path="my-materials" element={<StudentMyMaterials />} />
          <Route path="upload" element={<StudentUploadMaterial />} />
          <Route path="groups" element={<StudentGroups />} />
          <Route path="groups/:id" element={<StudentGroupDetails />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="messages" element={<StudentPrivateMessages />} />
          <Route path="password" element={<StudentChangePassword />} />
        </Route>

        <Route path="/lecturer" element={<LecturerArea />}>
          <Route index element={<LecturerDashboard />} />
          <Route path="profile" element={<LecturerProfile />} />
          <Route path="materials" element={<LecturerMaterials />} />
          <Route path="materials/:id" element={<LecturerMaterialDetails />} />
          <Route path="my-materials" element={<LecturerMyMaterials />} />
          <Route path="upload" element={<LecturerUploadMaterial />} />
          <Route path="groups" element={<LecturerGroups />} />
          <Route path="groups/:id" element={<LecturerGroupDetails />} />
          <Route path="notifications" element={<LecturerNotifications />} />
          <Route path="messages" element={<LecturerPrivateMessages />} />
          <Route path="password" element={<LecturerChangePassword />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
