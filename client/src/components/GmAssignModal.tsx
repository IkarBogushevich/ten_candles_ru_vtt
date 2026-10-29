import { t, useLanguage } from "utils/i18n"
import User from "types/User"

type Props = {
  user: User
  onConfirm: () => void
  onCancel: () => void
}

export default function GmAssignModal({ user, onConfirm, onCancel }: Props) {
  useLanguage()

  return (
    <>
      <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={onCancel} />
      <div className="flex flex-col gap-4 justify-center items-center text-white z-50 fixed w-fit h-fit text-lg bg-grey px-8 py-6">
        <p>
          {t("Are you sure you want to make")}{" "}<span className="text-yellow">{user.name}</span> {t("the GM?")}</p>
        <div className="mt-auto flex justify-end gap-4">
          <button className="hover:text-yellow" onClick={onCancel}>
            {t("Cancel")}</button>
          <button
            className="px-3 py-2 bg-blue text-white hover:brightness-125 disabled:opacity-60 disabled:hover:brightness-100"
            onClick={onConfirm}
          >
            {t("Yes")}</button>
        </div>
      </div>
    </>
  )
}
