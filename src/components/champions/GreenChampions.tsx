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
  BarChart3,
  Calendar,
  X
} from 'lucide-react';

interface GreenChampion {
  id: string;
  personalInfo: {
    name: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    gender: string;
  };
  areaAssigned: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    state: string;
  };
  citizensUnderSupervision: string[];
  trainingsConducted: any[];
  violationsReported: any[];
  performanceMetrics: {
    totalReports: number;
    resolvedReports: number;
    citizensTrained: number;
    violationsReported: number;
  };
  createdAt: string;
}

const GreenChampions: React.FC = () => {
  const [champions, setChampions] = useState<GreenChampion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [selectedChampion, setSelectedChampion] = useState<GreenChampion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchChampions();
  }, []);

  const fetchChampions = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockChampions: GreenChampion[] = [
          {
            id: '1',
            personalInfo: {
              name: 'Dr. Rajesh Kumar',
              phone: '9876543210',
              email: 'rajesh.kumar@example.com',
              dateOfBirth: '1975-05-15',
              gender: 'male'
            },
            areaAssigned: 'Ward 1',
            address: {
              street: '123 Champion Street',
              city: 'Mumbai',
              pincode: '400001',
              state: 'Maharashtra'
            },
            citizensUnderSupervision: ['citizen1', 'citizen2', 'citizen3'],
            trainingsConducted: ['training1', 'training2'],
            violationsReported: ['violation1'],
            performanceMetrics: {
              totalReports: 25,
              resolvedReports: 22,
              citizensTrained: 45,
              violationsReported: 8
            },
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            personalInfo: {
              name: 'Ms. Priya Sharma',
              phone: '9876543211',
              email: 'priya.sharma@example.com',
              dateOfBirth: '1980-08-22',
              gender: 'female'
            },
            areaAssigned: 'Ward 2',
            address: {
              street: '456 Champion Lane',
              city: 'Mumbai',
              pincode: '400002',
              state: 'Maharashtra'
            },
            citizensUnderSupervision: ['citizen4', 'citizen5'],
            trainingsConducted: ['training3'],
            violationsReported: ['violation2', 'violation3'],
            performanceMetrics: {
              totalReports: 18,
              resolvedReports: 15,
              citizensTrained: 32,
              violationsReported: 12
            },
            createdAt: '2024-01-15'
          }
        ];
        setChampions(mockChampions);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching champions:', error);
      setLoading(false);
    }
  };

  const filteredChampions = champions.filter(champion => {
    const matchesSearch = champion.personalInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         champion.personalInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         champion.areaAssigned.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterArea === 'all' || champion.areaAssigned === filterArea;
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredChampions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedChampions = filteredChampions.slice(startIndex, startIndex + itemsPerPage);

  const getPerformanceRating = (champion: GreenChampion) => {
    const { totalReports, resolvedReports, citizensTrained, violationsReported } = champion.performanceMetrics;
    const resolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0;
    const trainingRate = citizensTrained > 0 ? Math.min(100, (citizensTrained / 50) * 100) : 0; // Assuming 50 is max
    const overallRating = (resolutionRate + trainingRate) / 2;
    
    if (overallRating >= 90) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (overallRating >= 80) return { label: 'Very Good', color: 'text-blue-600 bg-blue-100' };
    if (overallRating >= 70) return { label: 'Good', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  const handleViewChampion = (champion: GreenChampion) => {
    setSelectedChampion(champion);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedChampion(null);
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
            Green Champions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage area committee members and their performance
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
            Add Champion
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
              placeholder="Search champions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Areas</option>
              <option value="Ward 1">Ward 1</option>
              <option value="Ward 2">Ward 2</option>
              <option value="Ward 3">Ward 3</option>
              <option value="Ward 4">Ward 4</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredChampions.length} of {champions.length} champions
            </span>
          </div>
        </div>
      </div>

      {/* Champions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Champion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citizens Supervised
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedChampions.map((champion) => {
                const performanceRating = getPerformanceRating(champion);

                return (
                  <tr key={champion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Award className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {champion.personalInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {champion.personalInfo.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {champion.areaAssigned}
                        </div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {champion.personalInfo.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {champion.citizensUnderSupervision.length} citizens
                      </div>
                      <div className="text-sm text-gray-500">
                        {champion.performanceMetrics.citizensTrained} trained
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${performanceRating.color}`}>
                        {performanceRating.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1 text-gray-400" />
                          {champion.performanceMetrics.totalReports} total
                        </div>
                        <div className="text-sm text-gray-500">
                          {champion.performanceMetrics.resolvedReports} resolved
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewChampion(champion)}
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
                    {Math.min(startIndex + itemsPerPage, filteredChampions.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredChampions.length}</span> results
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

      {/* Champion Detail Modal */}
      {showModal && selectedChampion && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Champion Details
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
                    <p className="mt-1 text-sm text-gray-900">{selectedChampion.personalInfo.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedChampion.personalInfo.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedChampion.personalInfo.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Area Assigned</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedChampion.areaAssigned}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedChampion.address.street}, {selectedChampion.address.city}, {selectedChampion.address.state} - {selectedChampion.address.pincode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Reports:</span>
                        <span className="text-sm font-medium">{selectedChampion.performanceMetrics.totalReports}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Resolved Reports:</span>
                        <span className="text-sm font-medium">{selectedChampion.performanceMetrics.resolvedReports}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Citizens Trained:</span>
                        <span className="text-sm font-medium">{selectedChampion.performanceMetrics.citizensTrained}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Violations Reported:</span>
                        <span className="text-sm font-medium">{selectedChampion.performanceMetrics.violationsReported}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Supervision</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Citizens Supervised:</span>
                        <span className="text-sm font-medium">{selectedChampion.citizensUnderSupervision.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trainings Conducted:</span>
                        <span className="text-sm font-medium">{selectedChampion.trainingsConducted.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Violations Reported:</span>
                        <span className="text-sm font-medium">{selectedChampion.violationsReported.length}</span>
                      </div>
                    </div>
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
                  Edit Champion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenChampions;