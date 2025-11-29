
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ImageFile } from '../types';
import { formatBytes } from '../utils/formatters';

interface StatsPanelProps {
  files: ImageFile[];
  t: any; // Using any for simplicity with the passed translation object, typically would be a defined Interface
}

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const StatsPanel: React.FC<StatsPanelProps> = ({ files, t }) => {
  const data = useMemo(() => {
    const extMap: Record<string, number> = {};
    files.forEach(f => {
      const ext = f.extension.toUpperCase().replace('.', '');
      extMap[ext] = (extMap[ext] || 0) + 1;
    });
    
    return Object.keys(extMap).map(key => ({
      name: key,
      value: extMap[key]
    })).sort((a, b) => b.value - a.value);
  }, [files]);

  const totalSize = useMemo(() => files.reduce((acc, curr) => acc + curr.size, 0), [files]);

  if (files.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg border border-gray-200 dark:border-slate-700/50 transition-colors duration-300">
      <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{t.storageTitle}</h3>
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-3xl font-light text-slate-800 dark:text-white">{files.length}</p>
          <p className="text-slate-500 text-sm">{t.filesFound}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-light text-accent">{formatBytes(totalSize)}</p>
          <p className="text-slate-500 text-sm">{t.totalSize}</p>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--tooltip-bg, #1e293b)', 
                borderColor: 'var(--tooltip-border, #334155)', 
                color: 'var(--tooltip-text, #f8fafc)',
                borderRadius: '8px'
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsPanel;
