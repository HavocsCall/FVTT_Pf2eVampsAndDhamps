import { isVampireCharacter } from "./actors.js";
import { MODULE_ID } from "./constants.js";
import { getHungerState } from "./state.js";
import { isHungerTrackingEnabled } from "./settings.js";

const managedSyncActors = new Set();
const MANAGED_SLUGS = new Set(["drained", "confused", "dying"]);

export function registerConditionHooks() {
    Hooks.once("ready", () => {
        if (!game.user?.isGM) return;
        void syncExistingVampires();
    });

    Hooks.on(`${MODULE_ID}.hungerThresholdsChanged`, () => {
        if (!game.user?.isGM) return;
        void syncExistingVampires();
    });

    Hooks.on("preUpdateItem", (item, changed) => {
        if (!shouldBlockManagedConditionChange(item)) return;
        if (!isProtectedManagedUpdate(item, changed)) return;
        return false;
    });

    Hooks.on("preDeleteItem", (item) => {
        if (!shouldBlockManagedConditionChange(item)) return;
        if (!isProtectedManagedCondition(item)) return;
        return false;
    });

    Hooks.on("updateActor", (actor, changed) => {
        if (!foundry.utils.hasProperty(changed, `flags.${MODULE_ID}.hunger`)) return;
        if (!canManageConditions(actor)) return;
        void syncHungerConditions(actor);
    });

    Hooks.on("createItem", (item, _options, userId) => {
        if (userId !== game.userId || !isRelevantConditionChange(item)) return;
        if (!canManageConditions(item.parent)) return;
        void syncHungerConditions(item.parent);
    });

    Hooks.on("updateItem", (item, _changed, _options, userId) => {
        if (userId !== game.userId || !isRelevantConditionChange(item)) return;
        if (!canManageConditions(item.parent)) return;
        if (!isLinkedCondition(item, getHungerSourceItem(item.parent))) return;
        void syncHungerConditions(item.parent);
    });

    Hooks.on("deleteItem", (item, _options, userId) => {
        if (userId !== game.userId || !isRelevantConditionChange(item)) return;
        if (!canManageConditions(item.parent)) return;
        if (!isLinkedCondition(item, getHungerSourceItem(item.parent))) return;
        void syncHungerConditions(item.parent);
    });
}

async function syncExistingVampires() {
    for (const actor of game.actors ?? []) {
        if (!canManageConditions(actor)) continue;
        await syncHungerConditions(actor);
    }
}

export async function syncHungerConditions(actor) {
    if (!canManageConditions(actor)) return;
    if (managedSyncActors.has(actor.id)) return;

    const sourceItem = getHungerSourceItem(actor);
    if (!sourceItem) return;

    managedSyncActors.add(actor.id);

    try {
        const hunger = getHungerState(actor);
        const required = getRequiredConditions(hunger);

        await syncValuedCondition(actor, sourceItem, "drained", required.drained);
        await syncBinaryCondition(actor, sourceItem, "confused", required.confused);
        await syncValuedCondition(actor, sourceItem, "dying", required.dying);
    } finally {
        managedSyncActors.delete(actor.id);
    }
}

function getRequiredConditions(hunger) {
    const drained = hunger.current >= hunger.thresholds.drained
        ? hunger.current - hunger.thresholds.drained + 1
        : 0;

    return {
        drained,
        confused: hunger.current >= hunger.thresholds.confused,
        dying: hunger.current >= hunger.thresholds.death ? 1 : 0,
    };
}

async function syncValuedCondition(actor, sourceItem, slug, requiredValue) {
    const condition = findManagedCondition(actor, sourceItem, slug);
    if (requiredValue <= 0) {
        if (condition) {
            await actor.decreaseCondition(condition, { forceRemove: true });
        }
        return;
    }

    if (!condition) {
        await createLinkedCondition(actor, sourceItem, slug, requiredValue);
        return;
    }

    const liveCondition = actor.items.get(condition.id) ?? condition;
    const updates = {
        _id: liveCondition.id,
        "flags.pf2e.grantedBy.id": sourceItem.id,
        "system.references.parent.id": sourceItem.id,
    };
    if (liveCondition.value !== requiredValue) {
        updates["system.value.value"] = requiredValue;
    }
    await actor.updateEmbeddedDocuments("Item", [updates]);
}

