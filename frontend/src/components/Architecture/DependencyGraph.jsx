import React, { useMemo, useState, useEffect } from 'react';
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
import { Search, Info, HelpCircle, Layers } from 'lucide-react';

const typeColors = {
  route: '#10b981',      // Emerald
  controller: '#0ea5e9', // Sky
  service: '#8b5cf6',    // Purple
  model: '#f59e0b',      // Amber
  component: '#ec4899',  // Pink
  middleware: '#6366f1', // Indigo
  config: '#a855f7',     // Purple-light
  style: '#64748b',      // Slate
  markdown: '#f43f5e',   // Rose
  other: '#9ca3af',      // Gray
};

const CustomNode = ({ data }) => {
  const color = typeColors[data.type] || '#9ca3af';
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`px-4 py-3 rounded-xl border text-left transition-all duration-300 relative ${
        isHighlighted
          ? 'bg-neutral-900 border-white ring-2 ring-primary/60 scale-105 shadow-2xl'
          : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700'
      }`}
      style={{
        width: 220,
        borderLeft: `5px solid ${color}`,
        boxShadow: isHighlighted ? `0 0 20px rgba(255, 255, 255, 0.15)` : 'none',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, border: 'none', width: 6, height: 6 }}
      />

      <div className="flex items-center justify-between">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {data.type}
        </span>
        <span className="text-[9px] text-neutral-600 font-mono">
          {(data.size / 1024).toFixed(1)} KB
        </span>
      </div>
      <p className="text-xs font-semibold text-white mt-1.5 truncate" title={data.name}>
        {data.name}
      </p>
      <p className="text-[10px] text-neutral-500 truncate" title={data.path}>
        {data.path}
      </p>

      {isHighlighted && data.importsCount > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-900 text-[9px] text-neutral-400">
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
  const [selectedType, setSelectedType] = useState('all');

  const files = useMemo(() => {
    return activeRepo?.parsedData?.files || [];
  }, [activeRepo]);

  // Generate nodes and edges based on dependencies
  useEffect(() => {
    if (!files.length) return;

    // 1. Layer/columns positioning mapping
    const columnX = {
      route: 100,
      middleware: 380,
      config: 380,
      controller: 660,
      service: 940,
      model: 1220,
      component: 660,
      other: 1500,
      style: 1500,
      markdown: 1500,
    };

    // Keep track of vertical positions in each column to prevent overlaps
    const columnCounts = {};
    Object.keys(columnX).forEach((k) => (columnCounts[k] = 0));

    // 2. Generate nodes
    const generatedNodes = files.map((file) => {
      const type = file.type || 'other';
      const x = columnX[type] !== undefined ? columnX[type] : 1500;
      
      // Calculate Y offset
      const count = columnCounts[type] || 0;
      columnCounts[type] = count + 1;
      const y = 80 + count * 105;

      const isSearchMatch =
        searchQuery &&
        (file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.path.toLowerCase().includes(searchQuery.toLowerCase()));

      const isTypeMatch = selectedType === 'all' || file.type === selectedType;

      return {
        id: file.path,
        type: 'custom',
        position: { x, y },
        data: {
          name: file.name,
          path: file.path,
          type: type,
          size: file.size,
          importsCount: file.imports?.length || 0,
          isHighlighted: !!(isSearchMatch || (selectedType !== 'all' && isTypeMatch)),
        },
      };
    });

    // 3. Generate edges based on imports
    const generatedEdges = [];
    
    files.forEach((sourceFile) => {
      const sourcePath = sourceFile.path;
      const imports = sourceFile.imports || [];

      imports.forEach((imp) => {
        // Resolve import to another file in the repository
        // Check relative paths or matching names
        const targetFile = files.find((f) => {
          // Absolute path match
          if (imp === f.path) return true;

          // Suffix match (e.g. import './auth.routes.js' -> matches 'backend/src/routes/auth.routes.js')
          const cleanImp = imp.replace(/^\.+\//, ''); // strip leading ./ or ../
          if (f.path.endsWith(cleanImp)) return true;

          // Base filename match (fallback)
          const impName = imp.split('/').pop().replace(/\.(js|jsx|ts|tsx)$/, '');
          const fName = f.name.replace(/\.(js|jsx|ts|tsx)$/, '');
          return impName === fName;
        });

        if (targetFile && targetFile.path !== sourcePath) {
          const edgeId = `e-${sourcePath}-${targetFile.path}`;
          const isHighlighted =
            searchQuery &&
            (sourceFile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              targetFile.name.toLowerCase().includes(searchQuery.toLowerCase()));

          generatedEdges.push({
            id: edgeId,
            source: sourcePath,
            target: targetFile.path,
            animated: true,
            style: {
              stroke: isHighlighted ? '#a855f7' : 'rgba(255, 255, 255, 0.1)',
              strokeWidth: isHighlighted ? 2.5 : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: isHighlighted ? '#a855f7' : 'rgba(255, 255, 255, 0.2)',
            },
          });
        }
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [files, searchQuery, selectedType, setNodes, setEdges]);

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-900/10 border border-neutral-800/40 rounded-xl">
        <Info className="w-8 h-8 text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-400">No parsed files found for the active repository.</p>
        <p className="text-xs text-neutral-600 mt-1">Please select an indexed repository or sync the active one.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[600px] relative border border-neutral-800/40 shadow-xl">
      {/* Control bar */}
      <div className="p-4 bg-neutral-950/80 border-b border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-white">Dependency Graph</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Layer:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-md text-xs text-neutral-300 outline-none cursor-pointer"
            >
              <option value="all">All Layers</option>
              <option value="route">Routes</option>
              <option value="controller">Controllers</option>
              <option value="service">Services</option>
              <option value="model">Models</option>
              <option value="component">Components</option>
              <option value="middleware">Middlewares</option>
              <option value="config">Configs</option>
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Controls className="bg-neutral-900 border border-neutral-800 text-white rounded-lg p-1" />
          <MiniMap
            nodeColor={(n) => typeColors[n.data.type] || '#9ca3af'}
            maskColor="rgba(0, 0, 0, 0.7)"
            style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}
          />
          <Background color="#333" gap={16} />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="p-3 bg-neutral-950/90 border-t border-neutral-900 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] text-neutral-400 font-medium">
        {Object.entries(typeColors).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  );
}
