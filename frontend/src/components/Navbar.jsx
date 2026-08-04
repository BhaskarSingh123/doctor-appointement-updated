import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Navbar = () => {

  const navigate = useNavigate()

  const [showMenu, setShowMenu] = useState(false)
  const { token, setToken, userData, notifications, markNotificationsRead } = useContext(AppContext)
  const [showNotifications, setShowNotifications] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' >
          <li className='py-1'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' >
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' >
          <li className='py-1'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' >
          <li className='py-1'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4 '>
        {
          token && userData
            ? <div className='flex items-center gap-4 z-30'>
                {/* Notification Bell */}
                <div className='relative'>
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
                        <span className='font-semibold text-gray-700'>Notifications</span>
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
                              <p className={`text-sm text-gray-600 ${!item.read ? 'font-medium text-gray-800' : ''}`}>
                                {item.message}
                              </p>
                              <span className='text-[10px] text-gray-400 mt-1 block'>
                                {new Date(item.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile menu */}
                <div className='flex items-center gap-2 cursor-pointer group relative'>
                  <img className='w-8 rounded-full' src={userData.image} alt="" />
                  <img className='w-2.5' src={assets.dropdown_icon} alt="" />
                  <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                    <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                      <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                      <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                      <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                    </div>
                  </div>
                </div>
              </div>
            : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
        }
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden ${showMenu ? 'fixed w-full' : 'h-0 w-0'} right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/doctors' ><p className='px-4 py-2 rounded full inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about' ><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact' ><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Navbar