// Change Tracker Service - يتتبع التغييرات بدون استهلاك API
class ChangeTracker {
  constructor() {
    this.pendingChanges = new Map();
    this.activeUsers = new Set();
    this.lastSaveTime = Date.now();
  }

  // تسجيل مستخدم نشط
  registerUser(userId) {
    this.activeUsers.add(userId);
    }

  // إلغاء تسجيل مستخدم
  unregisterUser(userId) {
    this.activeUsers.delete(userId);
    this.pendingChanges.delete(userId);
    }

  // إضافة تغيير معلق
  addPendingChange(userId, changeData) {
    if (!this.pendingChanges.has(userId)) {
      this.pendingChanges.set(userId, []);
    }
    
    this.pendingChanges.get(userId).push({
      ...changeData,
      timestamp: Date.now()
    });
    
    }

  // التحقق من وجود تغييرات معلقة
  hasUnsavedChanges(userId = null) {
    if (userId) {
      return this.pendingChanges.has(userId) && this.pendingChanges.get(userId).length > 0;
    }
    
    // التحقق من جميع المستخدمين
    return this.pendingChanges.size > 0;
  }

  // الحصول على التغييرات المعلقة
  getPendingChanges(userId) {
    return this.pendingChanges.get(userId) || [];
  }

  // مسح التغييرات بعد الحفظ
  clearPendingChanges(userId) {
    this.pendingChanges.delete(userId);
    this.lastSaveTime = Date.now();
    }

  // الحصول على حالة جميع المستخدمين
  getSystemStatus() {
    const activeUsersCount = this.activeUsers.size;
    const usersWithChanges = Array.from(this.pendingChanges.keys());
    
    return {
      activeUsers: activeUsersCount,
      usersWithUnsavedChanges: usersWithChanges.length,
      totalPendingChanges: Array.from(this.pendingChanges.values()).flat().length,
      lastSaveTime: this.lastSaveTime,
      canSafelyRestart: usersWithChanges.length === 0
    };
  }

  // تحذير قبل إعادة التشغيل
  checkBeforeRestart() {
    const status = this.getSystemStatus();
    
    if (!status.canSafelyRestart) {
      return false;
    }
    
    return true;
  }
}

module.exports = new ChangeTracker();