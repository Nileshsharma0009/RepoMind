import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRepository } from '../../context/RepositoryContext.jsx';
import { Search, Info, HelpCircle, Layers, Cpu, Compass, Maximize2, Minimize2 } from 'lucide-react';

const serviceColors = {
  auth: '#f59e0b',       // Amber (Authentication & Users)
  repository: '#3b82f6', // Blue (Repo sync & indexing)
  chat: '#8b5cf6',       // Purple (AI chat coordination)
  documentation: '#10b981', // Emerald (Manual generator)
  pm: '#ec4899',         // Pink (Issue backlog prioritization)
  config: '#ef4444',     // Red (App settings & connections)
  layout: '#06b6d4',     // Cyan (Views & frames)
  other: '#9ca3af',      // Gray (Scripts / core elements)
};

const serviceLabels = {
  all: 'All Service Modules',
  auth: 'Authentication & Users',
  repository: 'Repository Sync & Crawler',
  chat: 'AI Chat Assistant',
  documentation: 'AI Documentation',
  pm: 'Project Manager (PM)',
  config: 'App Configurations',
  layout: 'App UI Layout',
  other: 'Other Code Units',
};

const getLogicalService = (filePath) => {
  const normalized = filePath.toLowerCase();
  
  if (normalized.includes('auth') || normalized.includes('user') || normalized.includes('login') || normalized.includes('token')) {
    return 'auth';
  }
  if (normalized.includes('chat') || normalized.includes('message') || normalized.includes('conversation') || normalized.includes('playground')) {
    return 'chat';
  }
  if (normalized.includes('repository') || normalized.includes('github') || normalized.includes('crawler') || normalized.includes('indexing')) {
    return 'repository';
  }
  if (normalized.includes('documentation') || normalized.includes('doc') || normalized.includes('readme') || normalized.includes('guide') || normalized.includes('commitmodal')) {
    return 'documentation';
  }
  if (normalized.includes('pm') || normalized.includes('project') || normalized.includes('issue') || normalized.includes('pr') || normalized.includes('backlog')) {
    return 'pm';
  }
  if (normalized.includes('config') || normalized.includes('env') || normalized.includes('db.js') || normalized.includes('setup')) {
    return 'config';
  }
  if (normalized.includes('layout') || normalized.includes('navbar') || normalized.includes('sidebar') || normalized.includes('theme') || normalized.includes('css')) {
    return 'layout';
  }
  return 'other';
};

// BFS to recursively traverse upstream and downstream import connections for a target node
const getWorkflowPath = (startId, edgesList) => {
  const connectedNodes = new Set([startId]);
  const connectedEdges = new Set();

  // Traverse downstream dependencies (what this file imports)
  let queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    edgesList.forEach((edge) => {
      if (edge.source === current && !connectedNodes.has(edge.target)) {
        connectedNodes.add(edge.target);
        connectedEdges.add(edge.id);
        queue.push(edge.target);
      }
    });
  }

  // Traverse upstream dependencies (what files import this file)
  queue = [startId];
  while (queue.length > 0) {
    const current = queue.shift();
    edgesList.forEach((edge) => {
      if (edge.target === current && !connectedNodes.has(edge.source)) {
        connectedNodes.add(edge.source);
        connectedEdges.add(edge.id);
        queue.push(edge.source);
      }
    });
  }

  return { nodes: connectedNodes, edges: connectedEdges };
};

