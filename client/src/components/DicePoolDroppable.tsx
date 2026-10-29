import { t, useLanguage } from "utils/i18n"
import clsx from "clsx"
import { useDroppable } from "@dnd-kit/core"
import Die from "types/Die"
import DieDraggable from "./DieDraggable"
import DicePool from "enums/DicePool"
import { HOPE_DIE_ID } from "utils/constants"

type Props = {
  dicePool: DicePool
  dice: Die[]
  draggingDice: { dieId: number; username: string }[]
  showRollButton?: boolean
  onRoll?: () => void
  moreClasses?: string
}

export default function DicePoolDroppable({
  dicePool,
  dice,
  draggingDice,
  showRollButton,
  onRoll,
  moreClasses,
}: Props) {
  useLanguage()

  const { isOver, setNodeRef } = useDroppable({
    id: dicePool,
  })

  const hopeDie = dice.find((d) => d.id === HOPE_DIE_ID)

  return (
    <div ref={setNodeRef} className={clsx(isOver && "bg-orangeTransparent", moreClasses)}>
      <div className="dice-pool-heading flex items-center justify-center gap-4">
        <h2 className="text-center text-xl">{t(dicePool)}</h2>
        {showRollButton && (
          <button
            onClick={onRoll}
            disabled={dice.length === 0}
            className="dice-roll btn !text-xl bg-yellow text-black !py-2.5 !px-[1.1rem]"
          >
            {t("Roll")}</button>
        )}
      </div>
      <div
        className={clsx(
          dicePool === DicePool.Stash ? "w-[100px] flex-col" : "flex-wrap justify-center",
          "relative flex gap-1 mt-4"
        )}
      >
        {dicePool === DicePool.Stash && hopeDie && (
          <DieDraggable
            die={hopeDie}
            isDraggedByUsername={draggingDice.find((d) => d.dieId === HOPE_DIE_ID)?.username}
            moreClasses="mx-auto mb-2"
          />
        )}
        {dice.map((die) =>
          dicePool === DicePool.Stash && die.id === HOPE_DIE_ID ? null : (
            <DieDraggable
              key={die.id}
              die={die}
              isDraggedByUsername={draggingDice.find((d) => d.dieId === die.id)?.username}
              moreClasses={dicePool === DicePool.Stash ? "mx-auto -mb-14" : ""}
            />
          )
        )}
      </div>
    </div>
  )
}
