import { JS_MODE_SETTING, MODE_NOTICE_SETTING, MODULE_ID } from "./constants.js";
import { reconcileFormerAncestryMode } from "./sync.js";

export function registerSettings() {
    game.settings.register(MODULE_ID, JS_MODE_SETTING, {
        name: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.FORMERANCESTRYMODE.NAME",
        hint: "FVTT_PF2EVAMPSANDDHAMPS.SETTINGS.FORMERANCESTRYMODE.HINT",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => {
            if (!game.user?.isGM) return;
            void reconcileFormerAncestryMode();
        },
    });

    game.settings.register(MODULE_ID, MODE_NOTICE_SETTING, {
        scope: "world",
        config: false,
        type: Boolean,
        default: false,
    });
}
