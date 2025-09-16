import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  BarChart3,
  Calendar,
  X,
  CheckCircle,
  Clock,
  DollarSign,
  Gift
} from 'lucide-react';

interface Incentive {
  id: string;
  type: 'bulk_generator' | 'citizen' | 'worker' | 'champion';
  recipientId: string;
  recipientName: string;
  amount: number;
  points: number;
  reason: string;
  status: 'pending' | 'approved' | 'distributed';
  createdAt: string;
  distributedAt?: string;
}

interface Penalty {
  id: string;
  citizenId: string;
  citizenName: string;
  violationType: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  imposedAt: string;
  dueDate: string;
  paidAt?: string;
  description: string;
}

const IncentivesAndPenalties: React.FC = () => {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incentives');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        const mockIncentives: Incentive[] = [
          {
            id: '1',
            type: 'citizen',
            recipientId: 'citizen1',
            recipientName: 'John Doe',
            amount: 500,
            points: 100,
            reason: 'Excellent waste segregation for 3 months',
            status: 'distributed',
            createdAt: '2024-01-20T10:00:00Z',
            distributedAt: '2024-01-22T14:00:00Z'
          },
          {
            id: '2',
            type: 'bulk_generator',
            recipientId: 'bulk1',
            recipientName: 'ABC Industries',
            amount: 2000,
            points: 500,
            reason: '100% compliance with waste segregation',
            status: 'approved',
            createdAt: '2024-01-24T09:00:00Z'
          }
        ];

        const mockPenalties: Penalty[] = [
          {
            id: '1',
            citizenId: 'citizen2',
            citizenName: 'Jane Smith',
            violationType: 'Mixed waste disposal',
            amount: 200,
            status: 'paid',
            imposedAt: '2024-01-15T10:00:00Z',
            dueDate: '2024-01-25T10:00:00Z',
            paidAt: '2024-01-20T15:00:00Z',
            description: 'Disposed mixed waste in segregated bins'
          },
          {
            id: '2',
            citizenId: 'citizen3',
            citizenName: 'Bob Johnson',
            violationType: 'Non-segregation',
            amount: 300,
            status: 'overdue',
            imposedAt: '2024-01-10T10:00:00Z',
            dueDate: '2024-01-20T10:00:00Z',
            description: 'Repeated non-segregation of waste'
          }
        ];

        setIncentives(mockIncentives);
        setPenalties(mockPenalties);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'incentives' ? incentives : penalties;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'incentives'
      ? (item as Incentive).recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as Incentive).reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as Incentive).type.toLowerCase().includes(searchQuery.toLowerCase())
      : (item as Penalty).citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as Penalty).violationType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as Penalty).description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || (item as Incentive).status === filterStatus || (item as Penalty).status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'distributed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'approved':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'citizen':
        return 'text-blue-600 bg-blue-100';
      case 'bulk_generator':
        return 'text-purple-600 bg-purple-100';
      case 'worker':
        return 'text-green-600 bg-green-100';
      case 'champion':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewItem = (item: Incentive | Penalty) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Incentives & Penalties
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage rewards and penalties for waste management compliance
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'incentives' ? 'Incentive' : 'Penalty'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('incentives')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'incentives'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Award className="h-4 w-4 inline mr-2" />
            Incentives ({incentives.length})
          </button>
          <button
            onClick={() => setActiveTab('penalties')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'penalties'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Penalties ({penalties.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              {activeTab === 'incentives' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="distributed">Distributed</option>
                </>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </>
              )}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredData.length} of {currentData.length} {activeTab}
            </span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === 'incentives' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citizen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violation & Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => {
                if (activeTab === 'incentives') {
                  const incentive = item as Incentive;
                  return (
                    <tr key={incentive.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <Award className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {incentive.recipientName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {incentive.recipientId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(incentive.type)}`}>
                            {incentive.type.replace('_', ' ')}
                          </span>
                          <div className="text-sm text-gray-900">
                            ₹{incentive.amount} ({incentive.points} pts)
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {incentive.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incentive.status)}`}>
                          {incentive.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(incentive)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  const penalty = item as Penalty;
                  return (
                    <tr key={penalty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {penalty.citizenName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {penalty.citizenId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {penalty.violationType}
                        </div>
                        <div className="text-sm font-medium text-red-600">
                          ₹{penalty.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {penalty.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(penalty.status)}`}>
                            {penalty.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(penalty.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(penalty)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, filteredData.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredData.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'incentives' ? 'Incentive' : 'Penalty'} Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {activeTab === 'incentives' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Incentive).recipientName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor((selectedItem as Incentive).type)}`}>
                          {(selectedItem as Incentive).type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <p className="mt-1 text-sm text-gray-900">₹{(selectedItem as Incentive).amount}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Points</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Incentive).points}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as Incentive).reason}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as Incentive).status)}`}>
                          {(selectedItem as Incentive).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as Incentive).createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {(selectedItem as Incentive).distributedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Distributed At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as Incentive).distributedAt!).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Citizen</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Penalty).citizenName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Violation Type</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Penalty).violationType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <p className="mt-1 text-sm text-gray-900">₹{(selectedItem as Penalty).amount}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as Penalty).status)}`}>
                          {(selectedItem as Penalty).status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as Penalty).description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Imposed At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as Penalty).imposedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as Penalty).dueDate).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {(selectedItem as Penalty).paidAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Paid At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as Penalty).paidAt!).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Edit {activeTab === 'incentives' ? 'Incentive' : 'Penalty'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncentivesAndPenalties;