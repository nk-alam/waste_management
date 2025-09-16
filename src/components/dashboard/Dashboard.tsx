import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Award,
  Trash2,
  Truck,
  Building,
  Eye,
  Gift,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalCitizens: number;
  totalWorkers: number;
  totalChampions: number;
  totalWasteCollected: number;
  totalFacilities: number;
  activeVehicles: number;
  totalReports: number;
  totalIncentives: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCitizens: 0,
    totalWorkers: 0,
    totalChampions: 0,
    totalWasteCollected: 0,
    totalFacilities: 0,
    activeVehicles: 0,
    totalReports: 0,
    totalIncentives: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would make API calls here
        // For now, we'll use mock data
        setTimeout(() => {
          setStats({
            totalCitizens: 1250,
            totalWorkers: 85,
            totalChampions: 45,
            totalWasteCollected: 12500,
            totalFacilities: 12,
            activeVehicles: 25,
            totalReports: 180,
            totalIncentives: 320,
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const wasteGenerationData = [
    { name: 'Mon', wet: 400, dry: 240, hazardous: 100 },
    { name: 'Tue', wet: 300, dry: 139, hazardous: 80 },
    { name: 'Wed', wet: 200, dry: 980, hazardous: 120 },
    { name: 'Thu', wet: 278, dry: 390, hazardous: 90 },
    { name: 'Fri', wet: 189, dry: 480, hazardous: 110 },
    { name: 'Sat', wet: 239, dry: 380, hazardous: 95 },
    { name: 'Sun', wet: 349, dry: 430, hazardous: 85 },
  ];

  const complianceData = [
    { name: 'Households', compliant: 85, nonCompliant: 15 },
    { name: 'Bulk Generators', compliant: 92, nonCompliant: 8 },
    { name: 'Facilities', compliant: 78, nonCompliant: 22 },
  ];

  const facilityUtilizationData = [
    { name: 'Biomethanization', utilization: 85, capacity: 100 },
    { name: 'Waste-to-Energy', utilization: 92, capacity: 100 },
    { name: 'Recycling', utilization: 78, capacity: 100 },
    { name: 'Composting', utilization: 65, capacity: 100 },
  ];

  const wasteTypeData = [
    { name: 'Wet Waste', value: 45, color: '#10B981' },
    { name: 'Dry Waste', value: 35, color: '#3B82F6' },
    { name: 'Hazardous', value: 15, color: '#EF4444' },
    { name: 'Mixed', value: 5, color: '#F59E0B' },
  ];

  const statsCards = [
    {
      title: 'Total Citizens',
      value: stats.totalCitizens.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Waste Workers',
      value: stats.totalWorkers.toLocaleString(),
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Green Champions',
      value: stats.totalChampions.toLocaleString(),
      icon: Award,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Waste Collected (kg)',
      value: stats.totalWasteCollected.toLocaleString(),
      icon: Trash2,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'positive' as const,
    },
    {
      title: 'Treatment Facilities',
      value: stats.totalFacilities.toLocaleString(),
      icon: Building,
      color: 'bg-indigo-500',
      change: '+2%',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Vehicles',
      value: stats.activeVehicles.toLocaleString(),
      icon: Truck,
      color: 'bg-cyan-500',
      change: '+3%',
      changeType: 'positive' as const,
    },
    {
      title: 'Monitoring Reports',
      value: stats.totalReports.toLocaleString(),
      icon: Eye,
      color: 'bg-pink-500',
      change: '+20%',
      changeType: 'positive' as const,
    },
    {
      title: 'Incentives Given',
      value: stats.totalIncentives.toLocaleString(),
      icon: Gift,
      color: 'bg-yellow-500',
      change: '+18%',
      changeType: 'positive' as const,
    },
  ];

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
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your waste management system
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${card.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          <span className="sr-only">
                            {card.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                          </span>
                          {card.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waste Generation Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Waste Generation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={wasteGenerationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="wet" stroke="#10B981" strokeWidth={2} name="Wet Waste" />
              <Line type="monotone" dataKey="dry" stroke="#3B82F6" strokeWidth={2} name="Dry Waste" />
              <Line type="monotone" dataKey="hazardous" stroke="#EF4444" strokeWidth={2} name="Hazardous" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="compliant" fill="#10B981" name="Compliant" />
              <Bar dataKey="nonCompliant" fill="#EF4444" name="Non-Compliant" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facility Utilization */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Facility Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facilityUtilizationData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="utilization" fill="#3B82F6" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Waste Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Waste Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={wasteTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {wasteTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {[
                { id: 1, type: 'citizen', action: 'New citizen registered', time: '2 minutes ago', icon: Users, color: 'bg-blue-500' },
                { id: 2, type: 'waste', action: 'Waste collection completed', time: '5 minutes ago', icon: Trash2, color: 'bg-green-500' },
                { id: 3, type: 'violation', action: 'Segregation violation reported', time: '10 minutes ago', icon: AlertTriangle, color: 'bg-red-500' },
                { id: 4, type: 'training', action: 'Training session completed', time: '15 minutes ago', icon: CheckCircle, color: 'bg-purple-500' },
                { id: 5, type: 'facility', action: 'Facility efficiency updated', time: '20 minutes ago', icon: Building, color: 'bg-indigo-500' },
              ].map((activity, activityIdx) => {
                const Icon = activity.icon;
                return (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== 4 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`${activity.color} h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white`}>
                            <Icon className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">{activity.action}</p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <time>{activity.time}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;