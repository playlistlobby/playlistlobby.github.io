import type { Action } from "./util";
import { buyClothes, setLook, sync } from "./account";
import { buyFurni, buySixty, buyVending, sellWeed } from "./shop";
import { eat, sixty, usePill } from "./quest";
import { carve, combineItems, dumpster, fillCan, finishSmoke, flappy, harvest, light, lockpick, plant, stab, syringe, water } from "./rewards";
import { drop, pickup } from "./floor";
import { furniMove, furniPlace, furniStore, storeItem, takeItem } from "./toolbox";
import { tradeFinish } from "./trade";
import { debug } from "./debug";
import { cdInsert, cdReturn } from "./cd";
import { mix } from "./mixer";

/** Every thing the browser may ask for. Anything not listed here cannot be done: the browser can't write economy data itself. */
export const ACTIONS: Record<string, Action> = {
  sync, setLook, buyClothes,
  buySixty, buyVending, buyFurni, sellWeed,
  sixty, usePill, eat,
  stab, syringe, flappy, carve, dumpster, light, finishSmoke, combine: combineItems, fillCan, plant, water, harvest, lockpick,
  drop, pickup,
  store: storeItem, take: takeItem, furniPlace, furniMove, furniStore,
  tradeFinish,
  cdInsert, cdReturn, mix,
  debug,
};
