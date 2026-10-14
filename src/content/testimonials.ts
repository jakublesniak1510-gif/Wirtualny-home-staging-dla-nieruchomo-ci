export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  city: string;
  /** true = przykładowa treść; na stronie pokazujemy wtedy dopisek „Przykładowe opinie”. */
  isPlaceholder: boolean;
}

// PLACEHOLDER – podmień na prawdziwe opinie
// (po podmianie ustaw isPlaceholder: false – zniknie dopisek o przykładowych opiniach).
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Puste mieszkanie wisiało w ogłoszeniu dwa miesiące. Po dodaniu wizualizacji telefon zaczął dzwonić już w pierwszym tygodniu.",
    author: "Agnieszka W.",
    role: "Agentka nieruchomości",
    city: "Kraków",
    isPlaceholder: true,
  },
  {
    quote:
      "Zamawiam po kilkanaście zdjęć miesięcznie. Szybko, przewidywalnie i zawsze z oznaczeniem „wizualizacja” – klienci to doceniają.",
    author: "Marek P.",
    role: "Właściciel biura nieruchomości",
    city: "Wrocław",
    isPlaceholder: true,
  },
  {
    quote:
      "Sprzedawałam mieszkanie po rodzicach i nie chciałam wydawać na meble. Styl japandi idealnie pokazał, jak można tam zamieszkać.",
    author: "Katarzyna L.",
    role: "Sprzedająca prywatnie",
    city: "Gdańsk",
    isPlaceholder: true,
  },
];

export const HAS_PLACEHOLDER_TESTIMONIALS = TESTIMONIALS.some((t) => t.isPlaceholder);
