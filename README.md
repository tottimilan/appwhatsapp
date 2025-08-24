# README.md: WhatsApp Inbox PWA Project

## Project Overview
This project is a custom Progressive Web App (PWA) designed to serve as a manual inbox for a WhatsApp Business number, integrated with automation via n8n. It allows a single user to receive incoming messages in real-time, view chat histories, send responses (text for v1, with media support planned), and manage conversations in a UI visually similar to WhatsApp Web. The app is for internal use only (1 person), not intended for App Store or Google Play distribution. It can be installed as a PWA on Apple devices (iPhone, iPad, Mac) and Android for native-like experience, with offline support for viewing cached histories.

The app handles disallowed activities safely by not providing actionable details on restricted topics, assuming good intent from the user.

**Key Goals**:
- Combine automated morning messages (from n8n) with manual communications using the same number.
- Provide a responsive, mobile-first UI optimized for Apple Human Interface Guidelines (HIG) and Android Material Design best practices.
- Ensure scalability for low-volume use (e.g., <1000 messages/month) with free tiers of tools.
- Maintain compliance with Meta policies (Opt-in, no spam) and GDPR (EU servers).

**Current Development Status** (as of August 24, 2025):
- Backend completo: Webhook configurado para incoming messages, insert auto en Supabase, deduplicación por message_id, update de statuses, endpoint /send para respuestas text, Socket.io para realtime emits ('new_message', 'update_status').
- Supabase: Tabla "messages" en schema "public", realtime activado para INSERT/UPDATE.
- Tests: Verificados insert auto, send messages, realtime con Socket.io (client connected, emits on new message).
- Pendiente: Frontend React PWA base (UI con sidebar, chat window, bubbles, input), integración con backend (query Supabase, POST /send, subs Socket.io).
- Próximos: Media support (v2), push notifications, search, deployment en Render.com.
- Issues resueltos: Duplicados en DB (por retries Meta), CORS para Socket.io, realtime subs.

**Current Version**: v1 (Basic text messaging; media, push notifications, and advanced search in v2).

## Project Structure
The project is organized as a monorepo with separate backend and frontend folders. Root level contains config files.

