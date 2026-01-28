import { useEffect, useMemo, useState } from 'react';
import {
  getProjects,
  getClients,
  getStatements,
  createStatement,
  updateStatement,
  deleteStatement,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getEmployees,
  createEmployee,
  deleteEmployee,
  updateEmployee,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  createProject,
  updateProject,
  deleteProject,
  Client,
  Project,
  Statement,
  Supplier,
  Employee,
  Equipment,
  Payment
} from './api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  BarElement
);

export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [authUser, setAuthUser] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activePage, setActivePage] = useState<
    | 'dashboard'
    | 'projects'
    | 'statements'
    | 'suppliers'
    | 'employees'
    | 'equipment'
    | 'payments'
    | 'profits-losses'
    | 'settings'
    | 'login'
    | 'register'
  >('dashboard');

  useEffect(() => {
    // auth + branding (local only)
    try {
      const u = localStorage.getItem('cm_auth_user');
      setAuthUser(u ? u : null);
      const logo = localStorage.getItem('cm_brand_logo');
      setLogoDataUrl(logo ? logo : null);
      const bg = localStorage.getItem('cm_brand_bg');
      setBgDataUrl(bg ? bg : null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!bgDataUrl) return;
    // apply as body background with subtle overlay
    document.body.style.backgroundImage = `linear-gradient(rgba(2,6,23,0.72), rgba(2,6,23,0.72)), url(${bgDataUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [bgDataUrl]);

  useEffect(() => {
    // lock scroll when mobile nav is open
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [p, c, s, e, eq, pay, st] = await Promise.all([
          getProjects(),
          getClients(),
          getSuppliers(),
          getEmployees(),
          getEquipment(),
          getPayments(),
          getStatements()
        ]);
        setProjects(p);
        setClients(c);
        setSuppliers(s);
        setEmployees(e);
        setEquipment(eq);
        setPayments(pay);
        setStatements(st);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    const planned = projects.filter((p) => p.status === 'PLANNED').length;
    const onHold = projects.filter((p) => p.status === 'ON_HOLD').length;
    const avgProgress =
      totalProjects === 0
        ? 0
        : Math.round(
            projects.reduce((sum, p) => sum + (typeof p.progress === 'number' ? p.progress : 0), 0) /
              totalProjects
          );

    return {
      totalProjects,
      inProgress,
      completed,
      planned,
      onHold,
      avgProgress
    };
  }, [projects]);

  const laborSpecializationChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const emp of employees) {
      if (emp.status !== 'ACTIVE') continue;
      const key = emp.specialization?.trim() || 'غير محدد';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const labels = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const palette = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#9ca3af'];

    return {
      hasData: values.length > 0,
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderWidth: 0
          }
        ]
      }
    };
  }, [employees]);

  const projectStatusChart = useMemo(() => {
    const { planned, inProgress, completed, onHold } = stats;
    const total = planned + inProgress + completed + onHold || 1;

    return {
      data: {
        labels: ['تخطيط', 'قيد التنفيذ', 'مكتمل', 'متوقف'],
        datasets: [
          {
            data: [planned, inProgress, completed, onHold],
            backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'],
            borderWidth: 0
          }
        ]
      },
      centerValue: `${total} مشروع`
    };
  }, [stats]);

  const revenueExpensesChart = useMemo(() => {
    const labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

    // بيانات تجريبية للإيرادات والمصروفات
    const revenues = [1.2, 1.5, 1.8, 2.1, 2.6, 2.2];
    const expenses = [0.9, 1.1, 1.3, 1.6, 1.8, 1.5];

    return {
      data: {
        labels,
        datasets: [
          {
            label: 'الإيرادات',
            data: revenues,
            fill: true,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: 'المصروفات',
            data: expenses,
            fill: true,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.15)',
            tension: 0.4,
            pointRadius: 3
          }
        ]
      }
    };
  }, []);

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => b.id - a.id)
        .slice(0, 4)
        .map((p, index) => ({
          ...p,
          progress: typeof p.progress === 'number' ? p.progress : fakeProgressForIndex(index)
        })),
    [projects]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="layout">
      {!authUser ? (
        activePage === 'register' ? (
          <RegisterPage
            onRegistered={(username) => {
              setAuthUser(username);
              try {
                localStorage.setItem('cm_auth_user', username);
              } catch {
                // ignore
              }
              setActivePage('dashboard');
            }}
            onGoLogin={() => setActivePage('login')}
          />
        ) : (
          <LoginPage
            onLoggedIn={(username) => {
              setAuthUser(username);
              try {
                localStorage.setItem('cm_auth_user', username);
              } catch {
                // ignore
              }
              setActivePage('dashboard');
            }}
            onGoRegister={() => setActivePage('register')}
          />
        )
      ) : null}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-icon">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="logo"
                style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              '🏢'
            )}
          </div>
          <div>
            <div className="sidebar-title">شركة الإنجاز للمقاولات</div>
            <div className="sidebar-subtitle">نظام الإدارة المتكامل</div>
          </div>
          <button
            className="mobile-nav-toggle"
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="فتح القائمة"
          >
            ☰
          </button>
        </div>

        {mobileNavOpen && (
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <nav
          className={`sidebar-nav ${mobileNavOpen ? 'open' : ''}`}
          onClick={() => setMobileNavOpen(false)}
        >
          <button
            className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            <span className="nav-icon">▦</span>
            <span>لوحة التحكم</span>
          </button>
          <button
            className={`nav-item ${activePage === 'projects' ? 'active' : ''}`}
            onClick={() => setActivePage('projects')}
          >
            <span className="nav-icon">📁</span>
            <span>المشروعات</span>
          </button>
          <button
            className={`nav-item ${activePage === 'statements' ? 'active' : ''}`}
            onClick={() => setActivePage('statements')}
          >
            <span className="nav-icon">📄</span>
            <span>المستخلصات</span>
          </button>
          <button
            className={`nav-item ${activePage === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActivePage('suppliers')}
          >
            <span className="nav-icon">🚚</span>
            <span>الموردين</span>
          </button>
          <button
            className={`nav-item ${activePage === 'employees' ? 'active' : ''}`}
            onClick={() => setActivePage('employees')}
          >
            <span className="nav-icon">👷</span>
            <span>العمّالة</span>
          </button>
          <button
            className={`nav-item ${activePage === 'equipment' ? 'active' : ''}`}
            onClick={() => setActivePage('equipment')}
          >
            <span className="nav-icon">🛠</span>
            <span>المعدات</span>
          </button>
          <button
            className={`nav-item ${activePage === 'payments' ? 'active' : ''}`}
            onClick={() => setActivePage('payments')}
          >
            <span className="nav-icon">💳</span>
            <span>الدفعات</span>
          </button>
          <button
            className={`nav-item ${activePage === 'profits-losses' ? 'active' : ''}`}
            onClick={() => setActivePage('profits-losses')}
          >
            <span className="nav-icon">📈</span>
            <span>الأرباح والخسائر</span>
          </button>
          <button
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>الإعدادات</span>
          </button>
        </nav>

        {/* sidebar footer removed */}
      </aside>

      <div className="main-area">
        {!authUser ? null : activePage === 'dashboard' ? (
          <>
            <header className="dashboard-header">
              <div>
                <h1>لوحة التحكم</h1>
                <p>نظرة عامة على أداء الشركة</p>
              </div>
            </header>

            <section className="stats-row">
          <div className="stat-card gradient-pink">
            <div className="stat-label">المصروفات</div>
            <div className="stat-value">٥٢٧٫٠٠٠ ر.س</div>
            <div className="stat-sub">إجمالي المدفوعات</div>
          </div>
          <div className="stat-card gradient-blue">
            <div className="stat-label">الإيرادات</div>
            <div className="stat-value">٨٥٠٫٠٠٠ ر.س</div>
            <div className="stat-sub">إجمالي المقبوضات</div>
          </div>
          <div className="stat-card gradient-green">
            <div className="stat-label">العمال النشطين</div>
            <div className="stat-value">٠ عامل</div>
            <div className="stat-sub">من إجمالي ٠ عامل</div>
          </div>
          <div className="stat-card gradient-orange">
            <div className="stat-label">المشاريع النشطة</div>
            <div className="stat-value">{stats.inProgress} مشروع</div>
            <div className="stat-sub">من {stats.totalProjects} مشروع</div>
          </div>
            </section>

            <section className="stats-row small">
          <div className="stat-card muted">
            <div className="stat-label">مستحقات الموردين</div>
            <div className="stat-value">٢٠٫٠٠٠ ر.س</div>
          </div>
          <div className="stat-card muted warning">
            <div className="stat-label">دفعات متأخرة</div>
            <div className="stat-value">٠ دفعات</div>
            <div className="stat-sub">تجاوزت موعد الاستحقاق</div>
          </div>
          <div className="stat-card muted">
            <div className="stat-label">دفعات معلّقة</div>
            <div className="stat-value">٤ دفعات</div>
            <div className="stat-sub">تحتاج للمتابعة</div>
          </div>
          <div className="stat-card muted">
            <div className="stat-label">متوسط إنجاز المشاريع</div>
            <div className="stat-value">{stats.avgProgress}%</div>
            <div className="stat-sub">نسبة تقديرية من كل المشاريع</div>
          </div>
            </section>

            <section className="charts-row">
          <div className="card chart-card">
            <div className="card-header">
              <h2>حالة المشاريع</h2>
            </div>
            <div className="chart-wrapper donut-wrapper">
              <Doughnut
                data={projectStatusChart.data}
                options={{
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  cutout: '70%'
                }}
              />
              <div className="donut-center">{projectStatusChart.centerValue}</div>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="dot planning" /> تخطيط
              </span>
              <span className="legend-item">
                <span className="dot completed" /> مكتمل
              </span>
              <span className="legend-item">
                <span className="dot in-progress" /> قيد التنفيذ
              </span>
              <span className="legend-item">
                <span className="dot stopped" /> متوقف
              </span>
            </div>
          </div>

          <div className="card chart-card">
            <div className="card-header">
              <h2>الإيرادات والمصروفات</h2>
            </div>
            <div className="chart-wrapper">
              <Line
                data={revenueExpensesChart.data}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      labels: {
                        color: '#e5e7eb'
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: { color: '#9ca3af' },
                      grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    },
                    y: {
                      ticks: { color: '#9ca3af' },
                      grid: { color: 'rgba(148, 163, 184, 0.2)' }
                    }
                  }
                }}
              />
            </div>
          </div>
            </section>

            <section className="charts-row">
          <div className="card wide-card">
            <div className="card-header">
              <h2>توزيع العمالة حسب التخصص</h2>
            </div>
            {!laborSpecializationChart.hasData ? (
              <div className="empty-chart-placeholder">
                <span>أضف عمالًا بتخصصاتهم لعرض التوزيع هنا</span>
              </div>
            ) : (
              <div className="chart-wrapper donut-wrapper" style={{ minHeight: 260 }}>
                <Doughnut
                  data={laborSpecializationChart.data}
                  options={{
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: '#e5e7eb' }
                      }
                    },
                    cutout: '65%'
                  }}
                />
              </div>
            )}
          </div>
            </section>

            <section className="bottom-row">
          <div className="card recent-projects-card">
            <div className="card-header">
              <h2>المشاريع الأخيرة</h2>
            </div>
            <div className="recent-projects-list">
              {recentProjects.map((p) => (
                <div key={p.id} className="recent-project-item">
                  <div className="recent-project-main">
                    <div>
                      <div className="recent-project-name">{p.name}</div>
                      <div className="recent-project-code">{p.code}</div>
                    </div>
                    <div className={`status-pill ${p.status.toLowerCase()}`}>
                      {translateStatus(p.status)}
                    </div>
                  </div>
                  <div className="progress-row">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="progress-label">{p.progress}%</span>
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="empty-text">لا توجد مشاريع بعد، أضف بعض المشاريع من خلال واجهة الـ API.</p>
              )}
            </div>
          </div>
            </section>
          </>
        ) : activePage === 'projects' ? (
          <ProjectsPage projects={projects} clients={clients} />
        ) : activePage === 'statements' ? (
          <StatementsPage projects={projects} />
        ) : activePage === 'suppliers' ? (
          <SuppliersPage suppliers={suppliers} onSupplierCreated={(s) => setSuppliers((p) => [...p, s])} />
        ) : activePage === 'employees' ? (
          <EmployeesPage
            projects={projects}
            employees={employees}
            onEmployeeCreated={(emp) => setEmployees((prev) => [...prev, emp])}
            onEmployeeDeleted={(id) =>
              setEmployees((prev) => prev.filter((e) => e.id !== id))
            }
          />
        ) : activePage === 'equipment' ? (
          <EquipmentPage
            projects={projects}
            equipment={equipment}
            onEquipmentCreated={(eq) => setEquipment((prev) => [...prev, eq])}
            onEquipmentDeleted={(id) =>
              setEquipment((prev) => prev.filter((e) => e.id !== id))
            }
          />
        ) : activePage === 'payments' ? (
          <PaymentsPage
            projects={projects}
            payments={payments}
            onPaymentCreated={(p) => setPayments((prev) => [...prev, p])}
            onPaymentDeleted={(id) =>
              setPayments((prev) => prev.filter((p) => p.id !== id))
            }
          />
        ) : activePage === 'profits-losses' ? (
          <ProfitsLossesPage
            projects={projects}
            payments={payments}
            statements={statements}
            employees={employees}
            equipment={equipment}
          />
        ) : activePage === 'settings' ? (
          <SettingsPage
            authUser={authUser}
            onLogout={() => {
              setAuthUser(null);
              try {
                localStorage.removeItem('cm_auth_user');
              } catch {
                // ignore
              }
              setActivePage('login');
            }}
            onGoLogin={() => setActivePage('login')}
            logoDataUrl={logoDataUrl}
            bgDataUrl={bgDataUrl}
            onPickLogo={(dataUrl) => {
              setLogoDataUrl(dataUrl);
              try {
                localStorage.setItem('cm_brand_logo', dataUrl);
              } catch {
                // ignore
              }
            }}
            onPickBg={(dataUrl) => {
              setBgDataUrl(dataUrl);
              try {
                localStorage.setItem('cm_brand_bg', dataUrl);
              } catch {
                // ignore
              }
            }}
            onClearBranding={() => {
              setLogoDataUrl(null);
              setBgDataUrl(null);
              try {
                localStorage.removeItem('cm_brand_logo');
                localStorage.removeItem('cm_brand_bg');
              } catch {
                // ignore
              }
            }}
          />
        ) : (
          <SettingsPage
            authUser={authUser}
            onLogout={() => {
              setAuthUser(null);
              try {
                localStorage.removeItem('cm_auth_user');
              } catch {
                // ignore
              }
              setActivePage('login');
            }}
            onGoLogin={() => setActivePage('login')}
            logoDataUrl={logoDataUrl}
            bgDataUrl={bgDataUrl}
            onPickLogo={(dataUrl) => {
              setLogoDataUrl(dataUrl);
              try {
                localStorage.setItem('cm_brand_logo', dataUrl);
              } catch {
                // ignore
              }
            }}
            onPickBg={(dataUrl) => {
              setBgDataUrl(dataUrl);
              try {
                localStorage.setItem('cm_brand_bg', dataUrl);
              } catch {
                // ignore
              }
            }}
            onClearBranding={() => {
              setLogoDataUrl(null);
              setBgDataUrl(null);
              try {
                localStorage.removeItem('cm_brand_logo');
                localStorage.removeItem('cm_brand_bg');
              } catch {
                // ignore
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function translateStatus(status: Project['status']): string {
  switch (status) {
    case 'PLANNED':
      return 'تخطيط';
    case 'IN_PROGRESS':
      return 'قيد التنفيذ';
    case 'COMPLETED':
      return 'مكتمل';
    case 'ON_HOLD':
      return 'متوقف';
    default:
      return status;
  }
}

function fakeProgressForIndex(index: number): number {
  const values = [0, 85, 6, 0];
  return values[index] ?? 0;
}

type ProjectsPageProps = {
  projects: Project[];
  clients: Client[];
};

function ProjectsPage({ projects, clients }: ProjectsPageProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<Project['status']>('PLANNED');
  const [progress, setProgress] = useState('0');

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [projects, statusFilter, search]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !clientId) return;
    try {
      if (editing) {
        await updateProject(editing.id, {
          code,
          name,
          clientId: Number(clientId),
          budget: budget ? Number(budget) : undefined,
          location: location || undefined,
          status,
          progress: Number(progress) || 0
        });
      } else {
        await createProject({
          code,
          name,
          clientId: Number(clientId),
          budget: budget ? Number(budget) : undefined,
          location: location || undefined,
          status,
          progress: Number(progress) || 0
        });
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('تعذر حفظ المشروع. تأكد من البيانات (والكود غير مكرر).');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا المشروع؟ سيتم حذف المستخلصات المرتبطة به.')) return;
    try {
      await deleteProject(id);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('تعذر حذف المشروع.');
    }
  };

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div>
          <h1>المشروعات</h1>
          <p>إدارة ومتابعة جميع المشروعات</p>
        </div>
        <button
          className="btn-accent"
          onClick={() => {
            setEditing(null);
            setCode('');
            setName('');
            setClientId('');
            setBudget('');
            setLocation('');
            setStatus('PLANNED');
            setProgress('0');
            setShowModal(true);
          }}
        >
          إضافة مشروع +
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="projects-filters">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            جميع الحالات
          </button>
          <button
            className={`filter-chip ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            قيد التنفيذ
          </button>
          <button
            className={`filter-chip ${statusFilter === 'PLANNED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PLANNED')}
          >
            تخطيط
          </button>
          <button
            className={`filter-chip ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            مكتمل
          </button>
          <button
            className={`filter-chip ${statusFilter === 'ON_HOLD' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ON_HOLD')}
          >
            متوقف
          </button>
        </div>
        <input
          className="projects-search"
          placeholder="ابحث في المشروعات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="project-cards-grid">
        {filtered.map((p) => (
          <article key={p.id} className="project-card">
            <div className="project-card-header">
              <span className={`status-pill small ${p.status.toLowerCase()}`}>
                {translateStatus(p.status)}
              </span>
              <div className="actions-cell">
                <button className="icon-button danger" onClick={() => handleDelete(p.id)}>
                  🗑
                </button>
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditing(p);
                    setCode(p.code);
                    setName(p.name);
                    setClientId(String(p.clientId));
                    setBudget(p.budget ? String(p.budget) : '');
                    setLocation(p.location ?? '');
                    setStatus(p.status);
                    setProgress(String(typeof p.progress === 'number' ? p.progress : 0));
                    setShowModal(true);
                  }}
                >
                  ✏️
                </button>
              </div>
            </div>
            <div className="project-card-body">
              <h3 className="project-title">{p.name}</h3>
              <p className="project-sub">الكود: {p.code}</p>
              <p className="project-sub">العميل: {p.client?.name ?? '-'}</p>
            </div>
            <div className="project-card-footer">
              <div className="progress-row">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${typeof p.progress === 'number' ? p.progress : 0}%` }}
                  />
                </div>
                <span className="progress-label">
                  {typeof p.progress === 'number' ? p.progress : 0}%
                </span>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-text">لا توجد مشروعات تطابق معايير البحث الحالية.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل مشروع' : 'إضافة مشروع جديد'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>الكود</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>اسم المشروع</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>العميل</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                  <option value="">اختر العميل</option>
                  {clients.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>الميزانية</label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>الموقع</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="form-row">
                <label>الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Project['status'])}
                >
                  <option value="PLANNED">تخطيط</option>
                  <option value="IN_PROGRESS">قيد التنفيذ</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="ON_HOLD">متوقف</option>
                </select>
              </div>
              <div className="form-row">
                <label>نسبة الإنجاز (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type StatementsPageProps = {
  projects: Project[];
};

function StatementsPage({ projects }: StatementsPageProps) {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Statement | null>(null);

  const [projectId, setProjectId] = useState<number | ''>('');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'REVIEW' | 'PENDING' | 'PAID'>('REVIEW');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStatements();
        setStatements(data);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('تعذر تحميل المستخلصات');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !number || !amount || !date) return;
    try {
      if (editing) {
        const updated = await updateStatement(editing.id, {
          projectId: Number(projectId),
          number,
          amount: Number(amount),
          date,
          description,
          status
        });
        setStatements((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...updated } : s)));
      } else {
        const created = await createStatement({
          projectId: Number(projectId),
          number,
          amount: Number(amount),
          date,
          description,
          status
        });
        setStatements((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditing(null);
      setProjectId('');
      setNumber('');
      setAmount('');
      setDate('');
      setDescription('');
      setStatus('REVIEW');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة المستخلص، تأكد من صحة البيانات.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا المستخلص؟')) return;
    try {
      await deleteStatement(id);
      setStatements((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('تعذر حذف المستخلص.');
    }
  };

  return (
    <div className="statements-page">
      <header className="projects-header">
        <div>
          <h1>المستخلصات</h1>
          <p>إدارة مستخلصات المشاريع والفواتير</p>
        </div>
        <button className="btn-accent" onClick={() => setShowModal(true)}>
          إضافة مستخلص +
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="projects-toolbar">
        <button className="filter-chip active">جميع الحالات</button>
        <input className="projects-search" placeholder="ابحث في المستخلصات..." />
      </div>

      <div className="statements-table-wrapper">
        <table className="statements-table">
          <thead>
            <tr>
              <th>رقم المستخلص</th>
              <th>المشروع</th>
              <th>الوصف</th>
              <th>المبلغ</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>جاري تحميل البيانات...</td>
              </tr>
            ) : statements.length === 0 ? (
              <tr>
                <td colSpan={7}>لا توجد مستخلصات بعد.</td>
              </tr>
            ) : (
              statements.map((s) => (
                <tr key={s.id}>
                  <td>{s.number}</td>
                  <td>{s.project?.name ?? 'غير معروف'}</td>
                  <td>{s.description ?? '-'}</td>
                  <td>{s.amount.toLocaleString() + ' ر.س'}</td>
                  <td>{s.date}</td>
                  <td>
                    <span className={`status-pill ${s.status.toLowerCase()}`}>
                      {translateStatementStatus(s.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="icon-button danger" onClick={() => handleDelete(s.id)}>
                      🗑
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditing(s);
                        setProjectId(s.projectId);
                        setNumber(s.number);
                        setAmount(String(s.amount));
                        setDate(s.date);
                        setDescription(s.description ?? '');
                        setStatus(s.status);
                        setShowModal(true);
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل مستخلص' : 'إضافة مستخلص جديد'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>المشروع</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">اختر المشروع</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>رقم المستخلص</label>
                <input value={number} onChange={(e) => setNumber(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>المبلغ (ريال)</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>الوصف</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                >
                  <option value="REVIEW">قيد المراجعة</option>
                  <option value="PENDING">مستحق</option>
                  <option value="PAID">مدفوع</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function translateStatementStatus(status: Statement['status']): string {
  switch (status) {
    case 'PAID':
      return 'مدفوع';
    case 'PENDING':
      return 'مستحق';
    case 'REVIEW':
    default:
      return 'قيد المراجعة';
  }
}

type SuppliersPageProps = {
  suppliers: Supplier[];
  onSupplierCreated: (s: Supplier) => void;
};

function SuppliersPage({ suppliers, onSupplierCreated }: SuppliersPageProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [materials, setMaterials] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 يوم');
  const [balance, setBalance] = useState('0');

  const filtered = useMemo(
    () =>
      suppliers.filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.companyName.toLowerCase().includes(q) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
        );
      }),
    [suppliers, search]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;
    try {
      if (editing) {
        const updated = await updateSupplier(editing.id, {
          companyName,
          contactPerson,
          phone,
          email,
          materials,
          paymentTerms,
          balance: Number(balance) || 0
        });
        // أبسط: أعد تحميل الصفحة لتحديث القائمة
        window.location.reload();
      } else {
        const created = await createSupplier({
          companyName,
          contactPerson,
          phone,
          email,
          materials,
          paymentTerms,
          balance: Number(balance) || 0
        });
        onSupplierCreated(created);
      }
      setShowModal(false);
      setEditing(null);
      setCompanyName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setMaterials('');
      setPaymentTerms('30 يوم');
      setBalance('0');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة المورد، تأكد من صحة البيانات.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا المورد؟')) return;
    try {
      await deleteSupplier(id);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('تعذر حذف المورد.');
    }
  };

  return (
    <div className="suppliers-page">
      <header className="projects-header">
        <div>
          <h1>الموردين</h1>
          <p>إدارة قاعدة بيانات الموردين</p>
        </div>
        <button className="btn-accent" onClick={() => setShowModal(true)}>
          إضافة مورد +
        </button>
      </header>

      <div className="projects-toolbar">
        <input
          className="projects-search"
          placeholder="ابحث في الموردين..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="supplier-cards-grid">
        {filtered.map((s) => (
          <article key={s.id} className="supplier-card">
            <header className="supplier-card-header">
              <div>
                <h3 className="supplier-name">{s.companyName}</h3>
                {s.contactPerson && <p className="supplier-sub">{s.contactPerson}</p>}
              </div>
              <div className="supplier-icon">🚚</div>
            </header>
            <div className="supplier-body">
              {s.phone && (
                <p className="supplier-row">
                  <span>📞 {s.phone}</span>
                </p>
              )}
              {s.email && (
                <p className="supplier-row">
                  <span>✉️ {s.email}</span>
                </p>
              )}
              {s.materials && (
                <p className="supplier-row">
                  <span className="label">المواد الموردة:</span> {s.materials}
                </p>
              )}
            </div>
            <footer className="supplier-footer">
              <div className="supplier-balance">
                الرصيد المستحق:{' '}
                <span className={s.balance && s.balance > 0 ? 'balance-negative' : 'balance-positive'}>
                  {s.balance?.toLocaleString() ?? 0} ر.س
                </span>
              </div>
              <div className="actions-cell">
                <button className="icon-button danger" onClick={() => handleDelete(s.id)}>
                  🗑
                </button>
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditing(s);
                    setCompanyName(s.companyName);
                    setContactPerson(s.contactPerson ?? '');
                    setPhone(s.phone ?? '');
                    setEmail(s.email ?? '');
                    setMaterials(s.materials ?? '');
                    setPaymentTerms(s.paymentTerms ?? '30 يوم');
                    setBalance(String(s.balance ?? 0));
                    setShowModal(true);
                  }}
                >
                  ✏️
                </button>
              </div>
            </footer>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-text">لا يوجد موردون يطابقون البحث الحالي.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل مورد' : 'إضافة مورد جديد'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>اسم الشركة</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>مسؤول التواصل</label>
                <input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>الهاتف</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-row">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>المواد الموردة (مفصولة بفاصلة)</label>
                <input
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="حديد، أسمنت، رمل"
                />
              </div>
              <div className="form-row">
                <label>شروط الدفع</label>
                <input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>الرصيد المستحق</label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type EmployeesPageProps = {
  projects: Project[];
  employees: Employee[];
  onEmployeeCreated: (e: Employee) => void;
  onEmployeeDeleted: (id: number) => void;
};

function EmployeesPage({
  projects,
  employees,
  onEmployeeCreated,
  onEmployeeDeleted
}: EmployeesPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Employee['status']>('all');
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [specialization, setSpecialization] = useState('عمالة عامة');
  const [dailyWage, setDailyWage] = useState('0');
  const [phone, setPhone] = useState('');
  const [projectName, setProjectName] = useState('غير معين');
  const [status, setStatus] = useState<Employee['status']>('ACTIVE');
  const [editing, setEditing] = useState<Employee | null>(null);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !e.name.toLowerCase().includes(q) &&
            !e.jobTitle.toLowerCase().includes(q) &&
            !e.specialization.toLowerCase().includes(q) &&
            !(e.projectName && e.projectName.toLowerCase().includes(q))
          ) {
            return false;
          }
        }
        return true;
      }),
    [employees, search, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !jobTitle || !specialization) return;
    try {
      if (editing) {
        const updated = await updateEmployee(editing.id, {
          name,
          jobTitle,
          specialization,
          dailyWage: Number(dailyWage) || 0,
          phone,
          projectName,
          status
        });
        onEmployeeDeleted(editing.id);
        onEmployeeCreated(updated);
      } else {
        const created = await createEmployee({
          name,
          jobTitle,
          specialization,
          dailyWage: Number(dailyWage) || 0,
          phone,
          projectName,
          status
        });
        onEmployeeCreated(created);
      }
      setShowModal(false);
      setEditing(null);
      setName('');
      setJobTitle('');
      setSpecialization('عمالة عامة');
      setDailyWage('0');
      setPhone('');
      setProjectName('غير معين');
      setStatus('ACTIVE');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة العامل، تأكد من صحة البيانات.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا العامل؟')) return;
    try {
      await deleteEmployee(id);
      onEmployeeDeleted(id);
    } catch (err) {
      console.error(err);
      alert('تعذر حذف العامل.');
    }
  };

  return (
    <div className="employees-page">
      <header className="projects-header">
        <div>
          <h1>العمّالة</h1>
          <p>إدارة العمال والموظفين</p>
        </div>
        <button className="btn-accent" onClick={() => setShowModal(true)}>
          إضافة عامل +
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="projects-filters">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            جميع الحالات
          </button>
          <button
            className={`filter-chip ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            نشط
          </button>
          <button
            className={`filter-chip ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            غير نشط
          </button>
        </div>
        <input
          className="projects-search"
          placeholder="ابحث في العمّال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="statements-table-wrapper">
        <table className="statements-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الوظيفة</th>
              <th>التخصص</th>
              <th>الأجر اليومي</th>
              <th>الهاتف</th>
              <th>المشروع</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>لا يوجد عمال</td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.jobTitle}</td>
                  <td>{emp.specialization}</td>
                  <td>{emp.dailyWage.toLocaleString()} ر.س</td>
                  <td>{emp.phone ?? '-'}</td>
                  <td>{emp.projectName ?? 'غير معين'}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        emp.status === 'ACTIVE' ? 'completed' : 'on_hold'
                      }`}
                    >
                      {emp.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-button danger"
                      onClick={() => handleDelete(emp.id)}
                    >
                      🗑
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditing(emp);
                        setName(emp.name);
                        setJobTitle(emp.jobTitle);
                        setSpecialization(emp.specialization ?? 'عمالة عامة');
                        setDailyWage(String(emp.dailyWage));
                        setPhone(emp.phone ?? '');
                        setProjectName(emp.projectName ?? 'غير معين');
                        setStatus(emp.status);
                        setShowModal(true);
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل عامل' : 'إضافة عامل جديد'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>الاسم</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>الوظيفة</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>التخصص</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                >
                  <option value="عمالة عامة">عمالة عامة</option>
                  <option value="نجارة">نجارة</option>
                  <option value="حدادة">حدادة</option>
                  <option value="كهرباء">كهرباء</option>
                  <option value="سباكة">سباكة</option>
                  <option value="محارة">محارة</option>
                  <option value="دهانات">دهانات</option>
                  <option value="مسّاح">مسّاح</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <div className="form-row">
                <label>الأجر اليومي (ريال)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>الهاتف</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-row">
                <label>المشروع</label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                >
                  <option value="غير معين">غير معين</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>الحالة</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Employee['status'])
                  }
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="INACTIVE">غير نشط</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type EquipmentPageProps = {
  projects: Project[];
  equipment: Equipment[];
  onEquipmentCreated: (e: Equipment) => void;
  onEquipmentDeleted: (id: number) => void;
};

function EquipmentPage({
  projects,
  equipment,
  onEquipmentCreated,
  onEquipmentDeleted
}: EquipmentPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Equipment['status']>('all');
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [dailyCost, setDailyCost] = useState('0');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [projectName, setProjectName] = useState('غير معين');
  const [status, setStatus] = useState<Equipment['status']>('AVAILABLE');
  const [editing, setEditing] = useState<Equipment | null>(null);

  const filtered = useMemo(
    () =>
      equipment.filter((e) => {
        if (statusFilter !== 'all' && e.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !e.name.toLowerCase().includes(q) &&
            !e.type.toLowerCase().includes(q) &&
            !(e.projectName && e.projectName.toLowerCase().includes(q))
          ) {
            return false;
          }
        }
        return true;
      }),
    [equipment, search, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type) return;
    try {
      if (editing) {
        const updated = await updateEquipment(editing.id, {
          name,
          type,
          dailyCost: Number(dailyCost) || 0,
          maintenanceDate: maintenanceDate || undefined,
          projectName,
          status
        });
        onEquipmentDeleted(editing.id);
        onEquipmentCreated(updated);
      } else {
        const created = await createEquipment({
          name,
          type,
          dailyCost: Number(dailyCost) || 0,
          maintenanceDate: maintenanceDate || undefined,
          projectName,
          status
        });
        onEquipmentCreated(created);
      }
      setShowModal(false);
      setEditing(null);
      setName('');
      setType('');
      setDailyCost('0');
      setMaintenanceDate('');
      setProjectName('غير معين');
      setStatus('AVAILABLE');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة المعدة، تأكد من صحة البيانات.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه المعدة؟')) return;
    try {
      await deleteEquipment(id);
      onEquipmentDeleted(id);
    } catch (err) {
      console.error(err);
      alert('تعذر حذف المعدة.');
    }
  };

  const translateEquipmentStatus = (status: Equipment['status']): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'متاح';
      case 'IN_USE':
        return 'قيد الاستخدام';
      case 'MAINTENANCE':
        return 'صيانة';
      default:
        return status;
    }
  };

  return (
    <div className="equipment-page">
      <header className="projects-header">
        <div>
          <h1>المعدات</h1>
          <p>إدارة المعدات والآليات</p>
        </div>
        <button className="btn-accent" onClick={() => setShowModal(true)}>
          إضافة معدة +
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="projects-filters">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            جميع الحالات
          </button>
          <button
            className={`filter-chip ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('AVAILABLE')}
          >
            متاح
          </button>
          <button
            className={`filter-chip ${statusFilter === 'IN_USE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('IN_USE')}
          >
            قيد الاستخدام
          </button>
          <button
            className={`filter-chip ${statusFilter === 'MAINTENANCE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('MAINTENANCE')}
          >
            صيانة
          </button>
        </div>
        <input
          className="projects-search"
          placeholder="ابحث في المعدات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="supplier-cards-grid">
        {filtered.map((eq) => (
          <article key={eq.id} className="supplier-card">
            <header className="supplier-card-header">
              <div>
                <h3 className="supplier-name">{eq.name}</h3>
                <p className="supplier-sub">{eq.type}</p>
              </div>
              <div className="supplier-icon">🛠</div>
            </header>
            <div className="supplier-body">
              <p className="supplier-row">
                <span className="label">التكلفة اليومية:</span>{' '}
                {eq.dailyCost.toLocaleString()} ر.س
              </p>
              {eq.projectName && (
                <p className="supplier-row">
                  <span className="label">المشروع:</span> {eq.projectName}
                </p>
              )}
              {eq.maintenanceDate && (
                <p className="supplier-row">
                  <span className="label">تاريخ الصيانة:</span> {eq.maintenanceDate}
                </p>
              )}
            </div>
            <footer className="supplier-footer">
              <div className="supplier-balance">
                <span
                  className={`status-pill ${
                    eq.status === 'AVAILABLE'
                      ? 'completed'
                      : eq.status === 'IN_USE'
                      ? 'in_progress'
                      : 'on_hold'
                  }`}
                >
                  {translateEquipmentStatus(eq.status)}
                </span>
              </div>
              <div className="actions-cell">
                <button
                  className="icon-button danger"
                  onClick={() => handleDelete(eq.id)}
                >
                  🗑
                </button>
                <button
                  className="icon-button"
                  onClick={() => {
                    setEditing(eq);
                    setName(eq.name);
                    setType(eq.type);
                    setDailyCost(String(eq.dailyCost));
                    setMaintenanceDate(eq.maintenanceDate || '');
                    setProjectName(eq.projectName || 'غير معين');
                    setStatus(eq.status);
                    setShowModal(true);
                  }}
                >
                  ✏️
                </button>
              </div>
            </footer>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="empty-text">لا توجد معدات تطابق معايير البحث الحالية.</p>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل معدة' : 'إضافة معدة جديدة'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>اسم المعدة</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>النوع</label>
                <input value={type} onChange={(e) => setType(e.target.value)} required />
              </div>
              <div className="form-row">
                <label>التكلفة اليومية (ريال)</label>
                <input
                  type="number"
                  min="0"
                  value={dailyCost}
                  onChange={(e) => setDailyCost(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>تاريخ الصيانة</label>
                <input
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>المشروع</label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                >
                  <option value="غير معين">غير معين</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>الحالة</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Equipment['status'])}
                >
                  <option value="AVAILABLE">متاح</option>
                  <option value="IN_USE">قيد الاستخدام</option>
                  <option value="MAINTENANCE">صيانة</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type PaymentsPageProps = {
  projects: Project[];
  payments: Payment[];
  onPaymentCreated: (p: Payment) => void;
  onPaymentDeleted: (id: number) => void;
};

function PaymentsPage({
  projects,
  payments,
  onPaymentCreated,
  onPaymentDeleted
}: PaymentsPageProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Payment['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Payment['status']>('all');
  const [showModal, setShowModal] = useState(false);

  const [type, setType] = useState<Payment['type']>('INCOMING');
  const [amount, setAmount] = useState('0');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('CASH');
  const [status, setStatus] = useState<Payment['status']>('PENDING');
  const [relatedParty, setRelatedParty] = useState('');
  const [editing, setEditing] = useState<Payment | null>(null);

  const filtered = useMemo(
    () =>
      payments.filter((p) => {
        if (typeFilter !== 'all' && p.type !== typeFilter) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !(p.description && p.description.toLowerCase().includes(q)) &&
            !(p.relatedParty && p.relatedParty.toLowerCase().includes(q))
          ) {
            return false;
          }
        }
        return true;
      }),
    [payments, search, typeFilter, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    try {
      if (editing) {
        const updated = await updatePayment(editing.id, {
          type,
          amount: Number(amount),
          date,
          dueDate: dueDate || undefined,
          description,
          paymentMethod,
          status,
          relatedParty: relatedParty || undefined
        });
        onPaymentDeleted(editing.id);
        onPaymentCreated(updated);
      } else {
        const created = await createPayment({
          type,
          amount: Number(amount),
          date,
          dueDate: dueDate || undefined,
          description,
          paymentMethod,
          status,
          relatedParty: relatedParty || undefined
        });
        onPaymentCreated(created);
      }
      setShowModal(false);
      setEditing(null);
      setType('INCOMING');
      setAmount('0');
      setDate('');
      setDueDate('');
      setDescription('');
      setPaymentMethod('CASH');
      setStatus('PENDING');
      setRelatedParty('');
    } catch (err) {
      console.error(err);
      alert('تعذر إضافة الدفعة، تأكد من صحة البيانات.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الدفعة؟')) return;
    try {
      await deletePayment(id);
      onPaymentDeleted(id);
    } catch (err) {
      console.error(err);
      alert('تعذر حذف الدفعة.');
    }
  };

  const translatePaymentType = (type: Payment['type']): string => {
    return type === 'INCOMING' ? 'وارد' : 'صادر';
  };

  const translatePaymentMethod = (method: Payment['paymentMethod']): string => {
    switch (method) {
      case 'CASH':
        return 'نقدي';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      case 'CHECK':
        return 'شيك';
      default:
        return method;
    }
  };

  const translatePaymentStatus = (status: Payment['status']): string => {
    return status === 'COMPLETED' ? 'مكتمل' : 'معلق';
  };

  return (
    <div className="payments-page">
      <header className="projects-header">
        <div>
          <h1>الدفعات</h1>
          <p>إدارة المدفوعات والمقبوضات</p>
        </div>
        <button className="btn-accent" onClick={() => setShowModal(true)}>
          إضافة دفعة +
        </button>
      </header>

      <div className="projects-toolbar">
        <div className="projects-filters">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            جميع الحالات
          </button>
          <button
            className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            جميع الأنواع
          </button>
        </div>
        <input
          className="projects-search"
          placeholder="البحث في الدفعات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="statements-table-wrapper">
        <table className="statements-table">
          <thead>
            <tr>
              <th>الإجراءات</th>
              <th>الحالة</th>
              <th>الجهة</th>
              <th>طريقة الدفع</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>الوصف</th>
              <th>النوع</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>لا توجد دفعات</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="actions-cell">
                    <button
                      className="icon-button danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      🗑
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditing(p);
                        setType(p.type);
                        setAmount(String(p.amount));
                        setDate(p.date);
                        setDueDate(p.dueDate || '');
                        setDescription(p.description || '');
                        setPaymentMethod(p.paymentMethod);
                        setStatus(p.status);
                        setRelatedParty(p.relatedParty || '');
                        setShowModal(true);
                      }}
                    >
                      ✏️
                    </button>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        p.status === 'COMPLETED' ? 'completed' : 'in_progress'
                      }`}
                    >
                      {translatePaymentStatus(p.status)}
                    </span>
                  </td>
                  <td>{p.relatedParty || '-'}</td>
                  <td>{translatePaymentMethod(p.paymentMethod)}</td>
                  <td>{p.date}</td>
                  <td
                    style={{
                      color: p.type === 'INCOMING' ? '#22c55e' : '#ef4444',
                      fontWeight: 600
                    }}
                  >
                    {p.type === 'INCOMING' ? '+' : '-'}
                    {Math.abs(p.amount).toLocaleString()} ر.س
                  </td>
                  <td>{p.description || '-'}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {p.type === 'INCOMING' ? '⬇️' : '⬆️'}{' '}
                      {translatePaymentType(p.type)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{editing ? 'تعديل دفعة' : 'إضافة دفعة جديدة'}</h2>
              <button className="icon-button" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </header>
            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>النوع</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Payment['type'])}
                  required
                >
                  <option value="INCOMING">وارد (مقبوضات)</option>
                  <option value="OUTGOING">صادر (مدفوعات)</option>
                </select>
              </div>
              <div className="form-row">
                <label>المبلغ (ريال)</label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-row">
                <label>تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>الوصف</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>طريقة الدفع</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['CASH', 'BANK_TRANSFER', 'CHECK'] as Payment['paymentMethod'][]).map(
                    (method) => (
                      <button
                        key={method}
                        type="button"
                        className={`filter-chip ${
                          paymentMethod === method ? 'active' : ''
                        }`}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {translatePaymentMethod(method)}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="form-row">
                <label>الحالة</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['PENDING', 'COMPLETED'] as Payment['status'][]).map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      className={`filter-chip ${status === stat ? 'active' : ''}`}
                      onClick={() => setStatus(stat)}
                    >
                      {translatePaymentStatus(stat)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>الجهة المرتبطة</label>
                <input
                  value={relatedParty}
                  onChange={(e) => setRelatedParty(e.target.value)}
                  placeholder="اسم المشروع أو الجهة"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-accent">
                  {editing ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

type ProfitsLossesPageProps = {
  projects: Project[];
  payments: Payment[];
  statements: Statement[];
  employees: Employee[];
  equipment: Equipment[];
};

function ProfitsLossesPage({
  projects,
  payments,
  statements,
  employees,
  equipment
}: ProfitsLossesPageProps) {
  // حساب الإيرادات من المستخلصات المدفوعة
  const totalRevenues = useMemo(() => {
    return statements
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [statements]);

  // حساب المصروفات من الدفعات الصادرة
  const totalExpenses = useMemo(() => {
    return payments
      .filter((p) => p.type === 'OUTGOING')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // حساب تكلفة العمال (نشطين فقط)
  const laborCost = useMemo(() => {
    return employees
      .filter((e) => e.status === 'ACTIVE')
      .reduce((sum, e) => sum + e.dailyWage * 30, 0); // تقدير شهري
  }, [employees]);

  // حساب تكلفة المعدات (قيد الاستخدام)
  const equipmentCost = useMemo(() => {
    return equipment
      .filter((eq) => eq.status === 'IN_USE')
      .reduce((sum, eq) => sum + eq.dailyCost * 30, 0); // تقدير شهري
  }, [equipment]);

  // حساب قيمة العقود
  const contractValue = useMemo(() => {
    return projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  }, [projects]);

  // حساب صافي الربح
  const netProfit = totalRevenues - totalExpenses;
  const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

  // توزيع المصروفات
  const expensesDistribution = useMemo(() => {
    const materials = payments
      .filter((p) => p.type === 'OUTGOING' && p.description?.includes('مواد'))
      .reduce((sum, p) => sum + p.amount, 0);
    const other = totalExpenses - materials - laborCost - equipmentCost;
    const admin = other * 0.2; // تقدير
    const otherExpenses = other * 0.8;

    return {
      materials: materials || 0,
      labor: laborCost || 0,
      equipment: equipmentCost || 0,
      admin: admin || 0,
      other: otherExpenses || 0
    };
  }, [payments, totalExpenses, laborCost, equipmentCost]);

  // بيانات الأداء المالي الشهري (تجريبية)
  const monthlyPerformance = useMemo(() => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];
    const revenues = [1.2, 1.5, 2.0, 2.1, 5.5, 4.2];
    const expenses = [0.9, 1.1, 1.3, 1.6, 2.8, 2.5];
    const profits = revenues.map((r, i) => r - expenses[i]);

    return {
      labels: months,
      revenues,
      expenses,
      profits
    };
  }, []);

  // اتجاه الأرباح
  const profitTrend = useMemo(() => {
    return {
      labels: monthlyPerformance.labels,
      data: monthlyPerformance.profits
    };
  }, [monthlyPerformance]);

  // قيمة المشاريع
  const projectValues = useMemo(() => {
    return projects
      .map((p) => ({
        name: p.name,
        value: p.budget || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [projects]);

  // ملخص المستخلصات
  const paidStatements = useMemo(() => {
    return statements.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + s.amount, 0);
  }, [statements]);

  const pendingStatements = useMemo(() => {
    return statements.filter((s) => s.status === 'PENDING').reduce((sum, s) => sum + s.amount, 0);
  }, [statements]);

  const donutChartData = {
    labels: ['مواد البناء', 'أجور العمال', 'إيجار المعدات', 'مصاريف إدارية', 'أخرى'],
    datasets: [
      {
        data: [
          expensesDistribution.materials,
          expensesDistribution.labor,
          expensesDistribution.equipment,
          expensesDistribution.admin,
          expensesDistribution.other
        ],
        backgroundColor: ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#9ca3af'],
        borderWidth: 0
      }
    ]
  };

  const barChartData = {
    labels: monthlyPerformance.labels,
    datasets: [
      {
        label: 'الإيرادات',
        data: monthlyPerformance.revenues,
        backgroundColor: '#22c55e'
      },
      {
        label: 'المصروفات',
        data: monthlyPerformance.expenses,
        backgroundColor: '#ef4444'
      },
      {
        label: 'الربح',
        data: monthlyPerformance.profits,
        backgroundColor: '#f97316'
      }
    ]
  };

  const lineChartData = {
    labels: profitTrend.labels,
    datasets: [
      {
        label: 'صافي الربح',
        data: profitTrend.data,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#f97316'
      }
    ]
  };

  const horizontalBarData = {
    labels: projectValues.map((p) => p.name),
    datasets: [
      {
        label: 'قيمة العقد',
        data: projectValues.map((p) => p.value / 1000000), // تحويل لملايين
        backgroundColor: '#f97316'
      }
    ]
  };

  return (
    <div className="profits-losses-page">
      <header className="projects-header">
        <div>
          <h1>الأرباح والخسائر</h1>
          <p>التقارير المالية وتحليل الأداء</p>
        </div>
      </header>

      {/* كروت الإحصائيات الرئيسية */}
      <section className="stats-row">
        <div className="stat-card gradient-orange">
          <div className="stat-label">قيمة العقود</div>
          <div className="stat-value">{(contractValue / 1000000).toFixed(2)}م ر.س</div>
          <div className="stat-sub">مكتمل: • ر.س</div>
        </div>
        <div className="stat-card gradient-red">
          <div className="stat-label">صافي الربح</div>
          <div className="stat-value">
            {netProfit >= 0 ? '+' : ''}
            {netProfit.toLocaleString()} ر.س
          </div>
          <div className="stat-sub">هامش الربح: {profitMargin.toFixed(1)}%</div>
        </div>
        <div className="stat-card gradient-red">
          <div className="stat-label">إجمالي المصروفات</div>
          <div className="stat-value">{totalExpenses.toLocaleString()} ر.س</div>
        </div>
        <div className="stat-card gradient-green">
          <div className="stat-label">إجمالي الإيرادات</div>
          <div className="stat-value">{totalRevenues.toLocaleString()} ر.س</div>
        </div>
      </section>

      {/* المخططات */}
      <section className="charts-row">
        <div className="card chart-card">
          <div className="card-header">
            <h2>توزيع المصروفات</h2>
          </div>
          <div className="chart-wrapper donut-wrapper">
            <Doughnut
              data={donutChartData}
              options={{
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      color: '#e5e7eb',
                      padding: 10,
                      font: { size: 11 }
                    }
                  }
                },
                cutout: '60%'
              }}
            />
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <h2>ملخص المستخلصات</h2>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>مستخلصات مدفوعة:</span>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>
                {paidStatements.toLocaleString()} ر.س
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>مستخلصات معلقة:</span>
              <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                {pendingStatements.toLocaleString()} ر.س
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.2)'
              }}
            >
              <span style={{ fontWeight: 600 }}>الإجمالي:</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {(paidStatements + pendingStatements).toLocaleString()} ر.س
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card wide-card">
          <div className="card-header">
            <h2>الأداء المالي الشهري</h2>
          </div>
          <div className="chart-wrapper">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    labels: {
                      color: '#e5e7eb'
                    }
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' }
                  },
                  y: {
                    ticks: {
                      color: '#9ca3af',
                      callback: function (value) {
                        return value + 'م';
                      }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' }
                  }
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className="charts-row">
        <div className="card chart-card">
          <div className="card-header">
            <h2>اتجاه الأرباح</h2>
          </div>
          <div className="chart-wrapper">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' }
                  },
                  y: {
                    ticks: {
                      color: '#9ca3af',
                      callback: function (value) {
                        return value + 'م';
                      }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="card chart-card">
          <div className="card-header">
            <h2>قيمة المشاريع</h2>
          </div>
          <div className="chart-wrapper">
            <Bar
              data={horizontalBarData}
              options={{
                indexAxis: 'y',
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  x: {
                    ticks: {
                      color: '#9ca3af',
                      callback: function (value) {
                        return value + 'م';
                      }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.2)' }
                  },
                  y: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type SettingsPageProps = {
  authUser: string | null;
  onLogout: () => void;
  onGoLogin: () => void;
  logoDataUrl: string | null;
  bgDataUrl: string | null;
  onPickLogo: (dataUrl: string) => void;
  onPickBg: (dataUrl: string) => void;
  onClearBranding: () => void;
};

function SettingsPage({
  authUser,
  onLogout,
  onGoLogin,
  logoDataUrl,
  bgDataUrl,
  onPickLogo,
  onPickBg,
  onClearBranding
}: SettingsPageProps) {
  const readFileAsDataUrl = (file: File, cb: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') cb(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="settings-page">
      <header className="projects-header">
        <div>
          <h1>الإعدادات</h1>
          <p>معلومات النظام وتفضيلات العرض</p>
        </div>
      </header>

      <section className="settings-grid">
        <div className="card settings-card">
          <div className="card-header">
            <h2>الحساب</h2>
          </div>
          <div className="settings-body">
            <div className="settings-row">
              <span className="settings-label">الحالة</span>
              <span className="settings-value">{authUser ? `مسجل دخول: ${authUser}` : 'غير مسجل'}</span>
            </div>
            <div className="settings-actions">
              {authUser ? (
                <button className="btn-secondary" onClick={onLogout}>
                  تسجيل الخروج
                </button>
              ) : (
                <button className="btn-accent" onClick={onGoLogin}>
                  تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-header">
            <h2>الهوية البصرية</h2>
          </div>
          <div className="settings-body">
            <div className="settings-row">
              <span className="settings-label">الشعار</span>
              <span className="settings-value">{logoDataUrl ? 'مضاف' : 'غير مضاف'}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">الخلفية</span>
              <span className="settings-value">{bgDataUrl ? 'مضافة' : 'غير مضافة'}</span>
            </div>
            <div className="settings-actions">
              <label className="btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                إضافة الشعار
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    readFileAsDataUrl(f, onPickLogo);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <label className="btn-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                إضافة الخلفية
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    readFileAsDataUrl(f, onPickBg);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <button className="btn-secondary" onClick={onClearBranding}>
                حذف الشعار/الخلفية
              </button>
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-header">
            <h2>معلومات النظام</h2>
          </div>
          <div className="settings-body">
            <div className="settings-row">
              <span className="settings-label">الإصدار</span>
              <span className="settings-value">1.0.0</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">اللغة</span>
              <span className="settings-value">العربية</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">المنطقة الزمنية</span>
              <span className="settings-value">(GMT+3) توقيت الرياض</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">العملة</span>
              <span className="settings-value">ريال سعودي (SAR)</span>
            </div>
          </div>
        </div>

        <div className="card settings-card wide-card">
          <div className="card-header">
            <h2>عن النظام</h2>
          </div>
          <div className="settings-about">
            نظام إدارة شركات المقاولات هو حل متكامل لإدارة جميع جوانب أعمال المقاولات،
            من إدارة المشاريع والموردين والعمّالة إلى تتبع المدفوعات والمستخلصات وتحليل
            الأرباح والخسائر. تم تصميم النظام ليكون سهل الاستخدام وفعّال في تحسين إنتاجية
            شركتك واتخاذ قرارات أفضل مبنية على بيانات دقيقة ومحدّثة.
          </div>
        </div>
      </section>
    </div>
  );
}

type LoginPageProps = {
  onLoggedIn: (username: string) => void;
  onGoRegister: () => void;
};

function LoginPage({ onLoggedIn, onGoRegister }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const raw = localStorage.getItem('cm_users');
      const users: Array<{ username: string; password: string }> = raw ? JSON.parse(raw) : [];
      const found = users.find((u) => u.username === username && u.password === password);
      if (!found) {
        alert('بيانات الدخول غير صحيحة');
        return;
      }
      onLoggedIn(username);
    } catch (err) {
      console.error(err);
      alert('تعذر تسجيل الدخول');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">تسجيل الدخول</div>
        <div className="auth-sub">ادخل بياناتك للوصول للنظام</div>
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-row">
            <label>اسم المستخدم</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="auth-actions">
            <button type="submit" className="btn-accent">
              تسجيل الدخول
            </button>
            <button type="button" className="btn-secondary" onClick={onGoRegister}>
              إنشاء حساب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type RegisterPageProps = {
  onRegistered: (username: string) => void;
  onGoLogin: () => void;
};

function RegisterPage({ onRegistered, onGoLogin }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('كلمة المرور غير متطابقة');
      return;
    }
    try {
      const raw = localStorage.getItem('cm_users');
      const users: Array<{ username: string; password: string }> = raw ? JSON.parse(raw) : [];
      if (users.some((u) => u.username === username)) {
        alert('اسم المستخدم مستخدم بالفعل');
        return;
      }
      users.push({ username, password });
      localStorage.setItem('cm_users', JSON.stringify(users));
      onRegistered(username);
    } catch (err) {
      console.error(err);
      alert('تعذر إنشاء الحساب');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">إنشاء حساب</div>
        <div className="auth-sub">أنشئ حسابًا جديدًا للوصول للنظام</div>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-row">
            <label>اسم المستخدم</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <div className="auth-actions">
            <button type="submit" className="btn-accent">
              تسجيل
            </button>
            <button type="button" className="btn-secondary" onClick={onGoLogin}>
              لدي حساب بالفعل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



