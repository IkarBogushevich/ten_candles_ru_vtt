import { t, useLanguage } from "utils/i18n"
import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import clsx from "clsx"
import { TbEye, TbFlame } from "react-icons/tb"
import Card from "types/Card"
import { CARD_CLASSES } from "utils/constants"
import CardType from "enums/CardType"

const xShift = 40

type Props = {
  card: Card
  areCardsLocked: boolean
  isTopOfStack: boolean
  onDelete: () => void
  onRevealBrink: () => void
}

export default function CardDraggable({ card, areCardsLocked, isTopOfStack, onDelete, onRevealBrink }: Props) {
  useLanguage()

  const [isDragDisabled, setIsDragDisabled] = useState(false)

  const {
    activeIndex,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    overIndex,
    index,
    isSorting,
  } = useSortable({
    id: card.id,
    data: { card },
    disabled: isDragDisabled || areCardsLocked,
  })

  const isBehindDraggingCard = index > activeIndex && index <= overIndex
  const isInFrontOfDraggingCard = index < activeIndex && index >= overIndex

  let x = transform?.x
  if (isBehindDraggingCard) x = xShift
  if (isInFrontOfDraggingCard) x = -xShift

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, x: x!, scaleX: 1, scaleY: 1 } : transform),
    transition,
    marginLeft: index * -30,
  }

  let title: string = card.type
  if (card.type === CardType.Brink && areCardsLocked) {
    title = card.isRevealed ? "Brink (revealed)" : "Brink (hidden)"
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        isSorting && "opacity-70",
        isDragging && "!opacity-0",
        areCardsLocked ? "hover:z-[999] cursor-default" : "hover:-translate-y-2",
        CARD_CLASSES,
        "mb-[-168px] translate-y-0"
      )}
    >
      {(!areCardsLocked || isTopOfStack) && (
        <div className="absolute top-2 right-2">
          {card.type === CardType.Brink && areCardsLocked && !card.isRevealed && (
            <button className="p-0.5 hover:text-blue" onClick={onRevealBrink}>
              <TbEye className="h-7 w-7" />
            </button>
          )}
          <button
            className="p-0.5 hover:text-red"
            onClick={onDelete}
            // this prevents clicking delete button from starting drag
            onMouseEnter={() => setIsDragDisabled(true)}
            onMouseLeave={() => setIsDragDisabled(false)}
          >
            <TbFlame className="h-7 w-7" />
          </button>
        </div>
      )}
      <div className="text-xl">{t(title)}</div>
      <div className="mt-3">{card.content}</div>
    </div>
  )
}
