import { Navigate, Outlet } from 'react-router'
import { useSessao } from '../contexts/sessao-contexto'
import Carregando from './Carregando'

/** Protege as rotas que exigem login: sem sessão, volta para a página inicial. */
export default function RotaComLogin() {
  const { usuario, carregando } = useSessao()
  if (carregando) return <Carregando />
  if (!usuario) return <Navigate to="/" replace />
  return <Outlet />
}
