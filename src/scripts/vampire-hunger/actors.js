export function isVampireCharacter(actor) {
    return actor?.type === "character" && actor.items.some((item) => item.type === "ancestry" && item.system?.slug === "vampire");
}
