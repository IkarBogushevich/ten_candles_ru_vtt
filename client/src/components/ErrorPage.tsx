import { t, useLanguage } from "utils/i18n"
import { useRouteError } from "react-router-dom"

export default function ErrorPage() {
  useLanguage()

  const error: any = useRouteError()
  console.error(error)

  return (
    <div id="error-page">
      <h1>{t("Oops!")}</h1>
      <p>{t("Sorry, an unexpected error has occurred.")}</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  )
}
