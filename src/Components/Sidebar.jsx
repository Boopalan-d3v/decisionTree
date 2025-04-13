import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listFlowcharts, getFlowchartData } from '../awsConfig';
import './Sidebar.css';

const Sidebar = ({ onFlowchartSelect }) => {
  const [flowcharts, setFlowcharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFlowcharts = async () => {
      try {
        const data = await listFlowcharts();
        // Parse each JSON file to get the flowchart name
        const processedData = await Promise.all(
          data.map(async (flowchart) => {
            const flowchartData = await getFlowchartData(flowchart.filename);
            return {
              ...flowchart,
              displayName: flowchartData.name || flowchart.filename.replace(/-\d+\.json$/, '')
            };
          })
        );
        setFlowcharts(processedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadFlowcharts();
  }, []);

  const handleFlowchartClick = async (filename) => {
    try {
      const flowchartData = await getFlowchartData(filename);
      localStorage.setItem('currentFlowchart', JSON.stringify(flowchartData));
      navigate('/', { state: { flowchartData } });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="sidebar">Loading...</div>;
  if (error) return <div className="sidebar">Error: {error}</div>;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Flowcharts</h3>
        <ul className="flowchart-list">
          {flowcharts.map((flowchart) => (
            <li 
              key={flowchart.filename}
              onClick={() => handleFlowchartClick(flowchart.filename)}
              className="flowchart-item"
            >
              {flowchart.displayName}
            </li>
          ))}
        </ul>
        <div className="sidebar-actions">
          <Link to="/new-node" className="action-button">
            + Add Node
          </Link>
          <Link to="/new-tree" className="action-button">
            + New Flowchart
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
