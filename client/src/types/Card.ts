import CardType from "enums/CardType"

export default interface Card {
  id: string
  type: CardType
  content: string
  isRevealed: boolean
}
