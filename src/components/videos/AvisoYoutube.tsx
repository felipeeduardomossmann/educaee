/** Aviso fixo dos vídeos, com os links exigidos pelas políticas do YouTube. */
export default function AvisoYoutube() {
  return (
    <p className="text-sm text-tinta-suave">
      Os vídeos vêm do YouTube. Assista antes com o aluno. Ao assistir, você concorda com os{' '}
      <a
        href="https://www.youtube.com/t/terms"
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-azul-escuro underline underline-offset-2"
      >
        Termos de Serviço do YouTube
      </a>{' '}
      (veja também a{' '}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-azul-escuro underline underline-offset-2"
      >
        Política de Privacidade do Google
      </a>
      ).
    </p>
  )
}
