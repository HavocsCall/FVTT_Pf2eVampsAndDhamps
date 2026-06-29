import { DEFAULT_HUNGER, HUNGER_FLAG_PATH, MODULE_ID } from "./constants.js";
import { getDefaultHungerThresholds } from "./settings.js";

export function getHungerState(actor) {
    const stored = actor?.getFlag(MODULE_ID, "hunger") ?? {};
    return sanitizeHungerState(stored);
}

export async function adjustHungerCurrent(actor, delta) {
    const state = getHungerState(actor);
    return setHungerState(actor, {
        ...state,
        current: state.current + delta,
    });
}

export async function setHungerCurrent(actor, value) {
    const state = getHungerState(actor);
    return setHungerState(actor, {
        ...state,
        current: value,
    });
}

export async function setHungerState(actor, state) {
    const next = sanitizeHungerState(state);
    await actor.update({
        [HUNGER_FLAG_PATH]: toStoredState(next),
    });
}

function sanitizeHungerState(state) {
    const baseMax = clampNumber(state?.baseMax, DEFAULT_HUNGER.baseMax, { min: 0 });
    const maxModifier = clampNumber(state?.maxModifier, DEFAULT_HUNGER.maxModifier);
    const defaultThresholds = getDefaultHungerThresholds();

    const baseThresholds = {
        drained: clampNumber(defaultThresholds.drained, DEFAULT_HUNGER.baseThresholds.drained, { min: 0 }),
        confused: clampNumber(defaultThresholds.confused, DEFAULT_HUNGER.baseThresholds.confused, { min: 0 }),
        death: clampNumber(defaultThresholds.death, DEFAULT_HUNGER.baseThresholds.death, { min: 0 }),
    };

    const thresholdModifiers = {
        drained: clampNumber(state?.thresholdModifiers?.drained, DEFAULT_HUNGER.thresholdModifiers.drained),
        confused: clampNumber(state?.thresholdModifiers?.confused, DEFAULT_HUNGER.thresholdModifiers.confused),
        death: clampNumber(state?.thresholdModifiers?.death, DEFAULT_HUNGER.thresholdModifiers.death),
    };

    const thresholds = deriveThresholds(baseThresholds, thresholdModifiers);
    const max = thresholds.death;
    const current = clampNumber(state?.current, DEFAULT_HUNGER.current, { min: 0, max });

    return {
        current,
        baseMax,
        maxModifier,
        max,
        baseThresholds,
        thresholdModifiers,
        thresholds,
    };
}

function deriveThresholds(baseThresholds, thresholdModifiers) {
    const drained = Math.max(0, baseThresholds.drained + thresholdModifiers.drained);
    const confused = Math.max(drained, baseThresholds.confused + thresholdModifiers.confused);
    const death = Math.max(confused, baseThresholds.death + thresholdModifiers.death);
    return { drained, confused, death };
}

function toStoredState(state) {
    return {
        current: state.current,
        baseMax: state.baseMax,
        maxModifier: state.maxModifier,
        thresholdModifiers: foundry.utils.deepClone(state.thresholdModifiers),
    };
}

function clampNumber(value, fallback, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(numeric)));
}
