type Props = {
  isChecked?: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function Checkbox({ isChecked, onChange }: Props) {
  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="focus:ring-yellow focus:ring-offset-0 h-9 w-9 rounded-lg bg-[transparent] border-2 border-orange cursor-pointer hover:border-yellow checked:bg-orange checked:hover:brightness-[115%] text-orange"
    />
  )
}
