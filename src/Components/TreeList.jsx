import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 180; // Slightly increased for text visibility
const nodeHeight = 60; // Reduced height

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Increased horizontal spacing
    ranksep: 80, // Vertical spacing between ranks
    marginx: 50, // Margin for the entire graph
    marginy: 50,
    align: 'UL', // Changed alignment to Upper Left
  });

  // Add nodes with explicit dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth + 50, // Add padding to prevent overlap
      height: nodeHeight + 30,
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Layout
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const TreeList = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const flowchartData =
      location.state?.flowchartData ||
      JSON.parse(localStorage.getItem('currentFlowchart'));

    console.log('Flowchart Data:', flowchartData); // Debug log

    if (flowchartData?.nodes?.length > 0) {
      // Create nodes first
      const initialNodes = flowchartData.nodes.map((node) => ({
        id: node.id.toString(),
        data: {
          label: (
            <div style={{ padding: '8px' }}>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '13px',
                  whiteSpace: 'normal', // Allow text wrapping
                  wordBreak: 'break-word', // Break long words
                }}
              >
                {node.text}
              </div>
              {node.subheading && (
                <div
                  style={{
                    fontSize: '11px',
                    color: '#666',
                    marginTop: '4px',
                  }}
                >
                  {node.subheading}
                </div>
              )}
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          width: nodeWidth,
          height: 'auto', // Allow height to adjust to content
          minHeight: nodeHeight,
          background: node.yes || node.no ? '#fff3cd' : '#d1e7dd',
          border: '1px solid',
          borderColor: node.yes || node.no ? '#ffc107' : '#198754',
          borderRadius: '4px',
          padding: '4px',
        },
      }));

      // Create edges
      const initialEdges = [];
      flowchartData.nodes.forEach((node) => {
        if (node.yes) {
          initialEdges.push({
            id: `${node.id}-yes`,
            source: node.id.toString(),
            target: flowchartData.nodes.find((n) => n.text === node.yes)?.id.toString(),
            label: 'Yes',
            type: 'smoothstep', // Changed from default
            animated: true,
            style: { stroke: '#4caf50', strokeWidth: 2 },
            labelStyle: { fill: '#4caf50', fontWeight: 'bold' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
            },
          });
        }
        if (node.no) {
          initialEdges.push({
            id: `${node.id}-no`,
            source: node.id.toString(),
            target: flowchartData.nodes.find((n) => n.text === node.no)?.id.toString(),
            label: 'No',
            type: 'smoothstep', // Changed from default
            animated: true,
            style: { stroke: '#f44336', strokeWidth: 2 },
            labelStyle: { fill: '#f44336', fontWeight: 'bold' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
            },
          });
        }
        if (node.next) {
          initialEdges.push({
            id: `${node.id}-next`,
            source: node.id.toString(),
            target: flowchartData.nodes.find((n) => n.text === node.next)?.id.toString(),
            label: 'Next',
            type: 'smoothstep', // Changed from default
            animated: true,
            style: { stroke: '#2196f3', strokeWidth: 2 },
            labelStyle: { fill: '#2196f3', fontWeight: 'bold' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
            },
          });
        }
      });

      // Apply layout with the new settings
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges
      );

      console.log('Layouted Nodes:', layoutedNodes); // Debug log
      console.log('Edges:', layoutedEdges); // Debug log

      setNodes(layoutedNodes);
      setEdges(layoutedEdges.filter((edge) => edge.source && edge.target));
    }
  }, [location, setNodes, setEdges]); // Added setNodes and setEdges as dependencies

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div
        style={{
          padding: '20px',
          backgroundColor: '#fff',
          color:'#007bff',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>
          {location.state?.flowchartData?.name ||
            JSON.parse(localStorage.getItem('currentFlowchart'))?.name}
        </h2>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Back to Home
        </button>
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 70px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          defaultZoom={0.8}
          nodesDraggable={true}
          elementsSelectable={true}
          snapToGrid={true}
          snapGrid={[15, 15]}
          style={{ background: '#f8f9fa' }}
        >
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              return node.style?.background || '#fff';
            }}
          />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default TreeList;