import { t, useLanguage } from "utils/i18n"
import { TbEye, TbFlame, TbPencil, TbX } from "react-icons/tb"
import { RiCandleLine } from "react-icons/ri"

export default function HelpModal({ onClose }: { onClose: () => void; onSwitchFont: () => void }) {
  useLanguage()

  return (
    <>
      <div className="h-screen w-screen fixed absolute top-0 left-0 bg-black opacity-70 z-50" onClick={onClose} />
      <div className="flex justify-center items-center h-screen w-screen absolute p-4">
        <div className="relative text-white z-50 max-w-[650px] max-h-full bg-grey text-sm flex flex-col px-8 py-6">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:text-yellow">
            <TbX className="h-8 w-8" />
          </button>
          <h2 className="text-center text-4xl mb-6">{t("Useful Tips")}</h2>
          <div className="overflow-y-auto pr-2 font-sans text-lg">
            <p className="mb-4 text-yellow text-base">
              {t("If something isn't working, please email me at robyn3choi@gmail.com.")}</p>
            <h3 className="text-2xl pb-2 font-semibold">{t("Room Setup")}</h3>
            <ul>
              <li>
                {t("Whoever creates this room will be assigned as the")}{" "}<strong>{t("GM")}</strong>{" "}{t(". Send this page's URL to the rest of your group to invite them to join this room.")}</li>
              <li>
                {t("If you need to, click on another player to make them the")}{" "}<strong>{t("GM")}</strong> {t("instead.")}</li>
              <li>
                {t("You can adjust how long each candle lasts by clicking")}{" "}
                <RiCandleLine className="inline w-7 h-7 text-yellow" /> {t("in the top right corner (only the")}{" "}{" "}<strong>{t("GM")}</strong> {t("can see this).")}</li>
            </ul>

            <h3 className="text-2xl pt-5 pb-2 font-semibold">{t("Character Creation")}</h3>
            <ul>
              <li>
                {t("Follow the character creation rules for Ten Candles by clicking on candles to light them, adding cards, and dragging cards to other players.")}</li>
              <li>
                {t("To rearrange your card stack, view your cards by clicking on your name at the bottom of the screen, then drag each card to where you want them in the stack.")}</li>
              <li>
                {t("When character creation is complete, the")}{" "}<strong>{t("GM")}</strong> {t("should click the lock button to set it to locked. This will prevent further changes to your card stack, but you'll still be able to edit your Character/Inventory card throughout the game.")}</li>
            </ul>

            <h3 className="text-2xl pt-5 pb-2 font-semibold">{t("Gameplay")}</h3>
            <ul>
              <li>{t("You can roll dice and drag them in between Player Dice pool, GM Dice pool, and Dice Stash.")}</li>
              <li>
                {t("The")}{" "}<span className="text-lightblue">{t("blue")}</span> {t("die is the Hope die. When a player wants to use their Hope die, drag this die into the Player Dice pool")}</li>
              <li>
                {t("Hover your cursor over a player to view their Character/Inventory card and the top card in their stack. The content of their Brink card will be hidden until they reveal it.")}</li>
              <li>
                {t("Click your name (at the bottom of the screen) to view your cards. Here, you can:")}<ul className="mt-2">
                  <li>
                    {t("Edit your Character/Inventory card by clicking")}<TbPencil className="inline w-7 h-7" />
                  </li>
                  <li>
                    {t("Burn the active (top) card in your stack by clicking")}<TbFlame className="inline w-7 h-7" />
                  </li>
                  <li>
                    {t("Reveal your Brink if it's active by clicking")}<TbEye className="inline w-7 h-7" />
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
