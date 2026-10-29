import { t, useLanguage } from "utils/i18n"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useParams } from "react-router-dom"
import { Tooltip } from "react-tooltip"
import clsx from "clsx"
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core"
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable"
import socket from "utils/socket"
import { TbFlame, TbHelp, TbLock, TbLockOpen } from "react-icons/tb"
import { RiCandleLine } from "react-icons/ri"
import User from "types/User"
import { useUser } from "context/UserContext"
import { getUserPositionClasses, prioritizeUserCollisions } from "utils/helpers"
import CreateCardModal from "./CreateCardModal"
import Card from "types/Card"
import UserDroppable from "./UserDroppable"
import CardDraggable from "./CardDraggable"
import DeleteCardModal from "./DeleteCardModal"
import CardType from "enums/CardType"
import CandleModal from "./CandleModal"
import OnboardingStage from "enums/OnboardingStage"
import { useOnboarding } from "context/OnboardingContext"
import GmAssignModal from "./GmAssignModal"
import { CARD_CLASSES } from "utils/constants"
import CharacterCard from "./CharacterCard"
import HelpModal from "./HelpModal"
import BrinkRevealModal from "./BrinkRevealModal"
import usePersistentCards from 'utils/usePersistentCards'

type UserIdToCards = Record<string, Card[]>

