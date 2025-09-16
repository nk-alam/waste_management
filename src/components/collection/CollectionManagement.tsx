import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Truck,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Vehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  capacity: number;
  driver: {
    name: string;
    license: string;
    phone: string;
  };
  area: string;
  status: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    lastUpdated: string;
  };
  fuelEfficiency: number;
  totalDistance: number;
  totalCollections: number;
  createdAt: string;
}

interface PickupRecord {
  id: string;
  vehicleId: string;
  householdId: string;
  wasteType: string;
  quantity: number;
  quality: string;
  collectedBy: string;
  collectedAt: string;
  status: string;
}

const CollectionManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pickupRecords, setPickupRecords] = useState<PickupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vehicles');
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
        const mockVehicles: Vehicle[] = [
          {
            id: '1',
            vehicleNumber: 'MH-01-AB-1234',
            type: 'truck',
            capacity: 5000,
            driver: {
              name: 'Rajesh Kumar',
              license: 'DL123456789',
              phone: '9876543210'
            },
            area: 'Ward 1',
            status: 'active',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra',
              lastUpdated: '2024-01-25T10:30:00Z'
            },
            fuelEfficiency: 8.5,
            totalDistance: 1500,
            totalCollections: 250,
            createdAt: '2024-01-10'
          },
          {
            id: '2',
            vehicleNumber: 'MH-01-CD-5678',
            type: 'van',
            capacity: 2000,
            driver: {
              name: 'Sunita Devi',
              license: 'DL987654321',
              phone: '9876543211'
            },
            area: 'Ward 2',
            status: 'maintenance',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra',
              lastUpdated: '2024-01-24T15:45:00Z'
            },
            fuelEfficiency: 12.0,
            totalDistance: 800,
            totalCollections: 120,
            createdAt: '2024-01-15'
          }
        ];

        const mockPickupRecords: PickupRecord[] = [
          {
            id: '1',
            vehicleId: '1',
            householdId: 'household1',
            wasteType: 'wet',
            quantity: 2.5,
            quality: 'excellent',
            collectedBy: 'worker1',
            collectedAt: '2024-01-25T09:00:00Z',
            status: 'completed'
          },
          {
            id: '2',
            vehicleId: '1',
            householdId: 'household2',
            wasteType: 'dry',
            quantity: 1.8,
            quality: 'good',
            collectedBy: 'worker1',
            collectedAt: '2024-01-25T09:30:00Z',
            status: 'completed'
          },
          {
            id: '3',
            vehicleId: '2',
            householdId: 'household3',
            wasteType: 'mixed',
            quantity: 3.2,
            quality: 'poor',
            collectedBy: 'worker2',
            collectedAt: '2024-01-25T10:00:00Z',
            status: 'rejected'
          }
        ];

        setVehicles(mockVehicles);
        setPickupRecords(mockPickupRecords);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'vehicles' ? vehicles : pickupRecords;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'vehicles' 
      ? (item as Vehicle).vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Vehicle).driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as Vehicle).area.toLowerCase().includes(searchQuery.toLowerCase())
      : (item as PickupRecord).wasteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as PickupRecord).status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && (item as Vehicle).status === 'active') ||
                         (filterStatus === 'maintenance' && (item as Vehicle).status === 'maintenance') ||
                         (filterStatus === 'completed' && (item as PickupRecord).status === 'completed') ||
                         (filterStatus === 'rejected' && (item as PickupRecord).status === 'rejected');
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'breakdown':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewItem = (item: Vehicle | PickupRecord) => {
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
            Collection Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage collection vehicles and pickup records
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
            Add {activeTab === 'vehicles' ? 'Vehicle' : 'Pickup'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vehicles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Truck className="h-4 w-4 inline mr-2" />
            Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('pickups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pickups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Pickup Records ({pickupRecords.length})
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
              <option value="all">All {activeTab === 'vehicles' ? 'Vehicles' : 'Pickups'}</option>
              {activeTab === 'vehicles' ? (
                <>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="breakdown">Breakdown</option>
                </>
              ) : (
                <>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="in_progress">In Progress</option>
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
                {activeTab === 'vehicles' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pickup Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waste Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collection Time
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
                if (activeTab === 'vehicles') {
                  const vehicle = item as Vehicle;
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Truck className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.vehicleNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.type} • {vehicle.capacity} kg
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.driver.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.driver.license}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.area}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Collections: {vehicle.totalCollections}</div>
                          <div>Distance: {vehicle.totalDistance} km</div>
                          <div>Efficiency: {vehicle.fuelEfficiency} km/L</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(vehicle)}
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
                  const pickup = item as PickupRecord;
                  return (
                    <tr key={pickup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Vehicle: {pickup.vehicleId}
                        </div>
                        <div className="text-sm text-gray-500">
                          Household: {pickup.householdId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {pickup.wasteType} waste
                        </div>
                        <div className="text-sm text-gray-500">
                          {pickup.quantity} kg
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(pickup.quality)}`}>
                            {pickup.quality}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pickup.status)}`}>
                            {pickup.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(pickup.collectedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(pickup)}
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
                  {activeTab === 'vehicles' ? 'Vehicle' : 'Pickup'} Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {activeTab === 'vehicles' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Vehicle).vehicleNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedItem as Vehicle).type}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Capacity</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as Vehicle).capacity} kg</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as Vehicle).status)}`}>
                          {(selectedItem as Vehicle).status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Driver Information</label>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Name:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Vehicle).driver.name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">License:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Vehicle).driver.license}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <p className="text-sm text-gray-900">{(selectedItem as Vehicle).driver.phone}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Performance Metrics</label>
                      <div className="mt-1 grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-blue-800">
                            {(selectedItem as Vehicle).totalCollections}
                          </div>
                          <div className="text-sm text-blue-600">Collections</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-green-800">
                            {(selectedItem as Vehicle).totalDistance} km
                          </div>
                          <div className="text-sm text-green-600">Distance</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-yellow-800">
                            {(selectedItem as Vehicle).fuelEfficiency} km/L
                          </div>
                          <div className="text-sm text-yellow-600">Efficiency</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle ID</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as PickupRecord).vehicleId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Household ID</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as PickupRecord).householdId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Waste Type</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{(selectedItem as PickupRecord).wasteType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as PickupRecord).quantity} kg</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quality</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor((selectedItem as PickupRecord).quality)}`}>
                          {(selectedItem as PickupRecord).quality}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as PickupRecord).status)}`}>
                          {(selectedItem as PickupRecord).status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Collection Time</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date((selectedItem as PickupRecord).collectedAt).toLocaleString()}
                      </p>
                    </div>
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
                  Edit {activeTab === 'vehicles' ? 'Vehicle' : 'Pickup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionManagement;