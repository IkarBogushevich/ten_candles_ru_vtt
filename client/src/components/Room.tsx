import { useLanguage } from "utils/i18n"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useParams } from "react-router-dom"
import { DndContext, DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import socket from "utils/socket"
import Candle from "components/Candle"
import { useUser } from "context/UserContext"
import { getInitialDice } from "utils/helpers"
import DicePoolDroppable from "./DicePoolDroppable"
import Die from "types/Die"
import DicePool from "enums/DicePool"
import { HOPE_DIE_ID } from "utils/constants"
import Lobby from "./Lobby"
import UI from "./UI"
import OnboardingStage from "enums/OnboardingStage"
import { useOnboarding } from "context/OnboardingContext"
import { resumeToken } from 'utils/session'

export default function Room() {
  useLanguage()

  const { user, setUser, areCardsLocked, setAreCardsLocked, candleLifetime } = useUser()
  const [clocks, setClocks] = useState<any[]>([])
  const [clockOffset, setClockOffset] = useState(0)
  const { room } = useParams()

  const [candles, setCandles] = useState<boolean[]>(Array(10).fill(false))
  const [dicePools, setDicePools] = useState<{ [key in DicePool]: Die[] }>({
    [DicePool.Player]: getInitialDice(),
    [DicePool.GM]: [],
    [DicePool.Stash]: [{ id: HOPE_DIE_ID, num: 1 }],
  })
  const [draggingDice, setDraggingDice] = useState<{ dieId: number; username: string }[]>([])

  const { startOnboardingStage, completedOnboardingStages } = useOnboarding()

  useEffect(() => {
    if (user?.id && !completedOnboardingStages.includes(OnboardingStage.Table)) {
      startOnboardingStage(OnboardingStage.Table)
    }
    // adding startOnboardingStage as a dependency creates a bug where the table tutorial restarts immediately after ending closing onboarding
    // eslint-disable-next-line
  }, [user?.id, completedOnboardingStages])

  const transferDieToNewPool = useCallback((dieId, prevDicePool, newDicePool) => {
    setDicePools((prevState) => {
      const newState = { ...prevState }
      // remove die from the pool that the drag started in
      const index = newState[prevDicePool].findIndex((die) => die.id === dieId)
      if (index > -1) {
        const [die] = newState[prevDicePool].splice(index, 1)
        // add die to the pool that the drag ended in
        newState[newDicePool].push(die)
      }
      return newState
    })
  }, [])

  useEffect(() => {
    function initSocket() {
      socket.connect()

      socket.on("connect", () => {
        socket.emit("userJoined", { user, room, resumeToken:resumeToken(user!,room!) })
      })

      socket.on("disconnect", () => {
        toast(
          "Connection lost. Reconnecting. Your session and notes are saved.",
          { duration: Infinity, id:'table-connection' }
        )
      })
    }
    if (user) initSocket()

    return () => {
      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
      }
    }
    // we only want to rerun if user id changes
    // eslint-disable-next-line
  }, [room, user?.id])

  useEffect(() => {
    socket.on("candleClocks", ({clocks: next, serverNow}) => {
      setClocks(next)
      setClockOffset(serverNow - Date.now())
      setCandles(next.map(c => c.startedAt !== null))
    })
    socket.on('roomSnapshot', snapshot=>{
      toast.dismiss('table-connection');toast.dismiss('table-api-error')
      setUser(snapshot.user);setDicePools(snapshot.dicePools);setCandles(snapshot.candles);setAreCardsLocked(snapshot.areCardsLocked)
    })
    socket.on('sessionError',({message})=>toast(message,{duration:Infinity,id:'table-api-error'}))
    function syncInitialState() {
      // The server owns the table. A reconnect must never overwrite it with defaults.
    }
    socket.on("usersUpdated", syncInitialState)

    socket.on("passedInitialState", ({ dicePools: _dicePools, candles: _candles, areCardsLocked: _areCardsLocked }) => {
      setDicePools(_dicePools)
      setCandles(_candles)
      setAreCardsLocked(_areCardsLocked)
    })

    socket.on("candleChanged", ({ index, isLit, username }) => {
      setCandles((prevState) => {
        const newState = [...prevState]
        newState[index] = isLit
        return newState
      })
      if (username !== user!.name) {
        toast(`${username} ${isLit ? "lit" : "darkened"} a candle.`)
      }
    })

    socket.on("rolled", ({ dicePool, dice, username }) => {
      setDicePools((prevState) => {
        const newState = { ...prevState }
        dice.forEach((d, i) => (newState[dicePool][i].num = d))
        return newState
      })
      if (username !== user!.name) {
        toast(`${username} rolled the ${dicePool}.`)
      }
    })

    socket.on("dieDragStarted", ({ username, dieId }) => {
      setDraggingDice((prevState) => [...prevState, { dieId, username }])
    })

    socket.on("dieDragEnded", ({ prevDicePool, newDicePool, dieId }) => {
      setDraggingDice((prevState) => {
        const newState = [...prevState]
        const index = newState.findIndex((entry) => entry.dieId === dieId)
        if (index > -1) {
          newState.splice(index, 1)
        }
        return newState
      })
      if (newDicePool && prevDicePool !== newDicePool) {
        transferDieToNewPool(dieId, prevDicePool, newDicePool)
      }
    })

    return () => {
      socket.removeAllListeners("passedInitialState")
      socket.removeAllListeners('roomSnapshot')
      socket.removeAllListeners('sessionError')
      socket.removeAllListeners("candleClocks")
      // UI has its own usersUpdated listener; retain that one.
      socket.off("usersUpdated", syncInitialState)
      socket.removeAllListeners("candleChanged")
      socket.removeAllListeners("rolled")
      socket.removeAllListeners("dieDragStarted")
      socket.removeAllListeners("dieDragEnded")
    }
    // for some reason we need to rerun this useeffect when cards is updated
    // or else the socket will be lost after cards is updated
  })

  if (!user) {
    return <Lobby room={room} />
  }

  function handleDieDragStart(event: DragStartEvent) {
    let dicePool = DicePool.Player

    if (dicePools[DicePool.GM].find((die) => die.id === event.active.id)) {
      dicePool = DicePool.GM
    } else if (dicePools[DicePool.Stash].find((die) => die.id === event.active.id)) {
      dicePool = DicePool.Stash
    }

    socket.emit("dieDragStart", { username: user!.name, room, dieId: event.active.id, dicePool })
  }

  function handleDieDragEnd(event: DragEndEvent) {
    let prevDicePool = DicePool.Player
    if (dicePools[DicePool.GM].find((die) => die.id === event.active.id)) {
      prevDicePool = DicePool.GM
    } else if (dicePools[DicePool.Stash].find((die) => die.id === event.active.id)) {
      prevDicePool = DicePool.Stash
    }

    const newDicePool = event.over?.id

    if (newDicePool && prevDicePool !== newDicePool) {
      transferDieToNewPool(event.active.id, prevDicePool, newDicePool)
    }

    socket.emit("dieDragEnd", { username: user!.name, room, dieId: event.active.id, prevDicePool, newDicePool })
  }

  function handleRoll(dicePool: DicePool) {
    socket.emit("roll", { dicePool, diceCount: dicePools[dicePool].length, username: user!.name, room })
  }

  function handleCandleToggle(index, override?) {
    socket.emit("candleChange", {
      index,
      lifetime: candleLifetime,
      isLit: override === undefined ? !candles[index] : override,
      username: user!.name,
      room,
    })
  }

  const litCandleCount = candles.filter((c) => c).length
  const darknessOpacity = areCardsLocked ? 0.8 - (litCandleCount * 1) / 12.5 : 0

  return (
    <>
      <div
        className="bg-[url('/wood.png')] bg-[length:250px] absolute w-full h-full rounded-[100%] shadow-[0_0_50px_70px_rgba(16,16,15,1)_inset] outline outline-black"
        style={{ imageRendering: "pixelated" }}
      />
      {/* <p className="absolute top-1 left-2 text-xs text-lightgrey">
        To invite players to join this room, send them this page’s URL.
      </p> */}
      <div
        style={{ opacity: `${darknessOpacity}` }}
        className="pointer-events-none bg-[#000000] w-screen h-screen fixed"
      />
      {/* candles */}
      <div className="relative w-full h-full scale-75 mb-10 z-20 pointer-events-none rounded-[100%]">
        {candles.map((isLit, i) => (
          <Candle key={i} index={i} clock={clocks[i]} clockOffset={clockOffset} isLit={isLit} onToggle={(override) => handleCandleToggle(i, override)} />
        ))}
      </div>
      {/* dice */}
      <DndContext onDragStart={handleDieDragStart} onDragEnd={handleDieDragEnd}>
        <div className="dice-table absolute w-[50%] xl:w-[60%] h-[55%] z-10">
          <div className="dice-main relative">
            <DicePoolDroppable
              dicePool={DicePool.Player}
              dice={dicePools[DicePool.Player]}
              draggingDice={draggingDice}
              showRollButton
              onRoll={() => handleRoll(DicePool.Player)}
              moreClasses="dice-pool_player p-2 pt-0 h-[50%] border-b-6 border-brown"
            />
            <DicePoolDroppable
              dicePool={DicePool.GM}
              dice={dicePools[DicePool.GM]}
              draggingDice={draggingDice}
              showRollButton={user.isGm}
              onRoll={() => handleRoll(DicePool.GM)}
              moreClasses="dice-pool_gm p-2 pb-0 h-[50%]"
            />
          </div>
          <DicePoolDroppable
            dicePool={DicePool.Stash}
            dice={dicePools[DicePool.Stash]}
            draggingDice={draggingDice}
            moreClasses="dice-pool_stash p-2 my-12 border-l-6 border-brown"
          />
        </div>
      </DndContext>
      <UI candles={candles} />
    </>
  )
}
