import { useSyncExternalStore } from "react"

const listeners = new Set<() => void>()
let language = localStorage.getItem("tenCandles_language") === "en" ? "en" : "ru"
export function useLanguage() {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener) } }, () => language)
}
export function toggleLanguage() {
  language = language === "ru" ? "en" : "ru"
  localStorage.setItem("tenCandles_language", language)
  document.documentElement.lang = language
  document.title = language === "ru" ? "Десять свечей | Виртуальный стол" : "Ten Candles | Virtual Tabletop"
  listeners.forEach(listener => listener())
}
document.documentElement.lang = language
document.title = language === "ru" ? "Десять свечей | Виртуальный стол" : "Ten Candles | Virtual Tabletop"

const ru: Record<string, string> = {
  "Connection lost. Reconnecting. Your session and notes are saved.": "Соединение потеряно. Переподключаемся. Вход и записки сохранены.",
  "Return to my room": "Вернуться в мою комнату",
  "Invalid session. Reopen your room link.": "Не удалось восстановить вход. Откройте ссылку комнаты заново.",
  "This seat belongs to another session.": "Личный ключ не подходит к этому месту. Данные сохранены; проверьте ссылку и браузер.",
  "This name is already reserved in the room.": "Это имя уже закреплено за участником. Вернитесь с его сохранённым ключом или выберите другое имя.",
  "Ten Candles": "Десять свечей",
  "Since you are creating a new room,": "Вы создаёте новую комнату,",
  "you will be the": "поэтому ваша роль —",
  "GM": "Ведущий",
  "Create room": "Создать комнату",
  "Join Room": "Войти в комнату",
  "Joining...": "Подключение…",
  "Creating...": "Создание…",
  "Enter your name": "Введите ваше имя",
  "There is already a user with this name in the room.": "В комнате уже есть участник с таким именем.",
  "Failed to fetch": "Не удалось подключиться к серверу. Проверьте соединение.",
  "This is a virtual tabletop for": "Виртуальный игровой стол для",
  ", a tabletop roleplaying game by Stephen Dewey.": " — настольной ролевой игры Стивена Дьюи.",
  "Created by": "Автор оригинального сайта:",
  "Player Dice": "Кости игроков",
  "GM Dice": "Кости ведущего",
  "Dice Stash": "Запас костей",
  "Roll": "Бросить",
  "Add Card": "Добавить карту",
  "Select a card type": "Выберите тип карты",
  "Enter details here": "Введите текст карты",
  "Create": "Создать",
  "Cancel": "Отмена",
  "Yes": "Да",
  "Save": "Сохранить",
  "Virtue": "Добродетель",
  "Vice": "Порок",
  "Brink": "Грань",
  "Moment": "Момент",
  "Character/Inventory": "Персонаж / вещи",
  "Brink (revealed)": "Грань (раскрыта)",
  "Brink (hidden)": "Грань (скрыта)",
  "(hidden)": "(скрыта)",
  "Are you sure you want to burn this card?": "Сжечь эту карту?",
  "Are you sure you want to reveal your Brink?": "Раскрыть свою Грань?",
  "Are you sure you want to make": "Назначить участника",
  "the GM?": "ведущим?",
  "Each candle will go out": "Полная свеча сгорает за",
  "hours": "ч",
  "minutes": "мин",
  "seconds": "с",
  "after being lit.": "после зажигания.",
  "Candles gradually shrink as they burn. Extinguishing pauses wax consumption; relighting resumes it. The duration is shared with everyone when you light a candle. Relight burning candles to apply a new duration.": "Свечи постепенно уменьшаются. Гашение приостанавливает расход воска, повторное зажигание продолжает его. Таймер синхронизирован у всех участников. Чтобы применить новую длительность к горящей свече, погасите и зажгите её снова.",
  "You don't have any cards yet.": "У вас пока нет карт.",
  'Start by clicking "Add Card" in the top right corner.': 'Нажмите «Добавить карту» в правом верхнем углу.',
  "Or click anywhere to go back to the table.": "Или нажмите за пределами окна, чтобы вернуться к столу.",
  "View full instructions": "Открыть инструкцию",
  "Switch to normal font": "Обычный шрифт",
  "Switch to pixel font": "Пиксельный шрифт",
  "Change candle duration (GM only)": "Время горения свечей (для ведущего)",
  "Unlock card stacks (GM only)": "Разблокировать стопки карт (для ведущего)",
  "Lock card stacks (GM only)": "Заблокировать стопки карт (для ведущего)",
  "Card stacks are currently locked": "Стопки карт заблокированы",
  "Card stacks are now unlocked.": "Стопки карт разблокированы.",
  "Card stacks are now locked. Mouse over a user to see the top card of their stack.": "Стопки карт заблокированы. Наведите курсор на участника, чтобы увидеть верхнюю карту.",
  "You've been disconnected. Try refreshing the page and joining again with the same username. If you use a different username, you'll lose your cards.": "Соединение потеряно. Оставьте вкладку открытой и дождитесь переподключения. Обновление страницы может привести к потере карт.",
  "Useful Tips": "Инструкция",
  "If something isn't working, please email me at robyn3choi@gmail.com.": "Автор оригинального сайта: Robyn Choi (robyn3choi@gmail.com).",
  "Room Setup": "Создание комнаты",
  "Whoever creates this room will be assigned as the": "Создатель комнаты становится",
  ". Send this page's URL to the rest of your group to invite them to join this room.": ". Чтобы пригласить друзей, отправьте им адрес этой страницы.",
  "If you need to, click on another player to make them the": "Нажмите на другого участника, чтобы назначить его",
  "instead.": "вместо себя.",
  "You can adjust how long each candle lasts by clicking": "Изменить время горения свечей можно кнопкой",
  "in the top right corner (only the": "в левом верхнем углу (она доступна только",
  "can see this).": ").",
  "Character Creation": "Создание персонажей",
  "Follow the character creation rules for Ten Candles by clicking on candles to light them, adding cards, and dragging cards to other players.": "Следуйте правилам создания персонажей «Десяти свечей»: зажигайте свечи нажатием, создавайте карты и передавайте их другим игрокам перетаскиванием.",
  "To rearrange your card stack, view your cards by clicking on your name at the bottom of the screen, then drag each card to where you want them in the stack.": "Чтобы изменить порядок стопки, нажмите своё имя внизу экрана и перетащите карты на нужные места.",
  "When character creation is complete, the": "После создания персонажей",
  "should click the lock button to set it to locked. This will prevent further changes to your card stack, but you'll still be able to edit your Character/Inventory card throughout the game.": "блокирует стопки кнопкой с замком. После этого менять их порядок нельзя, но карту персонажа и вещей можно редактировать в течение игры.",
  "Gameplay": "Во время игры",
  "You can roll dice and drag them in between Player Dice pool, GM Dice pool, and Dice Stash.": "Бросайте кости и перетаскивайте их между пулами игроков, ведущего и запасом.",
  "The": "Кость",
  "blue": "голубого цвета",
  "die is the Hope die. When a player wants to use their Hope die, drag this die into the Player Dice pool": "— кость Надежды. Когда игрок использует Надежду, перетащите её в пул игроков.",
  "Hover your cursor over a player to view their Character/Inventory card and the top card in their stack. The content of their Brink card will be hidden until they reveal it.": "Наведите курсор на участника, чтобы увидеть его персонажа, вещи и верхнюю карту стопки. Текст Грани скрыт до её раскрытия.",
  "Click your name (at the bottom of the screen) to view your cards. Here, you can:": "Нажмите своё имя внизу экрана, чтобы открыть карты. Здесь можно:",
  "Edit your Character/Inventory card by clicking": "Редактировать персонажа и вещи кнопкой",
  "Burn the active (top) card in your stack by clicking": "Сжечь активную (верхнюю) карту кнопкой",
  "Reveal your Brink if it's active by clicking": "Раскрыть активную Грань кнопкой",
  "It looks like this screen or window is smaller than what's ideal for this website. If you continue, things will look janky and may not work properly.": "Окно слишком маленькое для этого стола. Некоторые элементы могут отображаться или работать некорректно.",
  'If it\'s possible, zoom out in your browser or use "Desktop site" if you\'re on mobile.': "Уменьшите масштаб браузера или включите режим «Версия для ПК» на телефоне.",
  "I have been warned": "Понятно, продолжить",
  "Oops!": "Ошибка",
  "Sorry, an unexpected error has occurred.": "Произошла непредвиденная ошибка.",
  "Click a candle to light or darken it.": "Нажмите на свечу, чтобы зажечь или погасить её.",
  "This is the players’ dice pool. Click the “Roll” button to roll all the dice in this pool, which will update the dice for everyone.": "Это пул костей игроков. Кнопка «Бросить» бросает все кости пула; результат виден всем участникам.",
  "This is the GM’s dice pool that will show a “Roll” button for the GM. There may not be any dice here yet, but anyone can drag dice between dice pools.": "Это пул ведущего. Кнопка броска доступна только ему. Перетаскивать кости между пулами могут все участники.",
  "This is where you can set aside the dice that land on 1 during successful player rolls.": "Сюда откладывают кости, на которых выпала единица при успешном броске игрока.",
  "This is the Hope die. Drag it into the player dice pool when a player wants to use their Hope die.": "Это кость Надежды. Перетащите её в пул игроков, когда игрок решит использовать Надежду.",
  "Click your name to view your cards.": "Нажмите своё имя, чтобы открыть карты.",
  "You can drag a card onto another player to give it to them. (If there are no other players here yet, invite them by sending them this page's URL.)": "Перетащите карту на другого игрока, чтобы передать её. Если вы пока одни, пригласите друзей, отправив адрес этой страницы.",
  "Now that you have multiple cards in your stack, you can drag cards to rearrange the order.": "Теперь в стопке несколько карт. Перетаскивайте их, чтобы изменить порядок.",
  "These are buttons that only you can see because you're the GM. To make someone else the GM, click on their name.": "Эти кнопки доступны только ведущему. Чтобы передать роль, нажмите на имя другого участника.",
  "If everyone is finished arranging their cards and you're ready to start the game, click this to lock everyone's card stacks to prevent further changes. (You can click this again to unlock them if needed.)": "Когда все разложат карты и будут готовы играть, заблокируйте стопки этой кнопкой. Повторное нажатие разблокирует их.",
  "Close Tour": "Закрыть обучение",
}

