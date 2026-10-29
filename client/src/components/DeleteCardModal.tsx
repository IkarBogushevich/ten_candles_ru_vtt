import { t, useLanguage } from "utils/i18n"
import Card from "types/Card"
import { CARD_CLASSES } from "utils/constants"

type Props = {
  card: Card
  onDelete: () => void
  onCancel: () => void
}

export default function DeleteCardModal({ card, onDelete, onCancel }: Props) {
  useLanguage()

  return (
    <>
      <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={onCancel} />
      <div className="flex flex-col gap-4 justify-center items-center text-white z-50 fixed w-fit h-fit text-xl bg-grey px-8 py-6">
        {t("Are you sure you want to burn this card?")}<div className={CARD_CLASSES}>
          <div className="text-xl">{t(card.type)}</div>
          <div className="mt-3 text-base">{card.content}</div>
        </div>
        <div className="flex gap-4">
          <button className="text-lg hover:text-yellow" onClick={onCancel}>
            {t("Cancel")}</button>
          <button className="btn text-white bg-red" onClick={onDelete}>
            {t("Yes")}</button>
        </div>
      </div>
    </>
  )
}
