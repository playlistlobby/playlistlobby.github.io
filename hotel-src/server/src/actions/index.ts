import type { Action } from "./util";
import { buyClothes, setLook, sync } from "./account";
import { buyStashbox, buyFurni, buyPoster, buyRecord, buyRoomUpgrade, roomColors, roomSkins, buySixty, buyVending, sellWeed } from "./shop";
import { claimPurchases } from "./pay";
import { eat, sixty, usePill } from "./quest";
import { combineItems, consume, dumpster, fillCan, finishSmoke, flappy, harvest, light, plant, stab, syringe, water } from "./rewards";
import { drop, pickup } from "./floor";
import { furniMove, furniPlace, furniState, furniStore, stashStore, stashTake, storeItem, takeItem } from "./toolbox";
import { tradeFinish } from "./trade";
import { debug } from "./debug";
import { backupNow, banPlayer } from "./admin";
import { giftAnswer, giftCollect, giftSend } from "./gift";
import { posterAdmin } from "./posters";
import { cdControl, cdInsert, cdReturn } from "./cd";
import { mix, mixCollect } from "./mixer";

/** Every thing the browser may ask for. Anything not listed here cannot be done: the browser can't write economy data itself. */
export const ACTIONS: Record<string, Action> = {
  sync, setLook, buyClothes,
  buySixty, buyVending, buyRecord, buyPoster, claimPurchases, buyFurni, buyRoomUpgrade, roomColors, roomSkins, sellWeed,
  sixty, usePill, eat,
  consume, stab, syringe, flappy, dumpster, light, finishSmoke, combine: combineItems, fillCan, plant, water, harvest,
  drop, pickup,
  store: storeItem, take: takeItem, stashStore, stashTake, buyStashbox, furniPlace, furniMove, furniStore, furniState,
  tradeFinish,
  cdInsert, cdReturn, cdControl, mix, mixCollect,
  debug, posterAdmin, backupNow, banPlayer, giftSend, giftAnswer, giftCollect,
};
