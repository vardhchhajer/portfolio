// ============================================================================
// content.js — Portfolio Data Layer
// Single source of truth for profile info, projects, and metadata.
// All other modules import from here — never hardcode content elsewhere.
// ============================================================================

export const profile = {
  name: "Vardh Chhajer",
  title: "Full-Stack Developer & Systems Builder",
  bio: "Computer Science student building production systems, AI pipelines, and hardware integrations. I architect software that bridges the gap between raw hardware and intelligent automation — from barcode scanners to neural networks.",
  tagline: "I build systems that think.",
  currentlyBuilding: "Jarvis v2",
  availability: "Open to a semi-annual internship (January — June 2027)",

  education: [
    {
      institution: "SVKM's Shree Bhagubhai Mafatlal Polytechnic",
      degree: "Diploma",
      field: "Computer Science",
      period: "2024 — June 2027 (Final Year)",
      current: true,
    },
  ],

  skills: {
    Languages: ["Python", "Go", "C++", "JavaScript", "SQL"],
    Frontend: ["HTML5", "CSS3", "JavaScript", "Python Web UIs (Streamlit, Gradio)"],
    Backend: ["FastAPI", "Flask", "PostgreSQL"],
    "AI / ML": [
      "PyTorch",
      "LangChain",
      "OpenAI",
      "RAG Pipelines",
    ],
    DevOps: ["Docker", "AWS", "Vercel", "GitHub Actions"],
    Hardware: [
      "Raspberry Pi",
      "Arduino",
      "Barcode Scanners",
      "TSPL Printers",
    ],
  },

  socials: {
    github: "https://github.com/VardhChhajer",
    linkedin: "https://linkedin.com/in/vardh-chhajer",
    email: "vardh@vardh.me",
  },
};

export const projects = [
  {
    title: "Jarvis v2",
    slug: "jarvis-v2",
    description: "Personal AI assistant and home automation hub. Integrates local LLM orchestration, voice activation triggers, and ESP32 hardware client nodes.",
    techStack: ["LLMs", "IoT nodes", "Python"],
    status: "building",
    route: "https://github.com/vardhchhajer",
  },
  {
    title: "autogit-tool",
    slug: "autogit-tool",
    description: "CLI to automate project documentation, GitHub publishing, and social media content generation directly from any project folder.",
    techStack: ["Documentation CLI", "GitHub API", "Python"],
    status: "live",
    route: "https://github.com/vardhchhajer/autogit-tool",
  },
  {
    title: "Barcode Inventory Management",
    slug: "barcode-inventory",
    description: "Developed a barcode-based inventory management system for a textile factory in C# / WinForms. Interfaces directly with barcode label printers.",
    techStack: ["C# .NET", "WinForms", "Hardware Integration"],
    status: "live",
    route: "https://github.com/vardhchhajer/Barcode-Based-Inventory-Management-System",
  },
  {
    title: "FinSakhi",
    slug: "finsakhi",
    description: "AI-powered financial companion bridging financial literacy gaps through personalized gamified RPG modules and multilingual AI podcasts.",
    techStack: ["AI Companion", "Financial Literacy", "Python"],
    status: "live",
    route: "https://github.com/vardhchhajer/finsakhi",
  },
  {
    title: "Payment Operations Agent",
    slug: "payment-ops-agent",
    description: "Agentic AI for smart payment operations built for CyberCypher 5.0. Automates validation, tracking, and transactional analytics.",
    techStack: ["Agentic AI", "Payment Ops", "Python"],
    status: "live",
    route: "https://github.com/vardhchhajer/payment-ops-agent",
  },
  {
    title: "AI Virtual Try-On",
    slug: "ai-virtual-try-on",
    description: "An AI-powered fashion modelling application that allows users to virtually try on apparel assets in real-time.",
    techStack: ["AI Modelling", "Computer Vision", "Python"],
    status: "live",
    route: "https://github.com/vardhchhajer/ai-virtual-tryon",
  },
  {
    title: "Solana Stable Mint",
    slug: "solana-stable-mint",
    description: "Program implementing stablecoin token mechanics and peg management on the Solana blockchain. Optimized for low-latency transaction routing.",
    techStack: ["Rust", "Solana", "Smart Contracts"],
    status: "building",
    route: "https://github.com/vardhchhajer/solana-stable-mint",
  },
  {
    title: "File Classification",
    slug: "file-classification",
    description: "Python-based script utility for automatically classifying and organizing local file systems under Windows.",
    techStack: ["Python", "File System", "Automation"],
    status: "live",
    route: "https://github.com/vardhchhajer/File-classification",
  },
  {
    title: "hides.app",
    slug: "hides-app",
    description: "Secure client-side encrypted file and data sharing platform. Features zero-knowledge architecture, local file encryption, and secure transit.",
    techStack: ["Cryptography", "File Sharing", "JavaScript"],
    status: "live",
    route: "https://github.com/vardhchhajer",
  },
];
