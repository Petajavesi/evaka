// SPDX-FileCopyrightText: 2017-2023 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.evaka.webpush

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.math.BigInteger
import java.net.URI
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.SecureRandom
import java.security.interfaces.ECPrivateKey
import java.security.interfaces.ECPublicKey
import java.security.spec.ECParameterSpec
import java.security.spec.ECPrivateKeySpec
import java.security.spec.ECPublicKeySpec
import java.time.Instant
import java.util.Base64
import org.bouncycastle.crypto.ec.CustomNamedCurves
import org.bouncycastle.crypto.params.ECDomainParameters
import org.bouncycastle.jcajce.provider.asymmetric.util.EC5Util
import org.bouncycastle.math.ec.ECPoint
import org.bouncycastle.util.BigIntegers

data class WebPushKeyPair(val publicKey: ECPublicKey, val privateKey: ECPrivateKey) {
    fun privateKeyBase64(): String = WebPushCrypto.base64Encode(WebPushCrypto.encode(privateKey))
    fun publicKeyBase64(): String = WebPushCrypto.base64Encode(WebPushCrypto.encode(publicKey))

    init {
        WebPushCrypto.validate(publicKey)
        WebPushCrypto.validate(privateKey)
    }

    companion object {
        fun fromPrivateKey(privateKey: ECPrivateKey): WebPushKeyPair =
            WebPushKeyPair(
                WebPushCrypto.derivePublicKey(privateKey),
                privateKey,
            )
    }
}

// Voluntary Application Server Identification (VAPID) for Web Push
// Reference: https://datatracker.ietf.org/doc/html/rfc8292
fun vapidAuthorizationHeader(keyPair: WebPushKeyPair, expiresAt: Instant, uri: URI): String {
    // 2. Application Server Self-Identification
    // Reference: https://datatracker.ietf.org/doc/html/rfc8292#section-2
    val jwt =
        JWT.create()
            .withAudience(uri.toString())
            .withExpiresAt(expiresAt)
            .sign(Algorithm.ECDSA256(keyPair.privateKey))

    // 3. VAPID Authentication Scheme
    // Reference: https://datatracker.ietf.org/doc/html/rfc8292#section-3
    return "vapid t=$jwt; k=${keyPair.publicKeyBase64()}"
}

object WebPushCrypto {
    // P-256 curve (a.k.a secp256r1, a.k.a prime256v1)
    // Used by both VAPID (server authentication), and MEWP (message encryption)
    // Reference: RFC8291 (MEWP): https://datatracker.ietf.org/doc/html/rfc8291#section-3.1
    // 3.1. Diffie-Hellman Key Agreement
    // Reference: RFC8292 (VAPID): https://datatracker.ietf.org/doc/html/rfc8292#section-2
    // 2. Application Server Self-Identification
    private val domainParams = ECDomainParameters(CustomNamedCurves.getByName("P-256"))
    private val parameterSpec: ECParameterSpec = EC5Util.convertToSpec(domainParams)
    private fun keyPairGenerator(secureRandom: SecureRandom): KeyPairGenerator =
        KeyPairGenerator.getInstance("EC").apply { initialize(parameterSpec, secureRandom) }

    private fun keyFactory(): KeyFactory = KeyFactory.getInstance("EC")

    fun generateKeyPair(secureRandom: SecureRandom): WebPushKeyPair {
        val keyPair = keyPairGenerator(secureRandom).generateKeyPair()
        return WebPushKeyPair(
            publicKey = keyPair.public as ECPublicKey,
            privateKey = keyPair.private as ECPrivateKey
        )
    }

    // References:
    //   - RFC8292 (VAPID): https://datatracker.ietf.org/doc/html/rfc8292#section-3.2
    //     3.2. Public Key Parameter ("k")
    //   - RFC7515 (JWS): https://datatracker.ietf.org/doc/html/rfc7515#section-2
    //     2. Terminology - Base64url Encoding
    fun base64Encode(bytes: ByteArray): String =
        Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)

    fun base64Decode(base64: String): ByteArray = Base64.getUrlDecoder().decode(base64)

    fun encode(key: ECPublicKey): ByteArray =
        EC5Util.convertPoint(parameterSpec, key.w).getEncoded(false)

    fun encode(key: ECPrivateKey): ByteArray = domainParams.curve.fromBigInteger(key.s).encoded

    fun decodePublicKey(base64: String) = decodePublicKey(base64Decode(base64))
    fun decodePublicKey(bytes: ByteArray): ECPublicKey =
        domainParams.curve.decodePoint(bytes).toPublicKey()

    fun decodePrivateKey(base64: String) = decodePrivateKey(base64Decode(base64))
    fun decodePrivateKey(bytes: ByteArray): ECPrivateKey =
        BigIntegers.fromUnsignedByteArray(bytes).toPrivateKey()

    fun derivePublicKey(privateKey: ECPrivateKey): ECPublicKey =
        // Derive public key point from private key value "s"
        // The standard Java API doesn't seem to have a way to do this easily, so we use Bouncy
        // Castle library utils
        domainParams.g.multiply(privateKey.s).toPublicKey()

    fun validate(key: ECPublicKey) {
        domainParams.validatePublicPoint(EC5Util.convertPoint(parameterSpec, key.w))
    }

    fun validate(key: ECPrivateKey) {
        domainParams.validatePrivateScalar(key.s)
    }

    private fun ECPoint.toPublicKey(): ECPublicKey =
        keyFactory()
            .generatePublic(
                ECPublicKeySpec(
                    EC5Util.convertPoint(domainParams.validatePublicPoint(this)),
                    parameterSpec
                )
            ) as ECPublicKey

    private fun BigInteger.toPrivateKey(): ECPrivateKey =
        keyFactory()
            .generatePrivate(
                ECPrivateKeySpec(domainParams.validatePrivateScalar(this), parameterSpec)
            ) as ECPrivateKey
}
