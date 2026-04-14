const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  icon: { type: String, default: '🔖' },
  color: { type: String, default: 'bg-indigo-100' },
  schedule: { type: String, default: 'Daily' },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

const HabitModel = mongoose.model('Habit', habitSchema);
module.exports = { HabitModel };
