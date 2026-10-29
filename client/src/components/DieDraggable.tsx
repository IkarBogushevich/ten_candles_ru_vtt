import clsx from "clsx"
import { useDraggable } from "@dnd-kit/core"
import { PiHandGrabbingFill } from "react-icons/pi"
import Die from "types/Die"
import Drag from "types/Drag"
import { useEffect, useState } from "react"
import socket from "utils/socket"
import { useUser } from "context/UserContext"
import { HOPE_DIE_ID } from "utils/constants"

export default function DieDraggable({
  die,
  isDraggedByUsername,
  moreClasses,
}: {
  die: Die
  isDraggedByUsername?: string
  moreClasses?: string
}) {
  const { user } = useUser()

  const isBeingDraggedBySomeoneElse = isDraggedByUsername && isDraggedByUsername !== user!.name

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: die.id,
    data: die,
    disabled: !!isBeingDraggedBySomeoneElse,
  })

  const [peerDrag, setPeerDrag] = useState<Drag | null>(null)

  useEffect(() => {
    socket.on("dragged", ({ delta, username, dieId }) => {
      if (dieId === die.id) setPeerDrag({ delta, username, dieId })
    })
  }, [die.id])

  const delta = transform || peerDrag?.delta
  const style = delta ? { transform: `translate3d(${delta.x}px, ${delta.y}px, 0)` } : undefined

  let colorClasses
  if (die.id === HOPE_DIE_ID) {
    colorClasses =
      die.num >= 5 ? "text-darkgrey bg-lightblue border-lightblue" : "text-lightblue border-lightblue bg-darkgrey"
  } else {
    colorClasses =
      die.num === 6
        ? "text-darkgrey border-yellow bg-yellow"
        : die.num === 1
        ? "text-red border-red bg-darkgrey"
        : "text-orange border-orange bg-darkgrey"
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        colorClasses,
        isBeingDraggedBySomeoneElse && "opacity-60",
        isDragging ? "z-40" : "z-30",
        die.id === HOPE_DIE_ID && "die_hope",
        "relative flex justify-center items-center border-3 text-3xl w-[64px] h-[64px] pl-0.5 cursor-grab active:cursor-grabbing hover:brightness-125",
        moreClasses
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      {die.num}
      {isBeingDraggedBySomeoneElse && (
        <div className="absolute top-[6px] left-[12px] text-white text-sm flex flex-col justify-center items-center w-8 z-50">
          <PiHandGrabbingFill className="w-8 h-8" />
          {isDraggedByUsername}
        </div>
      )}
    </div>
  )
}
