import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const androidJavaHome = process.env.ANDROID_JAVA_HOME?.trim();

if (androidJavaHome) process.env.JAVA_HOME = androidJavaHome;

if (!serverUrl) {
  throw new Error(
    "CAPACITOR_SERVER_URL is required. Add the VPS frontend URL to .env before building Android.",
  );
}

const parsedServerUrl = new URL(serverUrl);
if (!["http:", "https:"].includes(parsedServerUrl.protocol)) {
  throw new Error("CAPACITOR_SERVER_URL must use http or https.");
}

function run(command, args, cwd = projectRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}

const gradleCommand =
  process.platform === "win32" ? "gradlew.bat" : "./gradlew";

await run(process.execPath, [
  path.join(
    projectRoot,
    "node_modules",
    "@capacitor",
    "cli",
    "bin",
    "capacitor",
  ),
  "sync",
  "android",
]);
if (process.platform === "win32") {
  await run(
    "cmd.exe",
    ["/d", "/s", "/c", gradleCommand, "assembleDebug"],
    path.join(projectRoot, "android"),
  );
} else {
  await run(
    gradleCommand,
    ["assembleDebug"],
    path.join(projectRoot, "android"),
  );
}

const apkPath = path.join(
  projectRoot,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk",
);
if (!fs.existsSync(apkPath))
  throw new Error("Gradle completed without producing the debug APK.");
console.log(`Debug APK: ${apkPath}`);
