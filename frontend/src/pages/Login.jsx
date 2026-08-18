import React, { useContext, useEffect, useState, useRef, useCallback } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'


const Login = () => {

  const [state, setState] = useState('sign Up')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef([])

  // Google Sign-In
  const googleButtonRef = useRef(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const navigate = useNavigate()
  const { backendUrl, token, setToken } = useContext(AppContext)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Google Sign-In callback
  const handleGoogleCallback = useCallback(async (response) => {
    setGoogleLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/google-login`, {
        credential: response.credential,
      })

      if (data.success) {
        toast.success('Signed in with Google successfully!')
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Google Sign-In failed. Please try again.')
    }
    setGoogleLoading(false)
  }, [backendUrl, setToken])

  // Load Google Identity Services script and render button
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === '505171249913-1licr6t06r7g07ro6lbopjufg2kagkik.apps.googleusercontent.com') return

    // Check if script is already loaded
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn(clientId)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => initializeGoogleSignIn(clientId)
    document.head.appendChild(script)

    return () => {
      // Cleanup: remove script on unmount if it was added
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [handleGoogleCallback])

  const initializeGoogleSignIn = (clientId) => {
    if (!window.google?.accounts?.id) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
    })

    // Render the button if the ref is available
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: state === 'sign Up' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }
  }

  // Re-render Google button when state (Login/Sign Up) changes
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || clientId === '505171249913-1licr6t06r7g07ro6lbopjufg2kagkik.apps.googleusercontent.com') return
    if (window.google?.accounts?.id && googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: state === 'sign Up' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      })
    }
  }, [state])

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (state === 'sign Up') {

      const { data } = await axios.post(`${backendUrl}/api/user/register`, { name, email, password })

      if (data.success && data.requiresVerification) {
        // Show OTP verification screen
        setOtpEmail(data.email)
        setShowOtp(true)
        setResendCooldown(60)
        toast.success('Verification code sent to your email!')
      } else if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }

    } else {

      const { data } = await axios.post(`${backendUrl}/api/user/login`, { email, password })

      if (data.success) {
        localStorage.setItem('token', data.token)
        setToken(data.token)
      } else {
        toast.error(data.message)
      }

    }

  }

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // only digits

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // only last digit
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return

    const newOtp = pastedData.split('')
    setOtp(newOtp)
    inputRefs.current[5]?.focus()
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setOtpLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/verify-otp`, {
        email: otpEmail,
        otp: otpString,
      })

      if (data.success) {
        toast.success('Email verified successfully!')
        localStorage.setItem('token', data.token)
        setToken(data.token)
        setShowOtp(false)
      } else {
        toast.error(data.message)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.')
    }
    setOtpLoading(false)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/resend-otp`, {
        email: otpEmail,
      })

      if (data.success) {
        toast.success(data.message)
        setResendCooldown(60)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.')
    }
  }

  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  // OTP Verification Screen
  if (showOtp) {
    return (
      <div className='min-h-[80vh] flex items-center'>
        <div className='flex flex-col gap-4 m-auto items-center p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
          
          {/* Lock Icon */}
          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2'>
            <svg xmlns="http://www.w3.org/2000/svg" className='w-8 h-8 text-primary' fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5-1.115a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
            </svg>
          </div>

          <p className='text-2xl font-semibold text-gray-800'>Verify Your Email</p>
          <p className='text-center text-gray-500'>
            We've sent a 6-digit verification code to<br />
            <span className='font-medium text-gray-700'>{otpEmail}</span>
          </p>

          {/* OTP Input Boxes */}
          <div className='flex gap-2 my-4' onPaste={handleOtpPaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className='w-11 h-13 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors'
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOtp}
            disabled={otpLoading || otp.join('').length !== 6}
            className='bg-primary text-white w-full py-2.5 rounded-md text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors'
          >
            {otpLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend OTP */}
          <div className='text-center mt-1'>
            {resendCooldown > 0 ? (
              <p className='text-gray-400 text-xs'>
                Resend code in <span className='font-semibold text-gray-600'>{resendCooldown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                className='text-primary underline cursor-pointer text-sm hover:text-primary/80 transition-colors'
              >
                Resend verification code
              </button>
            )}
          </div>

          {/* Back to register */}
          <button
            onClick={() => { setShowOtp(false); setOtp(['', '', '', '', '', '']) }}
            className='text-gray-400 text-xs mt-2 hover:text-gray-600 cursor-pointer transition-colors'
          >
            ← Back to registration
          </button>

        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'sign Up' ? 'sign up' : 'log in'} to book appointment</p>

        {/* Google Sign-In Button */}
        <div className='w-full flex flex-col items-center'>
          <div ref={googleButtonRef} className='w-full flex justify-center'></div>
          {googleLoading && (
            <p className='text-xs text-gray-400 mt-1'>Signing in with Google...</p>
          )}
        </div>

        {/* Divider */}
        <div className='flex items-center w-full gap-3 my-1'>
          <div className='flex-1 h-px bg-gray-300'></div>
          <span className='text-xs text-gray-400 font-medium'>OR</span>
          <div className='flex-1 h-px bg-gray-300'></div>
        </div>

        {state === 'sign Up'
          ? <div className='w-full '>
            <p>Full Name</p>
            <input onChange={(e) => setName(e.target.value)} value={name} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="text" required />
          </div>
          : null
        }
        <div className='w-full '>
          <p>Email</p>
          <input onChange={(e) => setEmail(e.target.value)} value={email} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="email" required />
        </div>
        <div className='w-full '>
          <p>Password</p>
          <input onChange={(e) => setPassword(e.target.value)} value={password} className='border border-[#DADADA] rounded w-full p-2 mt-1' type="password" required />
        </div>
        <button className='bg-primary text-white w-full py-2 my-2 rounded-md text-base'>{state === 'sign Up' ? 'Create account' : 'Login'}</button>
        {state === 'sign Up'
          ? <p>Already have an account? <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer'>Login here</span></p>
          : <p>Create an new account? <span onClick={() => setState('sign Up')} className='text-primary underline cursor-pointer'>Click here</span></p>
        }
      </div>
    </form>
  )
}

export default Login