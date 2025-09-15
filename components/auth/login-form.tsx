"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff, Building2, Users, Calendar, Shield, Wifi, TrendingUp } from "lucide-react"

// shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Keep your original imports and schema
import { LoginSchema } from "@/lib/validations/login-schema"
import { login } from "@/lib/auth-actions/login"

// Custom styled alert components for errors and success
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <Alert variant="destructive" className="mb-4 bg-red-950/30 border-red-900/50 text-red-300">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <Alert className="mb-4 bg-emerald-950/30 border-emerald-900/50 text-emerald-300">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

// Feature item component for the left panel
const FeatureItem = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <div className="flex gap-4 mb-8">
    <Card className="bg-black/40 border-gray-800 p-3 flex items-center justify-center min-w-[48px] h-12 backdrop-blur-sm">
      <Icon className="text-amber-400 w-6 h-6" />
    </Card>
    <div>
      <h3 className="text-gray-50 font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

export const LoginForm = () => {
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callbackUrl = searchParams?.get("callbackUrl")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      passwordHash: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("")
    setSuccess("")
    setIsLoading(true)
    try {
      const data = await login(values)
      if (data?.error) {
        setError(data.error)
      } else if (data.success) {
        // On successful login, redirect to the dashboard or home page
        window.location.assign("/setup")
      }
    } catch (error) {
      setError(`An unexpected error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Pitch black background with subtle gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.02),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.01),transparent_50%)]"></div>
      
      {/* Left Panel - Property Management Features */}
      <div className="hidden lg:flex lg:w-7/12 bg-transparent p-8 xl:p-16 flex-col justify-center relative z-10">
        {/* Logo and Brand */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-amber-500 w-9 h-9" />
            <h1 className="text-gray-50 text-2xl font-bold">PropManage Pro</h1>
          </div>
          <p className="text-gray-400 text-sm ml-12">Complete Property Management Solutions</p>
        </div>

        {/* Features List */}
        <div className="max-w-lg">
          <FeatureItem
            icon={Building2}
            title="Multi-Property Portfolio Management"
            description="Effortlessly manage residential, commercial, and mixed-use properties from a single, unified dashboard."
          />
          
          <FeatureItem
            icon={Users}
            title="Tenant & Lease Management"
            description="Streamline tenant relations with automated rent collection, lease tracking, and maintenance request systems."
          />
          
          <FeatureItem
            icon={TrendingUp}
            title="Financial Analytics & Reporting"
            description="Track income, expenses, and ROI with comprehensive financial reports and real-time analytics."
          />
          
          <FeatureItem
            icon={Calendar}
            title="Maintenance & Scheduling"
            description="Schedule property inspections, maintenance tasks, and vendor appointments with automated reminders."
          />
          
          <FeatureItem
            icon={Shield}
            title="Secure Document Management"
            description="Store leases, contracts, and legal documents with bank-grade security and easy access controls."
          />
          
          <FeatureItem
            icon={Wifi}
            title="Cloud-Based Access"
            description="Access your property management system anywhere with real-time synchronization across all devices."
          />
        </div>

        {/* Bottom accent */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <p className="text-gray-500 text-xs">
            Trusted by property managers nationwide • SOC 2 Certified • 24/7 Support
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-5/12 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6 lg:p-8 relative z-10 border-l border-gray-900/50">
        <Card className="w-full max-w-md bg-black/50 border-gray-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-4 justify-center">
              <Building2 className="text-amber-500 w-8 h-8" />
              <div className="text-center">
                <h1 className="text-gray-50 text-xl font-bold">PropManage Pro</h1>
                <p className="text-gray-500 text-xs">Property Management</p>
              </div>
            </div>

            <CardTitle className="text-2xl text-gray-50">
              {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
            </CardTitle>
            {!showTwoFactor && (
              <CardDescription className="text-gray-400">
                Access your property management dashboard
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {showTwoFactor ? (
                // --- 2FA Code Field ---
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-300">
                    Verification Code
                  </Label>
                  <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="code"
                        type="text"
                        placeholder="123456"
                        disabled={isLoading}
                        className="h-12 bg-black border-gray-800 text-gray-100 text-xl tracking-wider text-center focus:border-amber-500 focus:ring-amber-500/20"
                      />
                    )}
                  />
                  {errors.code && (
                    <p className="text-red-400 text-sm">{errors.code.message}</p>
                  )}
                </div>
              ) : (
                <>
                  {/* --- Username Field --- */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-300">
                      Username
                    </Label>
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          disabled={isLoading}
                          className="h-12 bg-black border-gray-800 text-gray-100 focus:border-amber-500 focus:ring-amber-500/20"
                        />
                      )}
                    />
                    {errors.username && (
                      <p className="text-red-400 text-sm">{errors.username.message}</p>
                    )}
                  </div>

                  {/* --- Password Field --- */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Controller
                        name="passwordHash"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            className="h-12 bg-black border-gray-800 text-gray-100 pr-12 focus:border-amber-500 focus:ring-amber-500/20"
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={togglePasswordVisibility}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-400 hover:bg-transparent h-8 w-8 p-0"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {errors.passwordHash && (
                      <p className="text-red-400 text-sm">{errors.passwordHash.message}</p>
                    )}
                  </div>

                  {/* --- Remember Me and Forgot Password --- */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        className="border-gray-700 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                      />
                      <Label htmlFor="remember" className="text-gray-400 text-sm">
                        Remember me
                      </Label>
                    </div>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </>
              )}

              {/* Error and Success Messages */}
              <FormError message={error} />
              <FormSuccess message={success} />

              {/* --- Submit Button --- */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-black font-semibold shadow-lg hover:shadow-amber-500/20"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    <span>{showTwoFactor ? "Verifying..." : "Signing in..."}</span>
                  </>
                ) : (
                  <span>{showTwoFactor ? "Verify & Access System" : "Login"}</span>
                )}
              </Button>

              {/* Footer Links */}
              {!showTwoFactor && (
                <div className="text-center pt-4 border-t border-gray-900/50">
                  <p className="text-gray-500 text-sm">
                    Need access to the system?{' '}
                    <Link 
                      href="/auth/register" 
                      className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      Request Account
                    </Link>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}