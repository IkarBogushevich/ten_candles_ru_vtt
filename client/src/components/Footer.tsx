import { t, useLanguage } from "utils/i18n"
export default function Footer() {
  useLanguage()

  return (
    <div className="p-2 font-sans absolute bottom-1 text-center w-full opacity-80 text-[0.94rem] text-yellow">
      <p>
        {t("This is a virtual tabletop for")}{" "}
        <a
          className="underline hover:text-white"
          href="https://cavalrygames.com/ten-candles-info"
          target="_blank"
          rel="noreferrer"
        >
          {t("Ten Candles")}</a>
        {t(", a tabletop roleplaying game by Stephen Dewey.")}</p>
      <p className="mt-0.5">
        {t("Created by")}{" "}
        <a className="underline hover:text-white" href="https://linktr.ee/bitbirdy" target="_blank" rel="noreferrer">
          {t("Robyn Choi")}</a>
        .
      </p>
    </div>
  )
}
