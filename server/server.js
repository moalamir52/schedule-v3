require('dotenv').config();
const express = require('express');
const cors = require('cors');

const scheduleRoutes = require('./api/routes/scheduleRoutes');
const clientRoutes = require('./api/routes/clientRoutes');
const authRoutes = require('./api/routes/authRoutes');
const assignmentRoutes = require('./api/routes/assignmentRoutes');
const overviewRoutes = require('./api/routes/overviewRoutes');
const workerRoutes = require('./api/routes/workerRoutes');
const tasksRoutes = require('./api/routes/tasksRoutes');
const invoiceRoutes = require('./api/routes/invoiceRoutes');
const clientsRoutes = require('./api/routes/clientsRoutes');
const workersRoutes = require('./api/routes/workersRoutes');
const servicesRoutes = require('./api/routes/servicesRoutes');
const userRoutes = require('./api/routes/userRoutes');
const auditRoutes = require('./api/routes/auditRoutes');
const aiRoutes = require('./api/routes/aiRoutes');
const debugRoutes = require('./api/routes/debugRoutes');
const autoScheduleRoutes = require('./api/routes/autoScheduleRoutes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'text/plain' && req.body) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Silent fail
    }
  }
  next();
});

app.use('/api/schedule/assign', assignmentRoutes);
app.use('/api/schedule/overview', overviewRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', clientRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/auto-schedule', autoScheduleRoutes);
app.use('/api/cron', require('./api/routes/cronRoutes'));

app.listen(PORT, () => {
  // Start cron service
  const cronService = require('./services/cronService');
  cronService.start();
});