async function syncBinaryCondition(actor, sourceItem, slug, required) {
    const condition = findManagedCondition(actor, sourceItem, slug);
    if (!required) {
        if (condition) {
            await actor.decreaseCondition(condition, { forceRemove: true });
        }
        return;
    }

    if (!condition) {
        await createLinkedCondition(actor, sourceItem, slug);
        return;
    }

    const liveCondition = actor.items.get(condition.id) ?? condition;
    await actor.updateEmbeddedDocuments("Item", [{
        _id: liveCondition.id,
        "flags.pf2e.grantedBy.id": sourceItem.id,
        "system.references.parent.id": sourceItem.id,
    }]);
}

function findManagedCondition(actor, sourceItem, slug) {
    return actor.conditions
        .bySlug(slug, { temporary: false })
        .find((condition) => isConditionManagedBySource(condition, sourceItem))
        ?? actor.itemTypes.condition.find((item) => item.slug === slug && isConditionManagedBySource(item, sourceItem))
        ?? null;
}

async function createLinkedCondition(actor, sourceItem, slug, value = null) {
    const condition = game.pf2e.ConditionManager.getCondition(slug);
    if (!condition) return null;

    condition.updateSource({
        "flags.pf2e.grantedBy.id": sourceItem.id,
        "system.references.parent.id": sourceItem.id,
    });

    if (condition.system.value.isValued && typeof value === "number") {
        condition.updateSource({ "system.value.value": value });
    }

    return (await actor.createEmbeddedDocuments("Item", [condition.toObject()])).shift() ?? null;
}

function getHungerSourceItem(actor) {
    return actor.items.find((item) => item.type === "ancestry" && item.system?.slug === "vampire") ?? null;
}

function canManageConditions(actor) {
    return isHungerTrackingEnabled()
        && isVampireCharacter(actor)
        && game.user === actor?.primaryUpdater;
}

function isRelevantConditionChange(item) {
    return item?.parent?.type === "character"
        && item.type === "condition"
        && MANAGED_SLUGS.has(item.slug ?? "");
}

function isConditionManagedBySource(item, sourceItem) {
    return isLinkedCondition(item, sourceItem);
}

function shouldBlockManagedConditionChange(item) {
    return isRelevantConditionChange(item)
        && canManageConditions(item.parent)
        && !managedSyncActors.has(item.parent?.id);
}

function isProtectedManagedCondition(item) {
    const sourceItem = getHungerSourceItem(item.parent);
    if (!sourceItem || !isConditionManagedBySource(item, sourceItem)) return false;

    const required = getRequiredConditions(getHungerState(item.parent));
    if (item.slug === "drained") return required.drained > 0;
    if (item.slug === "confused") return required.confused;
    if (item.slug === "dying") return required.dying > 0;
    return false;
}

function isLinkedCondition(item, sourceItem) {
    if (!item || !sourceItem) return false;
    const parentId = item.system?.references?.parent?.id ?? "";
    const granterId = item.flags?.pf2e?.grantedBy?.id ?? "";
    return parentId === sourceItem.id || granterId === sourceItem.id;
}

function isProtectedManagedUpdate(item, changed) {
    if (!isProtectedManagedCondition(item)) return false;

    const nextSource = foundry.utils.mergeObject(item.toObject(), changed, { inplace: false });
    const currentParentId = item.system?.references?.parent?.id ?? "";
    const nextParentId = nextSource.system?.references?.parent?.id ?? "";
    const currentGranterId = item.flags?.pf2e?.grantedBy?.id ?? "";
    const nextGranterId = nextSource.flags?.pf2e?.grantedBy?.id ?? "";

    if (nextParentId !== currentParentId || nextGranterId !== currentGranterId) return true;

    if (item.slug === "drained" || item.slug === "dying") {
        const currentValue = Number(item.system?.value?.value ?? 0);
        const nextValue = Number(nextSource.system?.value?.value ?? currentValue);
        return nextValue !== currentValue;
    }

    return true;
}
