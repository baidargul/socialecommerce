const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
const healthUrl = new URL("/health", backendUrl);
const deadline = Date.now() + 30_000;
let backendReady = false;

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { cache: "no-store" });
    await response.body?.cancel();
    if (response.ok) {
      backendReady = true;
      break;
    }
  } catch {
    // Backend is still starting.
  }

  await new Promise((resolve) => setTimeout(resolve, 500));
}

if (!backendReady) {
  console.error(`Backend did not become ready at ${healthUrl.href}`);
  process.exitCode = 1;
}
