import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "ru" | "en";

const translations = {
  en: {
    chats: "Chats", stars: "Stars", nft: "NFTs", numbers: "Numbers", cases: "Cases",
    admin: "Admin", profile: "Profile", marketplace: "Market", shop: "Shop",
    login: "Sign In", register: "Register", logout: "Logout",
    username: "Username", password: "Password", displayName: "Display Name",
    searchUsers: "Search users...", noChats: "No chats yet",
    online: "online", offline: "offline", lastSeen: "last seen",
    sendMessage: "Send message...", send: "Send",
    stars_balance: "Stars Balance", dailyClaim: "Claim Daily +10 ⭐", alreadyClaimed: "Claimed Today",
    inviteFriend: "Invite Friend +50 ⭐", invite: "Invite",
    nftUsernames: "NFT Usernames", nftGifts: "NFT Gifts",
    createNftUsername: "Create NFT Username", cost500: "Costs 500 ⭐",
    openCase: "Open Case (100 ⭐)", freeSpin: "Free Spin (daily)", paidSpin: "Spin (20 ⭐)",
    youWon: "You Won!", awesome: "Awesome!",
    adminPanel: "Admin Panel", requests: "Requests", users: "Users",
    pendingRequests: "Pending Requests", approve: "Approve", reject: "Reject",
    allUsers: "All Users", addStars: "Add Stars",
    createGift: "Create Gift", createNumber: "Create Number",
    requestStars: "⭐ Request Stars", requestNftUsername: "🏷️ Request NFT Username",
    requestAnonNumber: "📱 Request Anonymous Number", requestNftGift: "🎁 Request NFT Gift",
    howMany: "How many stars?", whichOne: "Which one?",
    sendRequest: "Send Request", requestSent: "Request sent!",
    myCollection: "My Collection", sell: "Sell", listOnMarket: "List on Market",
    forSale: "For Sale", forRent: "For Rent", buy: "Buy", rent: "Rent",
    price: "Price (stars)", rentDays: "Rent Duration (days)",
    listItem: "List Item", cancel: "Cancel",
    myAnonNumbers: "My Anonymous Numbers", createNumber2: "Create +888 Number",
    verified: "Verified", admin2: "Admin",
    language: "Language",
    history: "History",
  },
  ru: {
    chats: "Чаты", stars: "Звёзды", nft: "NFT", numbers: "Номера", cases: "Казино",
    admin: "Админ", profile: "Профиль", marketplace: "Маркет", shop: "Магазин",
    login: "Войти", register: "Регистрация", logout: "Выйти",
    username: "Имя пользователя", password: "Пароль", displayName: "Отображаемое имя",
    searchUsers: "Поиск пользователей...", noChats: "Нет чатов",
    online: "в сети", offline: "не в сети", lastSeen: "был(а)",
    sendMessage: "Написать сообщение...", send: "Отправить",
    stars_balance: "Баланс звёзд", dailyClaim: "Получить +10 ⭐ за день", alreadyClaimed: "Уже получено",
    inviteFriend: "Пригласить друга +50 ⭐", invite: "Пригласить",
    nftUsernames: "NFT Юзернеймы", nftGifts: "NFT Подарки",
    createNftUsername: "Создать NFT юзернейм", cost500: "Стоит 500 ⭐",
    openCase: "Открыть кейс (100 ⭐)", freeSpin: "Бесплатное вращение (раз в день)", paidSpin: "Крутить (20 ⭐)",
    youWon: "Вы выиграли!", awesome: "Отлично!",
    adminPanel: "Панель администратора", requests: "Запросы", users: "Пользователи",
    pendingRequests: "Ожидающие запросы", approve: "Одобрить", reject: "Отклонить",
    allUsers: "Все пользователи", addStars: "Добавить звёзды",
    createGift: "Создать подарок", createNumber: "Создать номер",
    requestStars: "⭐ Попросить звёзды", requestNftUsername: "🏷️ Попросить NFT Юзернейм",
    requestAnonNumber: "📱 Попросить анонимный номер", requestNftGift: "🎁 Попросить NFT подарок",
    howMany: "Сколько звёзд?", whichOne: "Какой/какое?",
    sendRequest: "Отправить запрос", requestSent: "Запрос отправлен!",
    myCollection: "Моя коллекция", sell: "Продать", listOnMarket: "На маркет",
    forSale: "Продажа", forRent: "Аренда", buy: "Купить", rent: "Арендовать",
    price: "Цена (звёзды)", rentDays: "Срок аренды (дней)",
    listItem: "Выставить", cancel: "Отмена",
    myAnonNumbers: "Мои анонимные номера", createNumber2: "Создать номер +888",
    verified: "Верифицирован", admin2: "Администратор",
    language: "Язык",
    history: "История",
  },
};

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "ru",
  setLang: () => {},
  t: (k) => translations.ru[k] || k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "ru");

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: TranslationKey): string => translations[lang][key] || key;

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
