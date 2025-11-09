// Column mapping service to handle differences between SQLite and PostgreSQL
class ColumnMapper {
  constructor() {
    // Map PostgreSQL columns to standardized format
    this.postgresMap = {
      // Customers table
      'CustomerID': 'CustomerID',
      'Name': 'Name', 
      'Villa': 'Villa',
      'CarPlates': 'CarPlates',
      'Washman_Package': 'Washman_Package',
      'Days': 'Days',
      'Time': 'Time',
      'Status': 'Status',
      'Phone': 'Phone',
      'Email': 'Email',
      'Notes': 'Notes',
      'Fee': 'Fee',
      'Number of car': 'Number of car',
      'start date': 'start date',
      
      // Workers table
      'WorkerID': 'WorkerID',
      'Specialization': 'Specialization',
      'HourlyRate': 'HourlyRate',
      
      // ScheduledTasks table
      'Day': 'Day',
      'AppointmentDate': 'AppointmentDate',
      'CustomerName': 'CustomerName',
      'CarPlate': 'CarPlate',
      'WashType': 'WashType',
      'WorkerName': 'WorkerName',
      'PackageType': 'PackageType',
      'isLocked': 'isLocked',
      'ScheduleDate': 'ScheduleDate',
      
      // Wash History table
      'WashID': 'WashID',
      'WashDate': 'WashDate',
      'WashTypePerformed': 'WashTypePerformed',
      'VisitNumberInWeek': 'VisitNumberInWeek',
      'WeekInCycle': 'WeekInCycle'
    };
    
    // SQLite uses same names (no mapping needed)
    this.sqliteMap = {};
  }
  
  // Normalize a single record from database
  normalizeRecord(record, isPostgres = false) {
    if (!record) return null;
    
    const normalized = {};
    
    // Copy all fields first
    Object.keys(record).forEach(key => {
      normalized[key] = record[key];
    });
    
    // Add standardized aliases for common fields
    if (record.Name && !normalized.CustomerName) {
      normalized.CustomerName = record.Name;
    }
    
    if (record.Days && !normalized.WashDay) {
      normalized.WashDay = record.Days;
    }
    
    if (record.Time && !normalized.WashTime) {
      normalized.WashTime = record.Time;
    }
    
    return normalized;
  }
  
  // Normalize array of records
  normalizeRecords(records, isPostgres = false) {
    if (!Array.isArray(records)) return [];
    
    return records.map(record => this.normalizeRecord(record, isPostgres));
  }
  
  // Get column name for database type
  getColumnName(standardName, isPostgres = false) {
    if (isPostgres) {
      return `"${standardName}"`;
    }
    return standardName;
  }
  
  // Build SELECT query with proper column names
  buildSelectQuery(tableName, columns = ['*'], isPostgres = false) {
    if (columns.includes('*')) {
      return `SELECT * FROM ${isPostgres ? `"${tableName}"` : tableName}`;
    }
    
    const columnList = columns.map(col => this.getColumnName(col, isPostgres)).join(', ');
    return `SELECT ${columnList} FROM ${isPostgres ? `"${tableName}"` : tableName}`;
  }
}

module.exports = new ColumnMapper();