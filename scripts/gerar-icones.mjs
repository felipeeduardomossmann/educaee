// Gera os ícones PNG do PWA a partir do desenho do favicon ("E" claro sobre quadrado coral).
// Uso: node scripts/gerar-icones.mjs  (os arquivos vão para public/ e entram no git)
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const publico = fileURLToPath(new URL('../public/', import.meta.url))

const CORAL = '#c8410b'
const CREME = '#fffaf2'

// Mesmo "E" do public/favicon.svg (caixa de 64 × 64). Ele já cabe na zona segura dos
// ícones "maskable" (círculo central com 80% do lado), então serve para todas as versões.
const letraE = `
  <g fill="${CREME}">
    <rect x="18" y="14" width="9" height="36" rx="4.5"/>
    <rect x="18" y="14" width="29" height="9" rx="4.5"/>
    <rect x="18" y="27.5" width="24" height="9" rx="4.5"/>
    <rect x="18" y="41" width="29" height="9" rx="4.5"/>
  </g>`

/** cantoArredondado: true = igual ao favicon; false = fundo inteiro (o sistema recorta). */
const svg = (cantoArredondado) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" ${cantoArredondado ? 'rx="16"' : ''} fill="${CORAL}"/>
  ${letraE}
</svg>`)

const icones = [
  { arquivo: 'icone-192.png', tamanho: 192, cantoArredondado: true },
  { arquivo: 'icone-512.png', tamanho: 512, cantoArredondado: true },
  { arquivo: 'icone-maskable-512.png', tamanho: 512, cantoArredondado: false },
  { arquivo: 'apple-touch-icon.png', tamanho: 180, cantoArredondado: false },
]

for (const { arquivo, tamanho, cantoArredondado } of icones) {
  const png = await sharp(svg(cantoArredondado), { density: (72 * tamanho) / 64 })
    .resize(tamanho, tamanho)
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()
  await writeFile(publico + arquivo, png)
  console.log(`${arquivo}: ${tamanho} px, ${png.length} bytes`)
}
