import { t, useLanguage } from "utils/i18n"
import { useState } from "react"
import { nanoid } from "nanoid"
import CardType from "enums/CardType"
import Card from "types/Card"

type Props = {
  cards: Card[]
  addCard: (card: Card) => void
  onClose: () => void
}

export default function CreateCardModal({ cards, addCard, onClose }: Props) {
  useLanguage()

  const [type, setType] = useState<CardType | string>("")
  const [content, setContent] = useState<string>("")

  function handleCreate() {
    addCard({ id: nanoid(), type: type as CardType, content, isRevealed: type !== CardType.Brink })
    onClose()
  }

  return (
    <>
      <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={onClose} />
      <div className="flex flex-col p-4 bg-yellow w-[500px] z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black">
        <select
          className="block p-2 border border-black bg-[transparent] w-full text-xl"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="" disabled>
            {t("Select a card type")}</option>
          {Object.values(CardType).map((cardType) => (
            <option
              key={cardType}
              value={cardType}
              disabled={cardType === CardType.Character && cards.some((c) => c.type === CardType.Character)}
            >
              {t(cardType)}
            </option>
          ))}
        </select>
        <textarea
          placeholder={t("Enter details here")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-lg bg-[transparent] border-black mt-2 w-full placeholder:text-[rgba(0,0,0,0.4)]"
          rows={6}
        />
        <div className="mt-2 flex justify-end gap-4">
          <button className="text-lg hover:text-blue" onClick={onClose}>
            {t("Cancel")}</button>
          <button disabled={!type} className="btn text-white bg-blue" onClick={handleCreate}>
            {t("Create")}</button>
        </div>
      </div>
    </>
  )
}
