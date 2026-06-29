import { isVampireCharacter } from "./actors.js";
import { adjustHungerCurrent, getHungerState } from "./state.js";
import { isHungerTrackingEnabled } from "./settings.js";

export function refreshHungerPanel(app, root) {
    const actor = app.actor;
    if (!isHungerTrackingEnabled() || !isVampireCharacter(actor)) {
        root.querySelector(".fvtt-vd-hunger-panel")?.remove();
        return;
    }

    const existing = root.querySelector(".fvtt-vd-hunger-panel");
    const replacement = createPanel(actor, getHungerState(actor));

    if (existing) {
        existing.replaceWith(replacement);
        return;
    }

    const anchor = findPanelAnchor(root);
    if (anchor) {
        anchor.insertAdjacentElement("afterend", replacement);
    } else {
        root.querySelector("form")?.prepend(replacement);
    }
}

export function hasHungerPanel(root) {
    return Boolean(root.querySelector(".fvtt-vd-hunger-panel"));
}

function createPanel(actor, state) {
    const canAdjustCurrent = actor.isOwner;
    const panel = document.createElement("section");
    panel.className = "fvtt-vd-hunger-panel";
    const dots = Array.from({ length: state.max }, (_, index) => {
        const value = index + 1;
        const activeClass = value <= state.current ? " fvtt-vd-hunger-panel__dot--active" : "";
        const severityClass = ` fvtt-vd-hunger-panel__dot--${getDotSeverity(value, state.thresholds)}`;
        return `
            <i class="fa-${value <= state.current ? "solid" : "regular"} fa-circle fvtt-vd-hunger-panel__dot${activeClass}${severityClass}"></i>
        `;
    }).join("");

    panel.innerHTML = `
        <a class="condition-pips fvtt-vd-hunger-panel__track${canAdjustCurrent ? " fvtt-vd-hunger-panel__track--editable" : ""}" data-action="adjust-hunger">
            <span class="sidebar_label">${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.HUNGER.PANEL.LABEL")}</span>
            <span class="pips fvtt-vd-hunger-panel__meter">
                ${dots || `<span class="fvtt-vd-hunger-panel__empty">${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.HUNGER.PANEL.EMPTY")}</span>`}
            </span>
        </a>
    `;

    if (!canAdjustCurrent) return panel;

    const track = panel.querySelector("[data-action='adjust-hunger']");
    track?.addEventListener("click", async (event) => {
        event.preventDefault();
        await adjustHungerCurrent(actor, 1);
    });

    track?.addEventListener("contextmenu", async (event) => {
        event.preventDefault();
        await adjustHungerCurrent(actor, -1);
    });

    return panel;
}

function findPanelAnchor(root) {
    return root.querySelector("aside .hitpoints") ?? root.querySelector("aside");
}

function getDotSeverity(value, thresholds) {
    if (value >= thresholds.death) return "death";
    if (value >= thresholds.confused) return "confused";
    if (value >= thresholds.drained) return "drained";
    return "safe";
}
