import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Award,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Phone,
  HardHat,
  Calendar,
  X
} from 'lucide-react';

interface Worker {
  id: string;
  personalInfo: {
    name: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    emergencyContact: string;
  };
  employeeId: string;
  area: string;
  role: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    state: string;
  };
  trainingPhases: {
    phase1: string | null;
    phase2: string | null;
    phase3: string | null;
  };
  safetyGear: {
    helmet: boolean;
    gloves: boolean;
    uniform: boolean;
    boots: boolean;
    mask: boolean;
  };
  attendance: any[];
  performanceRating: number;
  createdAt: string;
}

const WorkerManagement: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockWorkers: Worker[] = [
          {
            id: '1',
            personalInfo: {
              name: 'Amit Kumar',
              phone: '9876543210',
              dateOfBirth: '1985-05-15',
              gender: 'male',
              emergencyContact: '9876543211'
            },
            employeeId: 'EMP001',
            area: 'Ward 1',
            role: 'collector',
            address: {
              street: '123 Worker Street',
              city: 'Mumbai',
              pincode: '400001',
              state: 'Maharashtra'
            },
            trainingPhases: {
              phase1: '2024-01-15',
              phase2: '2024-01-20',
              phase3: '2024-01-25'
            },
            safetyGear: {
              helmet: true,
              gloves: true,
              uniform: true,
              boots: true,
              mask: true
            },
            attendance: [],
            performanceRating: 85,
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            personalInfo: {
              name: 'Sunita Devi',
              phone: '9876543212',
              dateOfBirth: '1990-08-22',
              gender: 'female',
              emergencyContact: '9876543213'
            },
            employeeId: 'EMP002',
            area: 'Ward 2',
            role: 'supervisor',
            address: {
              street: '456 Supervisor Lane',
              city: 'Mumbai',
              pincode: '400002',
              state: 'Maharashtra'
            },
            trainingPhases: {
              phase1: '2024-01-12',
              phase2: '2024-01-18',
              phase3: null
            },
            safetyGear: {
              helmet: true,
              gloves: true,
              uniform: true,
              boots: false,
              mask: true
            },
            attendance: [],
            performanceRating: 92,
            createdAt: '2024-01-08'
          }
        ];
        setWorkers(mockWorkers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching workers:', error);
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         worker.area.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterRole === 'all' || worker.role === filterRole;
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage);

  const getTrainingStatus = (worker: Worker) => {
    const completedPhases = Object.values(worker.trainingPhases).filter(phase => phase !== null).length;
    if (completedPhases === 3) {
      return { label: 'Completed', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
    if (completedPhases > 0) {
      return { label: 'In Progress', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
    }
    return { label: 'Not Started', color: 'text-gray-600 bg-gray-100', icon: Clock };
  };

  const getSafetyGearStatus = (worker: Worker) => {
    const totalGear = Object.keys(worker.safetyGear).length;
    const availableGear = Object.values(worker.safetyGear).filter(Boolean).length;
    const percentage = (availableGear / totalGear) * 100;
    
    if (percentage === 100) return { label: 'Complete', color: 'text-green-600 bg-green-100' };
    if (percentage >= 80) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (percentage >= 60) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600 bg-red-100' };
  };

  const handleViewWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedWorker(null);
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
            Worker Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage waste workers, training, and safety equipment
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
            Add Worker
          </button>
        </div>
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
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Roles</option>
              <option value="collector">Collector</option>
              <option value="supervisor">Supervisor</option>
              <option value="driver">Driver</option>
              <option value="facility_operator">Facility Operator</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredWorkers.length} of {workers.length} workers
            </span>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safety Gear
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedWorkers.map((worker) => {
                const trainingStatus = getTrainingStatus(worker);
                const safetyStatus = getSafetyGearStatus(worker);
                const TrainingIcon = trainingStatus.icon;

                return (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {worker.personalInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {worker.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {worker.role.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {worker.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trainingStatus.color}`}>
                        <TrainingIcon className="h-3 w-3 mr-1" />
                        {trainingStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${safetyStatus.color}`}>
                        <HardHat className="h-3 w-3 mr-1" />
                        {safetyStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${worker.performanceRating}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{worker.performanceRating}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewWorker(worker)}
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
                    {Math.min(startIndex + itemsPerPage, filteredWorkers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredWorkers.length}</span> results
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
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
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

      {/* Worker Detail Modal */}
      {showModal && selectedWorker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Worker Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWorker.personalInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWorker.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWorker.personalInfo.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWorker.personalInfo.emergencyContact}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedWorker.role.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Area</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedWorker.area}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedWorker.address.street}, {selectedWorker.address.city}, {selectedWorker.address.state} - {selectedWorker.address.pincode}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Training Phases</label>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded text-center text-sm ${selectedWorker.trainingPhases.phase1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Phase 1 {selectedWorker.trainingPhases.phase1 ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded text-center text-sm ${selectedWorker.trainingPhases.phase2 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Phase 2 {selectedWorker.trainingPhases.phase2 ? '✓' : '○'}
                    </div>
                    <div className={`p-2 rounded text-center text-sm ${selectedWorker.trainingPhases.phase3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Phase 3 {selectedWorker.trainingPhases.phase3 ? '✓' : '○'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Safety Gear</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {Object.entries(selectedWorker.safetyGear).map(([item, available]) => (
                      <div key={item} className="flex items-center">
                        <HardHat className={`h-4 w-4 mr-2 ${available ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-sm capitalize">{item.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`ml-2 text-xs ${available ? 'text-green-600' : 'text-red-600'}`}>
                          {available ? 'Available' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                  <div className="mt-1 flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedWorker.performanceRating}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">{selectedWorker.performanceRating}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Edit Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManagement;