import { Database } from './types';

export const db: Database = {
  clients: [
    {
      id: 1,
      name: 'شركة التطوير العقاري',
      contactPerson: 'أحمد علي',
      phone: '01000000000',
      email: 'client@example.com',
      address: 'القاهرة، مصر'
    }
  ],
  projects: [
    {
      id: 1,
      code: 'PRJ-001',
      name: 'برج سكني – المرحلة الأولى',
      clientId: 1,
      status: 'IN_PROGRESS',
      progress: 35,
      budget: 15000000,
      location: 'القاهرة الجديدة'
    }
  ],
  suppliers: [
    {
      id: 1,
      companyName: 'شركة مواد البناء المتحدة',
      contactPerson: 'مسؤول المشتريات',
      phone: '0500000000',
      email: 'supplier@example.com',
      materials: 'حديد، أسمنت، رمل',
      paymentTerms: '30 يوم',
      balance: 20000
    }
  ],
  employees: [
    {
      id: 1,
      name: 'عامل تجريبي',
      jobTitle: 'عامل موقع',
      specialization: 'عمالة عامة',
      dailyWage: 150,
      phone: '0550000000',
      projectName: 'برج سكني – المرحلة الأولى',
      status: 'ACTIVE'
    }
  ],
  equipment: [
    {
      id: 1,
      name: 'حفار صغير',
      type: 'حفار',
      dailyCost: 400,
      maintenanceDate: '2026-01-15',
      projectName: 'نقطة فايبر سكوب',
      status: 'IN_USE'
    }
  ],
  statements: [
    {
      id: 1,
      projectId: 1,
      number: '11',
      amount: 100000,
      date: '2026-01-12',
      description: 'مستخلص أول للمشروع',
      status: 'PAID'
    }
  ],
  payments: [
    {
      id: 1,
      type: 'OUTGOING',
      amount: 527,
      date: '2026-03-01',
      description: 'دفعة',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      relatedParty: 'مشروع اكس'
    },
    {
      id: 2,
      type: 'INCOMING',
      amount: 198,
      date: '2026-06-01',
      description: '1axna',
      paymentMethod: 'BANK_TRANSFER',
      status: 'COMPLETED',
      relatedParty: 'aaa'
    }
  ],
  nextClientId: 2,
  nextProjectId: 2,
  nextSupplierId: 2,
  nextEmployeeId: 2,
  nextEquipmentId: 2,
  nextStatementId: 2,
  nextPaymentId: 3
};
