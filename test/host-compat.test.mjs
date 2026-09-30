import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";
import { AssistantMessageComponent, DefaultResourceLoader, SettingsManager } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const host = realpathSync(join(root, "node_modules/@earendil-works/pi-coding-agent"));

test("the real host registers the extension without warnings", async () => {
  const loader = new DefaultResourceLoader({
    cwd: root, agentDir: root, settingsManager: SettingsManager.inMemory(),
    noExtensions: true, noSkills: true, noThemes: true,
    noPromptTemplates: true, noContextFiles: true,
    additionalExtensionPaths: [root],
  });
  await loader.reload();
  const result = loader.getExtensions();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings ?? [], []);
  assert.equal(result.extensions.length, 1);
  assert.ok(result.extensions[0].commands.has("thinking-steps"));
});

test("bundled CLI patches its running component and restores it on shutdown", async () => {
  const runtime = readFileSync(join(host, "dist/bundle/cli-runtime.js"), "utf8");
  const chunk = runtime.match(/from["'](\.\/chunks\/[^"']+)["']/)?.[1];
  assert.ok(chunk, "The bundled CLI runtime import must be identifiable");
  const bundled = await import(pathToFileURL(join(host, "dist/bundle", chunk)).href);
  assert.notEqual(bundled.AssistantMessageComponent, AssistantMessageComponent);
  const loader = new bundled.DefaultResourceLoader({
    cwd: root, agentDir: root, settingsManager: bundled.SettingsManager.inMemory(),
    noExtensions: true, noSkills: true, noThemes: true,
    noPromptTemplates: true, noContextFiles: true,
    additionalExtensionPaths: [root],
  });
  await loader.reload();
  const result = loader.getExtensions();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings ?? [], []);
  const extension = result.extensions[0];
  const before = bundled.AssistantMessageComponent.prototype.updateContent;
  const standalone = AssistantMessageComponent.prototype.updateContent;
  const ctx = {
    cwd: root, hasUI: true, sessionManager: { getEntries: () => [] },
    ui: {
      theme: { fg: (_color, text) => text, bold: text => text },
      setHiddenThinkingLabel: () => {}, setStatus: () => {},
      notify: message => { throw new Error(message); },
    },
  };
  try {
    for (const handler of extension.handlers.get("session_start") ?? []) await handler({ type: "session_start" }, ctx);
    assert.notEqual(bundled.AssistantMessageComponent.prototype.updateContent, before);
    assert.equal(AssistantMessageComponent.prototype.updateContent, standalone);
  } finally {
    for (const handler of extension.handlers.get("session_shutdown") ?? []) await handler({ type: "session_shutdown" }, ctx);
  }
  assert.equal(bundled.AssistantMessageComponent.prototype.updateContent, before);
});
