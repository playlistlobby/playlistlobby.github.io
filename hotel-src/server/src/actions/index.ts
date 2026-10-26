import type { Action } from "./util";
import { buyClothes, setLook, sync } from "./account";
import { buyStashbox, buyFurni, buyPoster, buyRecord, buyRoomUpgrade, roomColors, roomSkins, buySixty, buyVending, sellWeed } from "./shop";
import { claimPurchases } from "./pay";
import { eat, sixty, usePill } from "./quest";
import { combineItems, consume, dumpster, fillCan, finishSmoke, flappy, harvest, light, plant, stab, syringe, water } from "./rewards";
import { drop, fentDrop, pickup } from "./floor";
import { furniMove, furniPlace, furniState, furniStore, stashStore, stashTake, storeItem, takeItem } from "./toolbox";
import { tradeFinish } from "./trade";
import { debug } from "./debug";
import { flappyScore, flappyStart } from "./flappyboard";
import { backupNow, banPlayer } from "./admin";
import { giftAnswer, giftCollect, giftSend } from "./gift";
import { posterAdmin } from "./posters";
import { cdControl, cdInsert, cdReturn } from "./cd";
import { mix, mixCollect } from "./mixer";
import { rouletteJoin, rouletteLeave, rouletteOpen, roulettePull, rouletteTick } from "./roulette";
import { ideaComment, ideaDelete, ideaLike, ideaPost } from "./ideas";
import { duckyBuy } from "./ducky";
import { craft, mine } from "./mines";
import { modAlts, modBan, modBanMany, modBlood, modDismissReport, modIpBan, modIps, modKick, modMute, modNotice, modPromote, modRename, reportPlayer } from "./mod";
import { rollDice } from "./dice";
import { register } from "./signup";
import { raffleBuy, raffleCollect, raffleRemove, raffleTick } from "./raffle";
import { bagmandBuy, bagmandSell, deadlyStab } from "./bagmand";
import { loudspeaker } from "./loudspeaker";
import { petBuy, petPickup, petRelease, petStockNow } from "./pets";
import { caseOpen, unusualRemove, unusualWear } from "./cases";
import { hideoutAnswer, hideoutBoxStore, hideoutBoxTake, hideoutBuy, hideoutCollect, hideoutColors, hideoutInvite, hideoutKick, hideoutLeave, hideoutMember, hideoutOrder, hideoutSearch, hideoutSettings, hideoutUpgrade, hideoutBoost } from "./hideout";

/** Every thing the browser may ask for. Anything not listed here cannot be done: the browser can't write economy data itself. */
export const ACTIONS: Record<string, Action> = {
  sync, setLook, buyClothes,
  buySixty, buyVending, buyRecord, buyPoster, claimPurchases, buyFurni, buyRoomUpgrade, roomColors, roomSkins, sellWeed,
  sixty, usePill, eat,
  consume, stab, syringe, flappy, dumpster, light, finishSmoke, combine: combineItems, fillCan, plant, water, harvest,
  drop, pickup, fentDrop,
  store: storeItem, take: takeItem, stashStore, stashTake, buyStashbox, furniPlace, furniMove, furniStore, furniState,
  tradeFinish, flappyStart, flappyScore,
  cdInsert, cdReturn, cdControl, mix, mixCollect,
  rouletteOpen, rouletteJoin, rouletteLeave, roulettePull, rouletteTick,
  ideaPost, ideaComment, ideaLike, ideaDelete,
  duckyBuy, rollDice, register,
  modMute, modBan, modBanMany, modPromote, modAlts, modDismissReport, reportPlayer, modBlood, modIpBan, modIps, modNotice, modKick, modRename,
  raffleBuy, raffleCollect, raffleRemove, raffleTick,
  bagmandBuy, bagmandSell, deadlyStab, loudspeaker, petBuy, petRelease, petPickup, petStockNow, caseOpen, unusualWear, unusualRemove,
  hideoutBuy, hideoutUpgrade, hideoutColors, hideoutSettings, hideoutKick, hideoutLeave, hideoutMember, hideoutSearch, hideoutInvite, hideoutAnswer, hideoutBoxStore, hideoutBoxTake, hideoutOrder, hideoutCollect, hideoutBoost,
  mine, craft,
  debug, posterAdmin, backupNow, banPlayer, giftSend, giftAnswer, giftCollect,
};