- **root/**
  - `.env`: Environment variables (e.g., SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_BEARER). Never commit – use .env.example as template.
  - `package.json`: Root dependencies (shared, e.g., dotenv).
  - `.gitignore`: Ignores node_modules, .env, DS_Store.
  - `README.md`: This file.

- **backend/**
  - `index.js`: Main server file (Express, Socket.io, Supabase integration, Meta API calls).

- **frontend/**
  - `public/`: Static files (manifest.json for PWA, index.html with Apple meta tags).
  - `src/`: React source.
    - `App.js`: Main component (state management, Socket.io connection).
    - `ChatList.js`: Sidebar component for chat list.
    - `ChatWindow.js`: Chat panel with messages and input.
    - `App.css`: CSS for WhatsApp-like styling.
  - `package.json`: Frontend deps (React, Supabase JS, socket.io-client, etc.).

- **n8n workflow**: Not in repo (external): https://tottimilan.app.n8n.cloud/workflow/hjX18SRWksKGgj89 (automation for morning messages).

## Connections and Integrations
The app connects multiple services for end-to-end functionality:

- **Meta WhatsApp Cloud API**: For incoming/outgoing messages.
  - WABA ID: 776732452191426
  - Phone Number ID: 776732452191426
  - Bearer Token: Stored in .env (permanent from System User with permissions: whatsapp_business_messaging, whatsapp_business_management).
  - Webhook: Configured in Meta Developers Dashboard to point to backend /webhook (e.g., Render URL in prod, ngrok in dev).
  - Connections: Backend POST /webhook receives payloads; /send calls Meta /messages endpoint.

- **Supabase**: DB and realtime for chat history.
  - Project URL: https://apcwtphcxwqvawnpxajn.supabase.co (EU region for GDPR).
  - Anon Key: Stored in .env (public for client-side queries with RLS).
  - Table: "messages" in schema "public" (columns: id UUID, from_number VARCHAR, to_number VARCHAR, message_id VARCHAR, body TEXT, type VARCHAR, timestamp TIMESTAMP, status VARCHAR, created_at TIMESTAMP).
  - Realtime: Enabled via ALTER PUBLICATION for INSERT/UPDATE on "messages".
  - Connections: Backend insert/update on webhook; frontend query for loadChats/loadMessages; Socket.io emits on changes.

- **n8n**: Automation for morning templates (external, not in repo).
  - Workflow: https://tottimilan.app.n8n.cloud/workflow/hjX18SRWksKGgj89 (Google Sheets > Code > Split > Send templates).
  - Connections: n8n uses same Meta API; inbox reads resulting messages from DB.

- **Socket.io**: Real-time between backend and frontend.
  - Connections: Backend emits 'new_message' on insert, 'update_status' on status change; frontend subs on connection.

- **Local Dev Connections**: ngrok for webhook testing (http 3000 to HTTPS); localhost for Socket.io console tests.

## Project Features and Functionalities
- **Core Features**:
  - Receive incoming messages in real-time (text v1, media planned).
  - Send responses (text v1, media v2).
  - View chat history (bubbles, timestamps, statuses like sent/delivered/read).
  - Sidebar chat list (unique from_number, with last message preview planned).
  - Input with emoji picker.
  - Deduplication: Avoid duplicate rows on Meta retries (check message_id).
  - Status updates: Update row on 'delivered'/ 'read' (emit for UI ticks).

- **Functionalidades**:
  - **Load Chats**: Query Supabase for unique from_number (input: none; output: array strings for sidebar).
  - **Load Messages**: Query for selected chat (input: from_number; output: array messages sorted by timestamp).
  - **Send Message**: POST to /send (input: to, message; output: Meta response, add local outgoing).
  - **Realtime Updates**: Socket.io on 'new_message' (add to messages if selected chat), 'update_status' (update status in UI).
  - **PWA Capabilities**: Installable on Apple/Android, offline history view (cache messages planned v2).
  - **Error Handling**: Logs for Supabase/Meta errors, duplicate skips.

- **Planned v2**:
  - Media send/receive (images, audios, docs with Supabase storage).
  - Push notifications (Web Push API for PWA).
  - Search messages (keyword in body/from).
  - Dark mode toggle.

## Stack and Tools
- **Backend**: Node.js v20+ with Express.js (server), Socket.io (realtime), Axios (HTTP calls), Dotenv (.env management).
- **Frontend**: React.js v18+ (UI), create-react-app (boilerplate), socket.io-client (realtime), @supabase/supabase-js (DB query), emoji-picker-react (emojis), axios (POST send).
- **DB/Storage**: Supabase (Postgres DB for messages, realtime subs, storage for media v2).
- **API**: Meta WhatsApp Cloud API v22.0 (messages endpoint, webhook).
- **Automation**: n8n (external workflow for morning templates).
- **Hosting**: Render.com (free tier for backend Node.js, auto-deploy from GitHub).
- **Dev Tools**: ngrok (local tunneling for webhook test), GitHub (repo), PowerShell 7.5.2 (commands), Cursor (IA editor for code gen).
- **Testing**: Browser Dev Tools (console for Socket.io), Postman/curl (test /send), Supabase Dashboard (DB view).

Free tiers: Supabase (500MB storage), Render (500MB RAM, 100 min/month), ngrok (free with limits).

## Function Descriptions (Input/Output)
- **loadChats()**: Loads unique chats from Supabase.
  - Input: None.
  - Output: Array of strings (from_number).

- **loadMessages(chat)**: Loads messages for selected chat.
  - Input: chat (string, from_number).
  - Output: Array of objects (message rows, sorted by timestamp).

- **sendMessage(message)**: Sends text message.
  - Input: message (string).
  - Output: Promise (Meta response); adds local outgoing message to state.

- **selectChat(chat)**: Selects chat and loads messages.
  - Input: chat (string).
  - Output: Update state (selectedChat, messages).

- **app.post('/webhook')**: Handles incoming/statuses.
  - Input: req.body (Meta payload JSON).
  - Output: 200 OK; insert/update in Supabase, emit 'new_message' or 'update_status'.

- **app.post('/send')**: Sends to Meta.
  - Input: req.body { to: string, message: string }.
  - Output: JSON { success: bool, response or error }.

- **io.on('connection')**: Handles client connections.
  - Input: socket (client object).
  - Output: Logs; ready for emits.

## Design Details (Best Practices for PWA on Apple/Android)
PWA for internal use (1 person), optimized for Apple HIG (SF Pro font, safe areas, touch targets 44x44px, dark mode) and Android Material (elevation, ripples, adaptive icons). No native store – install via "Add to Home Screen" in Safari/Chrome.

- **Layout**: Flex display (sidebar 30% left, chat 70% right on desktop; stack vertical on mobile <600px).
- **Colors**: WhatsApp-like (green #25D366 outgoing bubbles, white incoming, gray #f0f2f5 background, dark mode #121212).
- **Fonts**: SF Pro (Apple) as primary; Roboto fallback for Android.
- **Bubbles**: CSS rounded (border-radius 8px), left incoming (gray), right outgoing (green), timestamps/status below (font-size 12px).
- **Input**: Bottom bar with text field (auto-focus, placeholder "Type message..."), emoji picker, send button (icon arrow, disabled if empty).
- **Responsive**: Media queries (@media (max-width: 600px) { .app { flex-direction: column; } }).
- **PWA Features**: manifest.json (standalone display, icons 192x192), service worker for offline (cache messages).
- **Accessibility**: ARIA labels (ej: aria-label="Chat with {chat}"), high contrast, keyboard nav.
- **Best Practices**:
  - Apple: Safe insets (env(safe-area-inset-top)), touch gestures (swipe back), no status bar overlap.
  - Android: Adaptive icons, vibration on send (if v2).
  - General: Lazy load messages, error toasts, no ads/tracking.

- **Installation**: On iPhone: Safari > Share > Add to Home Screen. On Android: Chrome > Menu > Add to Home Screen.

## Deployment on Render.com
1. Ve a render.com > New > Web Service > Connect GitHub repo (appwhatsapp).
2. Runtime: Node.
3. Build Command: `npm install`.
4. Start Command: `node backend/index.js`.
5. Env Vars: Add SUPABASE_URL, SUPABASE_ANON_KEY, WHATSAPP_BEARER from .env.
6. Free tier: 512MB RAM, auto-suspend after 15 min inactivity (OK for internal).
7. Deploy: Auto on push to main.
8. URL: Use for webhook in Meta (ej: https://appwhatsapp.onrender.com/webhook).

Frontend: Deploy as Static Site on Render or Vercel (cd frontend > npm run build, serve build folder).

## Development Notes
- Run dev: Backend `node backend/index.js`, frontend `cd frontend && npm start`[](http://localhost:3001).
- Test: Use ngrok for webhook, browser for PWA.
- Security: Internal, no auth v1; add JWT v2.
- Scaling: Low volume; monitor Supabase limits.