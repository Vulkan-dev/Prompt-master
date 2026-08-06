# Promptraitz

Premium AI prompt judge, optimizer, and enhancer. Built for MadeToFight.

**Author: darkwaveop**

---

## Features

- **Audit & Optimize** — Score prompts 0-100, get detailed feedback, and auto-optimize
- **Enhance** — Transform rough prompts into production-grade instructions
- **Image-to-Prompt** — Reverse-engineer images into AI generation prompts (vision AI + canvas fingerprint)
- **Prompt Recipes** — Persona, Chain of Thought, Few-Shot, Step-by-Step templates
- **Security Scanner** — Detects injection attacks, jailbreaks, and malicious prompts
- **Drag & Drop** — Drop files anywhere (images → Image-to-Prompt, text → attach as context)
- **Custom Cursor** — Animated cursor trail with motion blur

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 4
- Framer Motion (motion/react)
- OpenRouter API (free vision + text models)
- Vite

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env.local` or `.env`:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and set your OpenRouter API Key (get a free key at [OpenRouter Keys](https://openrouter.ai/keys)):
   ```env
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   ```
   > **Note**: Both `OPENROUTER_API_KEY` and `VITE_OPENROUTER_API_KEY` are supported.
   > **Offline Mode**: If no API key is set, Promptraitz will automatically fall back to local heuristic analysis so the application remains fully functional offline.

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Additional Tools & Scripts

- `recipes.py` — Python script for wrapping prompts with engineering frameworks (Persona, Chain of Thought, Few-Shot, Step-by-Step).
- `security_scanner.py` — Python script to scan prompts for security injection threats, jailbreaks, and sensitive data leakage.

## Models Used

| Feature | Primary Model | Fallback Models |
|---------|---------------|-----------------|
| Text (Audit / Enhance / Optimize) | `google/gemma-4-31b-it:free` | `google/gemma-4-26b-a4b-it:free`, `nvidia/nemotron-3-super-120b-a12b:free`, `openrouter/free` |
| Vision (Image-to-Prompt) | `google/gemma-4-31b-it:free` | `nvidia/nemotron-nano-12b-v2-vl:free`, `openrouter/free` |
| Offline Fallback | Canvas Fingerprint + Text Model | Local Heuristics Engine |

## License

MIT
