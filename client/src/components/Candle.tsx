import { t, useLanguage } from "utils/i18n"
import clsx from "clsx"
import { useCallback, useEffect, useState } from "react"
import type { Engine } from "tsparticles-engine"
import { loadSlim } from "tsparticles-slim"
import { loadEmittersPlugin } from "tsparticles-plugin-emitters"
import FlameParticles from "./FlameParticles"
import SmokeParticles from "./SmokeParticles"

const positionClasses = [
  "h-auto top-0 left-0 right-0 ml-auto mr-auto",
  "top-[10%] right-[20%]",
  "top-[33%] right-0",
  "bottom-[33%] right-0",
  "bottom-[10%] right-[20%]",
  "bottom-0 left-0 right-0 ml-auto mr-auto",
  "bottom-[10%] left-[20%]",
  "bottom-[33%] left-0",
  "top-[33%] left-0",
  "top-[10%] left-[20%]",
]

export default function Candle({ index, isLit, onToggle, clock, clockOffset = 0 }) {
  useLanguage()

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!isLit) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [isLit])
  const remaining = clock ? clock.remaining * (clock.startedAt === null ? 1 : Math.max(0, Math.min(1, 1 - (now + clockOffset - clock.startedAt) / clock.duration))) : 1
  const height = 0.16 + 0.84 * remaining
  const drop = (1280 / 23) * (1 - height)

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadEmittersPlugin(engine, false)
    await loadSlim(engine, false)
  }, [])

  return (
    <button draggable={false} onDragStart={(event) => event.preventDefault()} onContextMenu={(event) => event.preventDefault()} aria-label={t(`Candle ${index + 1}: ${Math.round(remaining * 100)}% wax, ${isLit ? "lit" : "out"}`)} data-candle={index} data-wax={remaining.toFixed(3)} onClick={() => onToggle()} className={clsx(positionClasses[index], "candle-sprite absolute w-[128px] h-[90px] pointer-events-auto")}>
      {index === 0 && <div className="candle-onboarding p-8 absolute -top-[100px] -left-[26px] w-[180px] h-[180px]" />}
      <div className="rounded-[100%] w-[130px] h-[20px] shadow-[0px_0px_12px_20px_rgba(16,16,15,0.2)] absolute top-[40px] bg-[rgba(16,16,15,0.2)]" />
      <img src="/candle.png" alt="" draggable={false} onDragStart={(event) => event.preventDefault()} className="absolute inset-0 w-full pointer-events-none select-none" style={{ imageRendering: "pixelated", transformOrigin: "center bottom", transform: `scaleY(${height})`, transition: "transform 250ms linear" }} />
      <div style={{ position: "absolute", top: drop, left: 0, width: "100%", transition: "top 250ms linear", pointerEvents: "none" }}>
      {isLit ? (
        <>
          <div
            className=" w-[200px] h-[200px] absolute -top-[105px] -left-[36px]"
            style={{
              background: "radial-gradient(circle at center, rgba(255, 207, 74, 0.5) 0%, rgba(255, 207, 74, 0) 60%",
            }}
          />
          <FlameParticles candleIndex={index} particlesInit={particlesInit} />
          <div className="-top-[1px] left-[61px] w-[6px] h-[6px] absolute bg-yellow" />
        </>
      ) : (
        <SmokeParticles candleIndex={index} />
      )}
      </div>
    </button>
  )
}
