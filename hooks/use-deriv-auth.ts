"use client"

import { useEffect, useState, useRef } from "react"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { DERIV_APP_ID, DERIV_LEGACY_APP_ID, DERIV_REDIRECT_URL } from "@/lib/deriv-config"

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

/**
 * Parse Deriv legacy OAuth redirect parameters from the URL.
 * 
 * Deriv's oauth.deriv.com/oauth2/authorize returns tokens via URL query params:
 *   ?acct1=CR1234&token1=abc&cur1=USD&acct2=VRTC5678&token2=def&cur2=USD
 * 
 * Each account is numbered sequentially (acct1, token1, cur1, acct2, token2, cur2, ...)
 */
function parseDerivOAuthParams(searchParams: URLSearchParams): { accounts: Array<{ id: string; token: string; currency: string }> } | null {
  const accounts: Array<{ id: string; token: string; currency: string }> = []

  for (let i = 1; i <= 20; i++) {
    const acct = searchParams.get(`acct${i}`)
    const token = searchParams.get(`token${i}`)
    const cur = searchParams.get(`cur${i}`)

    if (acct && token) {
      accounts.push({ id: acct, token, currency: cur || "USD" })
    } else {
      break // No more accounts
    }
  }

  if (accounts.length > 0) return { accounts }
  return null
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
            
            // Cache these balances
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

    const searchParams = new URLSearchParams(window.location.search)

    // ─── Deriv Legacy OAuth Redirect Handler ─────────────────────────────────
    // Deriv's oauth.deriv.com returns tokens directly in URL params:
    //   ?acct1=CR1234&token1=abc123&cur1=USD&acct2=VRTC5678&token2=def456&cur2=USD
    const oauthResult = parseDerivOAuthParams(searchParams)

    if (oauthResult && oauthResult.accounts.length > 0) {
      console.log("[v0] 🔐 Deriv OAuth redirect detected with", oauthResult.accounts.length, "accounts")
      
      // Store all account tokens
      const tokenMap: Record<string, string> = {}
      oauthResult.accounts.forEach(acc => {
        tokenMap[acc.id] = acc.token
      })
      localStorage.setItem("deriv_auth_tokens", JSON.stringify(tokenMap))

      // Pick the first account (or prefer demo)
      const preferredAccount = oauthResult.accounts.find(a => a.id.startsWith("VR")) || oauthResult.accounts[0]
      const primaryToken = preferredAccount.token

      // Store as active
      localStorage.setItem("deriv_api_token", primaryToken)
      localStorage.setItem("active_login_id", preferredAccount.id)
      setToken(primaryToken)
      setActiveLoginId(preferredAccount.id)
      activeLoginIdRef.current = preferredAccount.id

      // Build initial accounts list
      const initialAccounts: Account[] = oauthResult.accounts.map(acc => ({
        id: acc.id,
        type: acc.id.startsWith("VR") ? "Demo" as const : "Real" as const,
        currency: acc.currency,
        balance: 0
      }))
      setAccounts(initialAccounts)

      // Clean URL — remove all OAuth params
      const url = new URL(window.location.href)
      for (let i = 1; i <= 20; i++) {
        url.searchParams.delete(`acct${i}`)
        url.searchParams.delete(`token${i}`)
        url.searchParams.delete(`cur${i}`)
      }
      url.searchParams.delete("scope")
      window.history.replaceState({}, document.title, url.pathname + (url.search || ""))

      // Connect with the token
      connectWithToken(primaryToken)
      return
    }

    // ─── Check for scope-only URL (stuck after failed OAuth) ──────────────────
    // If URL has ?scope=... but no acct1/token1, user is stuck from a failed redirect
    const scopeParam = searchParams.get("scope")
    if (scopeParam && !searchParams.get("acct1")) {
      console.log("[v0] ⚠️ Detected stale scope param without tokens, cleaning URL")
      const url = new URL(window.location.href)
      url.searchParams.delete("scope")
      window.history.replaceState({}, document.title, url.pathname + (url.search || ""))
      // Fall through to standard session check
    }

    // ─── Standard session check ──────────────────────────────────────────────
    const storedToken = localStorage.getItem("deriv_api_token")
    if (storedToken && storedToken.length > 10) {
      connectWithToken(storedToken)
    } else {
      console.log("[v0] ℹ️ No session found")
      setIsInitializing(false)
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

  /**
   * Deriv Legacy OAuth Login Flow
   * 
   * Uses oauth.deriv.com/oauth2/authorize which is the STANDARD way for third-party
   * apps to authenticate with Deriv. This endpoint:
   * 1. Redirects user to Deriv login page
   * 2. After login, redirects back to our app with tokens in URL query params
   * 3. No PKCE or code exchange needed — tokens come directly
   * 
   * Supports both modern App ID (33tdJCamBVncjRj9m3WFe) and legacy App ID (110211)
   */
  const loginWithDeriv = async (useLegacyAppId = false) => {
    console.log("[v0] 🔐 Starting Deriv OAuth login flow...")
    if (typeof window === "undefined") return

    try {
      // Choose the App ID — legacy users use 110211
      const appId = useLegacyAppId ? DERIV_LEGACY_APP_ID : DERIV_APP_ID

      // Build the Deriv OAuth URL
      // This is the CORRECT endpoint for third-party apps
      const params = new URLSearchParams({
        app_id: appId,
      })

      const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?${params.toString()}`

      console.log(`[v0] 🔐 Redirecting to Deriv OAuth URL (app_id=${appId}):`, oauthUrl)
      window.location.href = oauthUrl
    } catch (error) {
      console.error("[v0] ❌ OAuth login error:", error)
    }
  }

  /**
   * Login with legacy App ID 110211 for backward compatibility
   */
  const loginWithDerivLegacy = () => {
    loginWithDeriv(true)
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
    loginWithDerivLegacy,
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
