import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { db } from './data';
import { Project, Client, Statement, Supplier, Employee, Equipment, Payment } from './types';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ message: 'Contracting Management API is running' });
});

// ===== Clients Endpoints =====
app.get('/api/clients', (_req, res) => {
  res.json(db.clients);
});

app.post('/api/clients', (req, res) => {
  const body = req.body as Partial<Client>;

  if (!body.name) {
    return res.status(400).json({ message: 'الاسم مطلوب' });
  }

  const newClient: Client = {
    id: db.nextClientId++,
    name: body.name,
    contactPerson: body.contactPerson,
    phone: body.phone,
    email: body.email,
    address: body.address
  };

  db.clients.push(newClient);
  res.status(201).json(newClient);
});

// ===== Projects Endpoints =====
app.get('/api/projects', (_req, res) => {
  const projectsWithClient = db.projects.map((p) => ({
    ...p,
    client: db.clients.find((c) => c.id === p.clientId) || null
  }));
  res.json(projectsWithClient);
});

app.get('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ message: 'المشروع غير موجود' });
  }
  const client = db.clients.find((c) => c.id === project.clientId) || null;
  res.json({ ...project, client });
});

app.post('/api/projects', (req, res) => {
  const body = req.body as Partial<Project>;

  if (!body.code || !body.name || !body.clientId) {
    return res.status(400).json({ message: 'الكود والاسم والعميل مطلوبة' });
  }

  const client = db.clients.find((c) => c.id === body.clientId);
  if (!client) {
    return res.status(400).json({ message: 'عميل غير موجود' });
  }

  const existsCode = db.projects.some((p) => p.code === body.code);
  if (existsCode) {
    return res.status(400).json({ message: 'هذا الكود مستخدم بالفعل' });
  }

  const newProject: Project = {
    id: db.nextProjectId++,
    code: body.code,
    name: body.name,
    clientId: body.clientId,
    status: body.status || 'PLANNED',
    progress: typeof body.progress === 'number' ? Math.max(0, Math.min(100, body.progress)) : 0,
    budget: body.budget,
    location: body.location
  };

  db.projects.push(newProject);
  res.status(201).json(newProject);
});

app.patch('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Project>;
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ message: 'المشروع غير موجود' });
  }

  if (body.code !== undefined) project.code = body.code;
  if (body.name !== undefined) project.name = body.name;
  if (body.clientId !== undefined) {
    const client = db.clients.find((c) => c.id === body.clientId);
    if (!client) {
      return res.status(400).json({ message: 'عميل غير موجود' });
    }
    project.clientId = body.clientId;
  }
  if (body.status !== undefined) project.status = body.status;
  if (typeof body.progress === 'number') {
    project.progress = Math.max(0, Math.min(100, body.progress));
  }
  if (body.budget !== undefined) project.budget = body.budget;
  if (body.location !== undefined) project.location = body.location;

  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.projects.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'المشروع غير موجود' });
  }

  // حذف المستخلصات المرتبطة بهذا المشروع
  db.statements = db.statements.filter((s) => s.projectId !== id);

  const [removed] = db.projects.splice(index, 1);
  res.json(removed);
});

// ===== Statements (Extracts) Endpoints =====
app.get('/api/statements', (_req, res) => {
  const statementsWithProject = db.statements.map((s) => ({
    ...s,
    project: db.projects.find((p) => p.id === s.projectId) || null
  }));
  res.json(statementsWithProject);
});

app.post('/api/statements', (req, res) => {
  const body = req.body as Partial<Statement>;

  if (!body.projectId || !body.number || typeof body.amount !== 'number' || !body.date) {
    return res.status(400).json({ message: 'المشروع، رقم المستخلص، المبلغ، والتاريخ مطلوبة' });
  }

  const project = db.projects.find((p) => p.id === body.projectId);
  if (!project) {
    return res.status(400).json({ message: 'مشروع غير موجود' });
  }

  const newStatement: Statement = {
    id: db.nextStatementId++,
    projectId: body.projectId,
    number: body.number,
    amount: body.amount,
    date: body.date,
    description: body.description,
    status: body.status || 'REVIEW'
  };

  db.statements.push(newStatement);
  res.status(201).json(newStatement);
});

