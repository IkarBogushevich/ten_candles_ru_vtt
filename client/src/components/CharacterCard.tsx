import { t, useLanguage } from "utils/i18n"
import clsx from "clsx"
import { useUser } from "context/UserContext"
import CardType from "enums/CardType"
import { useState } from "react"
import { TbCheck, TbFlame, TbPencil } from "react-icons/tb"
import { CgUndo } from "react-icons/cg"
import Card from "types/Card"
import { CARD_CLASSES } from "utils/constants"

export default function CharacterCard({
  content,
  cards,
  onUpdate,
  onDelete,
}: {
  content: string
  cards: Card[]
  onUpdate: (newContent: string) => void
  onDelete: () => void
}) {
  useLanguage()

  const { areCardsLocked } = useUser()

  const [isEditing, setIsEditing] = useState(false)
  const [currentContent, setCurrentContent] = useState(content)

  function handleRevert() {
    setCurrentContent(content)
    setIsEditing(false)
  }

  function handleSave() {
    onUpdate(currentContent)
    setIsEditing(false)
  }

  return (
    <div className={clsx(cards.length === 1 ? "" : "-mt-48", CARD_CLASSES, "card_character z-50")}>
      <div className="absolute top-2 right-2">
        {isEditing ? (
          <>
            <button className="hover:text-red p-0.5" onClick={handleRevert}>
              <CgUndo className="h-7 w-7" />
            </button>
            <button className="hover:text-green p-0.5" onClick={handleSave}>
              <TbCheck className="h-7 w-7" />
            </button>
          </>
        ) : (
          <>
            <button className="hover:text-blue p-0.5" onClick={() => setIsEditing(true)}>
              <TbPencil className="h-7 w-7" />
            </button>
            {!areCardsLocked && (
              <button className="hover:text-red p-0.5" onClick={onDelete}>
                <TbFlame className="h-7 w-7" />
              </button>
            )}
          </>
        )}
      </div>
      <div className="text-xl">{t(CardType.Character)}</div>
      {isEditing ? (
        <textarea
          value={currentContent}
          onChange={(e) => setCurrentContent(e.target.value)}
          className="bg-[transparent] border-black mt-3 w-full p-0"
          rows={6}
        />
      ) : (
        <div className="mt-3">{currentContent}</div>
      )}
    </div>
  )
}
