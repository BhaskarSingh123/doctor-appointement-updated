import Notification from "../models/notificationModel.js"

// User (patient) notifications
export const getUserNotifications = async (req, res) => {
   try {
      const { userId } = req.body
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 })
      res.json({ success: true, notifications })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

export const markUserNotificationsRead = async (req, res) => {
   try {
      const { userId } = req.body
      await Notification.updateMany({ userId }, { read: true })
      res.json({ success: true, message: "Notifications marked as read" })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

// Doctor notifications
export const getDoctorNotifications = async (req, res) => {
   try {
      const { docId } = req.body
      const notifications = await Notification.find({ userId: docId }).sort({ createdAt: -1 })
      res.json({ success: true, notifications })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

export const markDoctorNotificationsRead = async (req, res) => {
   try {
      const { docId } = req.body
      await Notification.updateMany({ userId: docId }, { read: true })
      res.json({ success: true, message: "Notifications marked as read" })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

// Admin notifications
export const getAdminNotifications = async (req, res) => {
   try {
      const notifications = await Notification.find({ userId: "admin" }).sort({ createdAt: -1 })
      res.json({ success: true, notifications })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

export const markAdminNotificationsRead = async (req, res) => {
   try {
      await Notification.updateMany({ userId: "admin" }, { read: true })
      res.json({ success: true, message: "Notifications marked as read" })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}

export const getNotifications = async (req, res) => {
   try {
      const notifications = await Notification.find().sort({ createdAt: -1 })
      res.json({ success: true, notifications })
   } catch (error) {
      console.log(error)
      res.json({ success: false, message: error.message })
   }
}