import { useState, useEffect, useRef } from 'react'
import './AlgorithmVisualizer.css'

function AlgorithmVisualizer({ code, language, onClose }) {
    const [trace, setTrace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentStep, setCurrentStep] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [speed, setSpeed] = useState(1000)

    const playInterval = useRef(null)

    useEffect(() => {
        fetchTrace()
        return () => stopPlaying()
    }, [code])

    const fetchTrace = async () => {
        setLoading(true)
        setError(null)
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://agentic-ai-platform-1-e7zu.onrender.com';
            const response = await fetch(`${API_BASE_URL}/api/visualize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            })

            if (!response.ok) throw new Error("Failed to generate visualization")

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setTrace(data)
            setCurrentStep(0)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const togglePlay = () => {
        if (isPlaying) {
            stopPlaying()
        } else {
            startPlaying()
        }
    }

    const startPlaying = () => {
        if (!trace) return
        setIsPlaying(true)
        playInterval.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= trace.steps.length - 1) {
                    stopPlaying()
                    return prev
                }
                return prev + 1
            })
        }, speed)
    }

    const stopPlaying = () => {
        setIsPlaying(false)
        if (playInterval.current) {
            clearInterval(playInterval.current)
            playInterval.current = null
        }
    }

    useEffect(() => {
        if (isPlaying) {
            stopPlaying()
            startPlaying()
        }
    }, [speed])

    // --- RENDERERS ---

    // Identity tracking for fluid animation
    const getTrackedArray = (arr) => {
        if (!Array.isArray(arr)) return [];
        const counts = {};
        return arr.map((val, idx) => {
            const count = counts[val] || 0;
            counts[val] = count + 1;
            return { id: `${val}-${count}`, val, idx };
        });
    }

    const renderArray = (arr, activeIndices = []) => {
        if (!Array.isArray(arr)) return <div className="json-data">{JSON.stringify(arr)}</div>

        const numericArr = arr.filter(v => typeof v === 'number');
        // Determine range for scaling
        const maxVal = numericArr.length ? Math.max(...numericArr) : 50;
        const minVal = numericArr.length ? Math.min(...numericArr) : 0;

        // If we have negatives, we need a baseline.
        // Let's allocate 200px height. 
        // If min < 0, we split the height based on max / (|min| + max).
        // Scale factor: 200px / (max - min) (if max-min > 0)

        const spread = Math.max(maxVal - minVal, 10); // avoid div zero
        const scale = 180 / spread; // Leave some padding

        // Zero line position from BOTTOM.
        // If min >= 0, zero is at 0.
        // If min < 0, zero is at |min| * scale.
        const zeroBottom = minVal < 0 ? Math.abs(minVal) * scale : 0;

        const width = 45;
        const totalWidth = arr.length * width;

        const trackedItems = getTrackedArray(arr);

        return (
            <div className="array-container" style={{
                position: 'relative',
                height: '240px',
                width: `${totalWidth}px`,
                transition: 'width 0.3s ease',
                borderBottom: minVal >= 0 ? '1px solid rgba(255,255,255,0.2)' : 'none'
            }}>
                {/* Zero Line if needed */}
                {minVal < 0 && (
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: `${zeroBottom + 20}px`, // +20 for label text space
                        height: '1px',
                        background: 'rgba(255,255,255,0.4)',
                        zIndex: 0
                    }} />
                )}

                {trackedItems.map((item) => {
                    const val = typeof item.val === 'number' ? item.val : 0;
                    const barHeight = Math.abs(val) * scale;
                    const isNegative = val < 0;

                    return (
                        <div
                            key={item.id}
                            className={`array-bar ${activeIndices.includes(item.idx) ? 'active' : ''}`}
                            style={{
                                height: `${Math.max(barHeight, 4)}px`, // Min height for visibility
                                left: `${item.idx * 45}px`,
                                position: 'absolute',
                                // If positive: bottom = zeroBottom + textSpace
                                // If negative: top of bar is at zeroBottom + textSpace. So bottom = zeroBottom + textSpace - height
                                bottom: isNegative
                                    ? `${zeroBottom + 20 - barHeight}px`
                                    : `${zeroBottom + 20}px`,

                                backgroundColor: isNegative ? '#f87171' : undefined, // Red for negative
                                transition: 'left 0.4s ease-in-out, height 0.4s ease, bottom 0.4s ease, background-color 0.2s'
                            }}
                        >
                            <span className="bar-value" style={{
                                top: isNegative ? '100%' : undefined,
                                bottom: isNegative ? undefined : '100%',
                                marginTop: isNegative ? '5px' : undefined,
                                marginBottom: isNegative ? undefined : '5px'
                            }}>
                                {item.val}
                            </span>
                            <span className="bar-index" style={{ bottom: isNegative ? `${barHeight + 10}px` : '-25px' }}>
                                {item.idx}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderGraph = (data, activeIndices = []) => {
        // Expected format: { nodes: [1,2], edges: [[1,2]] } or similar
        const nodes = data.nodes || [];
        const edges = data.edges || [];

        return (
            <svg className="graph-svg" viewBox="0 0 500 300">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#60a5fa" />
                    </marker>
                </defs>
                {/* Simple Graph Layout Strategy: Circle or Grid */}
                {edges.map((edge, idx) => {
                    const fromId = edge.from !== undefined ? edge.from : edge[0];
                    const toId = edge.to !== undefined ? edge.to : edge[1];
                    // Naive layout: 
                    const fromIdx = nodes.indexOf(fromId);
                    const toIdx = nodes.indexOf(toId);

                    if (fromIdx === -1 || toIdx === -1) return null;

                    const x1 = 100 + (fromIdx % 3) * 100;
                    const y1 = 100 + Math.floor(fromIdx / 3) * 80;
                    const x2 = 100 + (toIdx % 3) * 100;
                    const y2 = 100 + Math.floor(toIdx / 3) * 80;

                    return (
                        <line
                            key={`edge-${idx}`}
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke="#4b5563"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    )
                })}
                {nodes.map((node, idx) => {
                    const x = 100 + (idx % 3) * 100;
                    const y = 100 + Math.floor(idx / 3) * 80;
                    const isActive = activeIndices.includes(node);

                    return (
                        <g key={`node-${node}`} transform={`translate(${x},${y})`}>
                            <circle
                                r="20"
                                fill={isActive ? "#f59e0b" : "#1e293b"}
                                stroke="#60a5fa"
                                strokeWidth="2"
                                className={isActive ? "node-pulse" : ""}
                            />
                            <text dy="5" textAnchor="middle" fill="white" fontSize="12">{node}</text>
                        </g>
                    )
                })}
            </svg>
        )
    }

    const renderTree = (root, activeIndices = []) => {
        // Recursive tree rendering logic is complex for SVG.
        // Simplified approach: Render levels.
        // Assuming format: { id: 1, val: 5, left: ..., right: ... }

        const renderNode = (node, x, y, level) => {
            if (!node) return null;
            const isActive = activeIndices.includes(node.id);
            const gap = 150 / (level + 1);

            return (
                <g key={`tree-node-${node.id || Math.random()}`}>
                    {node.left && <line x1={x} y1={y} x2={x - gap} y2={y + 60} stroke="#4b5563" strokeWidth="2" />}
                    {node.right && <line x1={x} y1={y} x2={x + gap} y2={y + 60} stroke="#4b5563" strokeWidth="2" />}

                    <circle
                        cx={x} cy={y} r="18"
                        fill={isActive ? "#f59e0b" : "#1e293b"}
                        stroke="#10b981"
                        strokeWidth="2"
                        className={isActive ? "node-pulse" : ""}
                    />
                    <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="11">{node.val || node.value || node.id}</text>

                    {node.left && renderNode(node.left, x - gap, y + 60, level + 1)}
                    {node.right && renderNode(node.right, x + gap, y + 60, level + 1)}
                </g>
            )
        }

        return (
            <svg className="tree-svg" viewBox="0 0 500 300">
                <g transform="translate(0, 40)">
                    {renderNode(root, 250, 20, 1)}
                </g>
            </svg>
        )
    }

    // --- MAIN RENDER ---

    if (loading) return <div className="visualizer-loading"><div className="spinner"></div><p>Simulating execution...</p></div>
    if (error) return <div className="visualizer-error"><p>⚠️ {error}</p><button onClick={fetchTrace}>Retry</button></div>
    if (!trace || !trace.steps || trace.steps.length === 0) return <div className="visualizer-empty">No trace</div>

    const step = trace.steps[currentStep]
    const mainVarName = trace.data_structure_name || 'arr'
    const mainData = step.variables[mainVarName]
    const activeIndices = step.active_indices || step.highlighted_lines || []

    let VisualizationContent;
    if (trace.visualization_type === 'graph') {
        VisualizationContent = renderGraph(mainData, activeIndices);
    } else if (trace.visualization_type === 'tree') {
        VisualizationContent = renderTree(mainData, activeIndices);
    } else if (trace.visualization_type === 'array' || Array.isArray(mainData)) {
        VisualizationContent = renderArray(mainData, activeIndices);
    } else {
        VisualizationContent = <pre className="generic-display">{JSON.stringify(mainData, null, 2)}</pre>
    }

    return (
        <div className="algorithm-visualizer">
            <div className="visualizer-header">
                <h3>{trace.visualization_type?.toUpperCase()} Trace</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="visualization-stage">
                <div className="visual-display">
                    {VisualizationContent}
                </div>
                <div className="step-info">
                    <span className="step-counter">Step {currentStep + 1} / {trace.steps.length}</span>
                    <p className="step-description">{step.description}</p>
                </div>
            </div>

            <div className="variable-inspector">
                <h4>Variables</h4>
                <div className="variable-grid">
                    {Object.entries(step.variables).map(([key, val]) => (
                        key !== mainVarName && (
                            <div key={key} className="variable-card">
                                <span className="var-name">{key}</span>
                                <span className="var-value">{typeof val === 'object' ? '...' : String(val)}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            <div className="visualizer-controls">
                <button onClick={() => setCurrentStep(0)} disabled={currentStep === 0}>⏮</button>
                <button onClick={() => setCurrentStep(p => Math.max(0, p - 1))} disabled={currentStep === 0}>◀</button>
                <button className="play-btn" onClick={togglePlay}>{isPlaying ? '⏸' : '▶'}</button>
                <button onClick={() => setCurrentStep(p => Math.min(trace.steps.length - 1, p + 1))} disabled={currentStep === trace.steps.length - 1}>▶</button>
                <button onClick={() => setCurrentStep(trace.steps.length - 1)} disabled={currentStep === trace.steps.length - 1}>⏭</button>
                <div className="speed-control">
                    <label>Speed</label>
                    <input type="range" min="200" max="2000" step="200" value={2200 - speed} onChange={(e) => setSpeed(2200 - Number(e.target.value))} />
                </div>
            </div>

            <div className="timeline">
                <input type="range" min="0" max={trace.steps.length - 1} value={currentStep} onChange={(e) => setCurrentStep(Number(e.target.value))} />
            </div>
        </div>
    )
}

export default AlgorithmVisualizer
