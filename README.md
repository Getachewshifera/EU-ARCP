# EU-ARCP

EU-ARCP is scaffolded as an npm-workspaces application with a React/Vite client and an Express API.
The files under `client/src/components`, `client/src/pages`, and most of `server` are starter placeholders: their descriptions below explain their intended responsibilities, not features that have already been implemented.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Setup

From the project root, install all workspace dependencies:

```sh
npm install
```

Copy `client/.env.example` to `client/.env` and `server/.env.example` to `server/.env` if you need to override the local defaults.

Start the client and API in separate terminals:

```sh
npm run dev:client
npm run dev:server
```

The client runs on Vite's local development URL. The API listens on port 5000 by default, and `GET /api/health` provides a health check.

Build the client for production with:

```sh
npm run build
```

The feature folders and files are initial placeholders for subsequent implementation.

## File guide

### Project root

| File | Purpose |
| --- | --- |
| `package.json` | Defines the npm workspaces and root commands for starting the client/server and building the client. |
| `package-lock.json` | Locks the exact npm dependency versions installed for reproducible installs. |
| `.gitignore` | Keeps dependencies, build output, logs, environment files, and uploaded files out of Git. |
| `README.md` | Documents project setup, run/build commands, and the intended purpose of each scaffold file. |

### Client root and entry files

| File | Purpose |
| --- | --- |
| `client/package.json` | Declares the React/Vite client dependencies and its development, build, lint, and preview commands. |
| `client/.env.example` | Shows the client environment variable used to configure the API base URL. |
| `client/.gitignore` | Ignores client-local dependencies, build files, and editor artifacts. |
| `client/.oxlintrc.json` | Configures Oxlint rules for the client. |
| `client/vite.config.js` | Configures Vite and its React plugin. |
| `client/index.html` | HTML page template into which Vite mounts the React application. |
| `client/README.md` | Vite-generated client starter documentation. |
| `client/public/favicon.svg` | Browser tab icon served as a static client asset. |
| `client/public/icons.svg` | Shared SVG icon symbols available to the client. |
| `client/src/main.jsx` | Client entry point; loads Bootstrap and global styles, then mounts React. |
| `client/src/App.jsx` | Top-level React application component. |
| `client/src/App.css` | Starter component styles from the Vite template; available for app-specific styling. |
| `client/src/index.css` | Global application styles and page defaults. |
| `client/src/assets/hero.png` | Starter hero image asset from the Vite template. |
| `client/src/assets/react.svg` | Starter React logo asset from the Vite template. |
| `client/src/assets/vite.svg` | Starter Vite logo asset from the Vite template. |
| `client/src/assets/images/` | Location for application image assets. |
| `client/src/assets/icons/` | Location for application-specific icon assets. |
| `client/src/assets/styles/` | Location for shared stylesheets. |
| `client/public/images/` | Location for static images served directly by the client. |

### Client components

Components are reusable interface pieces intended to be shared by multiple pages.

