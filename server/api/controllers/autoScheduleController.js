const { autoAssignSchedule } = require('./assignmentController');
const db = require('../../services/databaseService');

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

// Smart Auto-Schedule - يحافظ على العملاء المحميين
const smartAutoSchedule = async (req, res) => {
  try {
    const { weekOffset } = req.params;
    const targetWeekOffset = parseInt(weekOffset) || 0;
    
    console.log(`[SMART-SCHEDULE] Starting smart schedule for week offset: ${targetWeekOffset}`);
    
    // Get all customers to check protection status
    const customers = await db.getCustomers();
    const protectedCustomers = customers.filter(c => c.isLocked === 'TRUE');
    const unprotectedCustomers = customers.filter(c => c.isLocked !== 'TRUE');
    
    console.log(`[SMART-SCHEDULE] Protected customers: ${protectedCustomers.length}`);
    console.log(`[SMART-SCHEDULE] Unprotected customers: ${unprotectedCustomers.length}`);
    
    // Generate schedule only for unprotected customers
    const mockReq = {
      params: { weekOffset: targetWeekOffset.toString() },
      body: { 
        showAllSlots: req.body.showAllSlots || false,
        smartMode: true,
        excludeCustomers: protectedCustomers.map(c => c.CustomerID)
      }
    };
    
    let generatedData = null;
    const mockRes = {
      json: (data) => {
        generatedData = data;
        return data;
      },
      status: (code) => ({
        json: (data) => {
          throw new Error(data.error || 'Generation failed');
        }
      })
    };
    
    await autoAssignSchedule(mockReq, mockRes);
    
    res.json({
      success: true,
      message: 'Smart Auto-Schedule completed',
      assignments: generatedData?.assignments || [],
      protectedCount: protectedCustomers.length,
      rescheduledCount: unprotectedCustomers.length
    });
    
  } catch (error) {
    console.error('[SMART-SCHEDULE] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Force Reset All - يمسح كل الحماية ويبدأ من جديد
const forceResetAll = async (req, res) => {
  try {
    const { weekOffset } = req.params;
    const targetWeekOffset = parseInt(weekOffset) || 0;
    
    console.log(`[FORCE-RESET] Starting force reset for week offset: ${targetWeekOffset}`);
    
    // Get all customers and reset their protection flags
    const customers = await db.getCustomers();
    const protectedCustomers = customers.filter(c => c.isLocked === 'TRUE');
    
    console.log(`[FORCE-RESET] Resetting protection for ${protectedCustomers.length} customers`);
    
    // Reset all protection flags
    for (const customer of protectedCustomers) {
      await db.updateCustomer(customer.CustomerID, { isLocked: 'FALSE' });
    }
    
    console.log(`[FORCE-RESET] All protection flags reset`);
    
    // Generate new schedule for all customers
    const mockReq = {
      params: { weekOffset: targetWeekOffset.toString() },
      body: { 
        showAllSlots: req.body.showAllSlots || false,
        forceReset: true
      }
    };
    
    let generatedData = null;
    const mockRes = {
      json: (data) => {
        generatedData = data;
        return data;
      },
      status: (code) => ({
        json: (data) => {
          throw new Error(data.error || 'Generation failed');
        }
      })
    };
    
    await autoAssignSchedule(mockReq, mockRes);
    
    res.json({
      success: true,
      message: 'Force Reset completed - all clients rescheduled',
      assignments: generatedData?.assignments || [],
      resetCount: protectedCustomers.length
    });
    
  } catch (error) {
    console.error('[FORCE-RESET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const forceGenerateWeek = async (req, res) => {
  try {
    const { weekOffset } = req.body;
    const targetWeekOffset = parseInt(weekOffset) || 0;
    
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

module.exports = { checkAndGenerateNewWeek, forceGenerateWeek, smartAutoSchedule, forceResetAll };