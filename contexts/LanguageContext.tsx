'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'th'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation strings
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'Massage App',
    'common.home': 'Home',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.add': 'Add',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.total': 'Total',
    'common.actions': 'Actions',
    
    // Landing Page
    'landing.manager': 'Manager Interface',
    'landing.therapist': 'Therapist Interface',
    'landing.therapistManagement': 'Therapist Management',
    
    // Manager
    'manager.dailyMatrix': 'Daily Matrix',
    'manager.addEntry': 'Add Entry',
    'manager.reports': 'Reports',
    'manager.therapistManagement': 'Therapist Management',
    'manager.servicesManagement': 'Services Management',
    'manager.menu': 'Menu',
    'manager.checkInTime': 'Check In Time',
    'manager.row': 'Row',
    
    // Therapist Management
    'therapist.name': 'Name',
    'therapist.phone': 'Phone',
    'therapist.email': 'Email',
    'therapist.pin': 'PIN',
    'therapist.status': 'Status',
    'therapist.commission': 'Commission',
    'therapist.joinDate': 'Join Date',
    'therapist.addTherapist': 'Add Therapist',
    'therapist.editProfile': 'Edit Therapist Profile',
    'therapist.createProfile': 'Create Therapist Profile',
    'therapist.assignShifts': 'Assign Shifts',
    'therapist.viewPayout': 'View Payout',
    'therapist.shifts': 'Shifts',
    'therapist.payout': 'Payout & Totals',
    
    // Shift Assignment
    'shift.weeklySchedule': 'Weekly Schedule',
    'shift.setWorkingHours': 'Set working hours for each day of the week',
    'shift.dayOff': 'Day off',
    'shift.start': 'Start',
    'shift.end': 'End',
    'shift.scheduleSummary': 'Schedule Summary',
    'shift.activeDays': 'Active days',
    'shift.totalHours': 'Total hours per week',
    'shift.hours': 'hours',
    'shift.saveSchedule': 'Save Schedule',
    
    // Payout
    'payout.view': 'View',
    'payout.daily': 'Daily',
    'payout.weekly': 'Weekly',
    'payout.monthly': 'Monthly',
    'payout.totalRevenue': 'Total Revenue',
    'payout.commission': 'Commission',
    'payout.sessions': 'Sessions',
    'payout.allPeriods': 'All Periods Overview',
    'payout.sessionDetails': 'Session Details',
    'payout.date': 'Date',
    'payout.service': 'Service',
    'payout.price': 'Price',
    'payout.export': 'Export',
    'payout.noSessions': 'No sessions found for this period',
    
    // Therapist Interface
    'therapist.login.title': 'Therapist Login',
    'therapist.login.idPhone': 'ID / Phone',
    'therapist.login.pin': 'PIN',
    'therapist.login.button': 'Login',
    'therapist.home.greeting': 'Hi, {name}!',
    'therapist.home.today': 'Today',
    'therapist.home.startSession': 'Start New Session',
    'therapist.home.todaysSummary': "Today's Summary",
    'therapist.home.recentSessions': 'Recent Sessions',
    'therapist.home.noSessions': 'No sessions today',
    'therapist.newSession.title': 'New Session',
    'therapist.newSession.service': 'Service',
    'therapist.newSession.duration': 'Duration',
    'therapist.newSession.price': 'Price',
    'therapist.newSession.addons': 'Add-ons',
    'therapist.newSession.tip': 'Tip',
    'therapist.newSession.notes': 'Notes',
    'therapist.newSession.save': 'Save Session',
    'therapist.summary.title': "Today's Stats",
    'therapist.summary.totalEarned': 'Total Earned',
    'therapist.summary.avgSession': 'Avg per session',
    'therapist.summary.history': 'History List',
    
    // Service Entry
    'entry.therapist': 'Therapist',
    'entry.timeSlot': 'Time Slot',
    'entry.service': 'Service',
    'entry.addons': 'Add-ons',
    'entry.paymentType': 'Payment Type',
    'entry.notes': 'Notes',
    'entry.autoPickRow': 'Auto / Pick Row',
    'entry.cash': 'Cash',
    'entry.card': 'Card',
    'entry.qr': 'QR',
    'entry.unpaid': 'Unpaid',
    
    // Service Management
    'service.addService': 'Add Service',
    'service.createService': 'Create Service',
    'service.editService': 'Edit Service',
    'service.name': 'Service Name',
    'service.category': 'Category',
    'service.price': 'Price',
    'service.duration': 'Duration',
    'service.description': 'Description',
    'service.status': 'Status',
    'service.filterByCategory': 'Filter by Category',
    'service.allCategories': 'All Categories',
    'service.noServices': 'No services found',
    'service.create': 'Create',
  },
  th: {
    // Common
    'app.name': 'แอปนวด',
    'common.home': 'หน้าแรก',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.close': 'ปิด',
    'common.back': 'กลับ',
    'common.add': 'เพิ่ม',
    'common.active': 'ใช้งาน',
    'common.inactive': 'ไม่ใช้งาน',
    'common.total': 'รวม',
    'common.actions': 'การดำเนินการ',
    
    // Landing Page
    'landing.manager': 'หน้าจอผู้จัดการ',
    'landing.therapist': 'หน้าจอช่างนวด',
    'landing.therapistManagement': 'จัดการช่างนวด',
    
    // Manager
    'manager.dailyMatrix': 'ตารางรายวัน',
    'manager.addEntry': 'เพิ่มรายการ',
    'manager.reports': 'รายงาน',
    'manager.therapistManagement': 'จัดการช่างนวด',
    'manager.servicesManagement': 'จัดการบริการ',
    'manager.menu': 'เมนู',
    'manager.checkInTime': 'เวลาเช็คอิน',
    'manager.row': 'แถว',
    
    // Therapist Management
    'therapist.name': 'ชื่อ',
    'therapist.phone': 'เบอร์โทรศัพท์',
    'therapist.email': 'อีเมล',
    'therapist.pin': 'รหัส PIN',
    'therapist.status': 'สถานะ',
    'therapist.commission': 'คอมมิชชั่น',
    'therapist.joinDate': 'วันที่เข้าร่วม',
    'therapist.addTherapist': 'เพิ่มช่างนวด',
    'therapist.editProfile': 'แก้ไขโปรไฟล์ช่างนวด',
    'therapist.createProfile': 'สร้างโปรไฟล์ช่างนวด',
    'therapist.assignShifts': 'กำหนดกะงาน',
    'therapist.viewPayout': 'ดูการจ่ายเงิน',
    'therapist.shifts': 'กะงาน',
    'therapist.payout': 'การจ่ายเงินและยอดรวม',
    
    // Shift Assignment
    'shift.weeklySchedule': 'ตารางรายสัปดาห์',
    'shift.setWorkingHours': 'กำหนดชั่วโมงทำงานสำหรับแต่ละวัน',
    'shift.dayOff': 'วันหยุด',
    'shift.start': 'เริ่ม',
    'shift.end': 'สิ้นสุด',
    'shift.scheduleSummary': 'สรุปตาราง',
    'shift.activeDays': 'วันที่ทำงาน',
    'shift.totalHours': 'ชั่วโมงรวมต่อสัปดาห์',
    'shift.hours': 'ชั่วโมง',
    'shift.saveSchedule': 'บันทึกตาราง',
    
    // Payout
    'payout.view': 'ดู',
    'payout.daily': 'รายวัน',
    'payout.weekly': 'รายสัปดาห์',
    'payout.monthly': 'รายเดือน',
    'payout.totalRevenue': 'รายได้รวม',
    'payout.commission': 'คอมมิชชั่น',
    'payout.sessions': 'จำนวนครั้ง',
    'payout.allPeriods': 'ภาพรวมทุกช่วงเวลา',
    'payout.sessionDetails': 'รายละเอียดการบริการ',
    'payout.date': 'วันที่',
    'payout.service': 'บริการ',
    'payout.price': 'ราคา',
    'payout.export': 'ส่งออก',
    'payout.noSessions': 'ไม่พบการบริการในช่วงเวลานี้',
    
    // Therapist Interface
    'therapist.login.title': 'เข้าสู่ระบบช่างนวด',
    'therapist.login.idPhone': 'รหัส / เบอร์โทรศัพท์',
    'therapist.login.pin': 'รหัส PIN',
    'therapist.login.button': 'เข้าสู่ระบบ',
    'therapist.home.greeting': 'สวัสดี, {name}!',
    'therapist.home.today': 'วันนี้',
    'therapist.home.startSession': 'เริ่มการบริการใหม่',
    'therapist.home.todaysSummary': 'สรุปรายวัน',
    'therapist.home.recentSessions': 'การบริการล่าสุด',
    'therapist.home.noSessions': 'ยังไม่มีการบริการวันนี้',
    'therapist.newSession.title': 'การบริการใหม่',
    'therapist.newSession.service': 'บริการ',
    'therapist.newSession.duration': 'ระยะเวลา',
    'therapist.newSession.price': 'ราคา',
    'therapist.newSession.addons': 'เพิ่มเติม',
    'therapist.newSession.tip': 'ทิป',
    'therapist.newSession.notes': 'หมายเหตุ',
    'therapist.newSession.save': 'บันทึกการบริการ',
    'therapist.summary.title': 'สถิติวันนี้',
    'therapist.summary.totalEarned': 'รายได้รวม',
    'therapist.summary.avgSession': 'เฉลี่ยต่อครั้ง',
    'therapist.summary.history': 'ประวัติ',
    
    // Service Entry
    'entry.therapist': 'ช่างนวด',
    'entry.timeSlot': 'ช่วงเวลา',
    'entry.service': 'บริการ',
    'entry.addons': 'เพิ่มเติม',
    'entry.paymentType': 'วิธีการชำระเงิน',
    'entry.notes': 'หมายเหตุ',
    'entry.autoPickRow': 'อัตโนมัติ / เลือกแถว',
    'entry.cash': 'เงินสด',
    'entry.card': 'บัตร',
    'entry.qr': 'QR',
    'entry.unpaid': 'ยังไม่ชำระ',
    
    // Service Management
    'service.addService': 'เพิ่มบริการ',
    'service.createService': 'สร้างบริการ',
    'service.editService': 'แก้ไขบริการ',
    'service.name': 'ชื่อบริการ',
    'service.category': 'หมวดหมู่',
    'service.price': 'ราคา',
    'service.duration': 'ระยะเวลา',
    'service.description': 'คำอธิบาย',
    'service.status': 'สถานะ',
    'service.filterByCategory': 'กรองตามหมวดหมู่',
    'service.allCategories': 'ทุกหมวดหมู่',
    'service.noServices': 'ไม่พบบริการ',
    'service.create': 'สร้าง',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'th')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    // Handle template strings like {name}
    const translation = translations[language][key] || translations.en[key] || key
    return translation
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

