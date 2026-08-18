import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// API for Google Sign-In
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.json({ success: false, message: 'Google credential is required' });
        }

        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

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

        res.json({ success: false, message: 'Google authentication failed. Please try again.' });
    }
};

export { googleLogin };
