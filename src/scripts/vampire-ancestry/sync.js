import {
    APPLIED_FLAG,
    BASELINE_FIELDS,
    BASELINE_FLAG,
    FORMER_ANCESTRY_PATH,
    JS_MODE_SETTING,
    MODULE_ID,
    VAMPIRE_SLUG,
} from "./constants.js";
import { resolveAncestryBySlug } from "./ancestry-index.js";
import { maybeAnnounceFormerAncestryMode } from "./chat.js";
import { buildFormerAncestryUpdate, createBaseline, restoreBaselineUpdate } from "./utils.js";

export function isJavascriptModeEnabled() {
    return game.settings.get(MODULE_ID, JS_MODE_SETTING) === true;
}

export async function reconcileFormerAncestryMode({ announceMode = false } = {}) {
    if (announceMode) await maybeAnnounceFormerAncestryMode();

    if (isJavascriptModeEnabled()) {
        await applyToExistingCharacters();
        return;
    }

    await restoreExistingCharactersToBaseline();
}

export function isVampireAncestry(item) {
    return item?.type === "ancestry" && item.system?.slug === VAMPIRE_SLUG && item.parent?.type === "character";
}

export function didFormerAncestryChange(changed) {
    return foundry.utils.hasProperty(changed, FORMER_ANCESTRY_PATH);
}

export async function applyToExistingCharacters() {
    for (const actor of game.actors ?? []) {
        if (actor.type !== "character") continue;
        const vampireAncestry = actor.items.find((item) => isVampireAncestry(item));
        if (!vampireAncestry) continue;
        await syncVampireAncestry(vampireAncestry, { force: true });
    }
}

async function restoreExistingCharactersToBaseline() {
    for (const actor of game.actors ?? []) {
        if (actor.type !== "character") continue;
        const vampireAncestry = actor.items.find((item) => isVampireAncestry(item));
        if (!vampireAncestry) continue;
        await restoreVampireAncestryBaseline(vampireAncestry);
    }
}

export async function syncVampireAncestry(item, { force = false } = {}) {
    const actor = item.parent;
    if (!actor?.isOwner) return;

    const selectedSlug = foundry.utils.getProperty(item, FORMER_ANCESTRY_PATH);
    const appliedSlug = item.getFlag(MODULE_ID, APPLIED_FLAG);
    const baseline = item.getFlag(MODULE_ID, BASELINE_FLAG) ?? createBaseline(item, BASELINE_FIELDS);

    if (!selectedSlug) {
        if (appliedSlug) {
            await item.update({
                ...restoreBaselineUpdate(baseline, BASELINE_FIELDS),
                [`flags.${MODULE_ID}.${BASELINE_FLAG}`]: baseline,
                [`flags.${MODULE_ID}.${APPLIED_FLAG}`]: null,
            });
        } else if (!item.getFlag(MODULE_ID, BASELINE_FLAG)) {
            await item.update({
                [`flags.${MODULE_ID}.${BASELINE_FLAG}`]: baseline,
            });
        }
        return;
    }

    if (!force && appliedSlug === selectedSlug) return;

    const formerAncestry = await resolveAncestryBySlug(selectedSlug);
    if (!formerAncestry) {
        console.warn(`${MODULE_ID} | Unable to resolve former ancestry "${selectedSlug}"`);
        return;
    }

    const update = buildFormerAncestryUpdate(baseline, formerAncestry);
    update[`flags.${MODULE_ID}.${BASELINE_FLAG}`] = baseline;
    update[`flags.${MODULE_ID}.${APPLIED_FLAG}`] = selectedSlug;
    await item.update(update);
}

async function restoreVampireAncestryBaseline(item) {
    const baseline = item.getFlag(MODULE_ID, BASELINE_FLAG);
    const appliedSlug = item.getFlag(MODULE_ID, APPLIED_FLAG);
    if (!baseline || !appliedSlug) return;

    await item.update({
        ...restoreBaselineUpdate(baseline, BASELINE_FIELDS),
        [`flags.${MODULE_ID}.${APPLIED_FLAG}`]: null,
    });
}