| File | Intended purpose |
| --- | --- |
| `client/src/components/common/Button.jsx` | Reusable button with consistent application styling and states. |
| `client/src/components/common/Input.jsx` | Reusable, labeled form input. |
| `client/src/components/common/Modal.jsx` | Reusable modal dialog container. |
| `client/src/components/common/Loader.jsx` | Loading indicator for asynchronous UI. |
| `client/src/components/common/Pagination.jsx` | Controls for moving between result pages. |
| `client/src/components/common/ConfirmDialog.jsx` | Confirmation prompt for potentially consequential actions. |
| `client/src/components/layout/Navbar.jsx` | Shared top navigation bar. |
| `client/src/components/layout/Sidebar.jsx` | Shared side navigation for signed-in areas. |
| `client/src/components/layout/Footer.jsx` | Shared page footer. |
| `client/src/components/layout/DashboardLayout.jsx` | Common dashboard page frame containing navigation and page content. |
| `client/src/components/auth/LoginForm.jsx` | Login form and its input controls. |
| `client/src/components/auth/StudentRegistrationForm.jsx` | Registration form for student accounts. |
| `client/src/components/auth/LecturerRegistrationForm.jsx` | Registration form for lecturer accounts. |
| `client/src/components/auth/OTPForm.jsx` | Form for entering a one-time verification code. |
| `client/src/components/auth/PasswordForm.jsx` | Reusable password-entry or password-update form. |
| `client/src/components/materials/MaterialCard.jsx` | Summary card for a learning material. |
| `client/src/components/materials/MaterialSearch.jsx` | Search input and controls for finding materials. |
| `client/src/components/materials/MaterialFilters.jsx` | Filter controls for material results. |
| `client/src/components/materials/MaterialUploadForm.jsx` | Form for submitting a material and its metadata. |
| `client/src/components/materials/MaterialDetails.jsx` | Detailed material information and related actions. |
| `client/src/components/groups/GroupCard.jsx` | Summary card for a study group. |
| `client/src/components/groups/GroupForm.jsx` | Form for creating or editing a group. |
| `client/src/components/groups/GroupMembers.jsx` | Group member list and membership actions. |
| `client/src/components/groups/GroupChat.jsx` | Chat interface embedded in a group. |
| `client/src/components/chat/ChatWindow.jsx` | Conversation view that combines messages and message entry. |
| `client/src/components/chat/MessageList.jsx` | Rendered list of messages in a conversation. |
| `client/src/components/chat/MessageInput.jsx` | Composer for sending a chat message. |
| `client/src/components/chat/ConversationList.jsx` | List for choosing a private conversation. |
| `client/src/components/notifications/NotificationItem.jsx` | Single notification display and actions. |
| `client/src/components/notifications/NotificationList.jsx` | List of notifications. |
| `client/src/components/admin/StatCard.jsx` | Summary metric card for the administration dashboard. |
| `client/src/components/admin/UserTable.jsx` | Table of user accounts and administrative actions. |
| `client/src/components/admin/RegistrationTable.jsx` | Table of pending registration requests. |
| `client/src/components/admin/MaterialTable.jsx` | Administrative table of submitted materials. |
| `client/src/components/admin/ReportTable.jsx` | Table of reports submitted for review. |
| `client/src/components/admin/ActivityLogTable.jsx` | Table of recorded administrative/system activity. |

### Client pages

| File | Intended purpose |
| --- | --- |
| `client/src/pages/public/Home.jsx` | Public landing page. |
| `client/src/pages/public/Login.jsx` | Public login page. |
| `client/src/pages/public/Register.jsx` | Public account registration page. |
| `client/src/pages/public/RegistrationStatus.jsx` | Page showing the status of a registration request. |
| `client/src/pages/public/ForgotPassword.jsx` | Starts the password recovery process. |
| `client/src/pages/public/VerifyOTP.jsx` | Verifies a one-time code during account or password recovery. |
| `client/src/pages/public/ResetPassword.jsx` | Sets a replacement password after verification. |
| `client/src/pages/student/StudentDashboard.jsx` | Student landing dashboard. |
| `client/src/pages/student/Profile.jsx` | Student profile view and editing page. |
| `client/src/pages/student/Materials.jsx` | Browse and search available materials as a student. |
| `client/src/pages/student/MyMaterials.jsx` | View materials submitted by the current student. |
| `client/src/pages/student/UploadMaterial.jsx` | Student material submission page. |
| `client/src/pages/student/MaterialDetails.jsx` | Student-facing material detail page. |
| `client/src/pages/student/Groups.jsx` | Browse and manage a student's groups. |
| `client/src/pages/student/GroupDetails.jsx` | Student-facing group information and discussion page. |
| `client/src/pages/student/PrivateMessages.jsx` | Student private messaging page. |
| `client/src/pages/student/Notifications.jsx` | Student notification center. |
| `client/src/pages/student/ChangePassword.jsx` | Student password change page. |
| `client/src/pages/lecturer/LecturerDashboard.jsx` | Lecturer landing dashboard. |
| `client/src/pages/lecturer/Profile.jsx` | Lecturer profile view and editing page. |
| `client/src/pages/lecturer/Materials.jsx` | Browse and search available materials as a lecturer. |
| `client/src/pages/lecturer/MyMaterials.jsx` | View materials submitted by the current lecturer. |
| `client/src/pages/lecturer/UploadMaterial.jsx` | Lecturer material submission page. |
| `client/src/pages/lecturer/MaterialDetails.jsx` | Lecturer-facing material detail page. |
| `client/src/pages/lecturer/Groups.jsx` | Browse and manage a lecturer's groups. |
| `client/src/pages/lecturer/GroupDetails.jsx` | Lecturer-facing group information and discussion page. |
| `client/src/pages/lecturer/PrivateMessages.jsx` | Lecturer private messaging page. |
| `client/src/pages/lecturer/Notifications.jsx` | Lecturer notification center. |
| `client/src/pages/lecturer/ChangePassword.jsx` | Lecturer password change page. |
| `client/src/pages/admin/AdminDashboard.jsx` | Administration overview and summary metrics. |
| `client/src/pages/admin/RegistrationRequests.jsx` | Review and process registration requests. |
| `client/src/pages/admin/Users.jsx` | Manage platform user accounts. |
| `client/src/pages/admin/Universities.jsx` | Manage universities in the academic directory. |
| `client/src/pages/admin/AcademicStructure.jsx` | Manage colleges, departments, programs, and courses. |
| `client/src/pages/admin/Categories.jsx` | Manage material categories. |
| `client/src/pages/admin/Materials.jsx` | Moderate and manage platform materials. |
| `client/src/pages/admin/Groups.jsx` | Manage study groups. |
| `client/src/pages/admin/Reports.jsx` | Review and process user-submitted reports. |
| `client/src/pages/admin/ActivityLogs.jsx` | Review platform activity records. |
| `client/src/pages/admin/SystemSettings.jsx` | View and update system settings. |

### Client routing, data, and helpers

| File | Intended purpose |
| --- | --- |
| `client/src/routes/AppRoutes.jsx` | Declares the client URL routes and their page components. |
| `client/src/routes/ProtectedRoute.jsx` | Restricts routes to authenticated users. |
| `client/src/routes/RoleRoute.jsx` | Restricts routes to users with allowed roles. |
| `client/src/routes/routeConfig.js` | Shared route path and access configuration. |
| `client/src/services/api.js` | Shared HTTP client configuration for API requests. |
| `client/src/services/authService.js` | Client API calls for authentication and registration. |
| `client/src/services/userService.js` | Client API calls for user profiles and account data. |
| `client/src/services/materialService.js` | Client API calls for materials. |
| `client/src/services/groupService.js` | Client API calls for groups and memberships. |
| `client/src/services/chatService.js` | Client API calls for chat data. |
| `client/src/services/notificationService.js` | Client API calls for notifications. |
| `client/src/services/reportService.js` | Client API calls for reports. |
| `client/src/services/adminService.js` | Client API calls for administrative operations. |
| `client/src/context/AuthContext.jsx` | Shared client authentication state and actions. |
| `client/src/context/NotificationContext.jsx` | Shared notification state and actions. |
| `client/src/context/ChatContext.jsx` | Shared chat and conversation state. |
| `client/src/hooks/useAuth.js` | Hook for accessing authentication context. |
| `client/src/hooks/useFetch.js` | Reusable hook for loading data asynchronously. |
| `client/src/hooks/useSocket.js` | Hook for managing a real-time socket connection. |
| `client/src/hooks/useDebounce.js` | Hook for delaying rapidly repeated value updates, such as search input. |
| `client/src/utils/validators.js` | Shared client-side input validation helpers. |
| `client/src/utils/formatDate.js` | Shared date formatting helpers. |
| `client/src/utils/fileHelpers.js` | Shared file selection and file metadata helpers. |
| `client/src/utils/constants.js` | Shared client constants. |

### Server configuration and entry point

| File | Intended purpose |
| --- | --- |
| `server/package.json` | Declares Express server dependencies and commands for development and production. |
| `server/.env.example` | Documents the server port and allowed client origin environment variables. |
| `server/.gitignore` | Excludes server-local dependencies, environment secrets, uploads, and logs from Git. |
| `server/server.js` | Creates the Express app, configures middleware, exposes the health check, and starts the API. |
| `server/config/database.js` | Database connection configuration and setup. |
| `server/config/environment.js` | Centralized server environment variable loading and validation. |
| `server/config/storage.js` | File storage configuration. |

### Server models

Each model file is intended to define the data shape and persistence behavior for its named platform entity.

| File | Entity |
| --- | --- |
| `server/models/User.js` | User accounts and role/profile data. |
| `server/models/RegistrationRequest.js` | Account registration applications and their review status. |
| `server/models/University.js` | Universities. |
| `server/models/College.js` | Colleges belonging to universities. |
| `server/models/Department.js` | Departments belonging to colleges. |
| `server/models/Program.js` | Academic programs belonging to departments. |
| `server/models/Course.js` | Courses in academic programs. |
| `server/models/Category.js` | Material categories. |
| `server/models/Material.js` | Uploaded learning materials and metadata. |
| `server/models/Group.js` | Study groups and membership data. |
| `server/models/Message.js` | Group chat messages. |
| `server/models/PrivateMessage.js` | Messages in private conversations. |
| `server/models/Notification.js` | User notifications. |
| `server/models/Report.js` | User-submitted reports and their review status. |
| `server/models/ActivityLog.js` | Auditable platform activity records. |
| `server/models/SystemSetting.js` | Configurable platform settings. |

### Server request handling

| File | Intended purpose |
| --- | --- |
| `server/routes/authRoutes.js` | Maps authentication URLs to their handlers. |
| `server/routes/registrationRoutes.js` | Maps registration request URLs to their handlers. |
| `server/routes/userRoutes.js` | Maps user/profile URLs to their handlers. |
| `server/routes/universityRoutes.js` | Maps university management URLs to their handlers. |
| `server/routes/academicRoutes.js` | Maps academic structure URLs to their handlers. |
| `server/routes/categoryRoutes.js` | Maps category URLs to their handlers. |
| `server/routes/materialRoutes.js` | Maps material URLs to their handlers. |
| `server/routes/groupRoutes.js` | Maps group URLs to their handlers. |
| `server/routes/messageRoutes.js` | Maps group-message URLs to their handlers. |
| `server/routes/privateMessageRoutes.js` | Maps private-message URLs to their handlers. |
| `server/routes/notificationRoutes.js` | Maps notification URLs to their handlers. |
| `server/routes/reportRoutes.js` | Maps report URLs to their handlers. |
| `server/routes/adminRoutes.js` | Maps administrative URLs to their handlers. |
| `server/routes/settingRoutes.js` | Maps system setting URLs to their handlers. |
| `server/controllers/authController.js` | Handles authentication requests and responses. |
| `server/controllers/registrationController.js` | Handles registration submission and review requests. |
| `server/controllers/userController.js` | Handles user and profile requests. |
| `server/controllers/materialController.js` | Handles material requests. |
| `server/controllers/universityController.js` | Handles university requests. |
| `server/controllers/academicController.js` | Handles college, department, program, and course requests. |
| `server/controllers/categoryController.js` | Handles category requests. |
| `server/controllers/groupController.js` | Handles group and membership requests. |
| `server/controllers/messageController.js` | Handles group chat message requests. |
| `server/controllers/privateMessageController.js` | Handles private message requests. |
| `server/controllers/notificationController.js` | Handles notification requests. |
| `server/controllers/reportController.js` | Handles report submission and review requests. |
| `server/controllers/adminController.js` | Handles administrative dashboard and management requests. |

