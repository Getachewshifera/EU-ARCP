# Chat system

The platform provides group conversations and direct conversations for authenticated users. MongoDB remains the source of truth for conversations, messages, membership, and read state. Express REST endpoints perform message writes and enforce account, conversation, group-membership, and moderation permissions. Socket.IO carries live message updates, online presence, typing indicators, and private message delivery/read receipts; clients cannot write messages directly over sockets.

## Features

- Search active students and lecturers and start a private conversation.
- Create and manage public/private groups, including group type, description, image, membership, and group-admin assignments.
- Send text messages and PDF, DOC, DOCX, PPT, or PPTX attachments (maximum 20 MB); reply to group messages and delete your own messages.
- Group owners/admins and platform administrators can remove members and moderate group messages.
- Paginate message history; display timestamps, sender profiles, private delivery/read state, online status, and typing indicators.
- Administrators can enable or disable chat platform-wide in **Admin → System settings**.

## Storage and deployment

Message metadata is stored in MongoDB. Chat attachments and group images use the existing private Supabase Storage bucket configured by `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`; downloads use short-lived signed URLs. Do not expose the service-role key to the client.

Configure `CLIENT_ORIGIN` on the server with the exact comma-separated frontend origins permitted by Socket.IO CORS. Set `VITE_API_URL` in the client to the API base URL, and use HTTPS/WSS in production. Hosting must allow persistent WebSocket connections. The current online-presence map is process-local, so deployments with multiple API instances need a shared Socket.IO adapter and appropriate load-balancer support for consistent cross-instance presence and room events.

The global chat switch is checked by chat REST middleware and Socket.IO room/typing handlers. Authorization is still checked for every REST message operation and room join; hiding a client control is not an authorization boundary.