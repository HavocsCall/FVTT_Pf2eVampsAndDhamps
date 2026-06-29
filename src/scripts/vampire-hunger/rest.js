import { isVampireCharacter } from "./actors.js";
import { adjustHungerCurrent } from "./state.js";
import { isHungerTrackingEnabled } from "./settings.js";

export function registerRestHook() {
    Hooks.on("pf2e.restForTheNight", (actor) => {
        void increaseHungerFromRest(actor);
    });
}

async function increaseHungerFromRest(actor) {
    if (!isHungerTrackingEnabled()) return;
    if (!isVampireCharacter(actor)) return;
    if (!actor?.isOwner) return;

    await adjustHungerCurrent(actor, 1);
}