### Server services, middleware, and validation

| File | Intended purpose |
| --- | --- |
| `server/services/authService.js` | Authentication business logic. |
| `server/services/registrationService.js` | Registration processing and approval logic. |
| `server/services/usernameService.js` | Username generation and availability checks. |
| `server/services/passwordService.js` | Password hashing, verification, and related operations. |
| `server/services/otpService.js` | One-time code creation and verification. |
| `server/services/emailService.js` | Outbound email delivery. |
| `server/services/materialService.js` | Material business logic and data access. |
| `server/services/fileService.js` | File storage and retrieval operations. |
| `server/services/categoryValidationService.js` | Validation of material category references and rules. |
| `server/services/searchService.js` | Search and filtering logic. |
| `server/services/notificationService.js` | Notification creation and delivery logic. |
| `server/services/activityLogService.js` | Creation and retrieval of activity log entries. |
| `server/middleware/authMiddleware.js` | Authenticates requests before protected handlers run. |
| `server/middleware/roleMiddleware.js` | Authorizes requests according to user role. |
| `server/middleware/adminMiddleware.js` | Restricts requests to administrators. |
| `server/middleware/validationMiddleware.js` | Runs request validation and reports invalid input. |
| `server/middleware/uploadMiddleware.js` | Parses and constrains uploaded files. |
| `server/middleware/rateLimitMiddleware.js` | Limits repeated requests to protect API endpoints. |
| `server/middleware/errorMiddleware.js` | Converts application errors into consistent HTTP responses. |
| `server/middleware/notFoundMiddleware.js` | Handles requests that do not match an API route. |
| `server/validators/authValidator.js` | Validates authentication request data. |
| `server/validators/registrationValidator.js` | Validates registration request data. |
| `server/validators/materialValidator.js` | Validates material request data. |
| `server/validators/groupValidator.js` | Validates group request data. |
| `server/validators/userValidator.js` | Validates user and profile request data. |

### Server real-time, jobs, seed data, tests, and utilities

| File | Intended purpose |
| --- | --- |
| `server/sockets/socket.js` | Creates and configures the real-time socket server. |
| `server/sockets/groupChatSocket.js` | Handles real-time group chat events. |
| `server/sockets/privateChatSocket.js` | Handles real-time private chat events. |
| `server/jobs/activationCleanup.js` | Periodically cleans up expired, unactivated accounts or requests. |
| `server/seeders/adminSeeder.js` | Creates initial administrator data for local setup. |
| `server/seeders/categorySeeder.js` | Creates initial material categories. |
| `server/seeders/universitySeeder.js` | Creates initial university data. |
| `server/tests/auth.test.js` | Tests authentication behavior. |
| `server/tests/registration.test.js` | Tests registration behavior. |
| `server/tests/materials.test.js` | Tests material behavior. |
| `server/tests/authorization.test.js` | Tests access control and role authorization. |
| `server/utils/generateUsername.js` | Shared username generation helper. |
| `server/utils/generatePassword.js` | Shared secure password generation helper. |
| `server/utils/generateOTP.js` | Shared one-time code generation helper. |
| `server/utils/token.js` | Shared token creation and verification helpers. |
| `server/utils/constants.js` | Shared server constants. |
| `server/utils/logger.js` | Shared server logging setup. |

### Documentation files

| File | Purpose |
| --- | --- |
| `docs/system-requirements.md` | Records functional and non-functional system requirements. |
| `docs/api-documentation.md` | Describes API endpoints, request data, and responses. |
| `docs/database-design.md` | Describes entities, fields, and database relationships. |
| `docs/authentication-flow.md` | Explains registration, verification, login, and password recovery flows. |
| `docs/material-system.md` | Describes material upload, discovery, and moderation. |
| `docs/chat-system.md` | Describes group and private messaging behavior. |
| `docs/deployment.md` | Describes environment configuration and deployment steps. |
