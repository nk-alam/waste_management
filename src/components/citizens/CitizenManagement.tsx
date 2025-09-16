import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X
} from 'lucide-react';

interface Citizen {
  id: string;
  personalInfo: {
    name: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
  };
  aadhaar: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    state: string;
    ward?: string;
  };
  trainingStatus: {
    completed: boolean;
    modules: string[];
    certificate: string | null;
    enrolledAt: string | null;
    completedAt: string | null;
  };
  segregationCompliance: {
    score: number;
    violations: any[];
    lastAssessment: string | null;
  };
  rewardPoints: number;
  penaltyHistory: any[];
  createdAt: string;
}

const CitizenManagement: React.FC = () => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockCitizens: Citizen[] = [
          {
            id: '1',
            personalInfo: {
              name: 'Rajesh Kumar',
              phone: '9876543210',
              dateOfBirth: '1985-05-15',
              gender: 'male'
            },
            aadhaar: '123456789012',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              pincode: '400001',
              state: 'Maharashtra',
              ward: 'Ward 1'
            },
            trainingStatus: {
              completed: true,
              modules: ['basic', 'advanced', 'certification'],
              certificate: 'CERT-123456789012-1234567890',
              enrolledAt: '2024-01-15',
              completedAt: '2024-01-20'
            },
            segregationCompliance: {
              score: 85,
              violations: [],
              lastAssessment: '2024-01-25'
            },
            rewardPoints: 150,
            penaltyHistory: [],
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            personalInfo: {
              name: 'Priya Sharma',
              phone: '9876543211',
              dateOfBirth: '1990-08-22',
              gender: 'female'
            },
            aadhaar: '123456789013',
            address: {
              street: '456 Park Avenue',
              city: 'Mumbai',
              pincode: '400002',
              state: 'Maharashtra',
              ward: 'Ward 2'
            },
            trainingStatus: {
              completed: false,
              modules: ['basic'],
              certificate: null,
              enrolledAt: '2024-01-20',
              completedAt: null
            },
            segregationCompliance: {
              score: 65,
              violations: [
                {
                  type: 'non_segregation',
                  date: '2024-01-22',
                  amount: 200
                }
              ],
              lastAssessment: '2024-01-22'
            },
            rewardPoints: 50,
            penaltyHistory: ['penalty1'],
            createdAt: '2024-01-18'
          }
        ];
        setCitizens(mockCitizens);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching citizens:', error);
      setLoading(false);
    }
  };

  const filteredCitizens = citizens.filter(citizen => {
    const matchesSearch = citizen.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         citizen.aadhaar.includes(searchQuery) ||
                         citizen.address.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'trained' && citizen.trainingStatus.completed) ||
                         (filterStatus === 'untrained' && !citizen.trainingStatus.completed) ||
                         (filterStatus === 'compliant' && citizen.segregationCompliance.score >= 70) ||
                         (filterStatus === 'non-compliant' && citizen.segregationCompliance.score < 70);
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredCitizens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCitizens = filteredCitizens.slice(startIndex, startIndex + itemsPerPage);

  const getComplianceStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600 bg-red-100' };
  };

  const getTrainingStatus = (citizen: Citizen) => {
    if (citizen.trainingStatus.completed) {
      return { label: 'Completed', color: 'text-green-600 bg-green-100', icon: CheckCircle };
    }
    if (citizen.trainingStatus.modules.length > 0) {
      return { label: 'In Progress', color: 'text-yellow-600 bg-yellow-100', icon: Clock };
    }
    return { label: 'Not Started', color: 'text-gray-600 bg-gray-100', icon: Clock };
  };

  const handleViewCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedCitizen(null);
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
            Citizen Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage citizen registrations, training, and compliance
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
            Add Citizen
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
              placeholder="Search citizens..."
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
              <option value="all">All Citizens</option>
              <option value="trained">Trained</option>
              <option value="untrained">Untrained</option>
              <option value="compliant">Compliant</option>
              <option value="non-compliant">Non-Compliant</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredCitizens.length} of {citizens.length} citizens
            </span>
          </div>
        </div>
      </div>

      {/* Citizens Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citizen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Training Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedCitizens.map((citizen) => {
                const complianceStatus = getComplianceStatus(citizen.segregationCompliance.score);
                const trainingStatus = getTrainingStatus(citizen);
                const TrainingIcon = trainingStatus.icon;

                return (
                  <tr key={citizen.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {citizen.personalInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Aadhaar: {citizen.aadhaar}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {citizen.personalInfo.phone}
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {citizen.address.city}, {citizen.address.state}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trainingStatus.color}`}>
                        <TrainingIcon className="h-3 w-3 mr-1" />
                        {trainingStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${complianceStatus.color}`}>
                          {complianceStatus.label}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({citizen.segregationCompliance.score}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1 text-yellow-500" />
                        {citizen.rewardPoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewCitizen(citizen)}
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
                    {Math.min(startIndex + itemsPerPage, filteredCitizens.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredCitizens.length}</span> results
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

      {/* Citizen Detail Modal */}
      {showModal && selectedCitizen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Citizen Details
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
                    <p className="mt-1 text-sm text-gray-900">{selectedCitizen.personalInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCitizen.personalInfo.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aadhaar</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCitizen.aadhaar}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedCitizen.personalInfo.gender}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCitizen.address.street}, {selectedCitizen.address.city}, {selectedCitizen.address.state} - {selectedCitizen.address.pincode}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Training Status</label>
                    <div className="mt-1">
                      {getTrainingStatus(selectedCitizen).label}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Compliance Score</label>
                    <div className="mt-1">
                      {selectedCitizen.segregationCompliance.score}%
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Reward Points</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedCitizen.rewardPoints}</p>
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
                  Edit Citizen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenManagement;