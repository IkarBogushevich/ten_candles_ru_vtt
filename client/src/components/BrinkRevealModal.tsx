import { t, useLanguage } from "utils/i18n"
type Props = {
  onConfirm: () => void
  onCancel: () => void
}

export default function BrinkRevealModal({ onConfirm, onCancel }: Props) {
  useLanguage()

  return (
    <>
      <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={onCancel} />
      <div className="flex flex-col gap-4 justify-center items-center text-white z-50 fixed w-fit h-fit text-xl bg-grey py-8 px-6">
        <p>{t("Are you sure you want to reveal your Brink?")}</p>
        <div className="mt-auto flex justify-end gap-4">
          <button className="text-lg hover:text-yellow" onClick={onCancel}>
            {t("Cancel")}</button>
          <button className="btn text-white bg-blue" onClick={onConfirm}>
            {t("Yes")}</button>
        </div>
      </div>
    </>
  )
}
