import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';

interface DailyWaste {
  date: string;
  wet: number;
  dry: number;
  hazardous: number;
}

interface Efficiency {
  facility: string;
  efficiency: number;
}

const AnalyticsReports: React.FC = () => {
  const [dailyWaste, setDailyWaste] = useState<DailyWaste[]>([]);
  const [efficiency, setEfficiency] = useState<Efficiency[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setDailyWaste([
        { date: 'Mon', wet: 120, dry: 80, hazardous: 10 },
        { date: 'Tue', wet: 150, dry: 90, hazardous: 12 },
        { date: 'Wed', wet: 130, dry: 85, hazardous: 11 },
        { date: 'Thu', wet: 160, dry: 95, hazardous: 13 },
        { date: 'Fri', wet: 170, dry: 100, hazardous: 12 },
        { date: 'Sat', wet: 140, dry: 88, hazardous: 9 },
        { date: 'Sun', wet: 110, dry: 70, hazardous: 8 }
      ]);
      setEfficiency([
        { facility: 'Biomethanization', efficiency: 85 },
        { facility: 'WTE', efficiency: 92 },
        { facility: 'Recycling', efficiency: 78 }
      ]);
    }, 300);
  }, []);

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Key metrics and trends</p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button className="inline-flex items-center px-4 py-2 border rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 flex items-center"><TrendingUp className="h-4 w-4 mr-2" /> Daily Waste Generation</div>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyWaste} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="wet" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="dry" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="hazardous" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 flex items-center"><BarChart3 className="h-4 w-4 mr-2" /> Facility Efficiency</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiency} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="facility" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;