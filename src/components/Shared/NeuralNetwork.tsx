import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Theme } from '../../types';

interface NeuralNetworkProps {
  theme?: Theme;
  nodeCount?: number;
}

interface Node {
  id: number;
  x: number;
  y: number;
  connections: number[];
}

export function NeuralNetwork({ theme = 'brideware-purple', nodeCount = 15 }: NeuralNetworkProps) {
  const isPastel = theme === 'pastel';
  const primaryRgba = isPastel ? 'rgba(216, 180, 254, ' : 'rgba(139, 92, 246, ';
  const secondaryRgba = isPastel ? 'rgba(165, 180, 252, ' : 'rgba(34, 211, 238, ';

  const nodes = useMemo(() => {
    const nodeArray: Node[] = [];
    const cols = 5;
    const rows = Math.ceil(nodeCount / cols);
    
    for (let i = 0; i < nodeCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col / (cols - 1)) * 100;
      const y = (row / (rows - 1)) * 100;
      
      const connections: number[] = [];
      // Connect to nearby nodes
      if (col < cols - 1) connections.push(i + 1);
      if (row < rows - 1) connections.push(i + cols);
      if (col < cols - 1 && row < rows - 1) connections.push(i + cols + 1);
      
      nodeArray.push({ id: i, x, y, connections });
    }
    
    return nodeArray;
  }, [nodeCount]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full">
        {/* Connections */}
        {nodes.map((node) =>
          node.connections.map((targetId) => {
            const target = nodes[targetId];
            if (!target) return null;
            return (
              <motion.line
                key={`${node.id}-${targetId}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isPastel ? 'rgba(216, 180, 254, 0.2)' : 'rgba(139, 92, 246, 0.3)'}
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 0.3, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: (node.id + targetId) * 0.1,
                  ease: 'easeInOut',
                }}
              />
            );
          })
        )}
      </svg>
      
      {/* Nodes */}
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: '8px',
            height: '8px',
            background: `radial-gradient(circle, ${primaryRgba}1), ${secondaryRgba}0.5))`,
            boxShadow: `0 0 10px ${primaryRgba}0.8), 0 0 20px ${secondaryRgba}0.4)`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: node.id * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
