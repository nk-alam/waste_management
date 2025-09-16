import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  BarChart3,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  User
} from 'lucide-react';

interface CleaningDay {
  id: string;
  title: string;
  date: string;
  area: string;
  organizer: string;
  participants: {
    id: string;
    name: string;
    role: string;
    attended: boolean;
  }[];
  status: 'scheduled' | 'completed' | 'cancelled';
  description: string;
  createdAt: string;
}

interface GovernmentParticipation {
  id: string;
  employeeName: string;
  department: string;
  designation: string;
  eventId: string;
  eventType: string;
  participationDate: string;
  contribution: string;
  status: 'confirmed' | 'attended' | 'absent';
}

interface AwarenessCampaign {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  area: string;
  organizer: string;
  participants: number;
  status: 'planned' | 'ongoing' | 'completed';
  materials: string[];
}

const CommunityEngagement: React.FC = () => {
  const [cleaningDays, setCleaningDays] = useState<CleaningDay[]>([]);
  const [governmentParticipation, setGovernmentParticipation] = useState<GovernmentParticipation[]>([]);
  const [awarenessCampaigns, setAwarenessCampaigns] = useState<AwarenessCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cleaning');
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
        const mockCleaningDays: CleaningDay[] = [
          {
            id: '1',
            title: 'Ward 1 Clean-up Drive',
            date: '2024-02-01T09:00:00Z',
            area: 'Ward 1',
            organizer: 'champion1',
            participants: [
              { id: 'citizen1', name: 'John Doe', role: 'citizen', attended: true },
              { id: 'citizen2', name: 'Jane Smith', role: 'citizen', attended: true },
              { id: 'worker1', name: 'Raj Kumar', role: 'worker', attended: true }
            ],
            status: 'scheduled',
            description: 'Monthly community cleaning drive',
            createdAt: '2024-01-20T10:00:00Z'
          },
          {
            id: '2',
            title: 'Beach Clean-up Initiative',
            date: '2024-01-15T08:00:00Z',
            area: 'Beach Area',
            organizer: 'champion2',
            participants: [
              { id: 'citizen3', name: 'Bob Johnson', role: 'citizen', attended: true },
              { id: 'citizen4', name: 'Alice Brown', role: 'citizen', attended: false }
            ],
            status: 'completed',
            description: 'Beach cleaning and awareness program',
            createdAt: '2024-01-10T10:00:00Z'
          }
        ];

        const mockGovernmentParticipation: GovernmentParticipation[] = [
          {
            id: '1',
            employeeName: 'Dr. Rajesh Kumar',
            department: 'Municipal Corporation',
            designation: 'Health Officer',
            eventId: '1',
            eventType: 'cleaning_day',
            participationDate: '2024-02-01T09:00:00Z',
            contribution: 'Provided medical supplies and guidance',
            status: 'confirmed'
          },
          {
            id: '2',
            employeeName: 'Ms. Priya Sharma',
            department: 'Education Department',
            designation: 'District Education Officer',
            eventId: '2',
            eventType: 'awareness_campaign',
            participationDate: '2024-01-15T08:00:00Z',
            contribution: 'Conducted awareness sessions for students',
            status: 'attended'
          }
        ];

        const mockAwarenessCampaigns: AwarenessCampaign[] = [
          {
            id: '1',
            title: 'Waste Segregation Awareness',
            description: 'Educational campaign about proper waste segregation',
            targetAudience: 'Residents',
            startDate: '2024-02-01T10:00:00Z',
            endDate: '2024-02-28T18:00:00Z',
            area: 'Ward 1',
            organizer: 'champion1',
            participants: 150,
            status: 'planned',
            materials: ['Brochures', 'Posters', 'Audio-visual content']
          },
          {
            id: '2',
            title: 'School Education Program',
            description: 'Waste management education for school children',
            targetAudience: 'Students',
            startDate: '2024-01-10T09:00:00Z',
            endDate: '2024-01-20T17:00:00Z',
            area: 'Ward 2',
            organizer: 'champion2',
            participants: 300,
            status: 'completed',
            materials: ['Educational kits', 'Interactive games', 'Certificates']
          }
        ];

        setCleaningDays(mockCleaningDays);
        setGovernmentParticipation(mockGovernmentParticipation);
        setAwarenessCampaigns(mockAwarenessCampaigns);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const currentData = activeTab === 'cleaning' ? cleaningDays :
    activeTab === 'government' ? governmentParticipation :
      awarenessCampaigns;

  const filteredData = currentData.filter(item => {
    const matchesSearch = activeTab === 'cleaning'
      ? (item as CleaningDay).title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as CleaningDay).area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item as CleaningDay).organizer.toLowerCase().includes(searchQuery.toLowerCase())
      : activeTab === 'government'
        ? (item as GovernmentParticipation).employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as GovernmentParticipation).department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as GovernmentParticipation).eventType.toLowerCase().includes(searchQuery.toLowerCase())
        : (item as AwarenessCampaign).title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as AwarenessCampaign).area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as AwarenessCampaign).targetAudience.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (activeTab === 'cleaning' && (item as CleaningDay).status === filterStatus) ||
      (activeTab === 'government' && (item as GovernmentParticipation).status === filterStatus) ||
      (activeTab === 'awareness' && (item as AwarenessCampaign).status === filterStatus);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'attended':
        return 'text-green-600 bg-green-100';
      case 'scheduled':
      case 'confirmed':
      case 'planned':
        return 'text-blue-600 bg-blue-100';
      case 'ongoing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'absent':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleViewItem = (item: CleaningDay | GovernmentParticipation | AwarenessCampaign) => {
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
            Community Engagement
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage community participation and awareness programs
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
            Add {activeTab === 'cleaning' ? 'Event' : activeTab === 'government' ? 'Participation' : 'Campaign'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('cleaning')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cleaning'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Cleaning Days ({cleaningDays.length})
          </button>
          <button
            onClick={() => setActiveTab('government')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'government'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Government Participation ({governmentParticipation.length})
          </button>
          <button
            onClick={() => setActiveTab('awareness')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'awareness'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Awareness Campaigns ({awarenessCampaigns.length})
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
              {activeTab === 'cleaning' ? (
                <>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              ) : activeTab === 'government' ? (
                <>
                  <option value="confirmed">Confirmed</option>
                  <option value="attended">Attended</option>
                  <option value="absent">Absent</option>
                </>
              ) : (
                <>
                  <option value="planned">Planned</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
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
                {activeTab === 'cleaning' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area & Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : activeTab === 'government' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department & Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event & Contribution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target & Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants & Materials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Duration
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
                if (activeTab === 'cleaning') {
                  const event = item as CleaningDay;
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {event.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {event.area}
                        </div>
                        <div className="text-sm text-gray-500">
                          by {event.organizer}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {event.participants.length} participants
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.participants.filter(p => p.attended).length} attended
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(event)}
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
                } else if (activeTab === 'government') {
                  const participation = item as GovernmentParticipation;
                  return (
                    <tr key={participation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {participation.employeeName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Event: {participation.eventId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {participation.department}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participation.designation}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {participation.eventType.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participation.contribution}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participation.status)}`}>
                            {participation.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(participation.participationDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(participation)}
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
                  const campaign = item as AwarenessCampaign;
                  return (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-yellow-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {campaign.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {campaign.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign.targetAudience}
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.area}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {campaign.participants} participants
                        </div>
                        <div className="text-sm text-gray-500">
                          {campaign.materials.length} materials
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewItem(campaign)}
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
                  {activeTab === 'cleaning' ? 'Cleaning Day' :
                    activeTab === 'government' ? 'Government Participation' :
                      'Awareness Campaign'} Details
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {activeTab === 'cleaning' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CleaningDay).title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as CleaningDay).status)}`}>
                          {(selectedItem as CleaningDay).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CleaningDay).area}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Organizer</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as CleaningDay).organizer}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as CleaningDay).description}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Participants</label>
                      <div className="mt-1 space-y-2">
                        {(selectedItem as CleaningDay).participants.map((participant) => (
                          <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                              <span className="ml-2 text-sm text-gray-500">({participant.role})</span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${participant.attended ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                              }`}>
                              {participant.attended ? 'Attended' : 'Absent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : activeTab === 'government' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Employee Name</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).employeeName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as GovernmentParticipation).status)}`}>
                          {(selectedItem as GovernmentParticipation).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Department</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Designation</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).designation}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Event Type</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).eventType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Event ID</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).eventId}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contribution</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as GovernmentParticipation).contribution}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedItem as AwarenessCampaign).status)}`}>
                          {(selectedItem as AwarenessCampaign).status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).targetAudience}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).area}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Participants</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).participants}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Organizer</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedItem as AwarenessCampaign).organizer}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Materials</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(selectedItem as AwarenessCampaign).materials.map((material, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {material}
                          </span>
                        ))}
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
                  Edit {activeTab === 'cleaning' ? 'Event' : activeTab === 'government' ? 'Participation' : 'Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityEngagement;