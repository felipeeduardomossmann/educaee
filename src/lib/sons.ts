/** Sons de acerto e erro gerados com Web Audio (curtos e em volume baixo). */

let contexto: AudioContext | null = null

function obterContexto(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  contexto ??= new AudioContext()
  // O navegador só libera o áudio depois de um toque; resume() é seguro de chamar sempre.
  if (contexto.state === 'suspended') void contexto.resume()
  return contexto
}

interface Nota {
  frequencia: number
  inicio: number
  duracao: number
}

function tocarNotas(notas: readonly Nota[], forma: OscillatorType, volume: number) {
  const audio = obterContexto()
  if (!audio) return
  const agora = audio.currentTime
  for (const nota of notas) {
    const oscilador = audio.createOscillator()
    const ganho = audio.createGain()
    oscilador.type = forma
    oscilador.frequency.value = nota.frequencia
    // Entrada e saída suaves (sem "clique" no começo e no fim da nota).
    const inicio = agora + nota.inicio
    ganho.gain.setValueAtTime(0, inicio)
    ganho.gain.linearRampToValueAtTime(volume, inicio + 0.02)
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + nota.duracao)
    oscilador.connect(ganho).connect(audio.destination)
    oscilador.start(inicio)
    oscilador.stop(inicio + nota.duracao + 0.05)
  }
}

/** Duas notas subindo (dó → mi), leves e alegres. */
export function tocarAcerto(): void {
  tocarNotas(
    [
      { frequencia: 523.25, inicio: 0, duracao: 0.18 },
      { frequencia: 659.25, inicio: 0.12, duracao: 0.3 },
    ],
    'sine',
    0.12,
  )
}

/** Duas notas graves descendo, bem suaves: avisa sem assustar. */
export function tocarErro(): void {
  tocarNotas(
    [
      { frequencia: 329.63, inicio: 0, duracao: 0.2 },
      { frequencia: 261.63, inicio: 0.15, duracao: 0.3 },
    ],
    'triangle',
    0.08,
  )
}

/** Desbloqueia o áudio num toque do usuário (ex.: no botão "Começar"). */
export function prepararSons(): void {
  obterContexto()
}
