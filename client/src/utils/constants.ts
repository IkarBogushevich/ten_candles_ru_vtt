import { t } from "utils/i18n"
import OnboardingStage from "enums/OnboardingStage"

export const MIN_WINDOW_HEIGHT = 700
export const MIN_WINDOW_WIDTH = 947

export const HOPE_DIE_ID = 11

export const CARD_CLASSES =
  "card bg-yellow whitespace-pre-wrap relative px-4 py-3 w-[350px] h-[210px] text-black shadow-[0px_0px_20px_5px_rgba(0,0,0,0.15)]"

export const ONBOARDING_STORAGE_KEY = "tenCandles_completedOnboardingStages"
export const ONBOARDING_GM_STORAGE_KEY = "tenCandles_gmOnboardingStage"

export const ONBOARDING_STEPS = {
  [OnboardingStage.Table]: [
    {
      selector: ".candle-onboarding",
      get content() { return t("Click a candle to light or darken it.") },
    },
    {
      selector: ".dice-pool_player",
      get content() { return t("This is the players’ dice pool. Click the “Roll” button to roll all the dice in this pool, which will update the dice for everyone.") },
    },
    {
      selector: ".dice-pool_gm",
      get content() { return t("This is the GM’s dice pool that will show a “Roll” button for the GM. There may not be any dice here yet, but anyone can drag dice between dice pools.") },
    },
    {
      selector: ".dice-pool_stash",
      get content() { return t("This is where you can set aside the dice that land on 1 during successful player rolls.") },
    },
    {
      selector: ".die_hope",
      get content() { return t("This is the Hope die. Drag it into the player dice pool when a player wants to use their Hope die.") },
    },
    {
      selector: ".this-user",
      get content() { return t("Click your name to view your cards.") },
    },
  ],
  [OnboardingStage.SingleCard]: [
    {
      selector: ".card",
      get content() { return t("You can drag a card onto another player to give it to them. (If there are no other players here yet, invite them by sending them this page's URL.)") },
    },
  ],
  [OnboardingStage.MultipleCards]: [
    {
      selector: ".card:not(.card_character)",
      get content() { return t("Now that you have multiple cards in your stack, you can drag cards to rearrange the order.") },
    },
  ],
  [OnboardingStage.GmButtons]: [
    {
      selector: ".gm-btns",
      get content() { return t("These are buttons that only you can see because you're the GM. To make someone else the GM, click on their name.") },
    },
  ],
  [OnboardingStage.GmLock]: [
    {
      selector: ".btn_lock",
      get content() { return t("If everyone is finished arranging their cards and you're ready to start the game, click this to lock everyone's card stacks to prevent further changes. (You can click this again to unlock them if needed.)") },
    },
  ],
}
