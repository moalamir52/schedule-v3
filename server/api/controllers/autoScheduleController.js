const { autoAssignSchedule } = require('./assignmentController');

const checkAndGenerateNewWeek = async (req, res) => {
  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    // Disabled automatic generation - only check status
    res.json({
      success: true,
      message: 'Auto-generation disabled - use manual Auto button',
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay],
      currentWeekStatus: 'Manual control enabled'
    });
    
  } catch (error) {
    console.error('[AUTO-SCHEDULE] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const forceGenerateWeek = async (req, res) => {
  try {
    const { weekOffset } = req.body;
    const targetWeekOffset = parseInt(weekOffset) || 1;
    
    console.log(`[FORCE-GENERATE] Generating schedule for week offset: ${targetWeekOffset}`);
    
    // Generate schedule for specified week
    const mockReq = {
      params: { weekOffset: targetWeekOffset.toString() },
      body: { showAllSlots: false }
    };
    
    let generatedData = null;
    const mockRes = {
      json: (data) => {
        generatedData = data;
        console.log('[FORCE-GENERATE] Generated schedule:', data.message);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.error('[FORCE-GENERATE] Error:', data);
          throw new Error(data.error || 'Generation failed');
        }
      })
    };
    
    await autoAssignSchedule(mockReq, mockRes);
    
    res.json({
      success: true,
      message: `Schedule generated for week ${targetWeekOffset > 0 ? '+' : ''}${targetWeekOffset}`,
      weekOffset: targetWeekOffset,
      generatedData: generatedData
    });
    
  } catch (error) {
    console.error('[FORCE-GENERATE] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { checkAndGenerateNewWeek, forceGenerateWeek };