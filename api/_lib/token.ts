// Verifica o ID token do Firebase com "jose".
// Não usar firebase-admin/auth: ele quebra no carregador da Vercel (ERR_REQUIRE_ESM).

import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

const CHAVES_GOOGLE = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
)

const FOLGA_RELOGIO_SEG = 60

/** Devolve o uid se o token for um ID token válido deste projeto; senão, null. */
export async function verificarIdToken(
  token: string,
  idProjeto: string,
  chaves: JWTVerifyGetKey = CHAVES_GOOGLE,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, chaves, {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${idProjeto}`,
      audience: idProjeto,
      clockTolerance: FOLGA_RELOGIO_SEG,
      requiredClaims: ['exp', 'iat', 'sub', 'auth_time'],
    })
    const agora = Date.now() / 1000 + FOLGA_RELOGIO_SEG
    const { sub, iat, auth_time: autenticadoEm } = payload
    if (typeof sub !== 'string' || sub.length === 0 || sub.length > 128) return null
    if (typeof iat !== 'number' || iat > agora) return null
    if (typeof autenticadoEm !== 'number' || autenticadoEm > agora) return null
    return sub
  } catch {
    return null
  }
}
