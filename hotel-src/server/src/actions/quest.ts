// 6ixty's introduction and jobs, and the pill / burger.
import { Action, int } from "./util";
import { fail } from "../ctx";
import { addToInv, FIRST_BLOOD, JOB_DELAY_MS, JOB_REWARD, takeOneFrom } from "../../../src/shared/economy";
import { findSlot, findSlotAny } from "../../../src/shared/items";

/** One step of the introduction / jobs. The server knows where the player is in it, so steps can't be skipped or repeated. */
export const sixty: Action = {
  async run(c, a) {
    const w = await c.user();
    const s = w.s;
    switch (a.step) {
      case "knife": {
        if (s.sixty.knifeAt !== 0) fail("He already gave you one.");
        const has = findSlotAny(s.inventory, "knife") >= 0;
        if (!has) {
          const next = addToInv(s.inventory, { item: "knife", qty: 1 });
          if (!next) fail("Your inventory is full");
          s.inventory = next!;
        }
        s.sixty.knifeAt = c.now;
        if (s.tutorial < 1) s.tutorial = 1;
        return {};
      }
      case "firstStab": {
        if (s.tutorial !== 1) fail("You've done that.");
        if (findSlot(s.inventory, "knife") < 0) fail("You need a knife for that.");
        // the guy is in your private copy of the basement: you must be standing in it
        if (!(await c.db.get(`rooms/tut_${c.uid}/players/${c.uid}`))) fail("You aren't in the right place.");
        s.blood += FIRST_BLOOD;
        s.tutorial = 2;
        s.questAt = c.now;
        return { gain: FIRST_BLOOD };
      }
      case "pill": {
        if (s.tutorial !== 2) fail("He has nothing for you right now.");
        const next = addToInv(s.inventory, { item: "pill", qty: 1 });
        if (!next) fail("Your inventory is full");
        s.inventory = next!;
        s.tutorial = 3;
        return {};
      }
      case "jobMoney": {
        if (s.tutorial !== 4) fail("He has nothing for you right now.");
        if (c.now - (s.questAt || s.sixty.knifeAt) < JOB_DELAY_MS) fail("He doesn't have a job for you yet.");
        const price = Math.max(1, (await c.itemEntry("lighter")).price);
        s.blood += price;
        s.tutorial = 5;
        return { amount: price };
      }
      case "jobReward": {
        if (s.tutorial !== 5) fail("He has nothing for you right now.");
        if (findSlot(s.inventory, "lighter") < 0) fail("You haven't got a lighter.");
        s.blood += JOB_REWARD; // just the 5 drops (no syringe any more)
        s.tutorial = 6;
        return {};
      }
      default:
        return fail("Unknown step.");
    }
  },
};

/** Swallows the pill in a slot (at the end of the introduction it finishes the introduction). */
export const usePill: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "pill") fail("You don't have a pill.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
    if (w.s.tutorial === 3) w.s.tutorial = 4;
    return {};
  },
};

export const eat: Action = {
  async run(c, a) {
    const w = await c.user();
    const slot = int(a.slot, 0, 27, "slot");
    if (w.s.inventory[slot]?.item !== "burger") fail("You don't have a burger.");
    w.s.inventory = takeOneFrom(w.s.inventory, slot);
    return {};
  },
};