app.patch('/api/statements/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Statement>;
  const statement = db.statements.find((s) => s.id === id);
  if (!statement) {
    return res.status(404).json({ message: 'المستخلص غير موجود' });
  }

  if (body.projectId !== undefined) {
    const project = db.projects.find((p) => p.id === body.projectId);
    if (!project) {
      return res.status(400).json({ message: 'مشروع غير موجود' });
    }
    statement.projectId = body.projectId;
  }
  if (body.number !== undefined) statement.number = body.number;
  if (typeof body.amount === 'number') statement.amount = body.amount;
  if (body.date !== undefined) statement.date = body.date;
  if (body.description !== undefined) statement.description = body.description;
  if (body.status !== undefined) statement.status = body.status;

  res.json(statement);
});

app.delete('/api/statements/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.statements.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'المستخلص غير موجود' });
  }
  const [removed] = db.statements.splice(index, 1);
  res.json(removed);
});

// ===== Suppliers Endpoints =====
app.get('/api/suppliers', (_req, res) => {
  res.json(db.suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const body = req.body as Partial<Supplier>;

  if (!body.companyName) {
    return res.status(400).json({ message: 'اسم الشركة مطلوب' });
  }

  const newSupplier: Supplier = {
    id: db.nextSupplierId++,
    companyName: body.companyName,
    contactPerson: body.contactPerson,
    phone: body.phone,
    email: body.email,
    materials: body.materials,
    paymentTerms: body.paymentTerms,
    balance: body.balance ?? 0
  };

  db.suppliers.push(newSupplier);
  res.status(201).json(newSupplier);
});

app.patch('/api/suppliers/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Supplier>;
  const supplier = db.suppliers.find((s) => s.id === id);
  if (!supplier) {
    return res.status(404).json({ message: 'المورد غير موجود' });
  }

  if (body.companyName !== undefined) supplier.companyName = body.companyName;
  if (body.contactPerson !== undefined) supplier.contactPerson = body.contactPerson;
  if (body.phone !== undefined) supplier.phone = body.phone;
  if (body.email !== undefined) supplier.email = body.email;
  if (body.materials !== undefined) supplier.materials = body.materials;
  if (body.paymentTerms !== undefined) supplier.paymentTerms = body.paymentTerms;
  if (typeof body.balance === 'number') supplier.balance = body.balance;

  res.json(supplier);
});

app.delete('/api/suppliers/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.suppliers.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'المورد غير موجود' });
  }
  const [removed] = db.suppliers.splice(index, 1);
  res.json(removed);
});

// ===== Employees (Workers) Endpoints =====
app.get('/api/employees', (_req, res) => {
  res.json(db.employees);
});

app.post('/api/employees', (req, res) => {
  const body = req.body as Partial<Employee>;

  if (!body.name || !body.jobTitle || !body.specialization || typeof body.dailyWage !== 'number') {
    return res
      .status(400)
      .json({ message: 'الاسم والوظيفة والتخصص والأجر اليومي (رقم) مطلوبة' });
  }

  const newEmployee: Employee = {
    id: db.nextEmployeeId++,
    name: body.name,
    jobTitle: body.jobTitle,
    specialization: body.specialization,
    dailyWage: body.dailyWage,
    phone: body.phone,
    projectName: body.projectName,
    status: body.status || 'ACTIVE'
  };

  db.employees.push(newEmployee);
  res.status(201).json(newEmployee);
});

app.delete('/api/employees/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.employees.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'العامل غير موجود' });
  }
  const [removed] = db.employees.splice(index, 1);
  res.json(removed);
});

