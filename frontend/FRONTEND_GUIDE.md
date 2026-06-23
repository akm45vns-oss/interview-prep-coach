# 🧠 Interview AI Coach - Frontend Architecture Guide

This document describes the design system, file structures, state management flow, and routing configurations that power the **Interview AI Coach** frontend.

---

## 🎨 1. Global Styling & Design System
* **Primary Stylesheet ([index.css](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/index.css))**:
  * **Theme**: Deep space theme (`#04040c`) styled with multiple high-blur radial gradients (`radial-gradient`) in the corners to create a futuristic neon ambient glow.
  * **Typography**: Uses `Plus Jakarta Sans` for clean, modern headings and general interface copy, with `JetBrains Mono` for code elements.
  * **Glassmorphism**: Contains custom classes like `.glass` and `.glass-card` containing frosted-glass backdrops (`backdrop-blur-xl`), transparent border boundaries (`border-white/[0.05]`), and dark drop shadows.
  * **Micro-Animations**:
    * `.animate-float`: Floating keyframes that gently bounce icons or trophies.
    * `.animate-pulse-glow`: Cycling border shadows for active containers.
    * `.wave-bar`: Multi-frequency bar scaling to simulate audio waves during AI response generation.
* **Theme Configuration ([tailwind.config.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/tailwind.config.js))**:
  * Extends default color scales with `brand` (Indigo-based palette) and `surface` (custom ultra-dark slate tones).
  * Outlines animations for slide-ups, fades, pulses, and glows.

---

## 🚦 2. Application Routing & Shell Layout
* **Routing Shell ([App.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/App.jsx))**:
  * Employs **React Router DOM v6** for client-side routing.
  * Implements `ProtectedRoute` (verifies presence of a JWT token, redirecting guests to `/login`) and `GuestRoute` (redirects logged-in users to `/dashboard`).
  * Injects a global `<Toaster>` component from `react-hot-toast` for custom-styled alerts.
* **Layout Wrapper ([Layout.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/layout/Layout.jsx))**:
  * Glues the main navigation and view components together.
  * Employs Framer Motion's `AnimatePresence` mode with route-keyed location paths. This automatically triggers a fade-in and slide-up transition whenever the user navigates between views.
* **Navigation Bar ([Sidebar.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/layout/Sidebar.jsx))**:
  * Glassmorphic sidebar containing main links: **Dashboard**, **Resume & ATS**, **Mock Interview**, and **Learning Roadmap**.
  * Implements a sliding indicator highlight (`layoutId="activeTabGlow"`) that animates smoothly from one tab to another on click.
  * Displays user profile details and triggers auth state logouts.

---

## 📦 3. Global State Management (Zustand)
Zustand is used for fast, lightweight state management without complex boilerplate:
* **Authentication Store ([authStore.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/store/authStore.js))**:
  * Persists session token and user profile model to `localStorage` using the `persist` middleware.
  * Exports `setAuth` (register/login action), `logout` (flushes state), and `updateUser` methods.
* **Active Interview Store ([interviewStore.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/store/interviewStore.js))**:
  * Controls active simulation telemetry.
  * Stores the active `session` details, current question index (`currentIndex`), a dictionary of completed evaluations (`answers`), evaluation loading state (`isEvaluating`), and final diagnostic summaries (`summary`).

---

## 🔌 4. API & Network Layer (Axios)
* **HTTP Client Base ([client.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/api/client.js))**:
  * Configures default Axios attributes (`baseURL` set to `/api` proxy for local dev or production URL, timeout values).
  * **Request Interceptor**: Extracts the JWT token from `authStore` and injects it into the HTTP headers (`Authorization: Bearer <JWT>`) for secure endpoints.
  * **Response Interceptor**: Automatically intercepts `401 Unauthorized` responses to clear auth states and redirect expired sessions to `/login`.
* **API Modules**:
  * **[auth.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/api/auth.js)**: Integrates registration, login, and retrieval of active user details.
  * **[resume.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/api/resume.js)**: Handles uploading resumes, parsing technical experiences, and triggering ATS score evaluations.
  * **[interview.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/api/interview.js)**: Launches session creation, fetches questions, submits answers for LLM review, and retrieves final diagnostic summaries.
  * **[dashboard.js](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/api/dashboard.js)**: Fetches statistics trends, past attempts, and triggers personalized roadmap generation.

---

## 🛠️ 5. Reusable Atomic UI Components
* **[Badge.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/Badge.jsx)**: Renders stylized status chips (Difficulty badges, completion status, and custom numeric score capsules).
* **[Button.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/Button.jsx)**: Handles primary, secondary, danger, and ghost configurations. Includes loading spin states and icon positioning.
* **[Card.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/Card.jsx)**: Standard structural block utilizing glass card backgrounds.
* **[Input.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/Input.jsx)**: Form control inputs and textareas complete with custom label headers, absolute icons, and dynamic validation messages.
* **[LoadingSpinner.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/LoadingSpinner.jsx)**: Custom loading animations (including inline elements and full-page overlays).
* **[ProgressBar.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/components/ui/ProgressBar.jsx)**: Progress indicators and comparative evaluation bars (used to show dimension scores like Correctness).

---

## 📄 6. Pages & Views
* **[LoginPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/LoginPage.jsx) & [RegisterPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/RegisterPage.jsx)**:
  * Employs a split layout:
    * Left Panel: Shows marketing copy detailing core features (ATS, adaptive mock question generation, phase roadmap tracking) decorated with custom icons.
    * Right Panel: Centered login/signup panel wrapping standard text inputs inside a glass card.
* **[DashboardPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/DashboardPage.jsx)**:
  * Renders 4 high-level stat cards (Total Sessions, Completed Sessions, Average Score, Best Score) with floating hover offsets.
  * Visualizes score improvements using a Recharts `AreaChart` with linear gradient fills, and plots dimension breakdowns on a `RadarChart`.
  * Integrates progress bars indicating weak/strong dimensions and displays a scrollable list of recent sessions.
* **[ResumePage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/ResumePage.jsx)**:
  * **Upload Zone**: A dropzone integrated with `react-dropzone`. Border lines animate with pulsing glows when drag actions are active.
  * **ATS Circular Gauge**: An animated SVG progress circle that counts up from 0 to the candidate's ATS score, changing color depending on performance (green/yellow/red).
  * **Skills & Gaps**: Formats matching and missing skills into separate green/red badges and lists AI suggestion cards.
* **[InterviewSetupPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/InterviewSetupPage.jsx)**:
  * Provides configuration parameters for new simulations: role list suggestions, difficulty card selectors, and question amount keys.
* **[MockInterviewPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/MockInterviewPage.jsx)**:
  * **Split Layout**:
    * Left Sidebar: Tracks question completion roadmap nodes (checked, active pulse, or locked) alongside telemetry info.
    * Right Chat Box: Generates conversation bubbles for AI prompts and user answers. Includes typing indicators, detail panels for reference answers, and correctness/communication/relevance score sliders.
  * **Summary View**: Completes the simulation, providing overall rating blocks and triggering backend PDF compilation requests to export structured reports.
* **[RoadmapPage.jsx](file:///c:/Users/akm45/OneDrive/Desktop/aiml%20intern/interview-prep-coach/frontend/src/pages/RoadmapPage.jsx)**:
  * Compiles multi-phase study timelines mapped with custom topic tags, reading resources, external links, and targets.
  * Includes individual phase checkboxes to help users track progress.
