"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in")
      }

      // Store JWT token and user info
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      toast.success("Login successful! Redirecting...")

      // Redirect to dashboard
      setTimeout(() => {
        window.location.assign("/dashboard")
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || "Login failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center bg-[#f6f4f1] px-4 py-8",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white px-10 py-10 md:px-12 md:py-12 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
        
        {/* Centered logo and welcome text (Larger sizing) */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative w-56 h-24 mb-4">
            <Image
              src="/small logo.png"
              alt="Southwest State of Somalia Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Welcome back</h2>
          <p className="text-base text-zinc-500 mt-2">Sign in to manage your Inspection Cars system</p>
        </div>

        <form onSubmit={submitForm} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="text-base font-semibold text-zinc-700">
              Username
            </label>
            <div className="group relative">
              <User className="absolute top-1/2 left-3 h-5.5 w-5.5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                disabled={submitting}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="flex h-12.5 w-full rounded-lg border border-zinc-200 bg-transparent py-2.5 pl-11 pr-3 text-base transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-base font-semibold text-zinc-700">
              Password
            </label>
            <div className="group relative">
              <Lock className="absolute top-1/2 left-3 h-5.5 w-5.5 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-12.5 w-full rounded-lg border border-zinc-200 bg-transparent py-2.5 pl-11 pr-12 text-base transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition-colors hover:text-primary focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5.5 w-5.5" /> : <Eye className="h-5.5 w-5.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <label className="flex cursor-pointer items-center gap-2 text-base text-zinc-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4.5 w-4.5 rounded border-zinc-300 text-primary focus:ring-primary/30"
              />
              Remember me
            </label>
            <a
              href="#"
              className="text-base font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="h-13 w-full rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary/95 transition-all flex items-center justify-center gap-2 mt-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-center text-xs leading-relaxed text-zinc-400 pt-4">
            Southwest State of Somalia
            <br />
            Inspection Cars Management System v1.0
          </p>
        </form>
      </div>
    </div>
  )
}
