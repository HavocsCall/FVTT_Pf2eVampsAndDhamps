import { registerConditionHooks } from "./conditions.js";
import { registerSettings } from "./settings.js";
import { registerRestHook } from "./rest.js";
import { registerHooks } from "./sheet.js";

Hooks.once("init", () => {
    registerSettings();
});

registerHooks();
registerConditionHooks();
registerRestHook();
