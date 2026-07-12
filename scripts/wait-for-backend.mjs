const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
const healthUrl = new URL("/health", backendUrl);
const deadline = Date.now() + 30_000;

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { cache: "no-store" });
    if (response.ok) {
      process.exit(0);
    }
  } catch {
    // Backend is still starting.
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}

console.error(`Backend did not become ready at ${healthUrl.href}`);
process.exit(1);
