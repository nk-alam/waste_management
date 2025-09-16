import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Building,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  type: 'biomethanization' | 'wte' | 'recycling' | 'composting';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  currentLoad: number;
  efficiency: number;
  status: string;
  ulbId: string;
  manager: {
    name: string;
    phone: string;
    email: string;
  };
  operationalHours: {
    start: string;
    end: string;
  };
  wasteIntake: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  processingStatus: {
    active: boolean;
    lastProcessed: string;
    nextMaintenance: string;
  };
  createdAt: string;
}

interface WasteIntake {
  id: string;
  facilityId: string;
  wasteType: string;
  quantity: number;
  source: string;
  receivedAt: string;
  processedAt?: string;
  status: string;
}

const FacilityManagement: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [wasteIntakes, setWasteIntakes] = useState<WasteIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('facilities');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
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
        const mockFacilities: Facility[] = [
          {
            id: '1',
            name: 'Mumbai Biomethanization Plant',
            type: 'biomethanization',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            },
            capacity: 1000,
            currentLoad: 750,
            efficiency: 85,
            status: 'active',
            ulbId: 'ulb1',
            manager: {
              name: 'Dr. Rajesh Kumar',
              phone: '9876543210',
              email: 'rajesh@facility.com'
            },
            operationalHours: {
              start: '06:00',
              end: '22:00'
            },
            wasteIntake: {
              daily: 750,
              weekly: 5250,
              monthly: 22500
            },
            processingStatus: {
              active: true,
              lastProcessed: '2024-01-25T10:30:00Z',
              nextMaintenance: '2024-02-15T00:00:00Z'
            },
            createdAt: '2024-01-01'
          },
          {
            id: '2',
            name: 'Delhi Waste-to-Energy Plant',
            type: 'wte',
            location: {
              lat: 28.7041,
              lng: 77.1025,
              address: 'Delhi, India'
            },
            capacity: 2000,
            currentLoad: 1800,
            efficiency: 92,
            status: 'active',
            ulbId: 'ulb2',
            manager: {
              name: 'Dr. Priya Sharma',
              phone: '9876543211',
              email: 'priya@facility.com'
            },
            operationalHours: {
              start: '00:00',
              end: '23:59'
            },
            wasteIntake: {
              daily: 1800,
              weekly: 12600,
              monthly: 54000
            },
            processingStatus: {
              active: true,
              lastProcessed: '2024-01-25T11:00:00Z',
              nextMaintenance: '2024-03-01T00:00:00Z'
            },
            createdAt: '2024-01-05'
          },
          {
            id: '3',
            name: 'Bangalore Recycling Center',
            type: 'recycling',
            location: {
              lat: 12.9716,
              lng: 77.5946,
              address: 'Bangalore, Karnataka'
            },
            capacity: 500,
            currentLoad: 300,
            efficiency: 78,
            status: 'maintenance',
            ulbId: 'ulb3',
            manager: {
              name: 'Mr. Suresh Reddy',
              phone: '9876543212',
              email: 'suresh@facility.com'
            },
            operationalHours: {
              start: '08:00',
              end: '18:00'
            },
            wasteIntake: {
              daily: 300,
              weekly: 2100,
              monthly: 9000
            },
            processingStatus: {
              active: false,
              lastProcessed: '2024-01-24T16:00:00Z',
              nextMaintenance: '2024-01-30T00:00:00Z'
            },
            createdAt: '2024-01-10'
          }
        ];

        const mockWasteIntakes: WasteIntake[] = [
          {
            id: '1',
            facilityId: '1',
            wasteType: 'wet',
            quantity: 150,
            source: 'Ward 1 Collection',
            receivedAt: '2024-01-25T09:00:00Z',
            processedAt: '2024-01-25T10:30:00Z',
            status: 'processed'
          },
          {
            id: '2',
            facilityId: '1',
            wasteType: 'wet',
            quantity: 200,
            source: 'Ward 2 Collection',
            receivedAt: '2024-01-25T10:00:00Z',
            status: 'processing'
          },
          {
            id: '3',
            facilityId: '2',
            wasteType: 'mixed',
            quantity: 500,
            source: 'Bulk Generator',
            receivedAt: '2024-01-25T08:00:00Z',
            processedAt: '2024-01-25T11:00:00Z',
            status: 'processed'
          }
        ];

        setFacilities(mockFacilities);
        setWasteIntakes(mockWasteIntakes);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'facilities' ? facilities : wasteIntakes;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'facilities' 
      ? (item as Facility).name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Facility).type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Facility).location.address.toLowerCase().includes(searchQuery.toLowerCase())
      : (item as WasteIntake).wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as WasteIntake).source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as WasteIntake).status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || (item as Facility).type === filterType;
    const matchesStatus = filterStatus === 'all' || (item as Facility).status === filterStatus || (item as WasteIntake).status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'processed':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
      case 'pending':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'biomethanization':
        return 'text-green-600 bg-green-100';
      case 'wte':
        return 'text-blue-600 bg-blue-100';
      case 'recycling':
        return 'text-yellow-600 bg-yellow-100';
      case 'composting':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewItem = (item: Facility | WasteIntake) => {
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
            Facility Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage waste treatment facilities and processing
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
            Add {activeTab === 'facilities' ? 'Facility' : 'Intake'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('facilities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'facilities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setActiveTab('intakes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'intakes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Waste Intakes ({wasteIntakes.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {activeTab === 'facilities' && (
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                <option value="biomethanization">Biomethanization</option>
                <option value="wte">Waste-to-Energy</option>
                <option value="recycling">Recycling</option>
                <option value="composting">Composting</option>
              </select>
            </div>
          )}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              {activeTab === 'facilities' ? (
                <>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </>
              ) : (
                <>
                  <option value="processed">Processed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
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
                {activeTab === 'facilities' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity & Load
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intake Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waste Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Time
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
                if (activeTab === 'facilities') {
                  const facility = item as Facility;
                  const loadPercentage = (facility.currentLoad / facility.capacity) * 100;
                  
                  return (
                    <tr key={facility.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {facility.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {facility.location.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(facility.type)}`}>
                            {facility.type}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(facility.status)}`}>
                            {facility.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{facility.currentLoad} / {facility.capacity} kg</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${loadPercentage > 90 ? 'bg-red-500' : loadPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${loadPercentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {loadPercentage.toFixed(1)}% full
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getEfficiencyColor(facility.efficiency)}`}>
                          {facility.efficiency}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {facility.wasteIntake.daily} kg/day
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.manager.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {facility.manager.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(facility)}
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
                  const intake = item as WasteIntake;
                  return (
                    <tr key={intake.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Facility: {intake.facilityId}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {intake.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {intake.wasteType} waste
                        </div>
                        <div className="text-sm text-gray-500">
                          {intake.quantity} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {intake.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(intake.status)}`}>
                            {intake.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            Received: {new Date(intake.receivedAt).toLocaleString()}
                          </div>
                          {intake.processedAt && (
                            <div className="text-xs text-gray-500">
                              Processed: {new Date(intake.processedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(intake)}
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
                  {activeTab === 'facilities' ? 'Facility' : 'Waste Intake'} Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {activeTab === 'facilities' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Facility Name</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Facility).name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor((selectedItem as Facility).type)}`}>
                          {(selectedItem as Facility).type}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Capacity</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Facility).capacity} kg</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Load</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Facility).currentLoad} kg</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as Facility).location.address}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager Information</label>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Name:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Facility).manager.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Facility).manager.phone}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Email:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Facility).manager.email}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Performance Metrics</label>
                      <div className="mt-1 grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-blue-800">
                            {(selectedItem as Facility).efficiency}%
                          </div>
                          <div className="text-sm text-blue-600">Efficiency</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-green-800">
                            {(selectedItem as Facility).wasteIntake.daily} kg
                          </div>
                          <div className="text-sm text-green-600">Daily Intake</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-yellow-800">
                            {((selectedItem as Facility).currentLoad / (selectedItem as Facility).capacity * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-yellow-600">Capacity Used</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Facility ID</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as WasteIntake).facilityId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Waste Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedItem as WasteIntake).wasteType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as WasteIntake).quantity} kg</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as WasteIntake).source}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as WasteIntake).status)}`}>
                          {(selectedItem as WasteIntake).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Received At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as WasteIntake).receivedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {(selectedItem as WasteIntake).processedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processed At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedItem as WasteIntake).processedAt!).toLocaleString()}
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
                  Edit {activeTab === 'facilities' ? 'Facility' : 'Intake'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityManagement;