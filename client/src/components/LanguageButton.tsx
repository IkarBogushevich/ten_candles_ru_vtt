import { toggleLanguage, useLanguage } from "utils/i18n"

export default function LanguageButton() {
  const language = useLanguage()
  return <button type="button" className="language-switch fixed right-2 top-[72px] z-[100000] border-2 border-yellow bg-black px-3 py-2 text-yellow text-lg hover:bg-yellow hover:text-black focus-visible:outline focus-visible:outline-yellow" onClick={toggleLanguage} aria-label={language === "ru" ? "Switch to English" : "Переключить на русский"} title={language === "ru" ? "Switch to English" : "Переключить на русский"}>
    <span style={{opacity: language === "ru" ? 1 : 0.45}}>RU</span><span aria-hidden="true"> / </span><span style={{opacity: language === "en" ? 1 : 0.45}}>EN</span>
  </button>
}
