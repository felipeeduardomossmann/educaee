import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'
import { verificarIdToken } from './token.js'

const PROJETO = 'educaee-teste'
let chaves: ReturnType<typeof createLocalJWKSet>
let assinar: (ajustes?: {
  aud?: string
  iss?: string
  sub?: string
  exp?: number
}) => Promise<string>

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256' }
  chaves = createLocalJWKSet({ keys: [jwk] })
  assinar = async (ajustes = {}) => {
    const agora = Math.floor(Date.now() / 1000)
    return new SignJWT({ auth_time: agora - 10 })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(ajustes.iss ?? `https://securetoken.google.com/${PROJETO}`)
      .setAudience(ajustes.aud ?? PROJETO)
      .setSubject(ajustes.sub ?? 'uid-123')
      .setIssuedAt(agora - 10)
      .setExpirationTime(ajustes.exp ?? agora + 3600)
      .sign(privateKey)
  }
})

describe('verificarIdToken', () => {
  it('aceita um token válido e devolve o uid', async () => {
    expect(await verificarIdToken(await assinar(), PROJETO, chaves)).toBe('uid-123')
  })

  it('recusa outro projeto, outro emissor, token vencido e sem uid', async () => {
    expect(await verificarIdToken(await assinar({ aud: 'outro' }), PROJETO, chaves)).toBeNull()
    expect(
      await verificarIdToken(await assinar({ iss: 'https://exemplo.com' }), PROJETO, chaves),
    ).toBeNull()
    const vencido = Math.floor(Date.now() / 1000) - 3600
    expect(await verificarIdToken(await assinar({ exp: vencido }), PROJETO, chaves)).toBeNull()
    expect(await verificarIdToken(await assinar({ sub: '' }), PROJETO, chaves)).toBeNull()
  })

  it('recusa lixo e token assinado por outra chave', async () => {
    expect(await verificarIdToken('falso', PROJETO, chaves)).toBeNull()
    const { privateKey } = await generateKeyPair('RS256')
    const alheio = await new SignJWT({ auth_time: 1 })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setIssuer(`https://securetoken.google.com/${PROJETO}`)
      .setAudience(PROJETO)
      .setSubject('uid-123')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey)
    expect(await verificarIdToken(alheio, PROJETO, chaves)).toBeNull()
  })
})
