const express = require('express');
const router = express.Router();
const db = require('../../services/databaseService');
const logicService = require('../../services/logicService');

// GET /api/customer/:id/profile
router.get('/:id/profile', async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Get customer data
    const allCustomers = await db.getCustomers();
    const customer = allCustomers.find(c => c.CustomerID === customerId);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get all history for this customer's car plates
    const allHistory = await db.getAllHistory();
    const customerCarPlates = customer.CarPlates ? customer.CarPlates.split(',').map(plate => plate.trim()) : [];
    const fullHistory = allHistory
      .filter(record => customerCarPlates.includes(record.CarPlate))
      .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));

    // Get this week's schedule for this customer
    const scheduledTasks = await db.getScheduledTasks();
    const thisWeekSchedule = scheduledTasks
      .filter(task => task.CustomerID === customerId)
      .sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return dayOrder.indexOf(a.Day) - dayOrder.indexOf(b.Day);
      });

    // Get billing/invoices for this customer
    const allInvoices = await db.getInvoices();
    const billing = allInvoices
      .filter(invoice => invoice.CustomerID === customerId)
      .sort((a, b) => new Date(b.InvoiceDate) - new Date(a.InvoiceDate));

    // Calculate this week's schedule using logic service
    let calculatedSchedule = [];
    try {
      // Get the schedule calculation for this specific customer
      if (customer.CarPlates && customer.Days && customer.Washman_Package) {
        const carPlates = customer.CarPlates.split(',').map(plate => plate.trim());
        
        for (const carPlate of carPlates) {
          const history = allHistory
            .filter(record => record.CarPlate === carPlate)
            .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
          
          // Use the calculateWashSchedule function from logicService
          if (typeof logicService.calculateWashSchedule === 'function') {
            const washSchedule = logicService.calculateWashSchedule(
              customer, 
              carPlate, 
              carPlates, 
              history, 
              allHistory, 
              0 // current week
            );
            calculatedSchedule.push(...washSchedule);
          }
        }
      }
    } catch (error) {
      console.log('Could not calculate schedule:', error.message);
      // Fall back to scheduled tasks if calculation fails
      calculatedSchedule = thisWeekSchedule;
    }

    // Prepare response data
    const responseData = {
      customer: {
        CustomerID: customer.CustomerID,
        CustomerName: customer.CustomerName || customer.Name,
        Villa: customer.Villa,
        Status: customer.Status,
        Washman_Package: customer.Washman_Package,
        Days: customer.Days,
        Time: customer.Time,
        Notes: customer.Notes,
        CarPlates: customer.CarPlates
      },
      thisWeekSchedule: calculatedSchedule.length > 0 ? calculatedSchedule.map(schedule => ({
        Day: schedule.washDay || schedule.Day,
        Time: schedule.washTime || schedule.Time,
        CarPlate: schedule.carPlate || schedule.CarPlate,
        WashType: schedule.washType || schedule.WashType,
        WorkerName: schedule.workerName || schedule.WorkerName
      })) : thisWeekSchedule,
      fullHistory: fullHistory.map(record => ({
        WashDate: record.WashDate,
        Day: record.Day,
        WashType: record.WashType,
        CarPlate: record.CarPlate
      })),
      billing: billing.map(invoice => ({
        Ref: invoice.Ref,
        InvoiceDate: invoice.InvoiceDate,
        TotalAmount: invoice.TotalAmount,
        Currency: invoice.Currency || 'AED',
        Status: invoice.Status
      }))
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;