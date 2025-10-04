// Role-based permissions system
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  USER: 'user'
};

export const PERMISSIONS = {
  // User Management
  VIEW_USERS: 'view_users',
  ADD_USERS: 'add_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VIEW_PASSWORDS: 'view_passwords',
  CHANGE_PASSWORDS: 'change_passwords',
  RESET_PASSWORDS: 'reset_passwords',
  
  // Operations Management
  VIEW_OPERATIONS: 'view_operations',
  MANAGE_WORKERS: 'manage_workers',
  MANAGE_SERVICES: 'manage_services',
  
  // Schedule Management
  VIEW_SCHEDULE: 'view_schedule',
  EDIT_SCHEDULE: 'edit_schedule',
  AUTO_ASSIGN: 'auto_assign',
  
  // Client Management
  VIEW_CLIENTS: 'view_clients',
  ADD_CLIENTS: 'add_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',
  
  // Invoice Management
  VIEW_INVOICES: 'view_invoices',
  CREATE_INVOICES: 'create_invoices',
  EDIT_INVOICES: 'edit_invoices',
  DELETE_INVOICES: 'delete_invoices',
  
  // Tasks Management
  VIEW_TASKS: 'view_tasks',
  COMPLETE_TASKS: 'complete_tasks'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.ADD_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_PASSWORDS,
    PERMISSIONS.CHANGE_PASSWORDS,
    PERMISSIONS.RESET_PASSWORDS,
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.MANAGE_WORKERS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.EDIT_SCHEDULE,
    PERMISSIONS.AUTO_ASSIGN,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.ADD_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.COMPLETE_TASKS
  ],
  
  [ROLES.MANAGER]: [
    // Management access but no user management
    PERMISSIONS.VIEW_OPERATIONS,
    PERMISSIONS.MANAGE_WORKERS,
    PERMISSIONS.MANAGE_SERVICES,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.EDIT_SCHEDULE,
    PERMISSIONS.AUTO_ASSIGN,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.ADD_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.CREATE_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.COMPLETE_TASKS
  ],
  
  [ROLES.USER]: [
    // Basic access - view only mostly
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.COMPLETE_TASKS
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Check if user can access a specific page/section
export const canAccess = (userRole, requiredPermissions) => {
  if (!userRole || !requiredPermissions) return false;
  if (typeof requiredPermissions === 'string') {
    return hasPermission(userRole, requiredPermissions);
  }
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
};

// Get role display info
export const getRoleInfo = (role) => {
  const roleInfo = {
    [ROLES.ADMIN]: {
      name: 'Administrator',
      color: '#dc3545',
      description: 'Full system access - can manage users, operations, and all data',
      icon: '👑'
    },
    [ROLES.MANAGER]: {
      name: 'Manager', 
      color: '#ffc107',
      description: 'Management access - can manage operations, schedules, and clients',
      icon: '👔'
    },
    [ROLES.USER]: {
      name: 'User',
      color: '#28a745', 
      description: 'Basic access - can view data and complete assigned tasks',
      icon: '👤'
    }
  };
  
  return roleInfo[role] || roleInfo[ROLES.USER];
};