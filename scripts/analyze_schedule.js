const fs = require('fs');
const path = require('path');
async function loadSchedule() {
  // Try to find latest schedule file in debug-output directory
  const debugDir = path.resolve(__dirname, '../debug-output');
  let files = [];
  try {
    files = fs.readdirSync(debugDir)
      .filter(f => f.startsWith('schedule-current-') && f.endsWith('.json'))
      .map(f => path.resolve(debugDir, f));
  } catch (e) {
    files = [];
  }
  if (files && files.length > 0) {
    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    const file = files[0];
    let raw = fs.readFileSync(file, 'utf8');
    raw = raw.replace(/^\uFEFF/, '');
    const firstBrace = raw.indexOf('{');
    if (firstBrace > 0) raw = raw.slice(firstBrace);
    const lastBrace = raw.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < raw.length - 1) raw = raw.slice(0, lastBrace + 1);
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse schedule file:', e.message);
      process.exit(2);
    }
  }

  // If no file, try to fetch from local server
  try {
    const res = await fetch('http://localhost:5000/api/schedule');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    return j;
  } catch (e) {
    console.error('No schedule file found and failed to fetch from server:', e.message);
    process.exit(2);
  }
}

async function main() {
  const data = await loadSchedule();
  const assignments = data.assignments || [];

  const slotWorkers = {}; // slotKey -> workerId -> set of customerIds
  const slotCustomers = {}; // slotKey -> customerId -> set of workerIds

  for (const a of assignments) {
    const slot = `${a.appointmentDate}||${a.time}`;
    const wid = (a.workerId || '').toString();
    const cid = (a.customerId || '').toString();
    const villa = a.villa || '';

    slotWorkers[slot] = slotWorkers[slot] || {};
    slotWorkers[slot][wid] = slotWorkers[slot][wid] || new Set();
    slotWorkers[slot][wid].add(cid + '::' + villa);

    slotCustomers[slot] = slotCustomers[slot] || {};
    slotCustomers[slot][cid] = slotCustomers[slot][cid] || new Set();
    slotCustomers[slot][cid].add(wid);
  }

  const workerConflicts = [];
  const customerConflicts = [];

  for (const slot of Object.keys(slotWorkers)) {
    for (const wid of Object.keys(slotWorkers[slot])) {
      const customers = Array.from(slotWorkers[slot][wid]);
      // If worker has assignments for more than one distinct customer (customerId part differs), flag
      const uniqueCustomerIds = new Set(customers.map(x => x.split('::')[0]));
      if (uniqueCustomerIds.size > 1) {
        workerConflicts.push({ slot, workerId: wid, assignments: customers.slice(0,10) });
      }
    }
  }

  for (const slot of Object.keys(slotCustomers)) {
    for (const cid of Object.keys(slotCustomers[slot])) {
      const wids = Array.from(slotCustomers[slot][cid]);
      // If customer has assignments from more than one worker at same slot, flag
      const uniqueWorkers = new Set(wids);
      if (uniqueWorkers.size > 1) {
        customerConflicts.push({ slot, customerId: cid, workers: wids });
      }
    }
  }

  console.log('Total assignments:', assignments.length);
  console.log('Total unique slots:', Object.keys(slotWorkers).length);
  console.log('Worker double-booking conflicts (worker assigned to multiple different customers at same slot):', workerConflicts.length);
  console.log('Customer multi-worker conflicts (customer assigned >1 worker at same slot):', customerConflicts.length);

  if (workerConflicts.length > 0) {
    console.log('\nExamples of worker conflicts (first 20):');
    workerConflicts.slice(0,20).forEach((c, i) => {
      console.log(i+1, c.slot, 'workerId=', c.workerId, 'assignments=', c.assignments);
    });
  }

  if (customerConflicts.length > 0) {
    console.log('\nExamples of customer conflicts (first 20):');
    customerConflicts.slice(0,20).forEach((c, i) => {
      console.log(i+1, c.slot, 'customerId=', c.customerId, 'workers=', c.workers);
    });
  }

  // Also print per-worker totals
  const perWorker = {};
  for (const a of assignments) {
    const wid = (a.workerId || '').toString();
    perWorker[wid] = (perWorker[wid] || 0) + 1;
  }
  console.log('\nPer-worker assignment counts from schedule:');
  Object.keys(perWorker).sort().forEach(w => console.log(w, perWorker[w]));

  // Save a small report file
  const report = { totalAssignments: assignments.length, totalSlots: Object.keys(slotWorkers).length, workerConflicts: workerConflicts.slice(0,100), customerConflicts: customerConflicts.slice(0,100), perWorker };
  fs.writeFileSync(path.resolve(__dirname,'../debug-output/schedule-analysis-20251025-113049.json'), JSON.stringify(report, null, 2));
  console.log('\nSaved report to debug-output/schedule-analysis-20251025-113049.json');
}

main().catch(e => { console.error(e); process.exit(2); });

