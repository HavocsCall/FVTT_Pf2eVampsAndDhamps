import {
    DEFAULT_HUNGER,
    HUNGER_CONFUSED_THRESHOLD_SETTING,
    HUNGER_DEATH_THRESHOLD_SETTING,
    HUNGER_DRAINED_THRESHOLD_SETTING,
    HUNGER_SETTING,
    MODULE_ID,
} from "./constants.js";

export function registerSettings() {
    game.settings.register(MODULE_ID, HUNGER_SETTING, {
        name: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTRACKING.NAME",
        hint: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTRACKING.HINT",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => {
            for (const app of Object.values(ui.windows)) {
                if (app.document?.documentName === "Actor") app.render(true);
            }
        },
    });

    game.settings.register(MODULE_ID, HUNGER_DRAINED_THRESHOLD_SETTING, {
        name: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.DRAINED.NAME",
        hint: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.DRAINED.HINT",
        scope: "world",
        config: true,
        type: Number,
        default: DEFAULT_HUNGER.baseThresholds.drained,
        onChange: onThresholdSettingChange,
    });

    game.settings.register(MODULE_ID, HUNGER_CONFUSED_THRESHOLD_SETTING, {
        name: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.CONFUSED.NAME",
        hint: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.CONFUSED.HINT",
        scope: "world",
        config: true,
        type: Number,
        default: DEFAULT_HUNGER.baseThresholds.confused,
        onChange: onThresholdSettingChange,
    });

    game.settings.register(MODULE_ID, HUNGER_DEATH_THRESHOLD_SETTING, {
        name: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.DEATH.NAME",
        hint: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.HUNGERTHRESHOLDS.DEATH.HINT",
        scope: "world",
        config: true,
        type: Number,
        default: DEFAULT_HUNGER.baseThresholds.death,
        onChange: onThresholdSettingChange,
    });
}

export function isHungerTrackingEnabled() {
    return game.settings.get(MODULE_ID, HUNGER_SETTING) === true;
}

export function getDefaultHungerThresholds() {
    return {
        drained: getThresholdSetting(HUNGER_DRAINED_THRESHOLD_SETTING, DEFAULT_HUNGER.baseThresholds.drained),
        confused: getThresholdSetting(HUNGER_CONFUSED_THRESHOLD_SETTING, DEFAULT_HUNGER.baseThresholds.confused),
        death: getThresholdSetting(HUNGER_DEATH_THRESHOLD_SETTING, DEFAULT_HUNGER.baseThresholds.death),
    };
}

function onThresholdSettingChange() {
    rerenderOpenActorWindows();
    Hooks.callAll(`${MODULE_ID}.hungerThresholdsChanged`);
}

function rerenderOpenActorWindows() {
    for (const app of Object.values(ui.windows)) {
        if (app.document?.documentName === "Actor") app.render(true);
    }
}

function getThresholdSetting(setting, fallback) {
    const value = Number(game.settings.get(MODULE_ID, setting));
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;
}
