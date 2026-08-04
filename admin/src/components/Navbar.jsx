import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { NavLink } from "react-router-dom";
import socket from '../socket'
import { toast } from 'react-toastify'
import axios from 'axios'

const Navbar = () => {

  const { dToken, setDToken, backendUrl: docBackendUrl, profileData } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  
  const backendUrl = docBackendUrl || import.meta.env.VITE_BACKEND_URL

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
  }

  const loadNotifications = async () => {
    try {
      if (aToken) {
        const { data } = await axios.get(`${backendUrl}/api/admin/notifications`, { headers: { aToken } })
        if (data.success) {
          setNotifications(data.notifications)
        }
      } else if (dToken) {
        const { data } = await axios.get(`${backendUrl}/api/doctor/notifications`, { headers: { dToken } })
        if (data.success) {
          setNotifications(data.notifications)
        }
      }
    } catch (error) {
      console.error("Error loading notifications in admin navbar:", error)
    }
  }

  const markNotificationsRead = async () => {
    try {
      if (aToken) {
        const { data } = await axios.post(`${backendUrl}/api/admin/notifications/mark-read`, {}, { headers: { aToken } })
        if (data.success) {
          loadNotifications()
        }
      } else if (dToken) {
        const { data } = await axios.post(`${backendUrl}/api/doctor/notifications/mark-read`, {}, { headers: { dToken } })
        if (data.success) {
          loadNotifications()
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  useEffect(() => {
    if (aToken || dToken) {
      loadNotifications()
    } else {
      setNotifications([])
    }
  }, [aToken, dToken])

  useEffect(() => {
    const handleNewAppointment = (data) => {
      console.log("Socket new-appointment received:", data)
      toast.success(data.message)
      loadNotifications()
    }

    const handleCancelled = (data) => {
      console.log("Socket appointment-cancelled received:", data)
      toast.error(data.message)
      loadNotifications()
    }

    socket.on("new-appointment", handleNewAppointment)
    socket.on("appointment-cancelled", handleCancelled)

    return () => {
      socket.off("new-appointment", handleNewAppointment)
      socket.off("appointment-cancelled", handleCancelled)
    }
  }, [aToken, dToken])

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img onClick={() => navigate('/')} className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo} alt="" />
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>{aToken ? 'Admin' : 'Doctor'}</p>
      </div>

      <div className='flex items-center gap-4'>
        {(aToken || dToken) && (
          <div className='relative z-30'>
            {/* Notification Bell */}
            <button onClick={() => setShowNotifications(!showNotifications)} className='relative p-1 text-gray-600 hover:text-primary transition-all duration-300 focus:outline-none'>
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' />
              </svg>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white'>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showNotifications && (
              <div className='absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100 max-h-96 overflow-y-auto text-left'>
                <div className='px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50'>
                  <span className='font-semibold text-gray-700 text-sm'>Notifications</span>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button onClick={() => { markNotificationsRead(); setShowNotifications(false); }} className='text-xs text-primary hover:underline font-medium bg-transparent border-none cursor-pointer'>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className='divide-y divide-gray-100 max-h-72 overflow-y-auto'>
                  {notifications.length === 0 ? (
                    <div className='px-4 py-6 text-center text-sm text-gray-500'>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((item, idx) => (
                      <div key={idx} className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!item.read ? 'bg-blue-50/30' : ''}`}>
                        <p className={`text-xs text-gray-600 ${!item.read ? 'font-medium text-gray-800' : ''}`}>
                          {item.message}
                        </p>
                        <span className='text-[9px] text-gray-400 mt-1 block'>
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => logout()} className='bg-primary text-white text-sm px-10 py-2 rounded-full'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar