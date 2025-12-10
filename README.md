<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Twister Blitz

A fun tongue twister game powered by OpenAI, built with Next.js.

## Run Locally

**Prerequisites:** Node.js 18+ 

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   Alternatively, you can use `API_KEY` as the environment variable name.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Cloudflare Pages

This application is configured to run on Cloudflare Pages with Edge Runtime support. See [CLOUDFLARE.md](./CLOUDFLARE.md) for detailed deployment instructions.

**Quick Setup:**
1. Push your code to GitHub/GitLab
2. Connect your repository to Cloudflare Pages
3. Set `OPENAI_API_KEY` environment variable in Cloudflare dashboard
4. Deploy!

The API route uses Edge Runtime and fetch API for full Cloudflare compatibility.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **OpenAI** - AI-powered tongue twister generation
- **Web Speech API** - Voice recognition
