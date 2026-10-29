import { t, useLanguage } from "utils/i18n"
import { useState } from "react"
import { useUser } from "context/UserContext"

export default function CandleModal({ onClose }: { onClose: () => void }) {
  useLanguage()

  const { candleLifetime, setCandleLifetime } = useUser()

  const [hours, setHours] = useState<string>(Math.floor(candleLifetime / 3600).toString())
  const [minutes, setMinutes] = useState<string>(Math.floor((candleLifetime % 3600) / 60).toString())
  const [seconds, setSeconds] = useState<string>(Math.floor((candleLifetime % 3600) % 60).toString())

  function handleSave() {
    const totalSeconds = Math.max(1, Math.min(86400, Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)))
    if (!Number.isFinite(totalSeconds)) return
    setCandleLifetime(totalSeconds)
    onClose()
  }

  return (
    <>
      <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={onClose} />
      <div className="text-lg text-center text-white z-50 fixed max-w-[650px] h-fit bg-grey px-8 py-6">
        <div>{t("Each candle will go out")}</div>
        <input
          value={hours}
          type="number"
          min={0}
          onChange={(e) => setHours(e.target.value)}
          className="text-yellow my-3 focus:border-yellow focus:ring-yellow w-16 text-center p-1 bg-[transparent] border-2 border-yellow"
        />{" "}
        {t("hours")}{" "}
        <input
          value={minutes}
          type="number"
          min={0}
          onChange={(e) => setMinutes(e.target.value)}
          className="text-yellow my-3 focus:border-yellow focus:ring-yellow w-16 text-center p-1 bg-[transparent] border-2 border-yellow"
        />{" "}
        {t("minutes")}{" "}
        <input
          value={seconds}
          type="number"
          min={0}
          onChange={(e) => setSeconds(e.target.value)}
          className="text-yellow my-3 focus:border-yellow focus:ring-yellow w-16 text-center p-1 bg-[transparent] border-2 border-yellow"
        />{" "}
        {t("seconds")}<div>{t("after being lit.")}</div>
        <div className="mt-3">
          {t("Candles gradually shrink as they burn. Extinguishing pauses wax consumption; relighting resumes it. The duration is shared with everyone when you light a candle. Relight burning candles to apply a new duration.")}</div>
        <div className="flex gap-4 text-base justify-center mt-8">
          <button className="hover:text-yellow text-lg" onClick={onClose}>
            {t("Cancel")}</button>
          <button className="btn bg-blue text-white" onClick={handleSave}>
            {t("Save")}</button>
        </div>
      </div>
    </>
  )
}
