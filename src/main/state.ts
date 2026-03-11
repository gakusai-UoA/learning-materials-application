import type { ChildProcess } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";

interface GlobalState {
	workspaceDir: string;
	activeReactProcess: ChildProcess | null;
	activeHonoProcess: ChildProcess | null;
}

export const globalState: GlobalState = {
	workspaceDir: path.join(os.homedir(), "LearningAppWorkspace"),
	activeReactProcess: null,
	activeHonoProcess: null,
};
