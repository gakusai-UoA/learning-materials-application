import * as fs from "node:fs/promises";
import * as path from "node:path";

export async function generatePartTemplates(workspaceDir: string, onProgress?: (msg: string) => void) {
	for (let partId = 0; partId <= 9; partId++) {
		if (onProgress) onProgress(`ワークスペース (Part-${partId}) を準備中...`);
		const partFolder = path.join(workspaceDir, `Part-${partId}`);

		// --- React ---
		const reactPath = path.join(partFolder, "react");
		try {
			await fs.access(reactPath);
		} catch {
			await fs.mkdir(path.join(reactPath, "src"), { recursive: true });
			await fs.writeFile(
				path.join(reactPath, "package.json"),
				JSON.stringify({ name: `part${partId}-react`, type: "module" }, null, 2),
			);
			await fs.writeFile(
				path.join(reactPath, "vite.config.ts"),
				`import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`,
			);
			await fs.writeFile(
				path.join(reactPath, "index.html"),
				`<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
			);
			await fs.writeFile(path.join(reactPath, "src", "index.css"), '@import "tailwindcss";');
			await fs.writeFile(
				path.join(reactPath, "src", "main.tsx"),
				`import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
			);
			await fs.writeFile(
				path.join(reactPath, "src", "App.tsx"),
				`import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>
        Reactへようこそ！
      </h1>
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
      >
        Count: {count}
      </button>
    </div>
  );
}
`,
			);
		}

		// --- Hono ---
		const honoPath = path.join(partFolder, "hono");
		try {
			await fs.access(honoPath);
		} catch {
			await fs.mkdir(path.join(honoPath, "src"), { recursive: true });
			await fs.writeFile(
				path.join(honoPath, "package.json"),
				JSON.stringify({ name: `part${partId}-hono`, type: "module" }, null, 2),
			);
			await fs.writeFile(
				path.join(honoPath, "src", "index.ts"),
				`import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

export default app;`,
			);
		}
	}
}
