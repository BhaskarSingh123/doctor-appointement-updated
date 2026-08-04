import Notification from "../models/notificationModel.js"
import { getIO } from "../socket.js"
import { sendEmail } from "./emailService.js"

export const sendBookingNotification = async (appointment) => {
    try {
        const { userId, docId, slotDate, slotTime, userData, docData } = appointment
        const formattedDate = slotDate ? slotDate.split('_').join('/') : ''

        const doctorName = docData.name
        const patientName = userData.name
        const patientEmail = userData.email
        const doctorEmail = docData.email

        const messageForDoctor = `New appointment booked by ${patientName} on ${formattedDate} at ${slotTime}`
        const messageForAdmin = `New booking: ${patientName} with Dr. ${doctorName} on ${formattedDate} at ${slotTime}`

        // 1. Create DB Notifications
        await Notification.create([
            { userId: docId, message: messageForDoctor },
            { userId: 'admin', message: messageForAdmin }
        ])

        // 2. Emit Socket events
        try {
            const io = getIO()
            io.to(`doctor_${docId}`).emit("new-appointment", { message: messageForDoctor })
            io.to("admin").emit("new-appointment", { message: messageForAdmin })
        } catch (socketError) {
            console.error("Socket emit failed in sendBookingNotification:", socketError.message)
        }

        // 3. Send Email notifications
        // User (Patient) Email
        const userSubject = `Appointment Confirmed - Dr. ${doctorName}`
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #5f6FFF; text-align: center;">Prescripto Appointment Confirmed</h2>
                <p>Dear <strong>${patientName}</strong>,</p>
                <p>Your appointment has been successfully booked with <strong>Dr. ${doctorName}</strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <h3>Appointment Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0; color: #666; width: 100px;">Doctor:</td><td><strong>Dr. ${doctorName} (${docData.speciality})</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Date:</td><td><strong>${formattedDate}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Time:</td><td><strong>${slotTime}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Fee:</td><td><strong>INR ${appointment.amount}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Address:</td><td><strong>${docData.address.line1}, ${docData.address.line2}</strong></td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999; text-align: center;">Thank you for using Prescripto!</p>
            </div>
        `
        const userText = `Dear ${patientName}, your appointment is confirmed with Dr. ${doctorName} on ${formattedDate} at ${slotTime}. Clinic Address: ${docData.address.line1}, ${docData.address.line2}.`
        sendEmail({ to: patientEmail, subject: userSubject, html: userHtml, text: userText })

        // Doctor Email
        const docSubject = `New Appointment Booked - ${patientName}`
        const docHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #5f6FFF; text-align: center;">New Booking Alert</h2>
                <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
                <p>A new appointment has been booked by patient <strong>${patientName}</strong>.</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <h3>Booking Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0; color: #666; width: 120px;">Patient Name:</td><td><strong>${patientName}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Gender:</td><td><strong>${userData.gender || 'Not specified'}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">DOB:</td><td><strong>${userData.dob || 'Not specified'}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Date:</td><td><strong>${formattedDate}</strong></td></tr>
                    <tr><td style="padding: 5px 0; color: #666;">Time:</td><td><strong>${slotTime}</strong></td></tr>
                </table>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999; text-align: center;">Prescripto Doctor Portal</p>
            </div>
        `
        const docText = `Dear Dr. ${doctorName}, a new appointment has been booked by ${patientName} on ${formattedDate} at ${slotTime}.`
        sendEmail({ to: doctorEmail, subject: docSubject, html: docHtml, text: docText })

    } catch (error) {
        console.error("Error sending booking notification:", error)
    }
}

