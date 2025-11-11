const db = require('../../services/databaseService');
const { buildWeeklySchedule, clearSchedule: clearScheduleLogic } = require('../../services/logicService');

const resetSchedule = async (req, res) => {
  try {
    // 1. حذف جميع المهام المجدولة
    await db.clearAndWriteSchedule([]);
    // 2. إعادة بناء الجدولة من الصفر
    const newSchedule = await buildWeeklySchedule();
    // 3. حفظ الجدولة الجديدة
    await db.clearAndWriteSchedule(newSchedule);
    res.json({
      success: true,
      message: 'تم إعادة تعيين الجدولة بنجاح',
      tasksCreated: newSchedule.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة تعيين الجدولة',
      details: error.message
    });
  }
};

const clearSchedule = async (req, res) => {
  try {
    await clearScheduleLogic();
    
    res.json({
      success: true,
      message: 'تم حذف جميع المهام بنجاح',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في حذف المهام',
      details: error.message
    });
  }
};

module.exports = {
  resetSchedule,
  clearSchedule
};