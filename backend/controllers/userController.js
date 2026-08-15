import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Notification from "../models/notificationModel.js"
import { getIO } from "../socket.js"
import { sendBookingNotification, sendCancellationNotification } from "../services/notificationService.js"
import { sendEmail } from "../services/emailService.js"
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import razorpay from 'razorpay';



// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Helper to generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // check if email already exists
        const existingUser = await userModel.findOne({ email })
        if (existingUser && existingUser.isVerified) {
            return res.json({ success: false, message: "Email already registered" })
        }

        // If an unverified user exists with the same email, delete it so they can re-register
        if (existingUser && !existingUser.isVerified) {
            await userModel.findByIdAndDelete(existingUser._id)
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // Generate OTP and set 10-minute expiry
        const otp = generateOtp()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        const userData = {
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            otp,
            otpExpiry,
            otpAttempts: 0,
        }

        const newUser = new userModel(userData)
        await newUser.save()

        // Send OTP email
        await sendEmail({
            to: email,
            subject: 'Prescripto — Verify Your Email',
            text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="color: #1a1a2e; margin-bottom: 8px;">Welcome to Prescripto!</h2>
                    <p style="color: #555; font-size: 15px;">Please use the following code to verify your email address:</p>
                    <div style="background: #5f6fff; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        ${otp}
                    </div>
                    <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
                </div>
            `
        })

        res.json({ success: true, requiresVerification: true, email })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.json({ success: false, message: 'Email and OTP are required' })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (user.isVerified) {
            return res.json({ success: false, message: 'Email is already verified' })
        }

        // Check if OTP has expired
        if (new Date() > user.otpExpiry) {
            return res.json({ success: false, message: 'OTP has expired. Please request a new one.' })
        }

        // Check attempt limit
        if (user.otpAttempts >= 5) {
            return res.json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' })
        }

        // Check OTP match
        if (user.otp !== otp) {
            await userModel.findByIdAndUpdate(user._id, { $inc: { otpAttempts: 1 } })
            const remaining = 4 - user.otpAttempts
            return res.json({ success: false, message: `Invalid OTP. ${remaining > 0 ? remaining : 0} attempts remaining.` })
        }

        // OTP is correct — verify the user
        await userModel.findByIdAndUpdate(user._id, {
            isVerified: true,
            otp: '',
            otpExpiry: null,
            otpAttempts: 0,
        })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to resend OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: 'Email is required' })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (user.isVerified) {
            return res.json({ success: false, message: 'Email is already verified' })
        }

        // Rate limit: check if last OTP was sent less than 60 seconds ago
        if (user.otpExpiry) {
            const timeSinceLastOtp = Date.now() - (user.otpExpiry.getTime() - 10 * 60 * 1000)
            if (timeSinceLastOtp < 60 * 1000) {
                const waitSeconds = Math.ceil((60 * 1000 - timeSinceLastOtp) / 1000)
                return res.json({ success: false, message: `Please wait ${waitSeconds} seconds before requesting a new OTP.` })
            }
        }

        // Generate new OTP
        const otp = generateOtp()
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

        await userModel.findByIdAndUpdate(user._id, {
            otp,
            otpExpiry,
            otpAttempts: 0,
        })

        // Send OTP email
        await sendEmail({
            to: email,
            subject: 'Prescripto — Your New Verification Code',
            text: `Your new verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="color: #1a1a2e; margin-bottom: 8px;">New Verification Code</h2>
                    <p style="color: #555; font-size: 15px;">Here is your new verification code:</p>
                    <div style="background: #5f6fff; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        ${otp}
                    </div>
                    <p style="color: #888; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
                </div>
            `
        })

        res.json({ success: true, message: 'A new OTP has been sent to your email.' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        // Block unverified users from logging in
        if (!user.isVerified) {
            return res.json({ success: false, message: "Please verify your email first. Check your inbox for the OTP." })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // Send Booking Notification (DB + Sockets + Email)
        await sendBookingNotification(newAppointment)

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        // Send Cancellation Notification (DB + Sockets + Email)
        const updatedAppointment = await appointmentModel.findById(appointmentId)
        await sendCancellationNotification(updatedAppointment, 'user')

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        // creating options for razorpay payment
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({ success: true, order })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })
            res.json({ success: true, message: "Payment Successful" })
        }
        else {
            res.json({ success: false, message: 'Payment Failed' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    verifyOtp,
    resendOtp,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
}