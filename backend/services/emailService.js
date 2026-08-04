import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log("=================================================");
            console.log(`[MOCK EMAIL SENT]`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content (text): ${text}`);
            console.log("=================================================");
            return { success: true, mock: true };
        }

        const mailOptions = {
            from: `"Prescripto Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`Email sent successfully: ${info.messageId}`)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error: error.message }
    }
}
