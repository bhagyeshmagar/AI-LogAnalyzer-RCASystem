import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchIncident, analyzeIncident, updateIncident } from '../services/api';

function IncidentDetail() {
    const { id } = useParams();
    const [incident, setIncident] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [notes, setNotes] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadIncident() {
            try {
                setLoading(true);
                const data = await fetchIncident(id);
                setIncident(data);
                setNotes(data.notes || '');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadIncident();
    }, [id]);

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            const result = await analyzeIncident(id);
            setAnalysis(result);
        } catch (err) {
            alert('Failed to analyze incident. Make sure OPENAI_API_KEY is set.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            setUpdating(true);
            const updated = await updateIncident(id, { status: newStatus });
            setIncident(updated);
        } catch (err) {
            alert('Failed to update incident status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            setUpdating(true);
            const updated = await updateIncident(id, { notes });
            setIncident(updated);
            setShowNoteInput(false);
        } catch (err) {
            alert('Failed to save notes.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <span className="loading-text">Loading incident details...</span>
            </div>
        );
    }

    if (error || !incident) {
        return (
            <div className="empty-state">
                <h3>Incident not found</h3>
                <Link to="/incidents" className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Back to Incidents
                </Link>
            </div>
        );
    }

    const getStatusActions = () => {
        switch (incident.status) {
            case 'OPEN':
                return (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleStatusChange('ACKNOWLEDGED')}
                        disabled={updating}
                    >
                        {updating ? '...' : '✓ Acknowledge'}
                    </button>
                );
            case 'ACKNOWLEDGED':
                return (
                    <>
                        <button
                            className="btn btn-success"
                            onClick={() => handleStatusChange('RESOLVED')}
                            disabled={updating}
                        >
                            {updating ? '...' : '✓ Mark Resolved'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleStatusChange('OPEN')}
                            disabled={updating}
                        >
                            Reopen
                        </button>
                    </>
                );
            case 'RESOLVED':
                return (
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleStatusChange('OPEN')}
                        disabled={updating}
                    >
                        Reopen Incident
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="incident-detail">
            <Link to="/incidents" style={{ color: 'var(--text-muted)', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                ← Back to Incidents
            </Link>

            <header className="page-header">
                <div className="incident-header">
                    <h1>Incident #{incident.id}</h1>
                    <span className={`badge ${incident.status.toLowerCase()}`}>
                        {incident.status}
                    </span>
                </div>
                <p>{incident.description}</p>
            </header>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {getStatusActions()}
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowNoteInput(!showNoteInput)}
                >
                    📝 {showNoteInput ? 'Cancel' : 'Add Note'}
                </button>
            </div>

            {/* Notes Section */}
            {showNoteInput && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📝 Incident Notes
                    </h4>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this incident, resolution steps, etc..."
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            marginBottom: '12px'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSaveNotes}
                        disabled={updating}
                    >
                        {updating ? 'Saving...' : 'Save Notes'}
                    </button>
                </div>
            )}

            {/* Existing Notes Display */}
            {incident.notes && !showNoteInput && (
                <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                    <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        Notes
                    </h4>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{incident.notes}</p>
                </div>
            )}

            <div className="incident-meta">
                <div className="meta-item">
                    <div className="meta-label">Service</div>
                    <div className="meta-value">{incident.serviceName}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">Type</div>
                    <div className="meta-value">{incident.type.replace('_', ' ')}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">Start Time</div>
                    <div className="meta-value">{new Date(incident.startTime).toLocaleString()}</div>
                </div>
                <div className="meta-item">
                    <div className="meta-label">End Time</div>
                    <div className="meta-value">
                        {incident.endTime ? new Date(incident.endTime).toLocaleString() : '⏳ Ongoing'}
                    </div>
                </div>
                {incident.acknowledgedAt && (
                    <div className="meta-item">
                        <div className="meta-label">Acknowledged At</div>
                        <div className="meta-value">{new Date(incident.acknowledgedAt).toLocaleString()}</div>
                    </div>
                )}
                {incident.resolvedAt && (
                    <div className="meta-item">
                        <div className="meta-label">Resolved At</div>
                        <div className="meta-value">{new Date(incident.resolvedAt).toLocaleString()}</div>
                    </div>
                )}
            </div>

            {!analysis ? (
                <button
                    className="btn btn-primary"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    style={{ marginBottom: '24px' }}
                >
                    {analyzing ? (
                        <>
                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            🤖 Generate AI Root Cause Analysis
                        </>
                    )}
                </button>
            ) : (
                <div className="rca-report">
                    <div className="rca-header">
                        <h3>🤖 AI Root Cause Analysis</h3>
                    </div>

                    <div className="rca-section">
                        <h4>Summary</h4>
                        <p>{analysis.summary}</p>
                    </div>

                    <div className="rca-section">
                        <h4>Probable Root Cause</h4>
                        <p style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '10px',
                            borderLeft: '4px solid var(--error)'
                        }}>
                            {analysis.probableRootCause}
                        </p>
                    </div>

                    <div className="rca-section">
                        <h4>Recommended Actions</h4>
                        <ul className="rca-actions">
                            {analysis.recommendedActions.map((action, index) => (
                                <li key={index}>{action}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="rca-section">
                        <h4>Confidence Score</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>
                                {Math.round(analysis.confidenceScore * 100)}%
                            </span>
                            <div className="confidence-bar" style={{ flex: 1 }}>
                                <div
                                    className="confidence-fill"
                                    style={{ width: `${analysis.confidenceScore * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default IncidentDetail;
