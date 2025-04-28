'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const OutputNode = ({ data }: NodeProps<{ label: string }>) => {
  return (
    <Card className="w-48 shadow-md bg-secondary text-secondary-foreground">
      <CardHeader className="p-3">
        <CardTitle className="text-sm text-center">{data.label || 'Output'}</CardTitle>
      </CardHeader>
      {/* Input handle */}
      <Handle type="target" position={Position.Left} id="output-input" className="w-2 h-2" />
    </Card>
  );
};

export default memo(OutputNode); 