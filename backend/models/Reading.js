const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    heartRate: Number,
    temperature: Number,
    gsr: Number,
    spo2: Number,          // <--- ADD THIS LINE
    stressLevel: String,
    motion: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reading', ReadingSchema);