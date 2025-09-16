import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  X,
  Users
} from 'lucide-react';

interface Household {
  id: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    state: string;
    ward?: string;
  };
  residentCount: number;
  contactInfo: {
    primaryContact: string;
    alternateContact?: string;
    email?: string;
  };
  wasteGeneration: {
    dailyWetWaste: number;
    dailyDryWaste: number;
    dailyHazardousWaste: number;
  };
  segregationStatus: {
    isCompliant: boolean;
    lastAssessment: string | null;
    complianceScore: number;
    violations: any[];
  };
  collectionSchedule: {
    wetWaste: string;
    dryWaste: string;
    hazardousWaste: string;
  };
  createdAt: string;
}

interface BulkGenerator {
  id: string;
  name: string;
  type: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    state: string;
  };
  contactInfo: {
    primaryContact: string;
    email: string;
    managerName?: string;
  };
  wasteGeneration: {
    dailyWetWaste: number;
    dailyDryWaste: number;
    dailyHazardousWaste: number;
  };
  complianceStatus: {
    isCompliant: boolean;
    lastInspection: string | null;
    complianceScore: number;
    violations: any[];
  };
  createdAt: string;
}

const WasteManagement: React.FC = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [bulkGenerators, setBulkGenerators] = useState<BulkGenerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('households');
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
      // Simulate API call
      setTimeout(() => {
        const mockHouseholds: Household[] = [
          {
            id: '1',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              pincode: '400001',
              state: 'Maharashtra',
              ward: 'Ward 1'
            },
            residentCount: 4,
            contactInfo: {
              primaryContact: '9876543210',
              alternateContact: '9876543211',
              email: 'household1@example.com'
            },
            wasteGeneration: {
              dailyWetWaste: 2.5,
              dailyDryWaste: 1.5,
              dailyHazardousWaste: 0.2
            },
            segregationStatus: {
              isCompliant: true,
              lastAssessment: '2024-01-25',
              complianceScore: 85,
              violations: []
            },
            collectionSchedule: {
              wetWaste: 'daily',
              dryWaste: 'weekly',
              hazardousWaste: 'monthly'
            },
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            address: {
              street: '456 Park Avenue',
              city: 'Mumbai',
              pincode: '400002',
              state: 'Maharashtra',
              ward: 'Ward 2'
            },
            residentCount: 6,
            contactInfo: {
              primaryContact: '9876543212',
              email: 'household2@example.com'
            },
            wasteGeneration: {
              dailyWetWaste: 3.2,
              dailyDryWaste: 2.1,
              dailyHazardousWaste: 0.3
            },
            segregationStatus: {
              isCompliant: false,
              lastAssessment: '2024-01-22',
              complianceScore: 65,
              violations: [
                {
                  type: 'non_segregation',
                  date: '2024-01-22',
                  amount: 200
                }
              ]
            },
            collectionSchedule: {
              wetWaste: 'daily',
              dryWaste: 'weekly',
              hazardousWaste: 'monthly'
            },
            createdAt: '2024-01-15'
          }
        ];

        const mockBulkGenerators: BulkGenerator[] = [
          {
            id: '1',
            name: 'Hotel Paradise',
            type: 'hotel',
            address: {
              street: '789 Hotel Street',
              city: 'Mumbai',
              pincode: '400003',
              state: 'Maharashtra'
            },
            contactInfo: {
              primaryContact: '9876543213',
              email: 'hotel@paradise.com',
              managerName: 'Mr. Sharma'
            },
            wasteGeneration: {
              dailyWetWaste: 50,
              dailyDryWaste: 30,
              dailyHazardousWaste: 5
            },
            complianceStatus: {
              isCompliant: true,
              lastInspection: '2024-01-20',
              complianceScore: 92,
              violations: []
            },
            createdAt: '2024-01-05'
          },
          {
            id: '2',
            name: 'Mall Central',
            type: 'mall',
            address: {
              street: '321 Mall Road',
              city: 'Mumbai',
              pincode: '400004',
              state: 'Maharashtra'
            },
            contactInfo: {
              primaryContact: '9876543214',
              email: 'mall@central.com',
              managerName: 'Ms. Patel'
            },
            wasteGeneration: {
              dailyWetWaste: 120,
              dailyDryWaste: 80,
              dailyHazardousWaste: 10
            },
            complianceStatus: {
              isCompliant: false,
              lastInspection: '2024-01-18',
              complianceScore: 75,
              violations: [
                {
                  type: 'compliance_failure',
                  date: '2024-01-18',
                  score: 75
                }
              ]
            },
            createdAt: '2024-01-08'
          }
        ];

        setHouseholds(mockHouseholds);
        setBulkGenerators(mockBulkGenerators);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'households' ? households : bulkGenerators;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'households' 
      ? (item as Household).address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Household).address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Household).contactInfo.primaryContact.includes(searchQuery)
      : (item as BulkGenerator).name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as BulkGenerator).type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as BulkGenerator).contactInfo.primaryContact.includes(searchQuery);
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'compliant' && item.segregationStatus?.isCompliant) ||
                         (filterStatus === 'non-compliant' && !item.segregationStatus?.isCompliant);
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getComplianceStatus = (item: Household | BulkGenerator) => {
    const score = item.segregationStatus?.complianceScore || item.complianceStatus?.complianceScore || 0;
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600 bg-red-100' };
  };

  const handleViewItem = (item: Household | BulkGenerator) => {
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
            Waste Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage households and bulk generators for waste collection
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
            Add {activeTab === 'households' ? 'Household' : 'Bulk Generator'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('households')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'households'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Home className="h-4 w-4 inline mr-2" />
            Households ({households.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk-generators')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bulk-generators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Bulk Generators ({bulkGenerators.length})
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
              <option value="all">All {activeTab === 'households' ? 'Households' : 'Generators'}</option>
              <option value="compliant">Compliant</option>
              <option value="non-compliant">Non-Compliant</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'households' ? 'Household' : 'Generator'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waste Generation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item) => {
                const complianceStatus = getComplianceStatus(item);
                const isHousehold = activeTab === 'households';
                const household = item as Household;
                const bulkGenerator = item as BulkGenerator;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isHousehold ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {isHousehold ? (
                              <Home className="h-5 w-5 text-blue-600" />
                            ) : (
                              <BarChart3 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {isHousehold ? `Household ${item.id}` : bulkGenerator.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isHousehold ? `${household.residentCount} residents` : bulkGenerator.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {isHousehold ? household.contactInfo.primaryContact : bulkGenerator.contactInfo.primaryContact}
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {isHousehold ? household.address.city : bulkGenerator.address.city}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Wet: {isHousehold ? household.wasteGeneration.dailyWetWaste : bulkGenerator.wasteGeneration.dailyWetWaste} kg</div>
                        <div>Dry: {isHousehold ? household.wasteGeneration.dailyDryWaste : bulkGenerator.wasteGeneration.dailyDryWaste} kg</div>
                        <div>Hazardous: {isHousehold ? household.wasteGeneration.dailyHazardousWaste : bulkGenerator.wasteGeneration.dailyHazardousWaste} kg</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${complianceStatus.color}`}>
                          {complianceStatus.label}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({(isHousehold ? household.segregationStatus?.complianceScore : bulkGenerator.complianceStatus?.complianceScore) || 0}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
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

      {/* Detail Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'households' ? 'Household' : 'Bulk Generator'} Details
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
                    <label className="block text-sm font-medium text-gray-700">
                      {activeTab === 'households' ? 'Address' : 'Name'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {activeTab === 'households' 
                        ? `${(selectedItem as Household).address.street}, ${(selectedItem as Household).address.city}, ${(selectedItem as Household).address.state} - ${(selectedItem as Household).address.pincode}`
                        : (selectedItem as BulkGenerator).name
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {activeTab === 'households' 
                        ? (selectedItem as Household).contactInfo.primaryContact
                        : (selectedItem as BulkGenerator).contactInfo.primaryContact
                      }
                    </p>
                  </div>
                  {activeTab === 'households' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Residents</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as Household).residentCount}</p>
                    </div>
                  )}
                  {activeTab === 'bulk-generators' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedItem as BulkGenerator).type}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Waste Generation (Daily)</label>
                  <div className="mt-1 grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-green-800">
                        {activeTab === 'households' 
                          ? (selectedItem as Household).wasteGeneration.dailyWetWaste
                          : (selectedItem as BulkGenerator).wasteGeneration.dailyWetWaste
                        } kg
                      </div>
                      <div className="text-sm text-green-600">Wet Waste</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-blue-800">
                        {activeTab === 'households' 
                          ? (selectedItem as Household).wasteGeneration.dailyDryWaste
                          : (selectedItem as BulkGenerator).wasteGeneration.dailyDryWaste
                        } kg
                      </div>
                      <div className="text-sm text-blue-600">Dry Waste</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-red-800">
                        {activeTab === 'households' 
                          ? (selectedItem as Household).wasteGeneration.dailyHazardousWaste
                          : (selectedItem as BulkGenerator).wasteGeneration.dailyHazardousWaste
                        } kg
                      </div>
                      <div className="text-sm text-red-600">Hazardous</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Compliance Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatus(selectedItem).color}`}>
                      {getComplianceStatus(selectedItem).label}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({(activeTab === 'households' 
                        ? (selectedItem as Household).segregationStatus?.complianceScore 
                        : (selectedItem as BulkGenerator).complianceStatus?.complianceScore
                      ) || 0}%)
                    </span>
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
                  Edit {activeTab === 'households' ? 'Household' : 'Generator'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteManagement;