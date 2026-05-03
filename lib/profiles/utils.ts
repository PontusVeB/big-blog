// Walidacja ksywki — wykonywana po obu stronach (UI dla feedbacku, server dla
// bezpieczeństwa). Reguły: min 2 znaki, max 30, brak nowych linii, brak spacji
// na początku/końcu. Emoji i znaki Unicode dozwolone.

export function validateNickname(
  nickname: string | null | undefined
): string | null {
  if (!nickname || nickname.length === 0) {
    return "Ksywka jest wymagana.";
  }
  if (nickname.length < 2) {
    return "Ksywka musi mieć minimum 2 znaki.";
  }
  if (nickname.length > 30) {
    return "Ksywka może mieć maksymalnie 30 znaków.";
  }
  if (/[\n\r\t]/.test(nickname)) {
    return "Ksywka nie może zawierać znaków nowej linii ani tabulatorów.";
  }
  if (nickname !== nickname.trim()) {
    return "Ksywka nie może zaczynać ani kończyć się spacją.";
  }
  return null;
}
