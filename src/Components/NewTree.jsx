import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadDataToS3 } from '../awsConfig';
import { useNavigate } from 'react-router-dom';
import './NewTree.css';

const NewTree = ({ onFlowchartSaved }) => {
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [currentNode, setCurrentNode] = useState({
    id: '',
    text: '',
    type: 'yesno',
    subheading: '',
    yes: null,
    no: null,
    next: null
  });
  const [message, setMessage] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [customInputs, setCustomInputs] = useState({
    yes: false,
    no: false,
    next: false
  });
  const [selectedExistingNode, setSelectedExistingNode] = useState('');
  const [flowchartName, setFlowchartName] = useState('');

  const handleNodeChange = (e) => {
    const { name, value } = e.target;
    setCurrentNode(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomInputChange = (field, value) => {
    setCurrentNode(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnectionChange = (e) => {
    const { name, value } = e.target;
    if (value === 'other') {
      setCustomInputs(prev => ({ ...prev, [name]: true }));
    } else {
      setCustomInputs(prev => ({ ...prev, [name]: false }));
      handleNodeChange(e);
    }
  };

  const handleExistingNodeSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const existingNode = nodes.find(node => node.id === selectedId);
      if (existingNode) {
        setCurrentNode({
          ...existingNode,
        });
        setSelectedExistingNode(selectedId);
      }
    } else {
      // Reset form if "Select a node..." is chosen
      setCurrentNode({
        id: '',
        text: '',
        type: 'yesno',
        subheading: '',
        yes: null,
        no: null,
        next: null
      });
      setSelectedExistingNode('');
    }
  };

  const handleAddNode = (e) => {
    e.preventDefault();
    
    try {
      let updatedNodes;
      
      if (selectedExistingNode) {
        // Update existing node
        updatedNodes = nodes.map(node => 
          node.id === selectedExistingNode ? { ...currentNode } : node
        );
        setMessage('Node updated successfully!');
      } else {
        // Add new node
        const newNode = {
          ...currentNode,
          id: uuidv4()
        };
        updatedNodes = [...nodes, newNode];
        setMessage('Node added successfully!');
      }

      setNodes(updatedNodes);
      
      // Reset form
      setCurrentNode({
        id: '',
        text: '',
        type: 'yesno',
        subheading: '',
        yes: null,
        no: null,
        next: null
      });
      setSelectedExistingNode('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleSaveTree = async () => {
    try {
      if (!flowchartName.trim()) {
        setMessage('Please enter a flowchart name');
        return;
      }

      if (nodes.length === 0) {
        setMessage('Please add at least one node to the tree');
        return;
      }

      // Create flowchart object
      const flowchartData = {
        name: flowchartName,
        nodes: nodes,
        createdAt: new Date().toISOString()
      };

      // Upload to S3 with unique filename
      const filename = await uploadDataToS3(flowchartData);

      // Notify parent component
      if (onFlowchartSaved) {
        onFlowchartSaved(filename, flowchartName);
      }

      setMessage('Flowchart saved successfully!');
      
      // Optional: Navigate to the question view
      navigate('/', { state: { flowchartData } });
    } catch (error) {
      setMessage('Error saving flowchart: ' + error.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateConnections = (e) => {
    e.preventDefault();
    try {
      let updatedNodes = [...nodes];
      const selectedNodeData = nodes.find(n => n.id === selectedNode);

      if (selectedNodeData) {
        if (selectedNodeData.type === 'yesno') {
          // Handle Yes connection
          if (customInputs.yes) {
            // Create new node for custom yes text
            const newYesNode = {
              id: uuidv4(),
              text: currentNode.yes,
              type: 'info',
              subheading: '',
              yes: null,
              no: null,
              next: null
            };
            updatedNodes.push(newYesNode); // Add new node to array
            selectedNodeData.yes = currentNode.yes; // Store text value for connection
          } else {
            // Store selected node's text for existing node connection
            const selectedYesNode = nodes.find(n => n.id === currentNode.yes);
            selectedNodeData.yes = selectedYesNode ? selectedYesNode.text : null;
          }

          // Handle No connection
          if (customInputs.no) {
            // Create new node for custom no text
            const newNoNode = {
              id: uuidv4(),
              text: currentNode.no,
              type: 'info',
              subheading: '',
              yes: null,
              no: null,
              next: null
            };
            updatedNodes.push(newNoNode); // Add new node to array
            selectedNodeData.no = currentNode.no; // Store text value for connection
          } else {
            // Store selected node's text for existing node connection
            const selectedNoNode = nodes.find(n => n.id === currentNode.no);
            selectedNodeData.no = selectedNoNode ? selectedNoNode.text : null;
          }
        } else {
          // Handle next connection for info type
          if (customInputs.next) {
            // Create new node for custom next text
            const newNextNode = {
              id: uuidv4(),
              text: currentNode.next,
              type: 'info',
              subheading: '',
              yes: null,
              no: null,
              next: null
            };
            updatedNodes.push(newNextNode); // Add new node to array
            selectedNodeData.next = currentNode.next; // Store text value for connection
          } else {
            // Store selected node's text for existing node connection
            const selectedNextNode = nodes.find(n => n.id === currentNode.next);
            selectedNodeData.next = selectedNextNode ? selectedNextNode.text : null;
          }
        }

        // Update the selected node in the array
        updatedNodes = updatedNodes.map(node =>
          node.id === selectedNode ? selectedNodeData : node
        );

        setNodes(updatedNodes);
        setMessage('Connections updated successfully!');
        
        // Reset form
        setCurrentNode({
          id: '',
          text: '',
          type: 'yesno',
          subheading: '',
          yes: null,
          no: null,
          next: null
        });
        setCustomInputs({
          yes: false,
          no: false,
          next: false
        });
        setSelectedNode('');
      }
    } catch (error) {
      setMessage('Error updating connections: ' + error.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteNode = (nodeId) => {
    try {
      // Remove the node and update connections that reference it
      const updatedNodes = nodes.filter(node => node.id !== nodeId).map(node => ({
        ...node,
        yes: node.yes === nodes.find(n => n.id === nodeId)?.text ? null : node.yes,
        no: node.no === nodes.find(n => n.id === nodeId)?.text ? null : node.no,
        next: node.next === nodes.find(n => n.id === nodeId)?.text ? null : node.next
      }));

      setNodes(updatedNodes);
      setMessage('Node deleted successfully!');
      setTimeout(() => setMessage(''), 3000);

      // Reset form if deleted node was selected
      if (selectedNode === nodeId) {
        setSelectedNode('');
        setCurrentNode({
          id: '',
          text: '',
          type: 'yesno',
          subheading: '',
          yes: null,
          no: null,
          next: null
        });
      }
    } catch (error) {
      setMessage('Error deleting node: ' + error.message);
    }
  };

  const handleViewFlowchart = (flowchartData) => {
    // Check if we have valid data
    if (!flowchartData || !flowchartData.nodes || !flowchartData.name) {
      setMessage('Invalid flowchart data');
      return;
    }

    console.log('Flowchart data being sent:', flowchartData); // Debug log
    localStorage.setItem('currentFlowchart', JSON.stringify(flowchartData));
    navigate('/TreeList', { state: { flowchartData } });
  };

  return (
    <div className="new-tree-container">
      <h2 style={{color:"#007bff"}}>Create New Flowchart</h2>
      
      <div className="form-group">
        <label>Flowchart Name: <span className="required">*</span></label>
        <input
          type="text"
          value={flowchartName}
          onChange={(e) => setFlowchartName(e.target.value)}
          required
          placeholder="Enter flowchart name"
          className="flowchart-name-input"
        />
      </div>

      <div className="form-group">
        <label>Select Existing Node (Optional):</label>
        <select 
          value={selectedExistingNode}
          onChange={handleExistingNodeSelect}
          className="existing-node-select"
        >
          <option value="">Select a node...</option>
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.text}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleAddNode} className="node-form">
        <div className="form-group">
          <label>Question Text: <span className="required">*</span></label>
          <input
            type="text"
            name="text"
            value={currentNode.text}
            onChange={handleNodeChange}
            required
            placeholder="Enter your question"
            className="question-input"
          />
        </div>

        <div className="form-group">
          <label>Subheading (Optional):</label>
          <input
            type="text"
            name="subheading"
            value={currentNode.subheading}
            onChange={handleNodeChange}
          />
        </div>

        <div className="form-group">
          <label>Type:</label>
          <select name="type" value={currentNode.type} onChange={handleNodeChange}>
            <option value="yesno">Yes/No</option>
            <option value="info">Info</option>
          </select>
        </div>

        <button type="submit" className="btn-add">
          {selectedExistingNode ? "Update Node" : "Add Node"}
        </button>

        {selectedExistingNode && (
          <button
            type="button"
            className="btn-cancel"
            onClick={() => {
              setSelectedExistingNode('');
              setCurrentNode({
                id: '',
                text: '',
                type: 'yesno',
                subheading: '',
                yes: null,
                no: null,
                next: null
              });
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>

      {nodes.length > 0 && (
        <div className="connections-section">
          <h3>Connect Nodes</h3>
          <form onSubmit={handleUpdateConnections}>
            <div className="form-group">
              <label>Select Node:</label>
              <select 
                value={selectedNode} 
                onChange={(e) => setSelectedNode(e.target.value)}
                required
              >
                <option value="">Select a node...</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.text}
                  </option>
                ))}
              </select>
            </div>

            {selectedNode && nodes.find(n => n.id === selectedNode)?.type === 'yesno' ? (
              <>
                <div className="form-group">
                  <label>Yes Connection:</label>
                  <select
                    name="yes"
                    value={customInputs.yes ? "other" : (currentNode.yes || '')}
                    onChange={handleConnectionChange}
                  >
                    <option value="">Select a node...</option>
                    {nodes.map(node => (
                      <option 
                        key={node.id} 
                        value={node.id}
                        disabled={node.id === selectedNode}
                      >
                        {node.text}
                      </option>
                    ))}
                    <option value="other">Other (Enter custom text)</option>
                  </select>
                  
                  {customInputs.yes && (
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Enter custom text"
                      value={currentNode.yes || ""}
                      onChange={(e) => handleCustomInputChange("yes", e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>No Connection:</label>
                  <select
                    name="no"
                    value={customInputs.no ? "other" : (currentNode.no || '')}
                    onChange={handleConnectionChange}
                  >
                    <option value="">Select a node...</option>
                    {nodes.map(node => (
                      <option 
                        key={node.id} 
                        value={node.id}
                        disabled={node.id === selectedNode}
                      >
                        {node.text}
                      </option>
                    ))}
                    <option value="other">Other (Enter custom text)</option>
                  </select>
                  
                  {customInputs.no && (
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Enter custom text"
                      value={currentNode.no || ""}
                      onChange={(e) => handleCustomInputChange("no", e.target.value)}
                    />
                  )}
                </div>
              </>
            ) : selectedNode && (
              <div className="form-group">
                <label>Next Connection:</label>
                <select
                  name="next"
                  value={customInputs.next ? "other" : (currentNode.next || '')}
                  onChange={handleConnectionChange}
                >
                  <option value="">Select a node...</option>
                  {nodes.map(node => (
                    <option 
                      key={node.id} 
                      value={node.id}
                      disabled={node.id === selectedNode}
                    >
                      {node.text}
                    </option>
                  ))}
                  <option value="other">Other (Enter custom text)</option>
                </select>
                
                {customInputs.next && (
                  <input
                    type="text"
                    className="custom-input"
                    placeholder="Enter custom text"
                    value={currentNode.next || ""}
                    onChange={(e) => handleCustomInputChange("next", e.target.value)}
                  />
                )}
              </div>
            )}

            <button type="submit" className="btn-update">Update Connections</button>
          </form>
        </div>
      )}

      {nodes.length > 0 && (
        <div className="preview-section">
          <h3>Current Nodes</h3>
          <div className="flowchart-header">
            <h4 
              className="flowchart-name clickable"
              onClick={() => handleViewFlowchart({ name: flowchartName, nodes: nodes })}
            >
              {flowchartName || 'Untitled Flowchart'}
            </h4>
          </div>
          <ul className="node-list">
            {nodes.map(node => (
              <li key={node.id} className="node-item">
                <div className="node-content">
                  <div className="node-header">
                    <strong>{node.text}</strong>
                    <button 
                      onClick={() => handleDeleteNode(node.id)}
                      className="btn-delete"
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                  {node.subheading && <p className="subheading">{node.subheading}</p>}
                  <p>Type: {node.type}</p>
                  {node.type === 'yesno' ? (
                    <p>
                      Yes: {node.yes || 'Not set'}<br />
                      No: {node.no || 'Not set'}
                    </p>
                  ) : (
                    <p>Next: {node.next || 'Not set'}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nodes.length > 0 && (
        <button onClick={handleSaveTree} className="btn-save">
          Save Flowchart
        </button>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default NewTree;