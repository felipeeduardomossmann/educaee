// Substitui dependências opcionais do jsPDF que não são usadas (ficam fora do build).
export default function moduloAusente(): never {
  throw new Error('Recurso do jsPDF desativado no EducAEE (html/svg).')
}
