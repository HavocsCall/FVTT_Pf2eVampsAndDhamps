export const MODULE_ID = "FVTT_Pf2eVampsAndDhamps";
export const HUNGER_SETTING = "enableHungerTracking";
export const HUNGER_DRAINED_THRESHOLD_SETTING = "hungerDrainedThreshold";
export const HUNGER_CONFUSED_THRESHOLD_SETTING = "hungerConfusedThreshold";
export const HUNGER_DEATH_THRESHOLD_SETTING = "hungerDeathThreshold";
export const HUNGER_FLAG_PATH = `flags.${MODULE_ID}.hunger`;
export const DEFAULT_HUNGER = Object.freeze({
    current: 0,
    baseMax: 7,
    maxModifier: 0,
    baseThresholds: {
        drained: 3,
        confused: 5,
        death: 7,
    },
    thresholdModifiers: {
        drained: 0,
        confused: 0,
        death: 0,
    },
});
