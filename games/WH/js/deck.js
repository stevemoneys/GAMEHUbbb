export function createDeck() {
  const shapes = ["\u2B24", "\u25B2", "\u25A0", "\u2716", "\u2605"];
  const numbers = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  const deck = [];

  shapes.forEach((shape) => {
    numbers.forEach((num) => {
      deck.push({ shape, number: num });
    });
  });

  deck.push({ shape: "WHOT", number: 20 });

  return shuffle(deck);
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}
