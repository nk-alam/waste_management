import React, { useEffect, useState } from 'react';
import {
    Plus,
    Search,
    Download,
    Eye,
    Edit,
    Trash2,
    Building2,
    BarChart3,
    FileText,
    X
} from 'lucide-react';

interface ULB {
    id: string;
    name: string;
    state: string;
    population: number;
    wards: number;
    facilities: number;
    complianceScore: number; // 0-100
    lastUpdated: string;
}

interface ULBPolicy {
    id: string;
    ulbId: string;
    title: string;
    description: string;
    effectiveFrom: string;
    status: 'draft' | 'active' | 'archived';
}

interface PerformanceMetric {
    id: string;
    ulbId: string;
    date: string;
    segregationCompliance: number;
    collectionEfficiency: number;
    treatmentEfficiency: number;
    grievanceResolution: number;
}

const ULBManagement: React.FC = () => {
    const [ulbs, setUlbs] = useState<ULB[]>([]);
    const [policies, setPolicies] = useState<ULBPolicy[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ulbs' | 'policies' | 'metrics'>('ulbs');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            const mockUlbs: ULB[] = [
                {
                    id: 'ulb1',
                    name: 'Brihanmumbai Municipal Corporation',
                    state: 'Maharashtra',
                    population: 12442373,
                    wards: 227,
                    facilities: 12,
                    complianceScore: 86,
                    lastUpdated: '2024-01-25T10:00:00Z'
                },
                {
                    id: 'ulb2',
                    name: 'New Delhi Municipal Council',
                    state: 'Delhi',
                    population: 257803,
                    wards: 28,
                    facilities: 6,
                    complianceScore: 91,
                    lastUpdated: '2024-01-24T09:30:00Z'
                }
            ];

            const mockPolicies: ULBPolicy[] = [
                {
                    id: 'p1',
                    ulbId: 'ulb1',
                    title: 'Mandatory Source Segregation',
                    description: 'All households must segregate waste into wet, dry, and hazardous.',
                    effectiveFrom: '2024-02-01T00:00:00Z',
                    status: 'active'
                },
                {
                    id: 'p2',
                    ulbId: 'ulb2',
                    title: 'Bulk Waste Generator Policy',
                    description: 'Bulk generators must process waste on-site or via empanelled vendors.',
                    effectiveFrom: '2024-03-01T00:00:00Z',
                    status: 'draft'
                }
            ];

            const mockMetrics: PerformanceMetric[] = [
                {
                    id: 'm1',
                    ulbId: 'ulb1',
                    date: '2024-01-24',
                    segregationCompliance: 88,
                    collectionEfficiency: 92,
                    treatmentEfficiency: 81,
                    grievanceResolution: 76
                },
                {
                    id: 'm2',
                    ulbId: 'ulb2',
                    date: '2024-01-24',
                    segregationCompliance: 93,
                    collectionEfficiency: 95,
                    treatmentEfficiency: 87,
                    grievanceResolution: 82
                }
            ];

            setUlbs(mockUlbs);
            setPolicies(mockPolicies);
            setMetrics(mockMetrics);
            setLoading(false);
        }, 600);
    }, []);

    const currentData = activeTab === 'ulbs' ? ulbs : activeTab === 'policies' ? policies : metrics;

    const filteredData = currentData.filter((item: any) => {
        if (activeTab === 'ulbs') {
            return (
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.state.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (activeTab === 'policies') {
            return (
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.ulbId.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return (
            item.ulbId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.date.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const openModal = (it: any) => {
        setSelectedItem(it);
        setShowModal(true);
    };
    const closeModal = () => {
        setSelectedItem(null);
        setShowModal(false);
    };

    const scoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 75) return 'text-yellow-600';
        return 'text-red-600';
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
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">ULB Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage Urban Local Bodies, policies and performance metrics</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </button>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" /> Add {activeTab === 'ulbs' ? 'ULB' : activeTab === 'policies' ? 'Policy' : 'Metric'}
                    </button>
                </div>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('ulbs')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'ulbs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <Building2 className="h-4 w-4 inline mr-2" /> ULBs ({ulbs.length})
                    </button>
                    <button onClick={() => setActiveTab('policies')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'policies' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <FileText className="h-4 w-4 inline mr-2" /> Policies ({policies.length})
                    </button>
                    <button onClick={() => setActiveTab('metrics')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'metrics' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        <BarChart3 className="h-4 w-4 inline mr-2" /> Metrics ({metrics.length})
                    </button>
                </nav>
            </div>

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
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {activeTab === 'ulbs' ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ULB</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population & Wards</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facilities</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </>
                                ) : activeTab === 'policies' ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ULB</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ULB & Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operational Metrics</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grievances</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.map((item: any) => {
                                if (activeTab === 'ulbs') {
                                    const u = item as ULB;
                                    const complianceColor = scoreColor(u.complianceScore);
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                                <div className="text-sm text-gray-500">{u.state}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.population.toLocaleString()} • {u.wards} wards</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.facilities}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-semibold ${complianceColor}`}>{u.complianceScore}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openModal(u)} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                                                    <button className="text-indigo-600 hover:text-indigo-900"><Edit className="h-4 w-4" /></button>
                                                    <button className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                if (activeTab === 'policies') {
                                    const p = item as ULBPolicy;
                                    const statusColor = p.status === 'active' ? 'text-green-600 bg-green-100' : p.status === 'draft' ? 'text-yellow-600 bg-yellow-100' : 'text-gray-600 bg-gray-100';
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{p.title}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">{p.description}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.ulbId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(p.effectiveFrom).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{p.status}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openModal(p)} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                                                    <button className="text-indigo-600 hover:text-indigo-900"><Edit className="h-4 w-4" /></button>
                                                    <button className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }

                                const m = item as PerformanceMetric;
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{m.ulbId}</div>
                                            <div className="text-sm text-gray-500">{m.date}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Segregation: <span className="font-semibold">{m.segregationCompliance}%</span> • Collection: <span className="font-semibold">{m.collectionEfficiency}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            Resolution: <span className="font-semibold">{m.grievanceResolution}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => openModal(m)} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4" /></button>
                                                <button className="text-indigo-600 hover:text-indigo-900"><Edit className="h-4 w-4" /></button>
                                                <button className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">{activeTab === 'ulbs' ? 'ULB' : activeTab === 'policies' ? 'Policy' : 'Metric'} Details</h3>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
                            </div>
                            <div className="space-y-3 text-sm text-gray-900">
                                <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">{JSON.stringify(selectedItem, null, 2)}</pre>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                                <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Edit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ULBManagement;


