const { HabitModel } = require('../models/habit.model');

const createHabit = async (req, res) => {
  try {
    const userId = req.id; 
    const { title, icon, color, schedule, metadata } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });

    const habit = await HabitModel.create({ userId, title, icon, color, schedule, metadata });
    res.status(201).json({ message: 'Habit created', habit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create habit' });
  }
};

const getHabits = async (req, res) => {
  try {
    const userId = req.id;
    const habits = await HabitModel.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ habits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch habits' });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;
    const habit = await HabitModel.findById(id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    if (habit.userId.toString() !== userId.toString()) return res.status(403).json({ message: 'Forbidden' });

    await HabitModel.deleteOne({ _id: id });
    res.status(200).json({ message: 'Habit deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete habit' });
  }
};

const updateHabit = async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;
    const habit = await HabitModel.findById(id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    if (habit.userId.toString() !== userId.toString()) return res.status(403).json({ message: 'Forbidden' });

    const { title, icon, color, schedule, metadata } = req.body;
    if (title !== undefined) habit.title = title;
    if (icon !== undefined) habit.icon = icon;
    if (color !== undefined) habit.color = color;
    if (schedule !== undefined) habit.schedule = schedule;
    if (metadata !== undefined) habit.metadata = metadata;

    await habit.save();
    res.status(200).json({ message: 'Habit updated', habit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update habit' });
  }
};

module.exports = { createHabit, getHabits, deleteHabit, updateHabit };
