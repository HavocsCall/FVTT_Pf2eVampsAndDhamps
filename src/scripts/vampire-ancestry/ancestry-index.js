let ancestryIndexPromise = null;

export async function resolveAncestryBySlug(slug) {
    if (!ancestryIndexPromise) ancestryIndexPromise = buildAncestryIndex();
    const ancestryIndex = await ancestryIndexPromise;
    const record = ancestryIndex.get(slug);
    if (!record) return null;

    if (record.document) return record.document;
    const document = await record.pack.getDocument(record.id);
    record.document = document;
    return document;
}

async function buildAncestryIndex() {
    const index = new Map();

    for (const item of game.items ?? []) {
        if (item.type !== "ancestry" || !item.system?.slug || index.has(item.system.slug)) continue;
        index.set(item.system.slug, { document: item });
    }

    for (const pack of game.packs ?? []) {
        if (pack.documentName !== "Item" || pack.metadata.system !== "pf2e") continue;
        const packIndex = await pack.getIndex({ fields: ["system.slug", "type"] });
        for (const entry of packIndex) {
            if (entry.type !== "ancestry") continue;
            const slug = foundry.utils.getProperty(entry, "system.slug");
            if (!slug || index.has(slug)) continue;
            index.set(slug, { pack, id: entry._id, document: null });
        }
    }

    return index;
}
