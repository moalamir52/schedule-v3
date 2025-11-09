const db = require('../../services/databaseService');
const { buildWeeklySchedule, clearSchedule: clearScheduleLogic } = require('../../services/logicService');

const resetSchedule = async (req, res) => {
  try {
    console.log('[RESET] بدء إعادة تعيين الجدولة...');
    
    // 1. حذف جميع المهام المجدولة
    console.log('[RESET] حذف جميع المهام الحالية...');
    await db.clearAndWriteSchedule([]);
    console.log('[RESET] تم حذف جميع المهام');
    
    // 2. إعادة بناء الجدولة من الصفر
    console.log('[RESET] إعادة بناء الجدولة...');
    const newSchedule = await buildWeeklySchedule();
    console.log(`[RESET] تم إنشاء ${newSchedule.length} مهمة جديدة`);
    
    // 3. حفظ الجدولة الجديدة
    console.log('[RESET] حفظ الجدولة الجديدة...');
    await db.clearAndWriteSchedule(newSchedule);
    console.log('[RESET] تم حفظ الجدولة الجديدة');
    
    res.json({
      success: true,
      message: 'تم إعادة تعيين الجدولة بنجاح',
      tasksCreated: newSchedule.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RESET] خطأ في إعادة التعيين:', error);
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
    console.error('[CLEAR] خطأ في الحذف:', error);
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