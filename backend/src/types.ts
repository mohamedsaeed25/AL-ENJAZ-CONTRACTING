export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  materials?: string;
  paymentTerms?: string;
  balance?: number;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  clientId: number;
  status: ProjectStatus;
  progress?: number; // 0..100
  budget?: number;
  location?: string;
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface Employee {
  id: number;
  name: string;
  jobTitle: string;
  specialization: string;
  dailyWage: number;
  phone?: string;
  projectName?: string;
  status: EmployeeStatus;
}

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';

export interface Equipment {
  id: number;
  name: string;
  type: string;
  dailyCost: number;
  maintenanceDate?: string;
  projectName?: string;
  status: EquipmentStatus;
}

export type StatementStatus = 'PENDING' | 'REVIEW' | 'PAID';

export interface Statement {
  id: number;
  projectId: number;
  number: string;
  amount: number;
  date: string; // ISO string
  description?: string;
  status: StatementStatus;
}

export type PaymentType = 'INCOMING' | 'OUTGOING';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK';
export type PaymentStatus = 'COMPLETED' | 'PENDING';

export interface Payment {
  id: number;
  type: PaymentType;
  amount: number;
  date: string; // ISO string
  dueDate?: string; // ISO string
  description?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  relatedParty?: string; // اسم المشروع أو الجهة المرتبطة
}

// هياكل بيانات بسيطة في الذاكرة فقط لأغراض المثال
export interface Database {
  clients: Client[];
  projects: Project[];
  suppliers: Supplier[];
  employees: Employee[];
  equipment: Equipment[];
  statements: Statement[];
  payments: Payment[];
  nextClientId: number;
  nextProjectId: number;
  nextSupplierId: number;
  nextEmployeeId: number;
  nextEquipmentId: number;
  nextStatementId: number;
  nextPaymentId: number;
}
