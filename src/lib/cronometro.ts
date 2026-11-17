/** Duração da rodada sem o tempo em pausa (relógio injetável para os testes). */
export class Cronometro {
  private readonly agora: () => number
  private acumuladoMs = 0
  private inicioTrechoMs: number | null

  constructor(agora: () => number = () => Date.now()) {
    this.agora = agora
    this.inicioTrechoMs = agora()
  }

  get pausado(): boolean {
    return this.inicioTrechoMs === null
  }

  pausar(): void {
    if (this.inicioTrechoMs === null) return
    this.acumuladoMs += this.agora() - this.inicioTrechoMs
    this.inicioTrechoMs = null
  }

  continuar(): void {
    if (this.inicioTrechoMs !== null) return
    this.inicioTrechoMs = this.agora()
  }

  /** Segundos inteiros jogados até agora. */
  segundos(): number {
    const trecho = this.inicioTrechoMs === null ? 0 : this.agora() - this.inicioTrechoMs
    return Math.round((this.acumuladoMs + trecho) / 1000)
  }
}

/** "45 s", "2 min" ou "2 min 15 s". */
export function formatarDuracao(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  if (minutos === 0) return `${resto} s`
  return resto === 0 ? `${minutos} min` : `${minutos} min ${resto} s`
}
