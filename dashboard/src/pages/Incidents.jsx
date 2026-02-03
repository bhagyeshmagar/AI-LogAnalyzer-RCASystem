import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchIncidents } from '../services/api';

function Incidents() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        type: ''
    });

    const loadIncidents = async () => {
        try {
            setLoading(true);
            const data = await fetchIncidents(filters);
            setIncidents(data);
        } catch (err) {
            console.error('Failed to load incidents:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIncidents();
    }, [filters]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OPEN': return '🔴';
            case 'ACKNOWLEDGED': return '🟡';
            case 'RESOLVED': return '🟢';
            default: return '⚪';
        }
    };

    return (
        <div>
            <header className="page-header">
                <h1>Incidents</h1>
                <p>View and manage detected anomalies and incidents</p>
            </header>

            <div className="input-group">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Statuses</option>
                    <option value="OPEN">🔴 Open</option>
                    <option value="ACKNOWLEDGED">🟡 Acknowledged</option>
                    <option value="RESOLVED">🟢 Resolved</option>
                </select>

                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                    <option value="">All Types</option>
                    <option value="ERROR_BURST">Error Burst</option>
                    <option value="LATENCY_SPIKE">Latency Spike</option>
                    <option value="NEW_ERROR_PATTERN">New Error Pattern</option>
                    <option value="RESOURCE_EXHAUSTION">Resource Exhaustion</option>
                </select>

                <button className="btn btn-secondary" onClick={loadIncidents}>
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <span className="loading-text">Loading incidents...</span>
                </div>
            ) : incidents.length === 0 ? (
                <div className="empty-state">
                    <h3>No incidents found</h3>
                    <p>Try adjusting your filters or run the log producer to generate data</p>
                </div>
            ) : (
                <div className="card">
                    <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Showing {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Service</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Started</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidents.map(incident => (
                                    <tr key={incident.id}>
                                        <td>
                                            <Link to={`/incidents/${incident.id}`} style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                                                #{incident.id}
                                            </Link>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{incident.serviceName}</td>
                                        <td><span className="badge error">{incident.type.replace('_', ' ')}</span></td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {incident.description}
                                        </td>
                                        <td>
                                            <span className={`badge ${incident.status.toLowerCase()}`}>
                                                {getStatusIcon(incident.status)} {incident.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {new Date(incident.startTime).toLocaleString()}
                                        </td>
                                        <td>
                                            <Link to={`/incidents/${incident.id}`} className="btn btn-secondary btn-sm">
                                                View →
                                            </Link>
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

export default Incidents;