export default function UI({ candles }: { candles: boolean[] }) {
  useLanguage()

  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    currentOnboardingStage,
    startOnboardingStage,
    completedOnboardingStages,
  } = useOnboarding()

  const { user, setUser, areCardsLocked, setAreCardsLocked } = useUser()
  const { room } = useParams()

  const [users, setUsers] = useState<User[]>([])
  const [cards, setCards] = usePersistentCards(room,user?.id)
  const [peerUserCards, setPeerUserCards] = useState<UserIdToCards>({})
  const [showCreateCardModal, setShowCreateCardModal] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [draggingCard, setDraggingCard] = useState<Card | null>(null)
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null)
  const [showCandleModal, setShowCandleModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showBrinkRevealModal, setShowBrinkRevealModal] = useState(false)
  const [userToMakeGm, setUserToMakeGm] = useState<User | null>(null)
  const [isPixelFont, setIsPixelFont] = useState(true)

  useEffect(() => {
    if (
      completedOnboardingStages.includes(OnboardingStage.Table) &&
      !isOnboardingOpen &&
      ((cards.length === 1 && cards[0].type !== CardType.Character) || cards.length === 2) &&
      currentOnboardingStage !== OnboardingStage.SingleCard &&
      !completedOnboardingStages.includes(OnboardingStage.SingleCard)
    ) {
      startOnboardingStage(OnboardingStage.SingleCard)
    } else if (
      showCards &&
      completedOnboardingStages.includes(OnboardingStage.SingleCard) &&
      !isOnboardingOpen &&
      cards.filter((c) => c.type !== CardType.Character).length > 1 &&
      currentOnboardingStage !== OnboardingStage.MultipleCards &&
      !completedOnboardingStages.includes(OnboardingStage.MultipleCards)
    ) {
      startOnboardingStage(OnboardingStage.MultipleCards)
    } else if (
      user?.isGm &&
      !showCards &&
      !isOnboardingOpen &&
      completedOnboardingStages.includes(OnboardingStage.Table) &&
      !completedOnboardingStages.includes(OnboardingStage.GmButtons) &&
      currentOnboardingStage !== OnboardingStage.GmButtons
    ) {
      // startOnboardingStage(OnboardingStage.GmButtons)
    }
  }, [
    cards,
    currentOnboardingStage,
    isOnboardingOpen,
    setIsOnboardingOpen,
    showCards,
    startOnboardingStage,
    user?.isGm,
    completedOnboardingStages,
  ])

  useEffect(() => {
    if (
      user?.isGm &&
      !candles.includes(false) &&
      !isOnboardingOpen &&
      !showCards &&
      !areCardsLocked &&
      !completedOnboardingStages.includes(OnboardingStage.GmLock) &&
      currentOnboardingStage !== OnboardingStage.GmLock
    ) {
      startOnboardingStage(OnboardingStage.GmLock)
    }
  }, [
    setIsOnboardingOpen,
    currentOnboardingStage,
    user?.isGm,
    candles,
    isOnboardingOpen,
    showCards,
    startOnboardingStage,
    completedOnboardingStages,
    areCardsLocked,
  ])

  useEffect(() => {
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showCandleModal) {
          setShowCandleModal(false)
        } else if (showHelpModal) {
          setShowHelpModal(false)
        } else if (showCreateCardModal) {
          setShowCreateCardModal(false)
        } else if (cardToDelete) {
          setCardToDelete(null)
        } else if (showCards) {
          setShowCards(false)
        }
      }
    }
    window.addEventListener("keyup", onKeyUp)
    return () => window.removeEventListener("keyup", onKeyUp)
  }, [cardToDelete, showCandleModal, showCards, showCreateCardModal, showHelpModal])

  useEffect(() => {
    socket.on("usersUpdated", ({ updatedUsers, toastText, isToastInfinite }) => {
      // reorder users so that this user is first in the array
      const reorderedUsers: User[] = []
      const userIndex = updatedUsers.findIndex((u) => u.id === user!.id)

      for (let index = userIndex, reorderedIndex = 0; reorderedIndex < updatedUsers.length; index++, reorderedIndex++) {
        if (index === updatedUsers.length) index = 0
        reorderedUsers[reorderedIndex] = updatedUsers[index]
      }
      setUsers(reorderedUsers)

      const updatedCurrentUser = updatedUsers[userIndex]
      setUser(updatedCurrentUser)
      if (toastText) toast(toastText, { duration: isToastInfinite ? Infinity : undefined })

      // if (user!.isGm) socket.emit("passInitialPeerUserCards", { room, dicePools, candles })
    })

    socket.on("cardTransferred", ({ newUsername, oldUsername, card }) => {
      // The private cardsSnapshot supplies the transferred card exactly once.
      toast(`${oldUsername} gave a ${card.type} to ${newUsername}`)
    })

    socket.on("lockChanged", (isLocked) => {
      setAreCardsLocked(isLocked)
      toast(
        isLocked
          ? "Card stacks are now locked. Mouse over a user to see the top card of their stack."
          : "Card stacks are now unlocked.",
        { duration: isLocked ? Infinity : undefined }
      )

      if (isLocked) socket.emit("updatePeerUserCards", { room, userId: user!.id, cards })
    })

    socket.on("peerUserCardsUpdated", ({ userId, cards: _cards, toastText }) => {
      setPeerUserCards((prevState) => {
        const newState = prevState ? { ...prevState } : ({} as UserIdToCards)
        newState[userId] = _cards
        return newState
      })
      if (toastText) toast(toastText)
    })

    socket.on("brinkRevealed", ({ userId }) => {
      const username = users.find((u) => u.id === userId)?.name

      setPeerUserCards((prevState) => {
        const newState = prevState ? { ...prevState } : ({} as UserIdToCards)
        const brink = newState[userId].find((c) => c.type === CardType.Brink)
        if (brink) {
          brink.isRevealed = true
        } else {
          console.error(`Trying to reveal brink for user with id: ${username} but brink not found.`)
        }
        return newState
      })
      toast.success(`${username} revealed their Brink.`)
    })

    return () => {
      socket.removeAllListeners("usersUpdated")
      socket.removeAllListeners("cardTransferred")
      socket.removeAllListeners("lockChanged")
      socket.removeAllListeners("peerUserCardsUpdated")
      socket.removeAllListeners("brinkRevealed")
    }
  })

  useEffect(() => {
    document.documentElement.style.fontFamily = isPixelFont ? "PixeloidSans, Verdana, sans-serif" : "Verdana, sans-serif"
  }, [isPixelFont])

  function handleCardDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || areCardsLocked) return

    if (isOnboardingOpen && currentOnboardingStage === OnboardingStage.MultipleCards) {
      setIsOnboardingOpen(false)
    }

    if (over.data.current?.card) {
      // dragged onto another card
      if (active.id !== over.id) {
        setCards((prevState) => {
          const oldIndex = prevState.findIndex((card) => card.id === active.id)
          const newIndex = prevState.findIndex((card) => card.id === over.id)
          return arrayMove(prevState, oldIndex, newIndex) as Card[]
        })
      }
    } else if (over.data.current?.user && over.data.current?.user.id !== user!.id) {
      // dragged onto another user
      const card = cards.find((c) => c.id === active.id)
      setCards((prevState) => prevState.filter((c) => c.id !== active.id))
      socket.emit("transferCard", { newUsername: over.data.current?.user.name, oldUsername: user!.name, room, card })
    }
  }

  const [needsToUpdatePeersAfterUpdatingCharacterCard, setNeedsToUpdatePeersAfterUpdatingCharacterCard] =
    useState(false)

  useEffect(() => {
    if (needsToUpdatePeersAfterUpdatingCharacterCard && areCardsLocked) {
      socket.emit("updatePeerUserCards", { room, userId: user!.id, cards })
      setNeedsToUpdatePeersAfterUpdatingCharacterCard(false)
    }
  }, [cards, areCardsLocked, room, user, needsToUpdatePeersAfterUpdatingCharacterCard])

  function handleCharacterCardUpdate(newContent: string) {
    setCards((prevState) => {
      const newState = [...prevState]
      const _characterCard = newState.find((c) => c.type === CardType.Character)
      if (_characterCard) {
        _characterCard.content = newContent
      } else {
        console.error("Trying to update character card but character card not found.")
      }
      return newState
    })
    setNeedsToUpdatePeersAfterUpdatingCharacterCard(true)
  }

  function handleDeleteCard() {
    const updatedCards = cards.filter((card) => card.id !== cardToDelete!.id)
    if (areCardsLocked) {
      socket.emit("updatePeerUserCards", {
        room,
        userId: user!.id,
        cards: updatedCards,
        toastText: `${user!.name} burned their ${cardToDelete!.type}.`,
      })
    }
    setCardToDelete(null)
    setShowCards(true)
    setCards((prevState) => prevState.filter((card) => card.id !== cardToDelete!.id))
  }

  function handleConfirmBrinkReveal() {
    setShowBrinkRevealModal(false)
    const newCards = [...cards]
    const brink = newCards.find((c) => c.type === CardType.Brink)
    if (brink) {
      brink.isRevealed = true
    } else {
      console.error(`Trying to reveal Brink but the Brink card not found.`)
    }

    socket.emit("updatePeerUserCards", {
      room,
      userId: user!.id,
      cards: newCards,
      toastText: `${user!.name} revealed their Brink.`,
    })

    setCards((prevState) => {
      const newState = [...prevState]
      const brink = newState.find((c) => c.type === CardType.Brink)
      if (brink) brink.isRevealed = true
      return newState
    })
  }

  const characterCard = cards.find((c) => c.type === CardType.Character)

  return (
    <DndContext
      onDragStart={(e) => {
        setDraggingCard(e.active.data.current?.card || null)
        if (isOnboardingOpen && currentOnboardingStage === OnboardingStage.SingleCard) {
          setIsOnboardingOpen(false)
        }
      }}
      onDragEnd={handleCardDragEnd}
      autoScroll={false}
      collisionDetection={prioritizeUserCollisions}
    >
      <DragOverlay>
        {draggingCard ? (
          <div className={CARD_CLASSES}>
            {!areCardsLocked && (
              <div className="absolute top-2.5 right-2.5">
                <TbFlame className="h-7 w-7" />
              </div>
            )}
            <div className="text-xl">{t(draggingCard.type)}</div>
            <div className="mt-3">{draggingCard.content}</div>
          </div>
        ) : null}
      </DragOverlay>
      <SortableContext items={[...cards]} strategy={verticalListSortingStrategy}>
        <div className="absolute w-screen h-screen flex justify-center items-center overflow-hidden">
          {showCards && (
            <>
              <div className="h-screen w-screen fixed bg-black opacity-70 z-50" onClick={() => setShowCards(false)} />
              {cards.length === 0 ? (
                <div className="flex justify-center items-center text-xl z-50 bg-grey p-6 leading-loose">
                  {t("You don't have any cards yet.")}<br />
                  {t("Start by clicking \"Add Card\" in the top right corner.")}<br />
                  {t("Or click anywhere to go back to the table.")}</div>
              ) : (
                <div className={clsx(characterCard && cards.length > 1 && "gap-24", "flex")}>
                  {characterCard && (
                    <CharacterCard
                      content={characterCard.content}
                      cards={cards}
                      onUpdate={handleCharacterCardUpdate}
                      onDelete={() => setCardToDelete(characterCard)}
                    />
                  )}
                  <div className={clsx(!characterCard && "-mt-28", "card-stack z-50")}>
                    {cards
                      .filter((c) => c.type !== CardType.Character)
                      .map((card, i) => (
                        <CardDraggable
                          key={card.id}
                          card={card}
                          areCardsLocked={areCardsLocked}
                          isTopOfStack={i === cards.length - (characterCard ? 2 : 1)}
                          onDelete={() => setCardToDelete(card)}
                          onRevealBrink={() => setShowBrinkRevealModal(true)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
          <div className="absolute top-2 left-2 z-50 flex items-center">
            <a data-tooltip-id="tooltip" data-tooltip-content={t("View full instructions")}>
              <button onClick={() => setShowHelpModal(true)} className="text-yellow  hover:brightness-110">
                <TbHelp className="h-12 w-12 mt-0.5" />
              </button>
            </a>
            <a
              data-tooltip-id="tooltip"
              data-tooltip-content={t(isPixelFont ? "Switch to normal font" : "Switch to pixel font")}
            >
              <button
                onClick={() => setIsPixelFont((prevState) => !prevState)}
                className="text-[2.6rem] w-12 text-yellow -mr-1 hover:brightness-110"
              >
                {t("A")}</button>
            </a>
            {user?.isGm && (
              <div className="gm-btns">
                <a data-tooltip-id="tooltip" data-tooltip-content={t("Change candle duration (GM only)")}>
                  <button onClick={() => setShowCandleModal(true)} className="text-yellow hover:brightness-110">
                    <RiCandleLine className="btn_flame h-12 w-12" />
                  </button>
                </a>
                <a
                  data-tooltip-id="tooltip"
                  data-tooltip-content={t(areCardsLocked ? "Unlock card stacks (GM only)" : "Lock card stacks (GM only)")}
                >
                  <button
                    onClick={() => socket.emit("changeLock", { isLocked: !areCardsLocked, room })}
                    className="btn_lock text-yellow hover:brightness-110"
                  >
                    {areCardsLocked ? <TbLock className="h-12 w-12" /> : <TbLockOpen className="h-12 w-12" />}
                  </button>
                </a>
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 z-50">
            <a data-tooltip-id="tooltip_add-card" data-tooltip-content={t("Card stacks are currently locked")}>
              <button
                className="btn text-black bg-yellow !py-3"
                disabled={areCardsLocked}
                onClick={() => setShowCreateCardModal(true)}
              >
                {t("Add Card")}</button>
            </a>
          </div>
          {/* users */}
          {users.map((u, i) => (
            <UserDroppable
              key={u.id}
              user={u}
              currentUser={user!}
              cards={peerUserCards[u.id]}
              areCardsLocked={areCardsLocked}
              onOpenCardStack={() => {
                setShowCards(true)
                if (isOnboardingOpen && currentOnboardingStage === OnboardingStage.Table) {
                  setIsOnboardingOpen(false)
                }
              }}
              onMakeUserGm={() => setUserToMakeGm(u)}
              moreClasses={getUserPositionClasses(i, users.length)}
            />
          ))}
        </div>
      </SortableContext>

      <Tooltip className="!bg-lightgrey z-[9999]" id="tooltip" place="bottom-start" />
      {areCardsLocked && <Tooltip className="!bg-lightgrey z-[9999]" id="tooltip_add-card" place="left" />}

      {showCreateCardModal && (
        <CreateCardModal
          cards={cards}
          addCard={(card) => setCards((prevState) => [...prevState, card])}
          onClose={() => {
            setShowCreateCardModal(false)
            setShowCards(true)
          }}
        />
      )}
      {cardToDelete && (
        <DeleteCardModal
          card={cardToDelete}
          onDelete={handleDeleteCard}
          onCancel={() => {
            setCardToDelete(null)
            setShowCards(true)
          }}
        />
      )}
      {showCandleModal && <CandleModal onClose={() => setShowCandleModal(false)} />}
      {userToMakeGm && (
        <GmAssignModal
          user={userToMakeGm}
          onConfirm={() => {
            socket.emit("updateGm", { room, oldGm: user, newGm: userToMakeGm })
            setUserToMakeGm(null)
          }}
          onCancel={() => setUserToMakeGm(null)}
        />
      )}
      {showHelpModal && (
        <HelpModal
          onSwitchFont={() => setIsPixelFont((prevState) => !prevState)}
          onClose={() => setShowHelpModal(false)}
        />
      )}
      {showBrinkRevealModal && (
        <BrinkRevealModal onConfirm={handleConfirmBrinkReveal} onCancel={() => setShowBrinkRevealModal(false)} />
      )}
    </DndContext>
  )
}
