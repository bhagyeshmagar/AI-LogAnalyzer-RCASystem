import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchIncidentStats, fetchIncidents, fetchTimeline } from '../services/api';

// Animated counter hook
function useAnimatedCounter(end, duration = 1000) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (end === 0) {
            setCount(0);
            return;
        }

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const currentCount = Math.floor(progress * end);

            if (currentCount !== countRef.current) {
                countRef.current = currentCount;
                setCount(currentCount);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        startTimeRef.current = null;
        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
}

function StatCard({ label, value, type, icon }) {
    const animatedValue = useAnimatedCounter(value || 0);

    return (
        <div className={`stat-card ${type || ''}`}>
            <div className="stat-label">{icon} {label}</div>
            <div className="stat-value">{animatedValue}</div>
        </div>
    );
}

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentIncidents, setRecentIncidents] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsData, incidentsData, timelineData] = await Promise.all([
                fetchIncidentStats(),
                fetchIncidents(),
                fetchTimeline(60)
            ]);
            setStats(statsData);
            setRecentIncidents(incidentsData.slice(0, 5));
            setTimeline(timelineData);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span className="loading-text">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="empty-state">
                <h3>Unable to load data</h3>
                <p>{error}</p>
                <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>
                    Make sure the backend is running on <code>localhost:8090</code>
                </p>
                <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={loadData}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <header className="page-header">
                <h1>Dashboard</h1>
                <p>
                    Real-time monitoring and anomaly detection overview
                    {lastUpdated && (
                        <span style={{ marginLeft: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </p>
            </header>

            <div className="stats-grid">
                <StatCard
                    label="Total Incidents"
                    value={stats?.total}
                    icon="📈"
                />
                <StatCard
                    label="Open Incidents"
                    value={stats?.open}
                    type="open"
                    icon="🔴"
                />
                <StatCard
                    label="Resolved"
                    value={stats?.resolved}
                    type="resolved"
                    icon="✅"
                />
                <StatCard
                    label="Error Bursts"
                    value={stats?.byType?.ERROR_BURST}
                    icon="💥"
                />
            </div>

            <div className="chart-container">
                <h3>Log Activity Timeline (Last 60 minutes)</h3>
                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={timeline}>
                        <defs>
                            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorWarn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey="time"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickFormatter={(val) => {
                                const date = new Date(val);
                                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            }}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-lg)'
                            }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                            labelFormatter={(val) => new Date(val).toLocaleString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="ERROR"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorError)"
                        />
                        <Area
                            type="monotone"
                            dataKey="WARN"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorWarn)"
                        />
                        <Area
                            type="monotone"
                            dataKey="INFO"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorInfo)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        🚨 Recent Incidents
                    </h3>
                    <Link to="/incidents" className="btn btn-secondary btn-sm">
                        View All →
                    </Link>
                </div>

                {recentIncidents.length === 0 ? (
                    <div className="empty-state">
                        <h3>No incidents yet</h3>
                        <p>Run the log producer to generate some data</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Service</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentIncidents.map(incident => (
                                    <tr key={incident.id}>
                                        <td>
                                            <Link to={`/incidents/${incident.id}`} style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                                                #{incident.id}
                                            </Link>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{incident.serviceName}</td>
                                        <td><span className="badge error">{incident.type}</span></td>
                                        <td>
                                            <span className={`badge ${incident.status.toLowerCase()}`}>
                                                {incident.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(incident.startTime).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
