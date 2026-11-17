// Todas as falas fixas do site, para scripts/gerar-falas.mjs gravar.
// Cada atividade lista as suas em `falas()`, com as mesmas funções que montam o texto.

import { falas as falasAlvo } from '../atividades/alvo/logica'
import { falas as falasCaminhos } from '../atividades/caminhos/logica'
import { falas as falasContar } from '../atividades/contar/logica'
import { falas as falasEmocoes } from '../atividades/emocoes/logica'
import { falas as falasFaltando } from '../atividades/faltando/logica'
import { falas as falasMonte } from '../atividades/monte/logica'
import { falas as falasPares } from '../atividades/pares/logica'
import { falas as falasRotina } from '../atividades/rotina/logica'
import { falas as falasSombra } from '../atividades/sombra/logica'
import { falas as falasSons } from '../atividades/sons/logica'
import { falas as falasPegue } from '../atividades/pegue/logica'
import { falas as falasSegure } from '../atividades/segure/logica'
import { falas as falasIgual } from '../atividades/igual/logica'
import { falas as falasLetras } from '../atividades/letras/logica'
import { falas as falasMemoria } from '../atividades/memoria/logica'
import { falas as falasSequencia } from '../atividades/sequencia/logica'
import { MENSAGENS_RESULTADO } from '../lib/mensagens'
import { falas as falasTrilha } from '../lib/trilha'
import { falas as falasPrancha } from '../prancha/vocabulario'
import { normalizarFala } from './hash'

export function falasDoSite(): string[] {
  const todas = [
    ...MENSAGENS_RESULTADO,
    ...falasTrilha(),
    ...falasPrancha(),
    ...falasMemoria(),
    ...falasIgual(),
    ...falasAlvo(),
    ...falasLetras(),
    ...falasSequencia(),
    ...falasContar(),
    ...falasEmocoes(),
    ...falasCaminhos(),
    ...falasPares(),
    ...falasPegue(),
    ...falasSegure(),
    ...falasSombra(),
    ...falasFaltando(),
    ...falasSons(),
    ...falasMonte(),
    ...falasRotina(),
  ].map(normalizarFala)
  return [...new Set(todas)]
}
