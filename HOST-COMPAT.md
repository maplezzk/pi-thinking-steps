# Host compatibility fork

Fork: https://github.com/maplezzk/pi-thinking-steps
Upstream: https://github.com/crustyhacker/pi-thinking-steps at d0a59a4f394a8b13f58aa84c30e2dc4071b7c2fd (1.0.11).

This fork targets the installed `@earendil-works/pi-coding-agent` host. Host packages are `peerDependencies` with `*`, not private runtime copies. The patch imports the public `AssistantMessageComponent` and uses `ctx.ui.theme`: in Pi 0.99.1 the bundled CLI and unbundled internal files have different component instances, so patching an internal file does not patch the running CLI.

## Local installation

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm run link-host
npm test
```

For an alternative host location: `npm run link-host -- /absolute/path/to/pi-coding-agent`.
The linking script refuses to replace another physical host copy. Do not install host peers separately.

Tests retain 154 upstream behavior tests, adjust metadata checks to shipped/tracked files, and add two real-host loader/bundled-component tests. Missing untracked upstream AGENTS.md and archived prompts are not treated as shipped files.

The local Pi package source is `/Users/zzk/CliProject/pi-thinking-steps`. Use `/reload` or a fresh Pi process after changing this package. This is a source fork, not a new npm release. Fetch/pull this fork manually and rerun linking/tests; `pi update` does not update a local-path package.
