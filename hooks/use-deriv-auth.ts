"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_APP_ID, OAUTH_CLIENT_ID, DERIV_API, DERIV_REDIRECT_URL } from "@/lib/deriv-config"

interface Balance {
  amount: number
  currency: string
}

interface Account {
  id: string
  type: "Demo" | "Real"
  currency: string
  balance: number
}

// Helper to get initial values from localStorage safely
const getStored = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue
  const saved = localStorage.getItem(key)
  if (!saved) return defaultValue
  try {
    return JSON.parse(saved)
  } catch {
    return saved
  }
}

export function useDerivAuth() {
  const [token, setToken] = useState<string>(() => getStored("deriv_api_token", ""))
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getStored("deriv_api_token", ""))
  const [balance, setBalance] = useState<Balance | null>(null)
  const [accountType, setAccountType] = useState<"Demo" | "Real" | null>(null)
  const [accountCode, setAccountCode] = useState<string>("")
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const tokens = getStored("deriv_auth_tokens", {})
    const lastBalances = getStored("deriv_last_balances", {})
    return Object.keys(tokens).map(id => ({
      id,
      type: id.startsWith("VR") ? "Demo" : "Real",
      currency: lastBalances[id]?.currency || "USD",
      balance: lastBalances[id]?.balance || 0
    }))
  })
  const [activeLoginId, setActiveLoginId] = useState<string | null>(() => getStored("active_login_id", null))
  const activeLoginIdRef = useRef<string | null>(getStored("active_login_id", null))
  const [isInitializing, setIsInitializing] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [balanceSubscribed, setBalanceSubscribed] = useState(false)
  const balanceSubscribedRef = useRef(false)
  const manager = DerivWebSocketManager.getInstance()

  // Keep ref in sync immediately
  useEffect(() => {
    activeLoginIdRef.current = activeLoginId
  }, [activeLoginId])

  // 1. Stable listener for auth and balance updates
  useEffect(() => {
    const handleAuthMessages = (data: any) => {
      console.log("[v0] 📡 Auth hook message:", data.msg_type)
      if (data.msg_type === "authorize") {
        setIsInitializing(false)
        if (data.error) {
          console.error("[v0] ❌ Auth error:", data.error.message)
          if (data.error.code === "InvalidToken" || data.error.code === "AuthorizationRequired") {
            setIsLoggedIn(false)
            setActiveLoginId(null)
            activeLoginIdRef.current = null
            setAccountCode("")
            setToken("")

            localStorage.removeItem("deriv_api_token")
            localStorage.removeItem("deriv_auth_tokens")
            localStorage.removeItem("active_login_id")
            localStorage.removeItem("deriv_last_balances")

            setShowTokenModal(true)
          }
          return
        }

        const { authorize } = data
        if (authorize) {
          console.log("[v0] ✅ Authorization successful for:", authorize.loginid)
          setIsLoggedIn(true)
          setActiveLoginId(authorize.loginid)
          setAccountCode(authorize.loginid)
          setAccountType(authorize.is_virtual ? "Demo" : "Real")

          if (authorize.balance !== undefined) {
            setBalance({
              amount: Number(authorize.balance),
              currency: authorize.currency || "USD",
            })
          }

          if (authorize.account_list && Array.isArray(authorize.account_list)) {
            const lastBalancesMap = getStored("deriv_last_balances", {})
            const formatted = authorize.account_list.map((acc: any) => {
              const apiBalance = Number(acc.balance) || 0
              // Always trust the active account's new balance. For inactive accounts, 
              // if API returns 0, try to use the last known good balance to avoid wiping it.
              const finalBalance = (acc.loginid === authorize.loginid || apiBalance > 0) 
                 ? apiBalance 
                 : (lastBalancesMap[acc.loginid]?.balance || 0)

              return {
                id: acc.loginid,
                type: acc.is_virtual ? "Demo" : "Real",
                currency: acc.currency,
                balance: finalBalance,
              }
            })
            
            // Cache these balanced
            const balanceMap: Record<string, { balance: number, currency: string }> = {}
            formatted.forEach((f: Account) => {
              balanceMap[f.id] = { balance: f.balance, currency: f.currency }
            })
            localStorage.setItem("deriv_last_balances", JSON.stringify(balanceMap))
            
            setAccounts(formatted)
          }

          if (!balanceSubscribedRef.current) {
            manager.send({ balance: 1, subscribe: 1 })
            balanceSubscribedRef.current = true
            setBalanceSubscribed(true)
          }
        }
      }

      if (data.msg_type === "balance" && data.balance) {
        const msgLoginId = data.balance.loginid || activeLoginIdRef.current
        console.log("[v0] 💰 Balance update:", data.balance.balance, "for", msgLoginId)
        
        if (msgLoginId === activeLoginIdRef.current) {
          setBalance({
            amount: Number(data.balance.balance),
            currency: data.balance.currency,
          })
        }

        setAccounts(prev => {
          const next = prev.map(acc => {
            if (acc.id === msgLoginId) {
                return { ...acc, balance: Number(data.balance.balance) }
            }
            return acc
          })
          
          // Persistence
          const balanceMap = getStored("deriv_last_balances", {})
          next.forEach(n => {
            balanceMap[n.id] = { balance: n.balance, currency: n.currency }
          })
          localStorage.setItem("deriv_last_balances", JSON.stringify(balanceMap))
          
          return next
        })
      }
    }

    const statusHandler = (status: string) => {
      if (status === "disconnected" && !localStorage.getItem("deriv_api_token")) {
        setIsInitializing(false)
      }
    }
    const unbindStatus = manager.onConnectionStatus(statusHandler)

    // Safety Timeout: Force initialization to end after 10 seconds to prevent "stuck" screen
    const safetyTimeout = setTimeout(() => {
      if (isInitializing) {
        console.warn("[v0] 🕒 Authorization safety timeout reached. Forcing check.")
        setIsInitializing(false)
      }
    }, 10000)

    return () => {
      clearTimeout(safetyTimeout)
      manager.off("authorize", handleAuthMessages)
      manager.off("balance", handleAuthMessages)
      unbindStatus()
    }
  }, [isInitializing])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Redirect Listener (Handles redirects to root instead of /api/auth/callback)
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    const handleRedirectAuth = async () => {
      try {
        const storedState = sessionStorage.getItem("oauth_state")
        const codeVerifier = sessionStorage.getItem("pkce_code_verifier")

        if (!state || state !== storedState) {
          throw new Error("Invalid state parameter (CSRF protection)")
        }

        if (!codeVerifier) {
          throw new Error("Missing code verifier")
        }

        console.log("[v0] 🔄 Exchanging redirect authorization code for token...")
        setIsInitializing(true)

        const response = await fetch("/api/auth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
            redirect_uri: DERIV_REDIRECT_URL,
            client_id: OAUTH_CLIENT_ID,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error_description || data.error || "Token exchange failed")
        }

        console.log("[v0] 🔑 Storing retrieved access token...")
        
        // Clear PKCE storage
        sessionStorage.removeItem("oauth_state")
        sessionStorage.removeItem("pkce_code_verifier")

        // Store token for the app
        localStorage.setItem("deriv_api_token", data.access_token)
        setToken(data.access_token)
        
        // Clean URL query parameters
        const url = new URL(window.location.href)
        url.searchParams.delete("code")
        url.searchParams.delete("state")
        window.history.replaceState({}, document.title, url.pathname + url.search)

        // Connect with the new token
        await connectWithToken(data.access_token)
      } catch (err: any) {
        console.error("[v0] ❌ Root redirect auth callback error:", err)
        alert(`Authentication failed: ${err.message || "Unknown error"}`)
        setIsInitializing(false)
      }
    }

    if (code && state) {
      handleRedirectAuth()
    } else {
      // Standard session check
      const storedToken = localStorage.getItem("deriv_api_token")
      if (storedToken && storedToken.length > 10) {
        connectWithToken(storedToken)
      } else {
        console.log("[v0] ℹ️ No session found")
        setIsInitializing(false)
      }
    }
  }, [])

  const connectWithToken = async (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      setIsInitializing(false)
      return
    }

    try {
      console.log("[v0] 🔄 Connecting with token:", apiToken.substring(0, 5) + "...")
      // Use the manager's V1 Auth flow (handles REST+OTP or Legacy Fallback)
      await manager.authorize(apiToken)
      // Note: isInitializing is also set to false in the 'authorize' event handler above
      setIsInitializing(false)
    } catch (e: any) {
      console.error("[v0] Connection error during auth:", e)
      setIsInitializing(false)
      
      // Handle the raw API error object that is thrown by the manager
      if (e?.code === "InvalidToken" || e?.code === "AuthorizationRequired") {
         console.warn("[v0] ⚠️ Invalid Token detected. Nuking session.")
         setIsLoggedIn(false)
         setActiveLoginId(null)
         activeLoginIdRef.current = null
         setAccountCode("")
         setToken("")

         localStorage.removeItem("deriv_api_token")
         localStorage.removeItem("deriv_auth_tokens")
         localStorage.removeItem("active_login_id")
         localStorage.removeItem("deriv_last_balances")
         
         setShowTokenModal(true)
      } else if (!isLoggedIn) {
        setShowTokenModal(true)
      }
    }
  }

  const submitApiToken = (apiToken: string) => {
    if (!apiToken || apiToken.length < 10) {
      alert("Please enter a valid API token")
      return
    }

    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", apiToken)
    setToken(apiToken)
    connectWithToken(apiToken)
  }

  const openTokenSettings = () => {
    setShowTokenModal(true)
  }

  const loginWithDeriv = async () => {
    console.log("[v0] 🔐 Starting Modern OAuth 2.0 PKCE login flow...")
    if (typeof window === "undefined") return

    try {
      // 1. Generate a random code_verifier
      const array = crypto.getRandomValues(new Uint8Array(64));
      const codeVerifier = Array.from(array)
        .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
        .join('');

      // 2. Derive the code_challenge
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // 3. Generate a random state for CSRF protection
      const state = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

      // 4. Store code_verifier and state before redirecting
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      // Build the standard authorization URL with all required PKCE parameters
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: OAUTH_CLIENT_ID, // Modern OAuth ID
        redirect_uri: DERIV_REDIRECT_URL,
        scope: 'trade account_manage',
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        app_id: DERIV_APP_ID // Legacy App ID (ensures compatibility with WS tokens)
      })

      const oauthUrl = `https://auth.deriv.com/oauth2/auth?${params.toString()}`

      console.log("[v0] 🔐 Redirecting to Deriv OAuth URL:", oauthUrl)
      window.location.href = oauthUrl
    } catch (error) {
      console.error("[v0] ❌ OAuth PKCE setup error:", error)
    }
  }

  const requestLogin = () => {
    loginWithDeriv()
  }

  const logout = () => {
    if (typeof window === "undefined") return
    manager.unsubscribeAll()
    localStorage.removeItem("deriv_api_token")
    localStorage.removeItem("deriv_auth_tokens")
    localStorage.removeItem("active_login_id")
    setToken("")
    setIsLoggedIn(false)
    setBalance(null)
    setAccounts([])
    setActiveLoginId(null)
    activeLoginIdRef.current = null
    setIsInitializing(false)
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    setShowTokenModal(true)
  }

  const switchAccount = (loginId: string) => {
    if (!loginId || typeof window === "undefined") return
    const storedTokens = JSON.parse(localStorage.getItem("deriv_auth_tokens") || "{}")
    const targetToken = storedTokens[loginId] || token

    if (!targetToken) return

    console.log("[v0] 🔄 Switching account to:", loginId)
    setIsInitializing(true)
    localStorage.setItem("deriv_api_token", targetToken)
    localStorage.setItem("active_login_id", loginId)
    setToken(targetToken)
    
    // Reset subscription flags so authorize handler re-subscribes for the NEW account
    balanceSubscribedRef.current = false
    setBalanceSubscribed(false)
    
    manager.authorize(targetToken).catch(console.error)
  }

  return {
    token,
    isLoggedIn,
    isInitializing,
    isAuthenticated: isLoggedIn,
    loginWithDeriv,
    requestLogin,
    showApprovalModal,
    logout,
    balance,
    accountType,
    accountCode,
    accounts,
    switchAccount,
    activeLoginId,
    showTokenModal,
    submitApiToken,
    openTokenSettings,
  }
}
