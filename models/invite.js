const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }, // Correct reference
    code: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
});

const Invite = mongoose.model('Invite', inviteSchema);
module.exports = Invite;