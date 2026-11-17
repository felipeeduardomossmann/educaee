import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Carregando from './components/Carregando'
import RotaComLogin from './components/RotaComLogin'
import ConvidadoProvider from './contexts/ConvidadoProvider'
import SessaoProvider from './contexts/SessaoProvider'
import { useAtualizacaoSegura } from './hooks/useAtualizacaoSegura'

// Cada página é carregada sob demanda (code splitting por rota).
const Inicio = lazy(() => import('./pages/Inicio'))
const Painel = lazy(() => import('./pages/Painel'))
const Conta = lazy(() => import('./pages/Conta'))
const AlunoFormulario = lazy(() => import('./pages/AlunoFormulario'))
const AtividadesAluno = lazy(() => import('./pages/AtividadesAluno'))
const Atividade = lazy(() => import('./pages/Atividade'))
const Progresso = lazy(() => import('./pages/Progresso'))
const Desenhos = lazy(() => import('./pages/Desenhos'))
const TrilhaDoDia = lazy(() => import('./pages/TrilhaDoDia'))
const PranchaPadrao = lazy(() => import('./pages/PranchaPadrao'))
const PranchaAluno = lazy(() => import('./pages/PranchaAluno'))
const PranchaEditar = lazy(() => import('./pages/PranchaEditar'))
const Videos = lazy(() => import('./pages/Videos'))
const Convidado = lazy(() => import('./pages/Convidado'))
const Sobre = lazy(() => import('./pages/Sobre'))
const Privacidade = lazy(() => import('./pages/Privacidade'))
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada'))
// Vitrine dos componentes base: só no modo de desenvolvimento, fica fora do build.
const Componentes = import.meta.env.DEV ? lazy(() => import('./pages/Componentes')) : null
const ExemploProgresso = import.meta.env.DEV ? lazy(() => import('./pages/ExemploProgresso')) : null

function AtualizacaoSegura() {
  useAtualizacaoSegura()
  return null
}

export default function App() {
  return (
    <SessaoProvider>
      <ConvidadoProvider>
        <AtualizacaoSegura />
        <Suspense fallback={<Carregando />}>
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/convidado" element={<Convidado />} />
            <Route path="/atividade/:atividadeId" element={<Atividade />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/prancha" element={<PranchaPadrao />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route element={<RotaComLogin />}>
              <Route path="/painel" element={<Painel />} />
              <Route path="/conta" element={<Conta />} />
              <Route path="/aluno/novo" element={<AlunoFormulario key="novo" />} />
              <Route path="/aluno/:id/editar" element={<AlunoFormulario key="editar" />} />
              <Route path="/aluno/:id/atividades" element={<AtividadesAluno />} />
              <Route path="/aluno/:id/progresso" element={<Progresso />} />
              <Route path="/aluno/:id/trilha" element={<TrilhaDoDia />} />
              <Route path="/aluno/:id/prancha" element={<PranchaAluno />} />
              <Route path="/aluno/:id/prancha/editar" element={<PranchaEditar />} />
              <Route path="/desenhos" element={<Desenhos />} />
              <Route path="/videos" element={<Videos />} />
            </Route>
            {Componentes && <Route path="/componentes" element={<Componentes />} />}
            {ExemploProgresso && (
              <Route path="/componentes/progresso" element={<ExemploProgresso />} />
            )}
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </Suspense>
      </ConvidadoProvider>
    </SessaoProvider>
  )
}
