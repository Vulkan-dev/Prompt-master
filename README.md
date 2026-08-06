# KernelX-Prompt

Next-Generation AI Prompt Engineering, Optimization, and Security Intelligence Console.

---

## Features

- **⚡ Audit & Optimize Engine** — High-precision prompt scoring (0-100), criteria diagnostic radar (clarity, context, constraints, persona, tone), policy risk detection, and automated neural optimization.
- **🚀 Prompt Factory & Enhancer** — Convert rough ideas into production-grade instructions with category detection (Code, Creative Writing, Vision, Research, General).
- **👁️ Vision Reverse-Engine** — Extract AI generation prompts from uploaded images with visual feature detection, color palette breakdown, and camera/lighting tag inference.
- **📜 Recipe Matrix Studio** — Instant prompt framework wrappers (Persona, Chain of Thought, Few-Shot, Step-by-Step, Context Injection).
- **🛡️ Security Diagnostic Scanner** — Real-time vulnerability scanner detecting injection threats, jailbreak overrides, credential leaks, and data privacy risks.
- **🔀 Side-by-Side Diff Viewer** — Interactive comparison terminal to inspect original vs optimized prompts line by line.
- **📁 File & Image Drag & Drop** — Drop text files or images anywhere on the console to automatically populate context or initiate vision analysis.

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4 + Custom Cybernetic Styling System
- Framer Motion (`motion/react`)
- OpenRouter API (Multi-model free tier fallback sequence)
- Vite

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and set your OpenRouter API Key (get a free key at [OpenRouter Keys](https://openrouter.ai/keys)):
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
   > **Note**: Both `OPENROUTER_API_KEY` and `VITE_OPENROUTER_API_KEY` are supported.
   > **Offline Fallback**: If no API key is provided, KernelX-Prompt automatically runs on local canvas heuristics and rule engines.

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Additional Tools & Scripts

- `recipes.py` — Python script for wrapping prompts with engineering frameworks.
- `security_scanner.py` — Python script to scan prompts for security injection threats and vulnerabilities.

## Models & Fallback Architecture

| Feature | Primary Model | Fallback Sequence |
|---------|---------------|-------------------|
| Text (Audit / Enhance / Optimize) | `google/gemma-4-31b-it:free` | `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free`, `openrouter/free` |
| Vision (Image-to-Prompt) | `google/gemma-4-31b-it:free` | `nvidia/nemotron-nano-12b-v2-vl:free`, `openrouter/free` |
| Offline Fallback | Canvas Fingerprint + Text Model | Local Heuristics Engine |

## License

MIT