app.patch('/api/employees/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Employee>;
  const employee = db.employees.find((e) => e.id === id);
  if (!employee) {
    return res.status(404).json({ message: 'العامل غير موجود' });
  }

  if (body.name !== undefined) employee.name = body.name;
  if (body.jobTitle !== undefined) employee.jobTitle = body.jobTitle;
  if (body.specialization !== undefined) employee.specialization = body.specialization;
  if (typeof body.dailyWage === 'number') employee.dailyWage = body.dailyWage;
  if (body.phone !== undefined) employee.phone = body.phone;
  if (body.projectName !== undefined) employee.projectName = body.projectName;
  if (body.status !== undefined) employee.status = body.status;

  res.json(employee);
});

// ===== Equipment Endpoints =====
app.get('/api/equipment', (_req, res) => {
  res.json(db.equipment);
});

app.post('/api/equipment', (req, res) => {
  const body = req.body as Partial<Equipment>;

  if (!body.name || !body.type || typeof body.dailyCost !== 'number') {
    return res
      .status(400)
      .json({ message: 'اسم المعدة، النوع، وتكلفة الإيجار اليومية مطلوبة' });
  }

  const newEq: Equipment = {
    id: db.nextEquipmentId++,
    name: body.name,
    type: body.type,
    dailyCost: body.dailyCost,
    maintenanceDate: body.maintenanceDate,
    projectName: body.projectName,
    status: body.status || 'AVAILABLE'
  };

  db.equipment.push(newEq);
  res.status(201).json(newEq);
});

app.patch('/api/equipment/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Equipment>;
  const eq = db.equipment.find((e) => e.id === id);
  if (!eq) {
    return res.status(404).json({ message: 'المعدة غير موجودة' });
  }

  if (body.name !== undefined) eq.name = body.name;
  if (body.type !== undefined) eq.type = body.type;
  if (typeof body.dailyCost === 'number') eq.dailyCost = body.dailyCost;
  if (body.maintenanceDate !== undefined) eq.maintenanceDate = body.maintenanceDate;
  if (body.projectName !== undefined) eq.projectName = body.projectName;
  if (body.status !== undefined) eq.status = body.status;

  res.json(eq);
});

app.delete('/api/equipment/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.equipment.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'المعدة غير موجودة' });
  }
  const [removed] = db.equipment.splice(index, 1);
  res.json(removed);
});

// ===== Payments Endpoints =====
app.get('/api/payments', (_req, res) => {
  res.json(db.payments);
});

app.post('/api/payments', (req, res) => {
  const body = req.body as Partial<Payment>;

  if (
    !body.type ||
    typeof body.amount !== 'number' ||
    !body.date ||
    !body.paymentMethod ||
    !body.status
  ) {
    return res
      .status(400)
      .json({ message: 'النوع، المبلغ، التاريخ، طريقة الدفع، والحالة مطلوبة' });
  }

  const newPayment: Payment = {
    id: db.nextPaymentId++,
    type: body.type,
    amount: body.amount,
    date: body.date,
    dueDate: body.dueDate,
    description: body.description,
    paymentMethod: body.paymentMethod,
    status: body.status,
    relatedParty: body.relatedParty
  };

  db.payments.push(newPayment);
  res.status(201).json(newPayment);
});

app.patch('/api/payments/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Partial<Payment>;
  const payment = db.payments.find((p) => p.id === id);
  if (!payment) {
    return res.status(404).json({ message: 'الدفعة غير موجودة' });
  }

  if (body.type !== undefined) payment.type = body.type;
  if (typeof body.amount === 'number') payment.amount = body.amount;
  if (body.date !== undefined) payment.date = body.date;
  if (body.dueDate !== undefined) payment.dueDate = body.dueDate;
  if (body.description !== undefined) payment.description = body.description;
  if (body.paymentMethod !== undefined) payment.paymentMethod = body.paymentMethod;
  if (body.status !== undefined) payment.status = body.status;
  if (body.relatedParty !== undefined) payment.relatedParty = body.relatedParty;

  res.json(payment);
});

app.delete('/api/payments/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = db.payments.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'الدفعة غير موجودة' });
  }
  const [removed] = db.payments.splice(index, 1);
  res.json(removed);
});

app.listen(PORT, () => {
  console.log(`Contracting backend running on http://localhost:${PORT}`);
});

