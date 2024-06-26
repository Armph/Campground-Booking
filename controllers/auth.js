const User = require('../models/User');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({success: true, token});
}

//@desc    Register user
//@route   POST /api/v1/auth/register
//@access  Public
const register = async (req, res, next) => {
    try {
        const { name, tel, email, password, role } = req.body;

        //Create user
        const user = await User.create({
            name,
            tel,
            email,
            password,
            role
        });

        //Create token
        //const token = user.getSignedJwtToken();

        //res.status(200).json({success: true, token});
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({success: false});
        console.error(err.stack);
    }
}

//@desc    Login user
//@route   POST /api/v1/auth/login
//@access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        //Validate email & password
        if (!email || !password) {
            return res.status(400).json({success: false, msg: 'Please provide email and password'});
        }

        //Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({success: false, msg: 'Invalid credentials'});
        }

        //Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({success: false, msg: 'Invalid credentials'});
        }

        //Create token
        //const token = user.getSignedJwtToken();

        //res.status(200).json({success: true, token});
        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(401).json({success: false, msg: 'Invalid credentials'});
        console.error(err.stack);
    }
}

//@desc    Get current logged in user
//@route   POST /api/v1/auth/me
//@access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({success: true, data: user});
    } catch (err) {
        res.status(400).json({success: false});
        console.error(err.stack);
    }
}

//@desc    Logout user / clear cookie
//@route   GET /api/v1/auth/logout
//@access  Private
const logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({success: true, data: {}});
}

//@desc     Reset password
//@route    POST /api/v1/auth/reset-password
//@access   Public
const resetPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({success: false, msg: 'No user with that email'});
        }

        // Send OTP to the user's email address
        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = otp;
        user.otpExpires = Date.now() + 3 * 60 * 1000; // 3 minutes

        await user.save();

        const transporter = nodemailer.createTransport(smtpTransport({
            host: 'smtp-mail.outlook.com',
            secureConnection: false,
            port: 587,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
            tls: {
                ciphers: 'SSLv3'
            }
        }));

        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Campground Booking: Verification code for password reset',
            html: (
                `<p>Hi,</p>
                <p>Your verification code is <strong>${otp}</strong>.</p>
                <p>Thanks,</p>
                <p>Campground Booking</p>`
            )
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                res.status(400).json({success: false, msg: 'Email could not be sent'});
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json({success: true, data: {otp} });
            }
        });
    } catch (err) {
        res.status(400).json({success: false});
        console.log(err);
    }
}

//@desc    Reset password verification
//@route   POST /api/v1/auth/reset-password/verify
//@access  Public
const resetPasswordVerify = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({success: false, msg: 'No user with that email'});
        }

        if (user.otp !== req.body.otp) {
            return res.status(400).json({success: false, msg: 'Invalid OTP'});
        }

        if (Date.now() > user.otpExpires) {
            return res.status(400).json({success: false, msg: 'OTP has expired'});
        }

        user.password = req.body.password;
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.status(200).json({success: true, msg: 'Password reset successful'});
    } catch (err) {
        res.status(400).json({success: false});
        console.log(err);
    }
}



module.exports = {
    register,
    login,
    getMe,
    logout,
    resetPassword,
    resetPasswordVerify
}
