const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: [true, 'Please add a booking date']
    },
    numberOfNights: {
        type: Number,
        required: [true, 'Please add the number of nights']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    campground: {
        type: mongoose.Schema.ObjectId,
        ref: 'Campground',
        required: true
    },
});

module.exports = mongoose.model('Booking', BookingSchema);
