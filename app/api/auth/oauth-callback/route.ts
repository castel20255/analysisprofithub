import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth 2.0 Callback Handler for Deriv
 * This endpoint receives the authorization code from Deriv's OAuth provider
 * and exchanges it for an access token using the PKCE code verifier
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    console.log('[v0] OAuth Callback received:', { code, state, error })

    // Handle OAuth errors
    if (error) {
      console.error('[v0] OAuth Error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`,
          request.nextUrl.origin
        )
      )
    }

    // Validate required parameters
    if (!code) {
      console.error('[v0] OAuth callback missing authorization code')
      return NextResponse.redirect(
        new URL(
          '/auth-error?error=missing_code&description=Authorization%20code%20not%20received',
          request.nextUrl.origin
        )
      )
    }

    // Validate state parameter for CSRF protection
    if (typeof window === 'undefined') {
      const sessionState = request.cookies.get('oauth_state')?.value
      if (!state || state !== sessionState) {
        console.error('[v0] OAuth state mismatch - possible CSRF attack')
        return NextResponse.redirect(
          new URL(
            '/auth-error?error=state_mismatch&description=OAuth%20state%20validation%20failed',
            request.nextUrl.origin
          )
        )
      }
    }

    // Exchange authorization code for access token
    // This is done in a separate server action to keep the client_secret secure
    const response = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NEXT_PUBLIC_DERIV_OAUTH_CLIENT_ID || '33tdJCamBVncjRj9m3WFe',
        redirect_uri: `${request.nextUrl.origin}`,
        code_verifier: request.cookies.get('pkce_code_verifier')?.value || '',
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('[v0] Token exchange failed:', response.status, errorData)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=token_exchange_failed&description=${encodeURIComponent(errorData)}`,
          request.nextUrl.origin
        )
      )
    }

    const tokenData = await response.json()

    console.log('[v0] OAuth token exchange successful')

    // Store the access token in an HTTP-only cookie
    const response_with_cookie = NextResponse.redirect(
      new URL('/dashboard', request.nextUrl.origin)
    )

    response_with_cookie.cookies.set({
      name: 'deriv_access_token',
      value: tokenData.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 86400, // Default 24 hours
      path: '/',
    })

    // Store user info if available
    if (tokenData.user_id) {
      response_with_cookie.cookies.set({
        name: 'deriv_user_id',
        value: tokenData.user_id.toString(),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400,
        path: '/',
      })
    }

    // Clear OAuth state and PKCE verifier
    response_with_cookie.cookies.delete('oauth_state')
    response_with_cookie.cookies.delete('pkce_code_verifier')

    return response_with_cookie
  } catch (error) {
    console.error('[v0] OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/auth-error?error=server_error&description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        request.nextUrl.origin
      )
    )
  }
}
