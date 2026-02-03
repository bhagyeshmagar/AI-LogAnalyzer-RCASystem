import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchServices, fetchLogs, fetchIncidents } from '../services/api';

function ServiceCard({ service, stats }) {
    const getHealthStatus = () => {
        if (stats.openIncidents > 0) return { status: 'critical', label: 'Critical', icon: '🔴' };
        if (stats.errorRate > 10) return { status: 'warning', label: 'Warning', icon: '🟡' };
        return { status: 'healthy', label: 'Healthy', icon: '🟢' };
    };

    const health = getHealthStatus();

    return (
        <div className="stat-card" style={{
            position: 'relative',
            borderLeft: `4px solid ${health.status === 'critical' ? 'var(--error)' : health.status === 'warning' ? 'var(--warning)' : 'var(--success)'}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <div className="stat-label">Service</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {service}
                    </div>
                </div>
                <span className={`badge ${health.status === 'critical' ? 'error' : health.status === 'warning' ? 'warn' : 'resolved'}`}>
                    {health.icon} {health.label}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Logs</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{stats.totalLogs}</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Error Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.errorRate > 10 ? 'var(--error)' : 'var(--text-primary)' }}>
                        {stats.errorRate.toFixed(1)}%
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Open Issues</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.openIncidents > 0 ? 'var(--error)' : 'var(--success)' }}>
                        {stats.openIncidents}
                    </div>
                </div>
            </div>

            {/* Mini error bar */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                    width: `${Math.min(stats.errorRate, 100)}%`,
                    height: '100%',
                    background: stats.errorRate > 10 ? 'var(--error)' : 'var(--accent-primary)',
                    transition: 'width 0.5s ease'
                }}></div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Link to={`/logs?service=${service}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    View Logs
                </Link>
                <Link to={`/incidents?serviceName=${service}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    View Incidents
                </Link>
            </div>
        </div>
    );
}

function Services() {
    const [services, setServices] = useState([]);
    const [serviceStats, setServiceStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [servicesData, logsData, incidentsData] = await Promise.all([
                    fetchServices(),
                    fetchLogs({ limit: 500 }),
                    fetchIncidents()
                ]);

                setServices(servicesData);

                // Calculate stats per service
                const stats = {};
                servicesData.forEach(service => {
                    const serviceLogs = logsData.filter(l => l.serviceName === service);
                    const errorLogs = serviceLogs.filter(l => l.level === 'ERROR');
                    const serviceIncidents = incidentsData.filter(i => i.serviceName === service && i.status === 'OPEN');

                    stats[service] = {
                        totalLogs: serviceLogs.length,
                        errorCount: errorLogs.length,
                        errorRate: serviceLogs.length > 0 ? (errorLogs.length / serviceLogs.length) * 100 : 0,
                        openIncidents: serviceIncidents.length
                    };
                });

                setServiceStats(stats);
            } catch (err) {
                console.error('Failed to load services:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const healthySvcs = services.filter(s =>
        serviceStats[s]?.openIncidents === 0 && (serviceStats[s]?.errorRate || 0) <= 10
    ).length;

    const criticalSvcs = services.filter(s =>
        serviceStats[s]?.openIncidents > 0
    ).length;

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span className="loading-text">Loading services...</span>
            </div>
        );
    }

    return (
        <div>
            <header className="page-header">
                <h1>Services</h1>
                <p>Monitor health and status of all connected services</p>
            </header>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <div className="stat-card">
                    <div className="stat-label">📦 Total Services</div>
                    <div className="stat-value">{services.length}</div>
                </div>
                <div className="stat-card resolved">
                    <div className="stat-label">✅ Healthy</div>
                    <div className="stat-value">{healthySvcs}</div>
                </div>
                <div className="stat-card open">
                    <div className="stat-label">🔴 Critical</div>
                    <div className="stat-value">{criticalSvcs}</div>
                </div>
            </div>

            {services.length === 0 ? (
                <div className="empty-state">
                    <h3>No services detected</h3>
                    <p>Run the log producer to register services</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '24px'
                }}>
                    {services.map(service => (
                        <ServiceCard
                            key={service}
                            service={service}
                            stats={serviceStats[service] || { totalLogs: 0, errorCount: 0, errorRate: 0, openIncidents: 0 }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Services;
