export interface Student {
  id: string;
  name: string;
  studentId: string;
  email: string;
  level: string;
  subject: string;
  program?: string;
  avatar?: string;
  schedule: WeeklySchedule;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'suspended';
  contactNumber?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface WeeklySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  sessionType?: string;
}

export interface Session {
  id: string;
  name: string;
  instructor: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  status: 'upcoming' | 'active' | 'completed';
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  checkInTime?: Date;
  learningStartTime?: Date;
  checkOutTime?: Date;
  status: 'absent' | 'checked-in' | 'learning' | 'completed';
  notes?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  checkedIn: number;
  learning: number;
  completed: number;
  absent: number;
}

export interface UserProfile {
  id: string;
  fullName?: string;
  roleId?: string;
  roleName?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  roleName: string;
  createdAt: string;
}

export interface Parent {
  id: string;
  userId?: string;
  userProfile?: UserProfile;
  qrCode?: string;
  qrCodeUrl?: string;
  linkedStudents: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'parent' | 'instructor';
  linkedStudentIds?: string[];
}

export interface StudentQRCode {
  id: string;
  studentId: string;
  qrCode: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDCardTemplate {
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  qrCode: string;
  qrCodeUrl: string;
  cardUrl?: string;
}

export interface GeneratedID {
  id: string;
  studentId: string;
  studentName?: string;
  studentIdNumber?: string;
  idType: 'student_card' | 'qr_code' | 'access_card' | 'library_card';
  idValue: string;
  metadata: {
    qr_code_url?: string;
    card_url?: string;
    is_active?: boolean;
    [key: string]: any;
  };
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  generatedBy?: string;
  generatedAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDStatistics {
  totalIds: number;
  activeIds: number;
  expiredIds: number;
  byType: Record<string, number>;
}