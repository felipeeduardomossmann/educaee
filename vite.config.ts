import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** Só no dev: atende /api/* com as funções de api/ (variáveis sem VITE_ ficam no servidor). */
function apiLocal(): Plugin {
  return {
    name: 'educaee-api-local',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const nome of ['GEMINI_API_KEY', 'FIREBASE_SERVICE_ACCOUNT', 'YOUTUBE_API_KEY']) {
        if (env[nome] && !process.env[nome]) process.env[nome] = env[nome]
      }
      server.middlewares.use('/api', (req, res, next) => {
        const nome = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!/^[a-z-]+$/.test(nome)) return next()
        if (!existsSync(`${server.config.root}/api/${nome}.ts`)) {
          res.statusCode = 404
          res.end()
          return
        }
        void (async () => {
          try {
            const modulo = await server.ssrLoadModule(`/api/${nome}.ts`)
            const funcao = modulo[req.method ?? 'GET'] as
              ((request: Request) => Promise<Response>) | undefined
            if (!funcao) {
              res.statusCode = 405
              res.end()
              return
            }
            const partes: Buffer[] = []
            for await (const parte of req) partes.push(parte as Buffer)
            const cabecalhos = new Headers()
            for (const [chave, valor] of Object.entries(req.headers)) {
              if (typeof valor === 'string') cabecalhos.set(chave, valor)
            }
            const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
              method: req.method,
              headers: cabecalhos,
              body: partes.length > 0 ? Buffer.concat(partes) : undefined,
            })
            const resposta = await funcao(request)
            res.statusCode = resposta.status
            resposta.headers.forEach((valor, chave) => res.setHeader(chave, valor))
            res.end(Buffer.from(await resposta.arrayBuffer()))
          } catch (e) {
            server.config.logger.error(`[api/${nome}] ${String(e)}`)
            res.statusCode = 500
            res.end()
          }
        })()
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiLocal(),
    VitePWA({
      // O aviso de versão nova é tratado em src/lib/atualizacao.ts (sem interromper uma rodada).
      registerType: 'prompt',
      injectRegister: false,
      // Os ícones já entram pelo globPatterns abaixo; sem isso apareceriam duas vezes.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'EducAEE',
        short_name: 'EducAEE',
        description:
          'Atividades educativas adaptáveis para o Atendimento Educacional Especializado (AEE).',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#fffaf2',
        theme_color: '#fffaf2',
        categories: ['education', 'kids'],
        icons: [
          { src: '/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icone-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Guarda tudo para o modo offline: páginas, figuras, fontes woff2 e do PDF e as falas.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf,mp3}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        // /__/ é o login do Firebase e /api/ são as funções: sempre direto na rede.
        navigateFallbackDenylist: [/^\/__\//, /^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: [
      // Opcionais do jsPDF que não usamos (veja src/lib/modulo-ausente.ts).
      {
        find: /^(html2canvas|canvg|dompurify)$/,
        replacement: fileURLToPath(new URL('./src/lib/modulo-ausente.ts', import.meta.url)),
      },
    ],
  },
  build: {
    // Figuras e falas gravadas são pequenas, mas ficam como arquivos separados: só baixam quando
    // usadas (e o service worker guarda todas para o offline).
    assetsInlineLimit: (arquivo) =>
      /\/assets\/(figuras|falas)\//.test(arquivo) ? false : undefined,
  },
  test: {
    include: ['src/**/*.test.ts', 'api/**/*.test.ts', 'scripts/**/*.test.mjs'],
    passWithNoTests: true,
  },
})
