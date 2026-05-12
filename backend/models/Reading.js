const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    heartRate: Number,
    temperature: Number,
    gsr: Number,
    spo2: Number,          
    stressLevel: String,
    stressScore: Number,
    hrScore: Number,
    gsrScore: Number,
    spo2Score: Number,
    tempScore: Number,
    motion: String,
    isHardware: Boolean,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reading', ReadingSchema);
