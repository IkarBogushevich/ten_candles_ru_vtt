import { t, useLanguage } from "utils/i18n"
import clsx from "clsx"
import { useDroppable } from "@dnd-kit/core"
import User from "types/User"
import { useState } from "react"
import Card from "types/Card"
import CardType from "enums/CardType"
import { CARD_CLASSES } from "utils/constants"

type Props = {
  user: User
  currentUser: User
  cards?: Card[]
  areCardsLocked: boolean
  onOpenCardStack: () => void
  onMakeUserGm: () => void
  moreClasses?: string
}

export default function UserDroppable({
  user,
  currentUser,
  cards,
  areCardsLocked,
  onOpenCardStack,
  onMakeUserGm,
  moreClasses,
}: Props) {
  useLanguage()

  const { setNodeRef, isOver } = useDroppable({ id: user.id, data: { user } })
  const [showTopCards, setShowTopCards] = useState(false)

  const isCurrentUser = user.id === currentUser!.id
  const characterCard = cards?.find((c) => c.type === CardType.Character)

  let topCardInStack: Card | null = null
  // the top card in the stack is actually the last card in the array
  // it needs to be this way for the card stack to display correctly
  if (cards?.length) {
    const lastIndex = cards.length - 1
    if (cards[lastIndex].type === CardType.Character) {
      if (cards.length > 1) topCardInStack = cards[lastIndex - 1]
    } else {
      topCardInStack = cards[lastIndex]
    }
  }

  function handleClick() {
    if (isCurrentUser) {
      onOpenCardStack()
    } else if (currentUser!.isGm) {
      onMakeUserGm()
    }
  }

  return (
    <>
      <div className={clsx(!areCardsLocked && "z-50", "text-center absolute", moreClasses)}>
        <button
          ref={setNodeRef}
          className={clsx(
            isCurrentUser && "hover:bg-yellow hover:text-black",
            isOver && "scale-125",
            currentUser!.isGm || isCurrentUser ? "cursor-pointer" : "cursor-default",
            isCurrentUser && "this-user",
            "user text-xl text-yellow h-fit w-fit p-2.5 border-2 border-yellow bg-black"
          )}
          onClick={handleClick}
          onMouseEnter={() => {
            if (areCardsLocked) setShowTopCards(true)
          }}
          onMouseLeave={() => {
            if (areCardsLocked) setShowTopCards(false)
          }}
        >
          {user.name}
        </button>
      </div>
      {showTopCards && (
        <>
          <div className={clsx(characterCard && topCardInStack && "gap-4", "flex justify-center items-center z-50")}>
            {characterCard && (
              <div className={clsx(CARD_CLASSES, "!shadow-[0px_0px_40px_10px_rgba(0,0,0,0.4)]")}>
                <div className="text-xl">{t(CardType.Character)}</div>
                <div className="mt-3">{characterCard.content}</div>
              </div>
            )}
            {topCardInStack && (
              <div className={clsx(CARD_CLASSES, "!shadow-[0px_0px_40px_10px_rgba(0,0,0,0.4)]")}>
                {topCardInStack.type === CardType.Brink && !topCardInStack.isRevealed ? (
                  <div className="flex justify-center items-center text-center w-full h-full text-xl">
                    {t(CardType.Brink)}
                    <br />
                    {t("(hidden)")}</div>
                ) : (
                  <>
                    <div className="text-xl">{t(topCardInStack.type)}</div>
                    <div className="mt-3">{topCardInStack.content}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
