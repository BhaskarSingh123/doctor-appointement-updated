import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

if (!process.env.GOOGLE_CLIENT_ID) {
    console.warn('⚠️  WARNING: GOOGLE_CLIENT_ID is not set in .env — Google Sign-In will not work!');
} else {
    console.log('✅ Google OAuth Client ID loaded:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
}

// API for Google Sign-In
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            console.log('Google Auth: No credential in request body');
            return res.json({ success: false, message: 'Google credential is required' });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID is not configured in .env');
            return res.json({ success: false, message: 'Google Sign-In is not configured on the server.' });
        }

        console.log('Google Auth: Verifying token...');

        // Verify the Google ID token
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (verifyError) {
            console.error('Google token verification failed:', verifyError.message);
            return res.json({ success: false, message: 'Google authentication failed. Please try signing in again.' });
        }

        const { sub: googleId, email, name, picture } = payload;
        console.log('Google Auth: Token verified for email:', email);

        if (!email) {
            return res.json({ success: false, message: 'Unable to get email from Google account' });
        }

        // Check if user already exists by googleId
        let user = await userModel.findOne({ googleId });

        if (user) {
            // Existing Google user — issue JWT
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }

        // Check if user exists by email (registered via email/password)
        user = await userModel.findOne({ email });

        if (user) {
            // Link Google account to existing email user
            user.googleId = googleId;
            user.isVerified = true;
            if (user.authProvider === 'local') {
                user.authProvider = 'both';
            }
            // Update profile picture if user still has default
            if (picture && user.image && user.image.startsWith('data:image/png;base64,')) {
                user.image = picture;
            }
            await user.save();

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }

        // New user — create account with Google data
        const newUser = new userModel({
            name,
            email,
            googleId,
            authProvider: 'google',
            isVerified: true,
            image: picture || undefined, // Use Google profile pic or fall back to schema default
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });

    } catch (error) {
        console.log('Google Auth Error:', error);

        // Handle specific Google token errors
        if (error.message && error.message.includes('Token used too late')) {
            return res.json({ success: false, message: 'Google token expired. Please try again.' });
        }
        if (error.message && error.message.includes('Invalid token')) {
            return res.json({ success: false, message: 'Invalid Google token. Please try again.' });
        }

        res.json({ success: false, message: error.message });
    }
};

export { googleLogin };
