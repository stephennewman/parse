'use client';

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useCanvasStore from '@/store/canvasStore';

// TODO: Add Save/Load Logic Here

const FormInfoNode = ({ id, data }: NodeProps<{ label: string, description?: string, templateId: string }>) => {
  const activeFormTemplateId = useCanvasStore((state) => state.activeFormTemplateId);
  const setActiveFormTemplateId = useCanvasStore((state) => state.setActiveFormTemplateId);

  const isActive = activeFormTemplateId === data.templateId;

  const handleClick = useCallback(() => {
    setActiveFormTemplateId(data.templateId);
  }, [setActiveFormTemplateId, data.templateId]);

  return (
    <Card 
      className={cn(
        "w-64 shadow-md cursor-pointer",
        isActive ? "border-2 border-blue-500 ring-2 ring-blue-500/30" : "border"
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <CardTitle className="text-base">{data.label || 'Form Info'}</CardTitle>
        {data.description && (
          <CardDescription className="text-xs">{data.description}</CardDescription>
        )}
      </CardHeader>
      {/* Placeholder for Save/Load buttons */}
      {/* <div className="p-2 flex justify-end gap-2 border-t"> 
        <Button variant="outline" size="xs">Load</Button>
        <Button variant="outline" size="xs">Save</Button>
      </div> */}
      {/* Output handle - workflows start from here */}
      <Handle type="source" position={Position.Right} id="form-output" className="w-2 h-2" />
    </Card>
  );
};

export default memo(FormInfoNode); 