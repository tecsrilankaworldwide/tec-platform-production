import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './auth/AuthContext';
import { 
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Search, 
  ChevronLeft, ChevronRight, UserPlus, Calendar, CheckCircle, XCircle,
  PlusCircle, Trash2, Edit2, Wallet, Receipt, CreditCard, Building2,
  ArrowUpCircle, ArrowDownCircle, PiggyBank
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2 text-green-500 text-sm">
            <TrendingUp size={14} className="mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="p-4 rounded-full" style={{ backgroundColor: `${color}20` }}>
        <Icon size={28} style={{ color }} />
      </div>
    </div>
  </div>
);

// Country names and flags
const COUNTRIES = {
  sri_lanka: { name: 'Sri Lanka', flag: '🇱🇰', currency: 'LKR' },
  india: { name: 'India', flag: '🇮🇳', currency: 'INR' },
  malaysia: { name: 'Malaysia', flag: '🇲🇾', currency: 'MYR' },
  bangladesh: { name: 'Bangladesh', flag: '🇧🇩', currency: 'BDT' },
  pakistan: { name: 'Pakistan', flag: '🇵🇰', currency: 'PKR' },
  indonesia: { name: 'Indonesia', flag: '🇮🇩', currency: 'IDR' },
  singapore: { name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
  uae: { name: 'UAE', flag: '🇦🇪', currency: 'AED' },
  saudi: { name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR' }
};

const AGE_GROUP_LABELS = {
  '4-6': '🌟 Foundation (4-6)',
  '7-9': '🚀 Explorers (7-9)',
  '10-12': '⚡ Smart (10-12)',
  '13-15': '💻 Teens (13-15)',
  '16-18': '🎯 Leaders (16-18)'
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgeGroup, setFilterAgeGroup] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ email: '', full_name: '', password: '' });
  
  // Finance state
  const [financeTab, setFinanceTab] = useState('summary');
  const [financeSummary, setFinanceSummary] = useState(null);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [payrollPayments, setPayrollPayments] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showAddModal, setShowAddModal] = useState(null); // 'income', 'expense', 'worker', 'payroll'
  const [formData, setFormData] = useState({});

  const pageSize = 20;

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch functions
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard/stats`, { headers });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams({ skip: currentPage * pageSize, limit: pageSize });
      if (searchQuery) params.append('search', searchQuery);
      if (filterAgeGroup) params.append('age_group', filterAgeGroup);
      if (filterCountry) params.append('country', filterCountry);
      const response = await axios.get(`${API}/admin/students?${params}`, { headers });
      setStudents(response.data.students);
      setTotalStudents(response.data.total);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API}/admin/teachers`, { headers });
      setTeachers(response.data.teachers);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API}/admin/payments?limit=50`, { headers });
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const fetchFinanceSummary = async () => {
    try {
      const response = await axios.get(`${API}/admin/finance/summary`, { headers });
      setFinanceSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch finance summary:', error);
    }
  };

  const fetchIncome = async () => {
    try {
      const params = selectedCountry ? `?country=${selectedCountry}` : '';
      const response = await axios.get(`${API}/admin/finance/income${params}`, { headers });
      setIncomeRecords(response.data.records);
    } catch (error) {
      console.error('Failed to fetch income:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const params = selectedCountry ? `?country=${selectedCountry}` : '';
      const response = await axios.get(`${API}/admin/finance/expenses${params}`, { headers });
      setExpenseRecords(response.data.records);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  };

  const fetchWorkers = async () => {
    try {
      const params = selectedCountry ? `?country=${selectedCountry}` : '';
      const response = await axios.get(`${API}/admin/finance/payroll/workers${params}`, { headers });
      setWorkers(response.data.workers);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    }
  };

  const fetchPayrollPayments = async () => {
    try {
      const params = selectedCountry ? `?country=${selectedCountry}` : '';
      const response = await axios.get(`${API}/admin/finance/payroll/payments${params}`, { headers });
      setPayrollPayments(response.data.payments);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
    }
  };

  // Add handlers
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/teachers`, { ...newTeacher, role: 'teacher' }, { headers });
      setShowAddTeacher(false);
      setNewTeacher({ email: '', full_name: '', password: '' });
      fetchTeachers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add teacher');
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/finance/income`, formData, { headers });
      setShowAddModal(null);
      setFormData({});
      fetchIncome();
      fetchFinanceSummary();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add income');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/finance/expenses`, formData, { headers });
      setShowAddModal(null);
      setFormData({});
      fetchExpenses();
      fetchFinanceSummary();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add expense');
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/finance/payroll/workers`, formData, { headers });
      setShowAddModal(null);
      setFormData({});
      fetchWorkers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add worker');
    }
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/finance/payroll/payments`, formData, { headers });
      setShowAddModal(null);
      setFormData({});
      fetchPayrollPayments();
      fetchFinanceSummary();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to process payment');
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    await axios.delete(`${API}/admin/finance/income/${id}`, { headers });
    fetchIncome();
    fetchFinanceSummary();
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    await axios.delete(`${API}/admin/finance/expenses/${id}`, { headers });
    fetchExpenses();
    fetchFinanceSummary();
  };

  const handleDeactivateWorker = async (id) => {
    if (!window.confirm('Deactivate this worker?')) return;
    await axios.delete(`${API}/admin/finance/payroll/workers/${id}`, { headers });
    fetchWorkers();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    loadData();
  }, [token]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'teachers') fetchTeachers();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'finance') {
      fetchFinanceSummary();
      if (financeTab === 'income') fetchIncome();
      if (financeTab === 'expenses') fetchExpenses();
      if (financeTab === 'payroll') { fetchWorkers(); fetchPayrollPayments(); }
    }
  }, [activeTab, currentPage, searchQuery, filterAgeGroup, filterCountry, financeTab, selectedCountry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">🎓 TecaiKids Admin Dashboard</h1>
          <p className="text-purple-200 mt-1">Manage students, teachers, finances, and operations</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-1 p-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'teachers', label: 'Teachers', icon: GraduationCap },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'finance', label: 'Finance', icon: Building2 },
              { id: 'attendance', label: 'Attendance', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(0); }}
                className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Students" value={stats.students.total} subtitle={`${stats.students.active} active`} icon={Users} color="#8B5CF6" trend={`+${stats.enrollments.last_7_days} this week`} />
              <StatCard title="Teachers" value={stats.teachers.total} icon={GraduationCap} color="#10B981" />
              <StatCard title="Courses" value={stats.courses.total} subtitle={`${stats.courses.published} published`} icon={BookOpen} color="#F59E0B" />
              <StatCard title="Revenue (USD)" value={`$${stats.revenue.total_usd.toFixed(2)}`} icon={DollarSign} color="#EF4444" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Students by Age Group</h3>
                <div className="space-y-3">
                  {Object.entries(stats.students.by_age_group).map(([age, count]) => (
                    <div key={age} className="flex items-center">
                      <span className="w-40 text-sm text-gray-600">{AGE_GROUP_LABELS[age] || age}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max((count / stats.students.total) * 100, 5)}%` }}>
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Students by Country</h3>
                <div className="space-y-3">
                  {Object.entries(stats.students.by_country).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([country, count]) => (
                    <div key={country} className="flex items-center">
                      <span className="w-40 text-sm text-gray-600">{COUNTRIES[country]?.flag} {COUNTRIES[country]?.name || country}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 mx-3">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 h-6 rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max((count / stats.students.total) * 100, 5)}%` }}>
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search by name, email, or student ID..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <select value={filterAgeGroup} onChange={(e) => { setFilterAgeGroup(e.target.value); setCurrentPage(0); }} className="border rounded-lg px-4 py-2">
                <option value="">All Age Groups</option>
                {Object.keys(AGE_GROUP_LABELS).map(ag => <option key={ag} value={ag}>{ag}</option>)}
              </select>
              <select value={filterCountry} onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(0); }} className="border rounded-lg px-4 py-2">
                <option value="">All Countries</option>
                {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4"><span className="font-mono text-purple-600 font-bold">{student.student_index || 'N/A'}</span></td>
                      <td className="px-6 py-4 font-medium text-gray-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-gray-500">{student.email}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{student.age_group}</span></td>
                      <td className="px-6 py-4 text-gray-500">{COUNTRIES[student.country]?.flag} {COUNTRIES[student.country]?.name || student.country}</td>
                      <td className="px-6 py-4">{student.is_active ? <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1" /> Active</span> : <span className="flex items-center text-red-600"><XCircle size={16} className="mr-1" /> Inactive</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalStudents)} of {totalStudents}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 rounded-lg bg-white border hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={18} /></button>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={(currentPage + 1) * pageSize >= totalStudents} className="p-2 rounded-lg bg-white border hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAddTeacher(true)} className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><UserPlus size={18} className="mr-2" /> Add Teacher</button>
            </div>
            {showAddTeacher && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Add New Teacher</h3>
                  <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={newTeacher.full_name} onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={newTeacher.password} onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
                    <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setShowAddTeacher(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                      <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Add Teacher</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{teacher.full_name.charAt(0)}</div>
                    <div className="ml-4"><h4 className="font-bold text-gray-800">{teacher.full_name}</h4><p className="text-sm text-gray-500">{teacher.email}</p></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Courses: <strong>{teacher.course_count || 0}</strong></span>
                    <span className={`px-2 py-1 rounded-full ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{teacher.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.order_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{payment.order_id}</td>
                    <td className="px-6 py-4 font-bold text-green-600">${payment.amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-sm ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{payment.status}</span></td>
                    <td className="px-6 py-4 text-gray-500">{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No payment records found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            {/* Finance Sub-tabs */}
            <div className="bg-white rounded-xl shadow p-2 flex flex-wrap gap-2">
              {[
                { id: 'summary', label: 'Summary', icon: PiggyBank },
                { id: 'income', label: 'Income', icon: ArrowUpCircle },
                { id: 'expenses', label: 'Expenses', icon: ArrowDownCircle },
                { id: 'payroll', label: 'Payroll', icon: Wallet }
              ].map(tab => (
                <button key={tab.id} onClick={() => setFinanceTab(tab.id)} className={`flex items-center px-4 py-2 rounded-lg font-medium ${financeTab === tab.id ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <tab.icon size={18} className="mr-2" />{tab.label}
                </button>
              ))}
              <div className="flex-1"></div>
              <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="border rounded-lg px-4 py-2">
                <option value="">All Countries</option>
                {Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}
              </select>
            </div>

            {/* Finance Summary */}
            {financeTab === 'summary' && financeSummary && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Financial Summary by Country</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(financeSummary).map(([country, data]) => (
                    <div key={country} className="bg-white rounded-xl shadow p-6">
                      <div className="flex items-center mb-4">
                        <span className="text-3xl mr-3">{COUNTRIES[country]?.flag}</span>
                        <div>
                          <h4 className="font-bold text-gray-800">{COUNTRIES[country]?.name}</h4>
                          <span className="text-sm text-gray-500">{data.workers}/{data.max_workers} workers</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Income:</span><span className="text-green-600 font-bold">{COUNTRIES[country]?.currency} {data.income.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Expenses:</span><span className="text-red-600 font-bold">{COUNTRIES[country]?.currency} {data.expenses.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Payroll:</span><span className="text-orange-600 font-bold">{COUNTRIES[country]?.currency} {data.payroll.toLocaleString()}</span></div>
                        <hr className="my-2" />
                        <div className="flex justify-between"><span className="text-gray-800 font-medium">Net Profit:</span><span className={`font-bold ${data.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{COUNTRIES[country]?.currency} {data.net_profit.toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Income Section */}
            {financeTab === 'income' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Income Records</h3>
                  <button onClick={() => { setShowAddModal('income'); setFormData({ country: selectedCountry || 'sri_lanka', category: 'tuition', date: new Date().toISOString().split('T')[0] }); }} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><PlusCircle size={18} className="mr-2" /> Add Income</button>
                </div>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {incomeRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{record.date}</td>
                          <td className="px-4 py-3">{COUNTRIES[record.country]?.flag} {COUNTRIES[record.country]?.name}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{record.category}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.description}</td>
                          <td className="px-4 py-3 font-bold text-green-600">{record.currency} {record.amount.toLocaleString()}</td>
                          <td className="px-4 py-3"><button onClick={() => handleDeleteIncome(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                      {incomeRecords.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No income records</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expenses Section */}
            {financeTab === 'expenses' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Expense Records</h3>
                  <button onClick={() => { setShowAddModal('expense'); setFormData({ country: selectedCountry || 'sri_lanka', category: 'operations', date: new Date().toISOString().split('T')[0] }); }} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><PlusCircle size={18} className="mr-2" /> Add Expense</button>
                </div>
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {expenseRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{record.date}</td>
                          <td className="px-4 py-3">{COUNTRIES[record.country]?.flag} {COUNTRIES[record.country]?.name}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{record.category}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.description}</td>
                          <td className="px-4 py-3 font-bold text-red-600">{record.currency} {record.amount.toLocaleString()}</td>
                          <td className="px-4 py-3"><button onClick={() => handleDeleteExpense(record.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                      {expenseRecords.length === 0 && <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No expense records</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payroll Section */}
            {financeTab === 'payroll' && (
              <div className="space-y-6">
                {/* Workers */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Workers (Max 25 per country)</h3>
                    <button onClick={() => { setShowAddModal('worker'); setFormData({ country: selectedCountry || 'sri_lanka', role: 'teacher', payment_frequency: 'monthly', join_date: new Date().toISOString().split('T')[0] }); }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><UserPlus size={18} className="mr-2" /> Add Worker</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map((worker) => (
                      <div key={worker.id} className="bg-white rounded-xl shadow p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">{worker.name?.charAt(0)}</div>
                            <div className="ml-3">
                              <h4 className="font-bold text-gray-800">{worker.name}</h4>
                              <span className="text-xs text-gray-500">{worker.role}</span>
                            </div>
                          </div>
                          <span className="text-lg">{COUNTRIES[worker.country]?.flag}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">{worker.email}</p>
                          <p className="font-bold text-green-600">{worker.currency} {worker.salary?.toLocaleString()}/{worker.payment_frequency}</p>
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t">
                          <button onClick={() => { setShowAddModal('payroll'); setFormData({ worker_id: worker.id, amount: worker.salary, date: new Date().toISOString().split('T')[0] }); }} className="text-sm text-blue-600 hover:underline">Pay Salary</button>
                          <button onClick={() => handleDeactivateWorker(worker.id)} className="text-sm text-red-600 hover:underline">Deactivate</button>
                        </div>
                      </div>
                    ))}
                    {workers.length === 0 && <div className="col-span-3 bg-white rounded-xl shadow p-8 text-center text-gray-500">No workers found</div>}
                  </div>
                </div>

                {/* Payroll Payments */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">Payroll Payments</h3>
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payrollPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{payment.date}</td>
                            <td className="px-4 py-3 font-medium">{payment.worker_name}</td>
                            <td className="px-4 py-3">{COUNTRIES[payment.country]?.flag} {COUNTRIES[payment.country]?.name}</td>
                            <td className="px-4 py-3 font-bold text-orange-600">{payment.currency} {payment.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{payment.reference_number || '-'}</td>
                          </tr>
                        ))}
                        {payrollPayments.length === 0 && <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No payroll payments</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-700">Attendance Tracking</h3>
              <p className="text-gray-500 mt-2">Mark and view student attendance for Zoom classes</p>
              <a 
                href="/attendance" 
                className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Calendar size={20} className="mr-2" /> Open Attendance Manager
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Add Income Modal */}
      {showAddModal === 'income' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Income</h3>
            <form onSubmit={handleAddIncome} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Country</label><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full border rounded-lg px-4 py-2">{Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-lg px-4 py-2"><option value="tuition">Tuition Fees</option><option value="materials">Learning Materials</option><option value="registration">Registration</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Amount</label><input type="number" required value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><input type="text" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Income</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal === 'expense' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Country</label><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full border rounded-lg px-4 py-2">{Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-lg px-4 py-2"><option value="operations">Operations</option><option value="marketing">Marketing</option><option value="software">Software</option><option value="rent">Rent</option><option value="utilities">Utilities</option><option value="other">Other</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Amount</label><input type="number" required value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><input type="text" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal === 'worker' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Worker</h3>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Country</label><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full border rounded-lg px-4 py-2">{Object.entries(COUNTRIES).map(([k, v]) => <option key={k} value={k}>{v.flag} {v.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" required value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded-lg px-4 py-2"><option value="teacher">Teacher</option><option value="assistant">Assistant</option><option value="admin">Admin</option><option value="support">Support</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Salary</label><input type="number" required value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Payment Frequency</label><select value={formData.payment_frequency} onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })} className="w-full border rounded-lg px-4 py-2"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="bi-weekly">Bi-Weekly</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Bank Name</label><input type="text" value={formData.bank_name || ''} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Bank Account</label><input type="text" value={formData.bank_account || ''} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Process Payroll Modal */}
      {showAddModal === 'payroll' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Process Salary Payment</h3>
            <form onSubmit={handleProcessPayroll} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Amount</label><input type="number" required value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Payment Method</label><select value={formData.payment_method || 'bank_transfer'} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="w-full border rounded-lg px-4 py-2"><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Reference Number</label><input type="text" value={formData.reference_number || ''} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Notes</label><input type="text" value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border rounded-lg px-4 py-2" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
