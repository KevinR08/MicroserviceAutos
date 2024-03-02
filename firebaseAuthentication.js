const admin = require('firebase-admin')
const cookie = require('cookie');
require('dotenv').config()

// Se configura la información de autenticación de Firebase desde variables de entorno
const firebaseConfig = {
  type: "service_account",
  projectId: "carstore-69599",
  privateKeyId: "8c1f74b4de679a1a1f75d14014eb880fe060eb4a",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC4v1Cxk0ytYfoD\nUxwM1bah6zd/aecfgQceInKE7fW1FM91k9PFWxye+aSEr4iY3SYqcRuT3yD/VrIv\nrO9Ky0PfWinMuc17gTMTiMihw9fpDMtfrQvel7J+fE34JbFLSBsVKwHzinnT9hR+\nH8J5jd5aIKRunY87GjUFutYbf8YWGAcmurSRbD4eUIS8e97SK3yzI4rRD+8ZpTO3\nKgq2uHanMQm33tqIJllCho/wSiRwC1DGdhde16Jay76ajg8xxHxygbfxNpmhqpnI\nVDB0x0gx9g28/hW1mg6X955uOZKQe3CRifD5MvRKfcp8MoNeBgeQiER4mBtyNat/\nXUn9lqwZAgMBAAECggEABijp1rvhr/u+72axXhuvktNCBtNn/4DItRhir1w0R7D9\nkE7pHhDRQdsywTJNmIQyIjLif6IOSnkwaH7IfTrNBOjPkToGOAaZJn72ao9aNvTk\nYIinZ0jxTH6WRm5yTH9nWMO19VHyCS9QpFpofG9OoTxqox4JgSfY6fueaS0P1Jty\nnRYq9uo6LgpAVFZw4eXvoeudV5srGn9CXflUreLS/lZ/aLzGmIWJbki4oh2laT6Z\nOlI3W8qNzFTIzztblCULihk6KyvHk3joAOzGpRqkk1KgML1PMelDQAr8nWtY0qj7\nRiysIEMzwS0JtwRGiUjCM5JwWw14BINGqd8BH0FagQKBgQD3at1JgvrOhT5HhSnG\nryFnkmVW5eKH0jHnOyWylhhIJuk3M9SLPWM4qNHI8S6dXhXpbUsqQmmL9SwCb059\nk5r3jZdpLqXV9F10r43E0EQbxJ0N83JoPIsrp69sLDWu6EjGMUO+3U4XpfgN0bjF\nahpZPf9YCuDEGSKQ1aZPBVvImQKBgQC/J+w7fwHgvTUMt8PTph0woeSVoUe1qo0L\nhgZ24n0jC3Zvn5gaNwVEcRgIWDc3l7/WZGCTv+bhFwR1Nu399RPHoHrNedUcRpoL\nvNkoP4jKZqzs0udJVmKPi+VMYUVdmcgIPlWnhXTyY6v1Cm1gOKCSNdC0Xtui+WHt\n6Cdc4aavgQKBgEu5P0Tye4SdrzQAg4q1qwmh+rYf4bckE/XrWlxQJ9pdXl9w04pS\nHX4H3T0c4+FyHE63Dpw+e0NEpFWSb3lrpbBCe6bLiiHzim7eFAu6mj3NbSwJ6GgS\nr52K0tvOpBeGLE/MYCmYXgBK4aKJH338PVg262Gs4qHh93xQh3gD8dVxAoGARnUU\noaliq8+Rqiphx7VGtRI3Ct/zaoZ+jmzMHS3GKhCjiuksSx1Ul7GHxiudzqPkVcWR\nw2PMWdL+FaY1epHGxKHmIa5yWoW7afAlqqwgY1oNCw2BqoposbhCwDBqPOHd1QwE\nzkZmoKEUVLGPNxQoOzwSvSjpk9yPt/0F5TpXEgECgYAbXxWvGFZjzBFwyP8Iw3ua\n+mF9sg+TVaKjMrA/P1g1oI+pUikWe/bKP4BOeWFihHxoQ+FhkJiZdBN9+Sclfoje\nXCZzEDHCeeQyOa7MJXaqbdi1H5xlepEQJ6bag8cJdAzF0UybobT6sPVOjOPzE8ZS\n1faRYbvgLDga9L1WLhJ8BA==\n-----END PRIVATE KEY-----\n",
  clientEmail: "firebase-adminsdk-m4inz@carstore-69599.iam.gserviceaccount.com",
  clientId: "103872805972432489457",
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  clientX509CertUrl: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-m4inz%40carstore-69599.iam.gserviceaccount.com",
  universeDomain: "googleapis.com"
}

// Inicializa Firebase Admin SDK con la configuración proporcionada
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
})

console.log('Firebase Admin SDK inicializado', adminApp.name)

// Middleware de autenticación
function isAuthenticated (req, res, next) {
  const auth = admin.auth()
  // Verifica si el usuario está autenticado utilizando el token proporcionado en el encabezado de autorización
  const idToken = req.header('Authorization')
  console.log('En firebase Authentication' + idToken)
  if (!idToken) {
    // Si no se proporciona un token en el encabezado, se responde con un error de acceso no autorizado
    return res.status(401).json({ error: 'Acceso no autorizado - Token no proporcionado' });
  }

  auth
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      // El token es válido, puedes acceder a la información del usuario en decodedToken
      req.user = decodedToken


// Establecer cookies con los datos del usuario (aquí se establece un ejemplo de cookie 'user' con el ID del usuario)
const userCookie = cookie.serialize('email', decodedToken.email, {
  httpOnly: true,
  maxAge: 24 * 60 * 60, // Duración de la cookie en segundos (aquí, un día)
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production', // Asegúrate de estar en un entorno seguro para usar 'secure'
  path: '/' // Ruta de la cookie
});

res.setHeader('Set-Cookie', userCookie);


      console.log('Token válido, usuario autenticado', decodedToken)
      next()
    })
    .catch((error) => {
      console.error('Error de verificación de token:', error)
      return res.status(401).json({ error: 'Acceso no autorizado - Token inválido' })
    })
}
// Exporta el middleware de autenticación
module.exports = isAuthenticated
