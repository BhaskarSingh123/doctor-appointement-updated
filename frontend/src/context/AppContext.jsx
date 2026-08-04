import { createContext, useEffect, useState,useRef } from "react";
import { toast } from "react-toastify";
import axios from 'axios'
import socket from "../socket";

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl=import.meta.env.VITE_BACKEND_URL
    
    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState(false)

    const joinedRef = useRef(false)

    // Getting Doctors using API
    const getDoctosData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const [notifications, setNotifications] = useState([])

    const loadNotifications = async () => {
        try {
            if (!token) return
            const { data } = await axios.get(backendUrl + '/api/user/notifications', { headers: { token } })
            if (data.success) {
                setNotifications(data.notifications)
            }
        } catch (error) {
            console.error("Error loading user notifications:", error)
        }
    }

    const markNotificationsRead = async () => {
        try {
            if (!token) return
            const { data } = await axios.post(backendUrl + '/api/user/notifications/mark-read', {}, { headers: { token } })
            if (data.success) {
                loadNotifications()
            }
        } catch (error) {
            console.error("Error marking user notifications as read:", error)
        }
    }

    useEffect(() => {
        getDoctosData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
            loadNotifications()
        } else {
            setNotifications([])
        }
    }, [token])

    useEffect(() => {

    if (
        userData?._id &&
        !joinedRef.current
    ) {

        socket.emit(
            "join-room",
            `user_${userData._id}`
        )

        console.log(
            `Joined room: user_${userData._id}`
        )

        joinedRef.current = true

    }

    }, [userData])

    useEffect(() => {
        const handleCancelled = (data) => {
            console.log("Socket appointment-cancelled received:", data)
            toast.error(data.message)
            loadNotifications()
        }

        socket.on("appointment-cancelled", handleCancelled)
        return () => {
            socket.off("appointment-cancelled", handleCancelled)
        }
    }, [token])

    useEffect(() => {
        const handleAvailabilityChanged = (data) => {
            console.log("Socket doctor-availability-changed received:", data)
            toast.info(data.message)
            getDoctosData()
        }

        socket.on("doctor-availability-changed", handleAvailabilityChanged)
        return () => {
            socket.off("doctor-availability-changed", handleAvailabilityChanged)
        }
    }, [])

    const value = {
        doctors, getDoctosData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,
        notifications, loadNotifications, markNotificationsRead
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider