import { MODE_NOTICE_SETTING, MODULE_ID } from "./constants.js";

export async function maybeAnnounceFormerAncestryMode() {
    const noticeSeen = game.settings.get(MODULE_ID, MODE_NOTICE_SETTING);
    if (noticeSeen) return;

    const content = `
<p>${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.INTRO")}</p>
<p><strong>${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.RULEELEMENTS_LABEL")}</strong> ${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.RULEELEMENTS_BODY")}</p>
<p><strong>${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.JAVASCRIPT_LABEL")}</strong> ${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.JAVASCRIPT_BODY")}</p>
<p>${game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.CHAT.FORMERANCESTRYMODE.SETTING_LOCATION")}</p>
`;

    await ChatMessage.create({
        whisper: ChatMessage.getWhisperRecipients("GM").map((user) => user.id),
        speaker: { alias: game.i18n.localize("FVTT_PF2EVAMPSANDDHAMPS.NAME") },
        content,
    });

    await game.settings.set(MODULE_ID, MODE_NOTICE_SETTING, true);
}
