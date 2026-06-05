"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Key, ExternalLink, LogIn } from "lucide-react"

interface ApiTokenModalProps {
  open: boolean
  onSubmit: (token: string) => void
  onOAuthLogin?: () => void
  theme?: "light" | "dark"
}

export function ApiTokenModal({ open, onSubmit, onOAuthLogin, theme = "dark" }: ApiTokenModalProps) {
  const [tokenInput, setTokenInput] = useState("")
  const [loginMethod, setLoginMethod] = useState<"oauth" | "token">("oauth")

  const handleSubmit = () => {
    if (tokenInput.trim().length < 10) {
      alert("Please enter a valid API token (at least 10 characters)")
      return
    }
    onSubmit(tokenInput.trim())
  }

  const handleOAuthClick = () => {
    console.log("[v0] OAuth login button clicked")
    // Check if running in v0 preview environment (vusercontent.net)
    if (typeof window !== "undefined" && window.location.hostname.includes("vusercontent.net")) {
      alert("OAuth login is not available in v0's preview environment due to Content Security Policy restrictions.\n\nTo use OAuth:\n1. Deploy this app to your own server\n2. Or use the API Token method below with a token from Deriv\n\nFor development, please enter your Deriv API token manually.")
      return
    }
    
    if (onOAuthLogin) {
      try {
        onOAuthLogin()
      } catch (error) {
        console.error("[v0] OAuth login error:", error)
        alert(`OAuth login failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      console.warn("[v0] onOAuthLogin callback not provided")
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className={`sm:max-w-md ${theme === "dark" ? "bg-[#0a0e27] border-blue-500/30 text-white" : "bg-white border-gray-200"}`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Connect to Deriv
            </div>
          </DialogTitle>
          <DialogDescription className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
            Choose your preferred authentication method to connect to the Deriv trading platform using the official Deriv API.
          </DialogDescription>
        </DialogHeader>

        {/* OAuth Login Option */}
        <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-semibold ${theme === "dark" ? "text-green-400" : "text-green-700"}`}>
              OAuth 2.0 Login (Recommended)
            </h3>
            <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-green-500/30 text-green-300" : "bg-green-200 text-green-800"}`}>
              Secure
            </span>
          </div>
          <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Use your Deriv account credentials directly. No API token management needed.
          </p>
          <Button
            onClick={handleOAuthClick}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Login with Deriv OAuth
          </Button>
          <div className={`text-xs p-2 rounded mt-2 ${theme === "dark" ? "bg-blue-500/20 border border-blue-500/30 text-blue-300" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
            <p className="font-semibold mb-1">First-time setup required:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Log in to Deriv</li>
              <li>Go to Settings → API Tokens → OAuth Apps</li>
              <li>Edit app <code className="bg-slate-800 px-1 rounded text-cyan-400">33tdJCamBVncjRj9m3WFe</code></li>
              <li>Add this callback URL to "Redirect URIs":</li>
            </ol>
            <code className={`block p-1 rounded mt-1 break-all text-[9px] font-mono ${
              theme === "dark" ? "bg-slate-900 text-cyan-300" : "bg-slate-100 text-cyan-600"
            }`}>
              {typeof window !== 'undefined' && window.location.origin}
            </code>
            <a
              href="https://app.deriv.com/account/api-token"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block mt-2 font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
            >
              Go to Deriv OAuth Settings →
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-4">
          <div className={`flex-1 h-px ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>OR</span>
          <div className={`flex-1 h-px ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="api-token" className={theme === "dark" ? "text-white" : "text-gray-900"}>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Deriv API Token (Manual)
              </div>
            </Label>
            <Input
              id="api-token"
              type="password"
              placeholder="Enter your Deriv API token"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              className={
                theme === "dark"
                  ? "bg-[#0f1629] border-blue-500/30 text-white placeholder:text-gray-500"
                  : "bg-white border-gray-300"
              }
            />
          </div>

          <div
            className={`text-sm p-3 rounded-lg ${theme === "dark" ? "bg-amber-500/10 border border-amber-500/30" : "bg-amber-50 border border-amber-200"}`}
          >
            <p className={`font-semibold mb-1 ${theme === "dark" ? "text-amber-400" : "text-amber-700"}`}>
              How to get your API token:
            </p>
            <ol
              className={`list-decimal list-inside space-y-1 text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
            >
              <li>Log in to your Deriv account</li>
              <li>Go to Settings → API Tokens</li>
              <li>Create a new token with "Trade" permissions</li>
              <li>Copy and paste the token here</li>
            </ol>
            <a
              href="https://app.deriv.com/account/api-token"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${theme === "dark" ? "text-amber-400 hover:text-amber-300" : "text-amber-600 hover:text-amber-700"}`}
            >
              Go to Deriv API Tokens <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={tokenInput.trim().length < 10}
          >
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
