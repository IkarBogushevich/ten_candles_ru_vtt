import { TbChevronLeft, TbChevronRight } from "react-icons/tb"

type Props = {
  value: number
  max: number
  onChange: (value: number) => void
}
export default function DiceNumberSelect({ value, onChange, max }: Props) {
  function decrement() {
    if (value > 0) onChange(value - 1)
  }

  function increment() {
    if (value < max) onChange(value + 1)
  }

  return (
    <div className="text-left mt-4 xs:mt-0">
      <div className="flex justify-center">
        <button
          onClick={decrement}
          className="flex justify-center items-center btn-filled !font-serif !text-2xl !border-b-orange !p-0 w-12 text-center !rounded-r-none rounded-l-lg shrink-0"
        >
          <TbChevronLeft className="w-6 h-6" />
        </button>
        <input
          disabled
          type="number"
          className="bg-[transparent] pt-2 pb-1 font-sans text-4xl appearance-none w-full xs:w-16 text-center border-y-2 border-x-0 border-orange"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          onClick={increment}
          className="flex justify-center items-center btn-filled w-12 !font-serif !text-2xl !border-b-orange !p-0 text-center !rounded-l-none rounded-r-lg shrink-0"
        >
          <TbChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