export const sendCancellationNotification = async (appointment, cancelledBy) => {
    try {
        const { userId, docId, slotDate, slotTime, userData, docData } = appointment
        const formattedDate = slotDate ? slotDate.split('_').join('/') : ''

        const doctorName = docData.name
        const patientName = userData.name
        const patientEmail = userData.email
        const doctorEmail = docData.email

        let messageForUser = ""
        let messageForDoctor = ""
        let messageForAdmin = ""

        if (cancelledBy === 'user') {
            messageForDoctor = `Appointment on ${formattedDate} at ${slotTime} cancelled by patient ${patientName}`
            messageForAdmin = `Cancelled by user: ${patientName} with Dr. ${doctorName} on ${formattedDate} at ${slotTime}`
            messageForUser = `Your appointment with Dr. ${doctorName} has been successfully cancelled`
        } else if (cancelledBy === 'doctor') {
            messageForUser = `Dr. ${doctorName} has cancelled your appointment scheduled on ${formattedDate} at ${slotTime}`
            messageForAdmin = `Cancelled by doctor: Dr. ${doctorName} with ${patientName} on ${formattedDate} at ${slotTime}`
            messageForDoctor = `Your appointment with ${patientName} has been cancelled`
        } else if (cancelledBy === 'admin') {
            messageForUser = `Your appointment with Dr. ${doctorName} has been cancelled by Admin`
            messageForDoctor = `Your appointment with ${patientName} has been cancelled by Admin`
            messageForAdmin = `Cancelled by Admin: ${patientName} with Dr. ${doctorName} on ${formattedDate} at ${slotTime}`
        }

        // 1. Create DB Notifications
        const dbNotifications = []
        if (cancelledBy !== 'user') {
            dbNotifications.push({ userId, message: messageForUser })
        }
        if (cancelledBy !== 'doctor') {
            dbNotifications.push({ userId: docId, message: messageForDoctor })
        }
        dbNotifications.push({ userId: 'admin', message: messageForAdmin })
        
        await Notification.create(dbNotifications)

        // 2. Emit Socket events
        try {
            const io = getIO()
            if (cancelledBy !== 'user') {
                io.to(`user_${userId}`).emit("appointment-cancelled", { message: messageForUser })
            }
            if (cancelledBy !== 'doctor') {
                io.to(`doctor_${docId}`).emit("appointment-cancelled", { message: messageForDoctor })
            }
            io.to("admin").emit("appointment-cancelled", { message: messageForAdmin })
        } catch (socketError) {
            console.error("Socket emit failed in sendCancellationNotification:", socketError.message)
        }

        // 3. Send Emails
        // User Email
        const userSubject = `Appointment Cancelled - Dr. ${doctorName}`
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #FF5F5F; text-align: center;">Appointment Cancelled</h2>
                <p>Dear <strong>${patientName}</strong>,</p>
                <p>Please be informed that the appointment booked with <strong>Dr. ${doctorName}</strong> on <strong>${formattedDate}</strong> at <strong>${slotTime}</strong> has been cancelled.</p>
                <p>Cancelled by: <strong>${cancelledBy === 'user' ? 'You' : cancelledBy === 'doctor' ? 'Doctor' : 'Admin'}</strong></p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999; text-align: center;">If you have any questions, please contact support.</p>
            </div>
        `
        const userText = `Dear ${patientName}, your appointment with Dr. ${doctorName} on ${formattedDate} at ${slotTime} has been cancelled by ${cancelledBy}.`
        sendEmail({ to: patientEmail, subject: userSubject, html: userHtml, text: userText })

        // Doctor Email
        const docSubject = `Appointment Cancelled - ${patientName}`
        const docHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h2 style="color: #FF5F5F; text-align: center;">Appointment Cancelled</h2>
                <p>Dear <strong>Dr. ${doctorName}</strong>,</p>
                <p>Please be informed that the appointment for patient <strong>${patientName}</strong> on <strong>${formattedDate}</strong> at <strong>${slotTime}</strong> has been cancelled.</p>
                <p>Cancelled by: <strong>${cancelledBy === 'user' ? 'Patient' : cancelledBy === 'doctor' ? 'You' : 'Admin'}</strong></p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999; text-align: center;">Prescripto Doctor Portal</p>
            </div>
        `
        const docText = `Dear Dr. ${doctorName}, the appointment with ${patientName} on ${formattedDate} at ${slotTime} has been cancelled by ${cancelledBy}.`
        sendEmail({ to: doctorEmail, subject: docSubject, html: docHtml, text: docText })

    } catch (error) {
        console.error("Error sending cancellation notification:", error)
    }
}
