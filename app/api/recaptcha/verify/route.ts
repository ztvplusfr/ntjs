import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token reCAPTCHA manquant' }, { status: 400 })
    }

    // Vérification du token reCAPTCHA avec Google
    const recaptchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      }
    )

    const recaptchaResult = await recaptchaResponse.json()

    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: 'Échec de la vérification reCAPTCHA' },
        { status: 400 }
      )
    }

    // Vérifier que le score est suffisant (reCAPTCHA v3 retourne un score de 0.0 à 1.0)
    if (recaptchaResult.score < 0.5) {
      return NextResponse.json(
        { error: 'Score reCAPTCHA trop bas' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, score: recaptchaResult.score })
  } catch (error) {
    console.error('Erreur lors de la vérification reCAPTCHA:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la vérification reCAPTCHA' },
      { status: 500 }
    )
  }
}
