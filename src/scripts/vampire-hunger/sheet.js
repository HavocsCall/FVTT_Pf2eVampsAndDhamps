import { hasHungerPanel, refreshHungerPanel } from "./panel.js";

const sheetObservers = new WeakMap();

export function registerHooks() {
    Hooks.on("renderCharacterSheetPF2e", (app, html) => {
        renderHungerPanel(app, html);
        ensureSheetObserver(app);
    });

    Hooks.on("updateActor", (actor, changed) => {
        if (!foundry.utils.hasProperty(changed, "flags.FVTT_Pf2eVampsAndDhamps.hunger")) return;
        refreshOpenActorSheets(actor);
    });

    Hooks.on("closeCharacterSheetPF2e", (app) => {
        sheetObservers.get(app)?.disconnect();
        sheetObservers.delete(app);
    });
}

function renderHungerPanel(app, html) {
    const root = html[0] ?? html;
    refreshHungerPanel(app, root);
}

function refreshOpenActorSheets(actor) {
    for (const app of Object.values(actor.apps ?? {})) {
        const root = app.element?.[0];
        if (!root) continue;
        if (app.actor?.type !== "character") continue;
        refreshHungerPanel(app, root);
    }
}

function ensureSheetObserver(app) {
    const root = app.element?.[0];
    if (!root) return;

    sheetObservers.get(app)?.disconnect();

    const observer = new MutationObserver(() => {
        const currentRoot = app.element?.[0];
        if (!currentRoot) return;
        if (hasHungerPanel(currentRoot)) return;
        refreshHungerPanel(app, currentRoot);
    });

    observer.observe(root, { childList: true, subtree: true });
    sheetObservers.set(app, observer);
}
