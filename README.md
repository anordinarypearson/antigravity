# 🎓 ScholarSage: The Ultimate AI-Powered learning Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-1.20-blueviolet?style=for-the-badge)](https://firebase.google.com/docs/genkit)

**ScholarSage** is a cutting-edge, AI-first study platform designed to revolutionize how students interact with information. From instant document analysis to automated Spaced Repetition (SRS), ScholarSage brings all the tools you need into one cohesive, high-performance ecosystem.

---

## 🔥 Key Pillars of ScholarSage

### 🧠 Advanced AI & Content Processing
- **Multi-Source Ingestion**: Transform PDFs, DOCX, YouTube videos, and raw text into interactive study materials.
- **Deep Document Analysis**: Get instant summaries, extraction of key concepts, and AI-generated insights.
- **Client-Side OCR**: Use **Tesseract.js** for powerful text extraction from images directly in your browser.
- **Intelligent RAG Search**: A sophisticated Retrieval-Augmented Generation system for accurate, context-aware answers.

### 📚 Science-Backed Learning
- **Smart Flashcards**: Automatically generate flashcards from your notes and study materials.
- **Spaced Repetition (SRS)**: Optimize your memory retention with an integrated SRS system.
- **Interactive Quizzes**: Generate personalized tests (MCQ, True/False) with real-time feedback and performance tracking.
- **Visual Learning**: Create AI-powered **Mind Maps** to see the big picture and connect complex ideas.

### 🤖 Your Personal AI Tutor
- **Socratic Method**: An AI tutor that doesn't just give answers but guides you through the learning process.
- **Contextual Memory**: The tutor understands your entire study session, creating a seamless conversational experience.
- **Multi-Level Explanations**: Ask for simplified "ELI5" explanations or deep dives into complex topics.

### 🛠️ The Integrated Workspace
- **AI Editor & Canvas**: A dual-pane workspace for writing and brainstorming alongside an AI assistant.
- **Integrated Browser & News**: Read articles and browse the web without leaving your study environment.
- **Performance Dashboard**: Track your learning velocity, retention rates, and subject mastery with beautiful data visualizations.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: [Next.js 15 (App Router)](https://nextjs.org/), [React 18](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **AI Orchestration**: [Google Genkit](https://firebase.google.com/docs/genkit), [Vercel AI SDK](https://sdk.vercel.ai/)
- **Models**: [Qwen](https://huggingface.co/Qwen), [SambaNova](https://sambanova.ai/), [Google Gemini](https://deepmind.google/technologies/gemini/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Cloud Functions)
- **Local ML**: [Transformers.js](https://huggingface.co/docs/transformers.js), [Tensorflow.js](https://www.tensorflow.org/js)
- **Desktop**: [Electron](https://www.electronjs.org/) (Optional wrapper for native features)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **yarn**

### 1. Installation

```bash
git clone https://github.com/your-username/ScholarSage.git
cd ScholarSage
npm install
```

### 2. Configuration
Create a `.env.local` file in the root directory and add your credentials:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."

# AI Service Keys
SAMBANOVA_API_KEY="..."
OPENAI_API_KEY="..."
GOOGLE_GENAI_API_KEY="..."
```

### 3. Launch the Platform

**Web Version:**
```bash
npm run dev
```

**Desktop Version (Electron):**
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run electron
```

---

## 📂 Project Structure

```
├── /src
│   ├── /app          # Pages, Layouts, and API Routes
│   ├── /ai           # Genkit flows and AI utility tools
│   ├── /components   # Reusable UI components (shadcn)
│   ├── /hooks        # Custom React hooks
│   ├── /lib          # Core logic, Firebase config, and types
│   └── /styles       # Global CSS & Tailwind configuration
├── /docs             # Extensive feature & design documentation
├── /electron         # Main process and desktop integration
├── /python-backend   # Specialized processing scripts (optional)
└── README.md         # You are here
```

---

## 🤝 Contributing & Community

ScholarSage is built for students, by developers who care about education. We welcome all contributions!

1. **Fork** the repository
2. **Branch**: `git checkout -b feature/amazing-feature`
3. **Commit**: `git commit -m 'Add amazing feature'`
4. **Push**: `git push origin feature/amazing-feature`
5. **Open a PR**

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for the future of education.
</p>
