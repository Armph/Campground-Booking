const mongoose = require('mongoose');

const CampgroundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        match: [
            // xxx-xxx-xxxx
            /^\d{3}-\d{3}-\d{4}$/,
            'Please add a valid telephone number'
        ]
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

CampgroundSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'campground',
    justOne: false
});

module.exports = mongoose.model('Campground', CampgroundSchema);
