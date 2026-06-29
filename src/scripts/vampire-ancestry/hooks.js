import { didFormerAncestryChange, isJavascriptModeEnabled, isVampireAncestry, reconcileFormerAncestryMode, syncVampireAncestry } from "./sync.js";

export function registerHooks() {
    Hooks.once("ready", () => {
        if (!game.user?.isGM) return;
        void reconcileFormerAncestryMode({ announceMode: true });
    });

    Hooks.on("createItem", (item, _options, userId) => {
        if (userId !== game.userId || !isVampireAncestry(item)) return;
        if (!isJavascriptModeEnabled()) return;
        void syncVampireAncestry(item);
    });

    Hooks.on("updateItem", (item, changed, _options, userId) => {
        if (userId !== game.userId || !isVampireAncestry(item)) return;
        if (!isJavascriptModeEnabled()) return;
        if (!didFormerAncestryChange(changed)) return;
        void syncVampireAncestry(item);
    });
}
