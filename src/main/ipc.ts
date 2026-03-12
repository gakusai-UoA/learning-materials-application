import { setupEnvHandlers } from "./ipc/env";
import { setupFormatHandlers } from "./ipc/format";
import { setupFsHandlers } from "./ipc/fs";
import { setupServerHandlers } from "./ipc/server";
import { setupTemplateHandlers } from "./ipc/template";
import { setupTerminalHandlers } from "./ipc/terminal";
import { setupTypesHandlers } from "./ipc/types";
import { setupUpdateHandlers } from "./ipc/update";
import { setupWorkspaceHandlers } from "./ipc/workspace";

export function setupIpcHandlers() {
	setupEnvHandlers();
	setupWorkspaceHandlers();
	setupFsHandlers();
	setupFormatHandlers();
	setupServerHandlers();
	setupTerminalHandlers();
	setupTypesHandlers();
	setupTemplateHandlers();
	setupUpdateHandlers();
}