const CustomNode = ({ data }) => {
  const color = serviceColors[data.service] || '#9ca3af';
  const isHighlighted = data.isHighlighted;
  const isDimmed = data.isDimmed;

  return (
    <div
      className={`px-4 py-3 rounded-xl border text-left transition-all duration-300 relative ${
        isHighlighted
          ? 'bg-neutral-900 border-white ring-2 ring-primary/80 scale-105 shadow-2xl'
          : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
      }`}
      style={{
        width: 220,
        borderLeft: `5px solid ${color}`,
        boxShadow: isHighlighted ? `0 0 20px ${color}50` : 'none',
        opacity: isDimmed ? 0.15 : 1,
        pointerEvents: 'auto',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, border: 'none', width: 6, height: 6 }}
      />

      <div className="flex items-center justify-between">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {data.service}
        </span>
        <span className="text-[9px] text-neutral-600 font-mono font-semibold">
          {(data.size / 1024).toFixed(1)} KB
        </span>
      </div>
      <p className="text-xs font-semibold text-white mt-1.5 truncate" title={data.name}>
        {data.name}
      </p>
      <p className="text-[10px] text-neutral-500 truncate mt-0.5" title={data.path}>
        {data.path}
      </p>

      {isHighlighted && data.importsCount > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-900 text-[9px] text-neutral-400 font-mono">
          Imports {data.importsCount} dependencies
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, border: 'none', width: 6, height: 6 }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function DependencyGraph() {
  const { activeRepo } = useRepository();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Failed to trigger native browser fullscreen:', err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [clickedNodeId, setClickedNodeId] = useState(null);

  const activeNodeId = hoveredNodeId || clickedNodeId;

  const files = useMemo(() => {
    return activeRepo?.parsedData?.files || [];
  }, [activeRepo]);

  // Filter files based on selected logical service module and architecture layer
  const filteredFiles = useMemo(() => {
    if (!files.length) return [];
    return files.filter(f => {
      const matchService = selectedService === 'all' || getLogicalService(f.path) === selectedService;
      const matchLayer = selectedLayer === 'all' || f.type === selectedLayer;
      return matchService && matchLayer;
    });
  }, [files, selectedService, selectedLayer]);

  // Generate nodes and edges
  useEffect(() => {
    if (!filteredFiles.length) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // 1. Calculate the import relationships and indegrees
    const nodeIds = filteredFiles.map(f => f.path);
    const incoming = {};
    const outgoing = {};
    nodeIds.forEach(id => {
      incoming[id] = [];
      outgoing[id] = [];
    });

    filteredFiles.forEach((file) => {
      const source = file.path;
      (file.imports || []).forEach((imp) => {
        const targetFile = filteredFiles.find((f) => {
          if (imp === f.path) return true;
          const cleanImp = imp.replace(/^\.+\//, ''); 
          if (f.path.endsWith(cleanImp)) return true;

          const impName = imp.split('/').pop().replace(/\.(js|jsx|ts|tsx)$/, '');
          const fName = f.name.replace(/\.(js|jsx|ts|tsx)$/, '');
          return impName === fName;
        });

        if (targetFile && targetFile.path !== source) {
          outgoing[source].push(targetFile.path);
          incoming[targetFile.path].push(source);
        }
      });
    });

    // 2. Identify root nodes (nodes not imported by any other active file)
    const roots = nodeIds.filter(id => incoming[id].length === 0);
    
    // Fallback: If everything forms a cycle or imports are fully circular,
    // select nodes with the absolute minimum incoming references
    if (roots.length === 0 && nodeIds.length > 0) {
      let minRefs = Infinity;
      nodeIds.forEach(id => {
        if (incoming[id].length < minRefs) minRefs = incoming[id].length;
      });
      nodeIds.forEach(id => {
        if (incoming[id].length === minRefs) roots.push(id);
      });
    }

    // 3. BFS traversal to calculate node depth levels for horizontal positioning
    const depths = {};
    const queue = [];
    roots.forEach(r => {
      depths[r] = 0;
      queue.push(r);
    });

    while (queue.length > 0) {
      const curr = queue.shift();
      const currDepth = depths[curr];
      outgoing[curr].forEach(target => {
        if (depths[target] === undefined || depths[target] < currDepth + 1) {
          depths[target] = currDepth + 1;
          queue.push(target);
        }
      });
    }

    // Handle any orphaned nodes (isolated files)
    nodeIds.forEach(id => {
      if (depths[id] === undefined) {
        depths[id] = 0;
      }
    });

    // Keep track of vertical positions in each depth column
    const levelCounts = {};

    // 4. Generate tree nodes
    const generatedNodes = filteredFiles.map((file) => {
      const service = getLogicalService(file.path);
      const depth = depths[file.path] || 0;
      
      // Spreads levels left to right (Roots on the left, dependencies flowing rightwards)
      const x = 50 + depth * 380;
      
      const count = levelCounts[depth] || 0;
      levelCounts[depth] = count + 1;
      const y = 80 + count * 125;

      const isSearchMatch =
        searchQuery &&
        (file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.path.toLowerCase().includes(searchQuery.toLowerCase()));

      return {
        id: file.path,
        type: 'custom',
        position: { x, y },
        data: {
          name: file.name,
          path: file.path,
          service: service,
          size: file.size,
          importsCount: file.imports?.length || 0,
          isHighlighted: !!isSearchMatch,
          isDimmed: false,
        },
      };
    });

    // 5. Generate edges
    const generatedEdges = [];
    
    filteredFiles.forEach((sourceFile) => {
      const sourcePath = sourceFile.path;
      const imports = sourceFile.imports || [];

      imports.forEach((imp) => {
        const targetFile = filteredFiles.find((f) => {
          if (imp === f.path) return true;
          const cleanImp = imp.replace(/^\.+\//, ''); 
          if (f.path.endsWith(cleanImp)) return true;

          const impName = imp.split('/').pop().replace(/\.(js|jsx|ts|tsx)$/, '');
          const fName = f.name.replace(/\.(js|jsx|ts|tsx)$/, '');
          return impName === fName;
        });

        if (targetFile && targetFile.path !== sourcePath) {
          const edgeId = `e-${sourcePath}-${targetFile.path}`;
          const isSearchMatch =
            searchQuery &&
            (sourceFile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              targetFile.name.toLowerCase().includes(searchQuery.toLowerCase()));

          const sourceService = getLogicalService(sourcePath);
          const color = serviceColors[sourceService] || '#9ca3af';

          generatedEdges.push({
            id: edgeId,
            source: sourcePath,
            target: targetFile.path,
            animated: isSearchMatch,
            style: {
              stroke: isSearchMatch ? '#a855f7' : `${color}b0`, 
              strokeWidth: isSearchMatch ? 2.5 : 1.8,
              opacity: 0.85,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: isSearchMatch ? '#a855f7' : `${color}cc`,
            },
          });
        }
      });
    });

    // 6. Highlight active workflow path
    if (activeNodeId) {
      const workflow = getWorkflowPath(activeNodeId, generatedEdges);

      generatedNodes.forEach((node) => {
        const isConnected = workflow.nodes.has(node.id);
        node.data.isHighlighted = isConnected || node.id === activeNodeId;
        node.data.isDimmed = !isConnected && node.id !== activeNodeId;
      });

      generatedEdges.forEach((edge) => {
        const isConnected = workflow.edges.has(edge.id);
        if (isConnected) {
          const sourceService = getLogicalService(edge.source);
          const color = serviceColors[sourceService] || '#9ca3af';
          edge.animated = true;
          edge.style = {
            stroke: color,
            strokeWidth: 3.5,
            opacity: 1,
          };
          edge.markerEnd = {
            ...edge.markerEnd,
            color: color,
          };
        } else {
          edge.animated = false;
          edge.style = {
            stroke: 'rgba(255, 255, 255, 0.02)',
            strokeWidth: 0.5,
            opacity: 0.1,
          };
          edge.markerEnd = {
            ...edge.markerEnd,
            color: 'rgba(255, 255, 255, 0.02)',
          };
        }
      });
    }

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [filteredFiles, searchQuery, selectedService, activeNodeId, setNodes, setEdges]);

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl">
        <Info className="w-8 h-8 text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-400">No parsed files found for the active repository.</p>
        <p className="text-xs text-neutral-600 mt-1">Please select an indexed repository or sync the active one.</p>
      </div>
    );
  }

  const handleNodeMouseEnter = (e, node) => {
    setHoveredNodeId(node.id);
  };

  const handleNodeMouseLeave = () => {
    setHoveredNodeId(null);
  };

  const handleNodeClick = (e, node) => {
    setClickedNodeId(prev => prev === node.id ? null : node.id);
  };

  const handlePaneClick = () => {
    setClickedNodeId(null);
  };

  return (
    <div
      ref={containerRef}
      className={`glass-panel rounded-xl overflow-hidden flex flex-col relative border border-neutral-800/40 shadow-xl text-left transition-all duration-300 ${
        isFullScreen 
          ? 'bg-neutral-950 w-full h-full p-4' 
          : 'h-[600px]'
      }`}
    >
      {/* Control bar */}
      <div className="p-4 bg-neutral-950/80 border-b border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Cpu className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-white">Interactive Dependency Tree</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono bg-neutral-900/40 px-3 py-1 rounded border border-neutral-850">
            <Compass className="w-3.5 h-3.5 text-neutral-400" />
            <span>Tip: Hover or Click a node to trace workflow path</span>
          </div>

          <button
            onClick={handleFullscreenToggle}
            className="flex items-center gap-1.5 px-3 py-1 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors shrink-0"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Service Module selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Service Module:</span>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setClickedNodeId(null);
                setHoveredNodeId(null);
              }}
              className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 outline-none cursor-pointer focus:border-primary/50 transition-colors"
            >
              {Object.entries(serviceLabels).map(([key, label]) => (
                <option key={key} value={key} className="bg-neutral-950 text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-md">
            <Search className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Highlight file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-neutral-300 placeholder-neutral-600 outline-none w-36"
            />
          </div>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="flex-1 bg-neutral-950/50">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-2">
            <Info className="w-8 h-8 text-neutral-600" />
            <p className="text-xs text-neutral-500 font-mono">No files assigned to this module service.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            minZoom={0.05}
            maxZoom={1.5}
          >
            <Controls className="bg-neutral-900 border border-neutral-800 text-white rounded-lg p-1" />
            <MiniMap
              nodeColor={(n) => serviceColors[n.data.service] || '#9ca3af'}
              maskColor="rgba(0, 0, 0, 0.7)"
              style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}
            />
            <Background color="#333" gap={16} />
          </ReactFlow>
        )}
      </div>

      {/* Legend */}
      <div className="p-3 bg-neutral-950/90 border-t border-neutral-900 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-neutral-400 font-medium">
        {Object.entries(serviceColors).map(([service, color]) => (
          <div key={service} className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {service}
          </div>
        ))}
      </div>
    </div>
  );
}
