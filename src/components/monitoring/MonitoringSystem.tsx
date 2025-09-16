import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Camera,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Image
} from 'lucide-react';

interface DumpingSite {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  photos: {
    id: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
  }[];
  status: 'reported' | 'cleaned' | 'under_review';
  reportedBy: string;
  reportedAt: string;
  cleanedAt?: string;
  cleanedBy?: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface CommunityReport {
  id: string;
  type: 'waste_movement' | 'dumping' | 'collection_issue' | 'other';
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  photos: {
    id: string;
    url: string;
    uploadedAt: string;
  }[];
  reportedBy: string;
  reportedAt: string;
  status: 'pending' | 'in_progress' | 'resolved';
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
}

interface AreaCleanliness {
  areaId: string;
  areaName: string;
  score: number;
  lastUpdated: string;
  submittedBy: string;
  factors: {
    wasteSegregation: number;
    collectionEfficiency: number;
    publicAwareness: number;
    infrastructure: number;
  };
}

const MonitoringSystem: React.FC = () => {
  const [dumpingSites, setDumpingSites] = useState<DumpingSite[]>([]);
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [areaCleanliness, setAreaCleanliness] = useState<AreaCleanliness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dumping');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
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
        const mockDumpingSites: DumpingSite[] = [
          {
            id: '1',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            },
            photos: [
              {
                id: 'photo1',
                url: '/api/placeholder/400/300',
                uploadedAt: '2024-01-25T10:00:00Z',
                uploadedBy: 'citizen1'
              }
            ],
            status: 'reported',
            reportedBy: 'citizen1',
            reportedAt: '2024-01-25T10:00:00Z',
            severity: 'high',
            description: 'Large amount of mixed waste dumped illegally'
          },
          {
            id: '2',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            },
            photos: [
              {
                id: 'photo2',
                url: '/api/placeholder/400/300',
                uploadedAt: '2024-01-24T15:30:00Z',
                uploadedBy: 'citizen2'
              }
            ],
            status: 'cleaned',
            reportedBy: 'citizen2',
            reportedAt: '2024-01-24T15:30:00Z',
            cleanedAt: '2024-01-25T09:00:00Z',
            cleanedBy: 'worker1',
            severity: 'medium',
            description: 'Small waste pile near residential area'
          }
        ];

        const mockCommunityReports: CommunityReport[] = [
          {
            id: '1',
            type: 'waste_movement',
            description: 'Waste being transported without proper covering',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            },
            photos: [
              {
                id: 'photo3',
                url: '/api/placeholder/400/300',
                uploadedAt: '2024-01-25T11:00:00Z'
              }
            ],
            reportedBy: 'citizen3',
            reportedAt: '2024-01-25T11:00:00Z',
            status: 'pending'
          },
          {
            id: '2',
            type: 'collection_issue',
            description: 'Collection vehicle not following schedule',
            location: {
              lat: 19.0760,
              lng: 72.8777,
              address: 'Mumbai, Maharashtra'
            },
            photos: [],
            reportedBy: 'citizen4',
            reportedAt: '2024-01-24T14:00:00Z',
            status: 'in_progress',
            assignedTo: 'supervisor1'
          }
        ];

        const mockAreaCleanliness: AreaCleanliness[] = [
          {
            areaId: 'area1',
            areaName: 'Ward 1',
            score: 85,
            lastUpdated: '2024-01-25T12:00:00Z',
            submittedBy: 'champion1',
            factors: {
              wasteSegregation: 90,
              collectionEfficiency: 80,
              publicAwareness: 85,
              infrastructure: 85
            }
          },
          {
            areaId: 'area2',
            areaName: 'Ward 2',
            score: 72,
            lastUpdated: '2024-01-24T16:00:00Z',
            submittedBy: 'champion2',
            factors: {
              wasteSegregation: 70,
              collectionEfficiency: 75,
              publicAwareness: 70,
              infrastructure: 73
            }
          }
        ];

        setDumpingSites(mockDumpingSites);
        setCommunityReports(mockCommunityReports);
        setAreaCleanliness(mockAreaCleanliness);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'dumping' ? dumpingSites : 
                     activeTab === 'reports' ? communityReports : 
                     areaCleanliness;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'dumping' 
      ? (item as DumpingSite).location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as DumpingSite).description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as DumpingSite).reportedBy.toLowerCase().includes(searchQuery.toLowerCase())
      : activeTab === 'reports'
      ? (item as CommunityReport).description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as CommunityReport).type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as CommunityReport).reportedBy.toLowerCase().includes(searchQuery.toLowerCase())
      : (item as AreaCleanliness).areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as AreaCleanliness).submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (activeTab === 'dumping' && (item as DumpingSite).status === filterStatus) ||
                         (activeTab === 'reports' && (item as CommunityReport).status === filterStatus);
    
    const matchesSeverity = filterSeverity === 'all' || 
                           (activeTab === 'dumping' && (item as DumpingSite).severity === filterSeverity);
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cleaned':
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'reported':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'under_review':
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'waste_movement':
        return 'text-blue-600 bg-blue-100';
      case 'dumping':
        return 'text-red-600 bg-red-100';
      case 'collection_issue':
        return 'text-yellow-600 bg-yellow-100';
      case 'other':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewItem = (item: DumpingSite | CommunityReport | AreaCleanliness) => {
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
            Digital Monitoring System
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor dumping sites, community reports, and area cleanliness
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
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dumping')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dumping'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Camera className="h-4 w-4 inline mr-2" />
            Dumping Sites ({dumpingSites.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Community Reports ({communityReports.length})
          </button>
          <button
            onClick={() => setActiveTab('cleanliness')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cleanliness'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Area Cleanliness ({areaCleanliness.length})
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
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              {activeTab === 'dumping' ? (
                <>
                  <option value="reported">Reported</option>
                  <option value="under_review">Under Review</option>
                  <option value="cleaned">Cleaned</option>
                </>
              ) : activeTab === 'reports' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </>
              ) : (
                <>
                  <option value="excellent">Excellent (80+)</option>
                  <option value="good">Good (60-79)</option>
                  <option value="poor">Poor (&lt;60)</option>
                </>
              )}
            </select>
          </div>
          {activeTab === 'dumping' && (
            <div className="relative">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}
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
                {activeTab === 'dumping' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location & Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : activeTab === 'reports' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cleanliness Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
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
                if (activeTab === 'dumping') {
                  const site = item as DumpingSite;
                  return (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {site.location.address}
                            </div>
                            <div className="text-sm text-gray-500">
                              {site.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Image className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {site.photos.length} photo{site.photos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(site.status)}`}>
                            {site.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(site.severity)}`}>
                            {site.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {site.reportedBy}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(site.reportedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(site)}
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
                } else if (activeTab === 'reports') {
                  const report = item as CommunityReport;
                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {report.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                            {report.type.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.location.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.reportedBy}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(report.reportedAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(report)}
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
                  const area = item as AreaCleanliness;
                  return (
                    <tr key={area.areaId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {area.areaName}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {area.areaId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-2xl font-bold ${getScoreColor(area.score)}`}>
                          {area.score}
                        </div>
                        <div className="text-sm text-gray-500">
                          out of 100
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Segregation: {area.factors.wasteSegregation}%</div>
                          <div>Collection: {area.factors.collectionEfficiency}%</div>
                          <div>Awareness: {area.factors.publicAwareness}%</div>
                          <div>Infrastructure: {area.factors.infrastructure}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(area.lastUpdated).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {area.submittedBy}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(area)}
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
                  {activeTab === 'dumping' ? 'Dumping Site' : 
                   activeTab === 'reports' ? 'Community Report' : 
                   'Area Cleanliness'} Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {activeTab === 'dumping' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as DumpingSite).location.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as DumpingSite).status)}`}>
                          {(selectedItem as DumpingSite).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor((selectedItem as DumpingSite).severity)}`}>
                          {(selectedItem as DumpingSite).severity}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reported By</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as DumpingSite).reportedBy}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as DumpingSite).description}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Photos</label>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(selectedItem as DumpingSite).photos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <img
                              src={photo.url}
                              alt="Dumping site"
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                              {new Date(photo.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {(selectedItem as DumpingSite).cleanedAt && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cleaned At</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date((selectedItem as DumpingSite).cleanedAt!).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cleaned By</label>
                          <p className="mt-1 text-sm text-gray-900">{(selectedItem as DumpingSite).cleanedBy}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : activeTab === 'reports' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor((selectedItem as CommunityReport).type)}`}>
                          {(selectedItem as CommunityReport).type.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as CommunityReport).status)}`}>
                          {(selectedItem as CommunityReport).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CommunityReport).location.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reported By</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CommunityReport).reportedBy}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as CommunityReport).description}</p>
                    </div>

                    {(selectedItem as CommunityReport).assignedTo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CommunityReport).assignedTo}</p>
                      </div>
                    )}

                    {(selectedItem as CommunityReport).resolution && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Resolution</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CommunityReport).resolution}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area Name</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AreaCleanliness).areaName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area ID</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AreaCleanliness).areaId}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cleanliness Score</label>
                        <div className={`text-3xl font-bold ${getScoreColor((selectedItem as AreaCleanliness).score)}`}>
                          {(selectedItem as AreaCleanliness).score}/100
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AreaCleanliness).submittedBy}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Factor Scores</label>
                      <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-blue-800">
                            {(selectedItem as AreaCleanliness).factors.wasteSegregation}%
                          </div>
                          <div className="text-sm text-blue-600">Segregation</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-green-800">
                            {(selectedItem as AreaCleanliness).factors.collectionEfficiency}%
                          </div>
                          <div className="text-sm text-green-600">Collection</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-yellow-800">
                            {(selectedItem as AreaCleanliness).factors.publicAwareness}%
                          </div>
                          <div className="text-sm text-yellow-600">Awareness</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-semibold text-purple-800">
                            {(selectedItem as AreaCleanliness).factors.infrastructure}%
                          </div>
                          <div className="text-sm text-purple-600">Infrastructure</div>
                        </div>
                      </div>
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
                  Edit {activeTab === 'dumping' ? 'Site' : activeTab === 'reports' ? 'Report' : 'Area'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringSystem;