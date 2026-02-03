import { useState, useEffect } from 'react';
import { fetchLogs, fetchServices } from '../services/api';
import { useWebSocket } from '../services/useWebSocket';

function LogExplorer() {
    const [logs, setLogs] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liveMode, setLiveMode] = useState(false);
    const [filters, setFilters] = useState({
        level: '',
        serviceName: '',
        search: '',
        limit: 100
    });

    useWebSocket('/topic/logs', (newLog) => {
        if (liveMode) {
            // Apply client-side filters if needed
            if (filters.level && newLog.level !== filters.level) return;
            if (filters.serviceName && newLog.serviceName !== filters.serviceName) return;
            if (filters.search && !newLog.message.toLowerCase().includes(filters.search.toLowerCase())) return;

            setLogs(prevLogs => {
                const updated = [newLog, ...prevLogs];
                return updated.slice(0, filters.limit);
            });
        }
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [logsData, servicesData] = await Promise.all([
                fetchLogs(filters),
                fetchServices()
            ]);
            setLogs(logsData);
            setServices(servicesData);
        } catch (err) {
            console.error('Failed to load logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filters]); // Reload when filters change

    const handleSearch = () => {
        loadData();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const exportToJSON = () => {
        const dataStr = JSON.stringify(logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToCSV = () => {
        const headers = ['Timestamp', 'Service', 'Level', 'Message', 'Cluster ID'];
        const rows = logs.map(log => [
            log.timestamp,
            log.serviceName,
            log.level,
            `"${(log.message || '').replace(/"/g, '""')}"`,
            log.clusterId || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getLevelBadgeClass = (level) => {
        switch (level?.toUpperCase()) {
            case 'ERROR': return 'error';
            case 'WARN': return 'warn';
            case 'INFO': return 'info';
            default: return '';
        }
    };

    return (
        <div>
            <header className="page-header">
                <h1>Log Explorer</h1>
                <p>Search and analyze log entries across all services</p>
            </header>

            <div className="input-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Search log messages..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    onKeyPress={handleKeyPress}
                />

                <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                >
                    <option value="">All Levels</option>
                    <option value="ERROR">🔴 ERROR</option>
                    <option value="WARN">🟡 WARN</option>
                    <option value="INFO">🔵 INFO</option>
                    <option value="DEBUG">⚪ DEBUG</option>
                </select>

                <select
                    value={filters.serviceName}
                    onChange={(e) => setFilters({ ...filters, serviceName: e.target.value })}
                >
                    <option value="">All Services</option>
                    {services.map(service => (
                        <option key={service} value={service}>{service}</option>
                    ))}
                </select>

                <select
                    value={filters.limit}
                    onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                >
                    <option value={50}>50 logs</option>
                    <option value={100}>100 logs</option>
                    <option value={200}>200 logs</option>
                    <option value={500}>500 logs</option>
                </select>

                <button className="btn btn-primary" onClick={handleSearch}>
                    Search
                </button>

                <button
                    className={`btn ${liveMode ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => setLiveMode(!liveMode)}
                    style={{ minWidth: '120px' }}
                >
                    {liveMode ? '🔴 Stop Live' : '⚡ Go Live'}
                </button>
            </div>

            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button className="btn btn-secondary btn-sm" onClick={exportToJSON} disabled={logs.length === 0}>
                    📥 Export JSON
                </button>
                <button className="btn btn-secondary btn-sm" onClick={exportToCSV} disabled={logs.length === 0}>
                    📥 Export CSV
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center' }}>
                    {logs.length} log{logs.length !== 1 ? 's' : ''} loaded
                </span>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <span className="loading-text">Loading logs...</span>
                </div>
            ) : logs.length === 0 ? (
                <div className="empty-state">
                    <h3>No logs found</h3>
                    <p>Try adjusting your search criteria or run the log producer</p>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>Timestamp</th>
                                    <th style={{ width: '140px' }}>Service</th>
                                    <th style={{ width: '80px' }}>Level</th>
                                    <th>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={log.id || index}>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            {log.serviceName}
                                        </td>
                                        <td>
                                            <span className={`badge ${getLevelBadgeClass(log.level)}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            maxWidth: '500px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: log.level === 'ERROR' ? 'var(--error)' : 'var(--text-primary)'
                                        }}>
                                            {log.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LogExplorer;
