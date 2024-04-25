const Booking = require('../models/Booking');
const Campground = require('../models/Campground');

// @desc       Get all bookings
// @route      GET /api/v1/bookings
// @access     Private
const getBookings = async (req, res, next) => {
    let query;

    if (req.user.role !== 'admin') {
        query = Booking.find({ user: req.user.id }).populate({
            path: 'campground',
            select: 'name address tel'
        });
    } else {
        if (req.params.campgroundId) {
            console.log(req.params.campgroundId);
            query = Booking.find({ campground: req.params.campgroundId }).populate({
                path: 'campground',
                select: 'name address tel'
            });
        } else {
            query = Booking.find().populate({
                path: 'campground',
                select: 'name address tel'
            });
        }
    }

    try {
        const bookings = await query;
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't find bookings"});
    }
}

// @desc       Get single booking
// @route      GET /api/v1/bookings/:id
// @access     Public
const getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: 'campground',
            select: 'name description tel'
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}`});
        }

        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't find booking"});
    }
}

// @desc       Add single booking
// @route      POST /api/v1/campgrounds/:campgroundId/bookings
// @access     Private
const addBooking = async (req, res, next) => {
    req.body.campground = req.params.campgroundId;
    req.body.user = req.user.id;

    const campground = await Campground.findById(req.params.campgroundId);

    if (!campground) {
        return res.status(404).json({ success: false, message: `No campground with the id of ${req.params.campgroundId}`});
    }

    try {
        if (req.body.numberOfNights > 3) {
            return res.status(400).json({ success: false, message: "Number of nights can't exceed 3"});
        }
        if (req.body.numberOfNights < 1) {
            return res.status(400).json({ success: false, message: "Number of nights can't be less than 1"});
        }
        if (req.body.bookingDate < Date.now()) {
            return res.status(400).json({ success: false, message: "Booking date can't be in the past"});
        }

        const booking = await Booking.create(req.body);
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't create booking"});
    }
}

// @desc       Update single booking
// @route      PUT /api/v1/bookings/:id
// @access     Private
const updateBooking = async (req, res, next) => {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
        return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}`});
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update booking ${booking._id}`});
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: booking });
}

// @desc       Delete single booking
// @route      DELETE /api/v1/bookings/:id
// @access     Private
const deleteBooking = async (req, res, next) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}`});
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete booking ${booking._id}`});
    }

    await booking.deleteOne();

    res.status(200).json({ success: true, data: {} });
}

module.exports = {
    getBookings,
    getBooking,
    addBooking,
    updateBooking,
    deleteBooking
}
