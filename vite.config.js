import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleBirthdayEmail } from "./server/sendBirthdayEmail.js";

// Serves POST /api/send-birthday-email from `npm run dev` and `npm run preview`,
// the same endpoint api/send-birthday-email.js provides on Vercel.
function birthdayEmailApi(env) {
  const middleware = (req, res, next) => {
    if (req.url !== "/api/send-birthday-email" || req.method !== "POST") return next();
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", async () => {
      let body = {};
      try {
        body = JSON.parse(raw || "{}");
      } catch {}
      const { status, json } = await handleBirthdayEmail(body, env);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(json));
    });
  };
  return {
    name: "birthday-email-api",
    // Block bodies: a function returned from these hooks would run as a post-hook.
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  // "" loads every key in .env, not just VITE_ ones. These stay on the server.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), birthdayEmailApi(env)],
  };
});
