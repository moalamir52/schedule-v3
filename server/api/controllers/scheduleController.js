const { buildWeeklySchedule } = require('../../services/logicService');

async function getWeeklySchedule(req, res) {
  try {
    const schedule = await buildWeeklySchedule();
    res.status(200).json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  getWeeklySchedule
};