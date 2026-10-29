import { ToastBar } from "react-hot-toast"
import { ComponentProps } from "react"
import { t, useLanguage } from "utils/i18n"

export default function LocalizedToastBar(props: ComponentProps<typeof ToastBar>) {
  useLanguage()
  return <ToastBar {...props} toast={{...props.toast, message: typeof props.toast.message === "string" ? t(props.toast.message) : props.toast.message}} />
}