export function t(value: string): string {
  if (language !== "ru" || typeof value !== "string") return value
  const key = value.replace(/\s+/g, " ").trim()
  const translated = ru[key]
  if (translated) return (value.startsWith(" ") ? " " : "") + translated + (value.endsWith(" ") ? " " : "")
  // Only system messages pass through here; player names and card contents are never translated.
  let m = key.match(/^(.+) has joined the room as the GM\. To invite other players, send them this page’s URL\.$/)
  if (m) return `${m[1]} — ведущий. Пригласите друзей, отправив адрес этой комнаты.`
  m = key.match(/^(.+) has joined the room as a player\.$/)
  if (m) return `${m[1]} присоединяется к игре.`
  m = key.match(/^(.+) has left the room\.(?: (.+) is now the GM\.)?$/)
  if (m) return `${m[1]} покидает комнату.${m[2] ? ` Новый ведущий: ${m[2]}.` : ""}`
  m = key.match(/^(.+) is now the GM\.$/)
  if (m) return `Новый ведущий: ${m[1]}.`
  m = key.match(/^(.+) (lit|darkened) a candle\.$/)
  if (m) return `${m[1] === "Timer" ? "Таймер" : m[1]}: свеча ${m[2] === "lit" ? "зажжена" : "погашена"}.`
  m = key.match(/^(.+) rolled the (.+)\.$/)
  if (m) return `${m[1]}: бросок — ${t(m[2])}.`
  m = key.match(/^(.+) gave a (.+) to (.+)$/)
  if (m) return `${m[1]}: карта «${t(m[2])}» передана ${m[3]}.`
  m = key.match(/^(.+) burned their (.+)\.$/)
  if (m) return `${m[1]}: сожжена карта «${t(m[2])}».`
  m = key.match(/^(.+) revealed their Brink\.$/)
  if (m) return `${m[1]}: Грань раскрыта.`
  m = key.match(/^Candle (\d+): (\d+)% wax, (lit|out)$/)
  if (m) return `Свеча ${m[1]}: воск ${m[2]}%, ${m[3] === "lit" ? "горит" : "погашена"}`
  return value
}
