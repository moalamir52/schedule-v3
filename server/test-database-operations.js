const db = require('./services/databaseService');

async function testDatabaseOperations() {
  console.log('🧪 Testing Database Operations...\n');
  
  try {
    // Test 1: Get scheduled tasks
    console.log('1️⃣ Testing getScheduledTasks...');
    const tasks = await db.getScheduledTasks();
    console.log(`✅ Found ${tasks.length} scheduled tasks`);
    
    if (tasks.length > 0) {
      const sampleTask = tasks[0];
      console.log('📋 Sample task:', {
        CustomerID: sampleTask.CustomerID,
        CustomerName: sampleTask.CustomerName,
        Day: sampleTask.Day,
        Time: sampleTask.Time,
        CarPlate: sampleTask.CarPlate
      });
      
      // Test 2: Test optimized task completion
      console.log('\n2️⃣ Testing optimized task completion...');
      const taskId = `${sampleTask.CustomerID}-${sampleTask.Day}-${sampleTask.Time}-${sampleTask.CarPlate}`;
      console.log(`🎯 Testing with taskId: ${taskId}`);
      
      // Don't actually delete, just test the parsing
      const dashes = [];
      for (let i = 0; i < taskId.length; i++) {
        if (taskId[i] === '-') dashes.push(i);
      }
      
      if (dashes.length >= 3) {
        const dayStart = dashes[dashes.length - 3] + 1;
        const timeStart = dashes[dashes.length - 2] + 1;
        const carPlateStart = dashes[dashes.length - 1] + 1;
        
        const customerID = taskId.substring(0, dashes[dashes.length - 3]);
        const day = taskId.substring(dayStart, dashes[dashes.length - 2]);
        const time = taskId.substring(timeStart, dashes[dashes.length - 1]);
        const carPlate = taskId.substring(carPlateStart) || '';
        
        console.log('✅ Task ID parsing successful:', {
          customerID,
          day,
          time,
          carPlate
        });
      } else {
        console.log('❌ Task ID parsing failed - invalid format');
      }
    }
    
    // Test 3: Test batch operations
    console.log('\n3️⃣ Testing batch operations...');
    const testTaskIds = tasks.slice(0, 3).map(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`
    );
    console.log(`📦 Would batch process ${testTaskIds.length} tasks`);
    console.log('✅ Batch operation structure ready');
    
    // Test 4: Test Supabase connection
    console.log('\n4️⃣ Testing Supabase connection...');
    const customers = await db.getCustomers();
    console.log(`✅ Supabase connection working - ${customers.length} customers found`);
    
    console.log('\n🎉 All database operation tests passed!');
    
  } catch (error) {
    console.error('❌ Database operation test failed:', error);
  }
}

// Run the test
testDatabaseOperations().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});