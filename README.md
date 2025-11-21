# 🚀 Recruiver – AI-Powered Hiring & Candidate Portal

Recruiver is a full-stack **AI-based recruitment platform** built with **Next.js**, **Node.js**, **Firebase Auth**, **TailwindCSS**, and a custom UI system.
It features two fully-independent portals:

### ✅ **Candidate Portal**

* Complete Profile Builder
* Resume ATS Scoring
* Mock Aptitude Test
* AI Mock Interview
* Job Profiles Browser
* Forum
* Candidate Dashboard
* Chat Assistant

### ✅ **Recruiter Portal**

* Recruiter Dashboard
* Job Postings Manager
* Candidates Manager
* Calendar
* Analytics & AI Insights
* Company Profile Manager
* Sticky Sidebar Navigation
* Chat Assistant
* Settings + Backup/Restore
* JD Library + Upload

---

## ✨ Features

### 🔹 **Dual Authentication with Firebase**

Separate user flows for:

* Candidate Login
* Recruiter Login
* Protected role-based routes

### 🔹 **AI-powered Modules**

* Resume ATS (JD based)
* AI mock interviews (video + transcript)
* Analytics Insights (Skill gaps, role trends)

### 🔹 **Advanced UI System**

* Tailwind + Fully custom theme
* Sticky sidebar on all dashboards
* Matching colors across candidate & recruiter portals
* Floating gradient background
* Custom cards, buttons, modals, charts

### 🔹 **Recruiter Features**

* Job CRUD
* JD upload and template library
* Calendar (interview scheduling)
* Company Profile Editor
* Candidate shortlisting & bulk actions
* Data snapshot import/export

### 🔹 **General**

* Chat widget on all dashboards
* Reusable layouts: `DashboardLayout`, `RecruiterLayout`, `Layout`
* Clean folder structure

---

## 🏗️ Tech Stack

### **Frontend**

* **Next.js**
* **React**
* **TailwindCSS**
* **Lucide Icons**
* **CSS Variables (light theme)**

### **Backend**

* Firebase (Auth + Firestore/Storage or custom backend if plugged)
* Node.js / API Routes

### **Other**

* LocalStorage for non-critical recruiter data
* Custom animations and charts

---

## 📁 Project Structure

```
/components
  /candidate
  /recruiter
  Layout.js
  Sidebar.js
  DashboardLayout.js
  ...
/pages
  /candidate
      dashboard.js
      profile.js
      resume-ats.js
      job-profiles.js
      mock-aptitude.js
      ai-mock-interview.js
      forum.js
      settings.js
  /recruiter
      dashboard.js
      job-profiles.js
      candidates.js
      calendar.js
      analytics.js
      company-profile.js
      settings.js
  /api
      jobs
      profile
      auth
/public
/styles
  globals.css
```

---

## ⚡ Getting Started

### 1️⃣ **Install Dependencies**

```
npm install
```

### 2️⃣ **Setup Firebase**

Create `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
FIREBASE_ADMIN_PRIVATE_KEY=xxxx
FIREBASE_ADMIN_CLIENT_EMAIL=xxxx
```

### 3️⃣ **Run Dev**

```
npm run dev
```

Open:
👉 [http://localhost:3000](http://localhost:3000)

---

## 🔐 Authentication

Both portals use Firebase Auth.
Role is stored as:

```
user.role = "CANDIDATE" | "RECRUITER"
```

Every protected page checks the role and denies access if mismatched.

---

## 🧩 Key Components

### **DashboardLayout**

Shared layout for candidate & recruiter dashboards (sticky sidebar + navbar)

### **Sidebar**

Displays correct navigation based on role.

### **ChatWidget**

Always visible floating AI chat assistant.

### **CompanyProfile**

Recruiter can customize:

* Logo
* About
* JD Template
* Social Links

### **Calendar Page**

Interview scheduling + event display.

---

## 🗂 Backup & Restore (Recruiter Settings)

Recruiter can export a JSON snapshot of:

* Jobs
* Candidates
* JDs
* Company Profile
* Settings

And import it again anytime.

---

## 🧪 Testing

```
npm run lint
npm run build
```

---

## 🔧 Environment Variables

| Key                    | Purpose                   |
| ---------------------- | ------------------------- |
| NEXT_PUBLIC_FIREBASE_* | Firebase client           |
| FIREBASE_ADMIN_*       | Firebase admin SDK        |
| OPENAI_API_KEY?        | If AI features integrated |

---

## 🛡️ Production

Deployable to:

* Vercel
* Firebase Hosting
* Netlify

---

## 📄 License

This project is private and proprietary unless otherwise stated.

---

## 💬 Need Help?

You can reach out directly through the Chat widget integrated in both dashboards.

---
