"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface User {
  id: string
  email: string
  name: string | null
  is_admin?: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token")
    if (savedToken) {
      setToken(savedToken)
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => {
          if (!res.ok) throw new Error("Invalid token")
          return res.json()
        })
        .then(data => {
          setUser(data)
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem("auth_token")
          setToken(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    let res: Response
    try {
      res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      throw new Error("Unable to connect to the server. Please ensure the backend is running and try again.")
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }))
      throw new Error(err.detail || "Login failed")
    }
    const data = await res.json()
    localStorage.setItem("auth_token", data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    let res: Response
    try {
      res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
    } catch {
      throw new Error("Unable to connect to the server. Please ensure the backend is running and try again.")
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Signup failed" }))
      throw new Error(err.detail || "Signup failed")
    }
    const data = await res.json()
    localStorage.setItem("auth_token", data.access_token)
    setToken(data.access_token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
