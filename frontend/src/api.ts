import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

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

export interface Project {
  id: number;
  code: string;
  name: string;
  clientId: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  progress?: number; // 0..100
  budget?: number;
  location?: string;
  client?: Client | null;
}

export type StatementStatus = 'PENDING' | 'REVIEW' | 'PAID';

export interface Statement {
  id: number;
  projectId: number;
  number: string;
  amount: number;
  date: string;
  description?: string;
  status: StatementStatus;
  project?: Project | null;
}

export type PaymentType = 'INCOMING' | 'OUTGOING';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK';
export type PaymentStatus = 'COMPLETED' | 'PENDING';

export interface Payment {
  id: number;
  type: PaymentType;
  amount: number;
  date: string;
  dueDate?: string;
  description?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  relatedParty?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const res = await api.get<Project[]>('/projects');
  return res.data;
};

export const getClients = async (): Promise<Client[]> => {
  const res = await api.get<Client[]>('/clients');
  return res.data;
};

export const createProject = async (data: Partial<Project>): Promise<Project> => {
  const res = await api.post<Project>('/projects', data);
  return res.data;
};

export const updateProject = async (
  id: number,
  data: Partial<Omit<Project, 'id' | 'client'>>
): Promise<Project> => {
  const res = await api.patch<Project>(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const getStatements = async (): Promise<Statement[]> => {
  const res = await api.get<Statement[]>('/statements');
  return res.data;
};

export const createStatement = async (
  data: Omit<Statement, 'id' | 'project' | 'status'> & { status?: StatementStatus }
): Promise<Statement> => {
  const res = await api.post<Statement>('/statements', data);
  return res.data;
};

export const updateStatement = async (
  id: number,
  data: Partial<Omit<Statement, 'id' | 'project'>>
): Promise<Statement> => {
  const res = await api.patch<Statement>(`/statements/${id}`, data);
  return res.data;
};

export const deleteStatement = async (id: number): Promise<void> => {
  await api.delete(`/statements/${id}`);
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await api.get<Supplier[]>('/suppliers');
  return res.data;
};

export const createSupplier = async (
  data: Omit<Supplier, 'id'>
): Promise<Supplier> => {
  const res = await api.post<Supplier>('/suppliers', data);
  return res.data;
};

export const updateSupplier = async (
  id: number,
  data: Partial<Omit<Supplier, 'id'>>
): Promise<Supplier> => {
  const res = await api.patch<Supplier>(`/suppliers/${id}`, data);
  return res.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await api.delete(`/suppliers/${id}`);
};

export const getEmployees = async (): Promise<Employee[]> => {
  const res = await api.get<Employee[]>('/employees');
  return res.data;
};

export const createEmployee = async (
  data: Omit<Employee, 'id'>
): Promise<Employee> => {
  const res = await api.post<Employee>('/employees', data);
  return res.data;
};

export const deleteEmployee = async (id: number): Promise<void> => {
  await api.delete(`/employees/${id}`);
};

export const updateEmployee = async (
  id: number,
  data: Partial<Omit<Employee, 'id'>>
): Promise<Employee> => {
  const res = await api.patch<Employee>(`/employees/${id}`, data);
  return res.data;
};

export const getEquipment = async (): Promise<Equipment[]> => {
  const res = await api.get<Equipment[]>('/equipment');
  return res.data;
};

export const createEquipment = async (
  data: Omit<Equipment, 'id'>
): Promise<Equipment> => {
  const res = await api.post<Equipment>('/equipment', data);
  return res.data;
};

export const updateEquipment = async (
  id: number,
  data: Partial<Omit<Equipment, 'id'>>
): Promise<Equipment> => {
  const res = await api.patch<Equipment>(`/equipment/${id}`, data);
  return res.data;
};

export const deleteEquipment = async (id: number): Promise<void> => {
  await api.delete(`/equipment/${id}`);
};

export const getPayments = async (): Promise<Payment[]> => {
  const res = await api.get<Payment[]>('/payments');
  return res.data;
};

export const createPayment = async (data: Omit<Payment, 'id'>): Promise<Payment> => {
  const res = await api.post<Payment>('/payments', data);
  return res.data;
};

export const updatePayment = async (
  id: number,
  data: Partial<Omit<Payment, 'id'>>
): Promise<Payment> => {
  const res = await api.patch<Payment>(`/payments/${id}`, data);
  return res.data;
};

export const deletePayment = async (id: number): Promise<void> => {
  await api.delete(`/payments/${id}`);
};

