const assert = require("node:assert/strict");
const test = require("node:test");

const recycleBin = require("../static/tools/yysls-tiaolv/assets/js/equip-recycle-bin.js");

function createStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        }
    };
}

test("stores a deleted equipment record with its deletion time", () => {
    const storage = createStorage();
    const equip = { id: "equip-1", name: "精准护腕", slotId: "8", subStats: [] };

    recycleBin.trash(storage, "阿青", equip, 1000);

    assert.deepEqual(recycleBin.list(storage, "阿青", 1000), [{ equip, deletedAt: 1000 }]);
});

test("automatically removes equipment deleted at least fifteen days ago", () => {
    const storage = createStorage();
    const fifteenDays = 15 * 24 * 60 * 60 * 1000;

    recycleBin.trash(storage, "阿青", { id: "expired", name: "旧装备" }, 1000);
    recycleBin.trash(storage, "阿青", { id: "active", name: "新装备" }, 1001);

    assert.deepEqual(
        recycleBin.list(storage, "阿青", 1000 + fifteenDays),
        [{ equip: { id: "active", name: "新装备" }, deletedAt: 1001 }]
    );
});

test("restores only the selected equipment and removes it from the recycle bin", () => {
    const storage = createStorage();
    const restored = { id: "equip-1", name: "会心武器", slotId: "1" };

    recycleBin.trash(storage, "阿青", restored, 1000);
    recycleBin.trash(storage, "阿青", { id: "equip-2", name: "劲胫甲", slotId: "7" }, 1001);

    assert.deepEqual(recycleBin.restore(storage, "阿青", "equip-1", 1002), restored);
    assert.deepEqual(recycleBin.list(storage, "阿青", 1002), [
        { equip: { id: "equip-2", name: "劲胫甲", slotId: "7" }, deletedAt: 1001 }
    ]);
});

test("permanently discards only the selected recycled equipment", () => {
    const storage = createStorage();

    recycleBin.trash(storage, "阿青", { id: "equip-1", name: "会心武器" }, 1000);
    recycleBin.trash(storage, "阿青", { id: "equip-2", name: "劲胫甲" }, 1001);

    recycleBin.discard(storage, "阿青", "equip-1", 1002);

    assert.deepEqual(recycleBin.list(storage, "阿青", 1002), [
        { equip: { id: "equip-2", name: "劲胫甲" }, deletedAt: 1001 }
    ]);
});

test("removes a deleted equipment from every saved scheme without changing other equipment", () => {
    const loadouts = {
        "破竹尘": {
            currentSchemeId: "输出",
            schemes: {
                输出: {
                    weapon1: "deleted-id",
                    hands: "keep-id",
                    transmutationSelections: { "deleted-id": { targetStat: "劲" }, "keep-id": { targetStat: "势" } }
                },
                生存: { chest: "deleted-id", pendant: "other-id" }
            }
        }
    };

    recycleBin.removeEquipReferences(loadouts, "deleted-id");

    assert.deepEqual(loadouts, {
        "破竹尘": {
            currentSchemeId: "输出",
            schemes: {
                输出: {
                    weapon1: null,
                    hands: "keep-id",
                    transmutationSelections: { "keep-id": { targetStat: "势" } }
                },
                生存: { chest: null, pendant: "other-id" }
            }
        }
    });
});

test("removes the deleted equipment from the active transmutation overlay", () => {
    const selections = {
        "deleted-id": { subStatIndex: 0, targetStat: "劲" },
        "keep-id": { subStatIndex: 1, targetStat: "势" }
    };

    recycleBin.removeTransmutationSelection(selections, "deleted-id");

    assert.deepEqual(selections, {
        "keep-id": { subStatIndex: 1, targetStat: "势" }
    });
});
