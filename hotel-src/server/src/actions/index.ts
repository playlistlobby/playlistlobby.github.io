import type { Action } from "./util";
import { buyClothes, setLook, sync } from "./account";
import { stashEnsure, buyFurni, buyPoster, buyRecord, buyWalkman, buyRoomUpgrade, roomColors, roomSkins, buySixty, buyVending, sellWeed } from "./shop";
import { claimPurchases } from "./pay";
import { eat, sixty, usePill } from "./quest";
import { combineItems, consume, dumpster, fillCan, finishSmoke, flappy, harvest, light, plant, stab, syringe, vapePuff, water } from "./rewards";
import { drop, fentDrop, pickup } from "./floor";
import { furniMove, furniPlace, furniState, furniStore, stashStore, stashTake, storeItem, takeItem } from "./toolbox";
import { tradeFinish } from "./trade";
import { buildCheck, debug, staffTp } from "./debug";
import { flappyRemove, flappyScore, flappyStart } from "./flappyboard";
import { backupNow, banPlayer } from "./admin";
import { giftAnswer, giftCollect, giftSend } from "./gift";
import { posterAdmin } from "./posters";
import { cdControl, cdInsert, cdReturn } from "./cd";
import { mix, mixCollect } from "./mixer";
import { pokerAct, pokerLeave, pokerSit, pokerTick } from "./poker";
import { gunShoot, hitPlace, hitSearch, rocketFire } from "./hits";
import { boardSet } from "./board";
import { bjAct, bjBet, bjDealer, bjLeave, bjSit, bjTickAction } from "./blackjack";
import { rouletteJoin, rouletteLeave, rouletteOpen, roulettePull, rouletteTick } from "./roulette";
import { ideaComment, ideaDelete, ideaLike, ideaPost } from "./ideas";
import { duckyBuy } from "./ducky";
import { craft, mine } from "./mines";
import { modAlts, modBan, modBanMany, modBlood, modDismissReport, modIpBan, modIps, modKick, modMute, modNotice, modPromote, modRename, reportPlayer } from "./mod";
import { rollDice } from "./dice";
import { register } from "./signup";
import { raffleBuy, raffleCollect, raffleRemove, raffleTick } from "./raffle";
import { bagmandBuy, bagmandSell, deadlyStab } from "./bagmand";
import { bagmandHitTick, bountyShow } from "./bounty";
import { roomSweep } from "./sweep";
import { speakerConnect, speakerControl } from "./speaker";
import { cdPress, cdPressPrice } from "./cdpress";
import { elevatorDown, elevatorUp, streetBin, streetEnter, streetFill, streetHeal, streetHit, streetShoot, streetTick, streetReturn, streetsTest, ticketBuy, streetsStaffTest } from "./streets";
import { beatBegin, beatBuy, beatChatRead, beatChatSend, beatFinish, beatRemove, beatReplyBegin, buyBeatShop } from "./beats";
import { songBegin, songDelete, songFinish, songSweep, songVote } from "./songs";
import { loudspeaker } from "./loudspeaker";
import { darkwebCollect, darkwebGive } from "./darkweb";
import { petBuy, petPickup, petRelease, petStockNow } from "./pets";
import { caseOpen, unusualRemove, unusualWear } from "./cases";
import { hideoutAnswer, hideoutBoxStore, hideoutBoxTake, hideoutBuy, hideoutCollect, hideoutColors, hideoutInvite, hideoutKick, hideoutLeave, hideoutMember, hideoutOrder, hideoutSearch, hideoutSettings, hideoutUpgrade, hideoutBoost, hideoutChestPut, hideoutChestTake, attachUpgrade, hideoutFavorite, hideoutTillCollect, hideoutDonate } from "./hideout";

/** Every thing the browser may ask for. Anything not listed here cannot be done: the browser can't write economy data itself. */
export const ACTIONS: Record<string, Action> = {
  sync, setLook, buyClothes,
  buySixty, buyVending, buyRecord, buyWalkman, buyPoster, claimPurchases, buyFurni, buyRoomUpgrade, roomColors, roomSkins, sellWeed,
  sixty, usePill, eat, darkwebGive, darkwebCollect, streetsStaffTest,
  consume, stab, syringe, vapePuff, flappy, dumpster, light, finishSmoke, combine: combineItems, fillCan, plant, water, harvest,
  drop, pickup, fentDrop,
  store: storeItem, take: takeItem, stashStore, stashTake, stashEnsure, furniPlace, furniMove, furniStore, furniState,
  tradeFinish, flappyStart, flappyScore, flappyRemove,
  cdInsert, cdReturn, cdControl, speakerConnect, speakerControl, cdPress, cdPressPrice, ticketBuy, elevatorUp, elevatorDown, streetBin, streetFill, streetEnter, streetHit, streetShoot, streetTick, streetReturn, streetHeal, streetsTest, buyBeatShop, beatBegin, beatFinish, beatRemove, beatBuy, beatReplyBegin, beatChatSend, beatChatRead, mix, mixCollect,
  rouletteOpen, rouletteJoin, rouletteLeave, roulettePull, rouletteTick,
  pokerSit, pokerAct, pokerLeave, pokerTick,
  hitPlace, hitSearch, gunShoot, rocketFire, boardSet,
  bjSit, bjBet, bjAct, bjLeave, bjDealer, bjTick: bjTickAction,
  ideaPost, ideaComment, ideaLike, ideaDelete,
  duckyBuy, rollDice, register,
  modMute, modBan, modBanMany, modPromote, modAlts, modDismissReport, reportPlayer, modBlood, modIpBan, modIps, modNotice, modKick, modRename,
  raffleBuy, raffleCollect, raffleRemove, raffleTick,
  bagmandBuy, bagmandSell, deadlyStab, bagmandHitTick, bountyShow, roomSweep, songBegin, songFinish, songVote, songDelete, songSweep, loudspeaker, petBuy, petRelease, petPickup, petStockNow, caseOpen, unusualWear, unusualRemove,
  hideoutBuy, hideoutUpgrade, hideoutColors, hideoutSettings, hideoutKick, hideoutLeave, hideoutMember, hideoutSearch, hideoutInvite, hideoutAnswer, hideoutBoxStore, hideoutBoxTake, hideoutOrder, hideoutCollect, hideoutBoost, hideoutChestPut, hideoutChestTake, attachUpgrade, hideoutFavorite, hideoutTillCollect, hideoutDonate,
  mine, craft,
  debug, staffTp, buildCheck, posterAdmin, backupNow, banPlayer, giftSend, giftAnswer, giftCollect,
};
