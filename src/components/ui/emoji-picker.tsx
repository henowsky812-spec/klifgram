import { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "😀": ["😀","😂","🤣","😊","😍","🥰","😘","😎","🤩","🥳","😢","😭","😤","😡","🤔","🤫","🤭","🫡","😴","🤯","🥺","😏","😒","🙄","😬","🤗","🫂","😇","🥹","😮","😲","😵","🫠","🤪","😜","😛","😝","🤑","🤤","🤮","🤧","🥵","🥶","😷","🤒","🤕","👻","💀","☠️"],
  "👋": ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","💪","🦾","🫂","🫶","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","💕","💞","💓","💗","💖","💘","💝","❣️"],
  "🐶": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪲","🦟","🦗","🕷","🦂","🐢","🦕","🦖","🐍","🦎","🐊","🦝","🦦","🦥"],
  "⚽": ["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🥏","🎾","🏸","🏒","🏑","🥍","🏓","🏏","🎯","🛹","🛷","🥌","🎿","⛸","🤺","🥊","🥋","🎽","⛳","🤿","🎣","🎽","🏋️","🤸","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🚣","🧗","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🎗","🎫","🎟"],
  "🍎": ["🍎","🍊","🍋","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🍆","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🧅","🥔","🍠","🫘","🥜","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕"],
  "✈️": ["✈️","🚀","🛸","🚁","🛩","⛵","🚢","🛳","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎","🏍","🛵","🛺","🛼","🛷","🚲","🛴","🛹","🚏","🛣","🛤"],
  "💎": ["💎","💰","💴","💵","💶","💷","💸","💳","🏦","🏧","💹","📈","📉","📊","🔑","🗝","🔐","🔒","🔓","🔏","🔩","🪛","🔧","🔨","⚒","🛠","⛏","🗜","⚙️","🪤","🧲","🔋","💡","🔦","🕯","🪔","🧨","💣","🔮","🎱","🧿","🪬","🪄","🎭","🎨","🖼","🎰","🎲","♟","🧸"],
};

const CATEGORY_LABELS: Record<string, string> = { "😀": "Смайлы", "👋": "Жесты", "🐶": "Животные", "⚽": "Спорт", "🍎": "Еда", "✈️": "Транспорт", "💎": "Разное" };

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("😀");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
  const filteredEmojis = search
    ? allEmojis.filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory] || [];

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ width: 300, maxHeight: 350 }}
    >
      <div className="p-2 border-b border-card-border">
        <input
          type="text"
          placeholder="Поиск эмодзи..."
          className="w-full bg-background border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      {!search && (
        <div className="flex gap-1 px-2 py-1.5 border-b border-card-border overflow-x-auto">
          {Object.keys(EMOJI_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-lg px-1.5 py-1 rounded-lg transition-all hover:bg-white/10 flex-shrink-0 ${activeCategory === cat ? "bg-primary/20 text-primary" : ""}`}
              title={CATEGORY_LABELS[cat]}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-8 gap-0.5 p-2 overflow-y-auto" style={{ maxHeight: 220 }}>
        {filteredEmojis.map((emoji, i) => (
          <button
            key={i}
            className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
            onClick={() => { onSelect(emoji); onClose(); }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
