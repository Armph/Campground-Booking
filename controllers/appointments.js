const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

// @desc       Get all appointment
// @route      GET /api/v1/appointments
// @access     Private
const getAppointments = async (req, res, next) => {
    let query;

    if (req.user.role !== 'admin') {
        query = Appointment.find({ user: req.user.id }).populate({
            path: 'hospital',
            select: 'name province tel'
        });
    } else {
        if (req.params.hospitalId) {
            console.log(req.params.hospitalId);
            query = Appointment.find({ hospital: req.params.hospitalId }).populate({
                path: 'hospital',
                select: 'name province tel'
            });
        } else {
            query = Appointment.find().populate({
                path: 'hospital',
                select: 'name province tel'
            });
        }
    }

    try {
        const appointments = await query;
        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't find appointments"});
    }
}

// @desc       Get single appointment
// @route      GET /api/v1/appointments/:id
// @access     Public
const getAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'hospital',
            select: 'name description tel'
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}`});
        }

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't find appointment"});
    }
}

// @desc       Add single appointment
// @route      POST /api/v1/hospitals/:hospitalId/appointments
// @access     Private
const addAppointment = async (req, res, next) => {
    try {
        req.body.hospital = req.params.hospitalId;
        const hospital = await Hospital.findById(req.params.hospitalId);

        if (!hospital) {
            return res.status(404).json({ success: false, message: `No hospital with the id of ${req.params.hospitalId}`});
        }

        // Add user Id to request body
        req.body.user = req.user.id;

        // Check for existing appointment
        const existedAppointments = await Appointment.find({ user: req.user.id });

        // If the user is not an admin, they can only create 3 appointments
        if (existedAppointments.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already created 3 appointments`});
        }

        const appointment = await Appointment.create(req.body);
        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't add appointment"});
    }
}

// @desc       Update appointment
// @route      PUT /api/v1/appointments/:id
// @access     Private
const updateAppointment = async (req, res, next) => {
    try {
        var appointment = await Appointment.findByIdAndUpdate(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}`});
        }

        // Make sure user is the appointment owner
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this appointment`});
        }

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: appointment });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't update appointment"});
    }
}

// @desc       Delete appointment
// @route      DELETE /api/v1/appointments/:id
// @access     Private
const deleteAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ success: false, message: `No appointment with the id of ${req.params.id}`});
        }

        // Make sure user is the appointment owner
        if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this appointment`});
        }

        await appointment.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Can't delete appointment"});
    }
}

module.exports = { getAppointments, getAppointment, addAppointment, updateAppointment, deleteAppointment };