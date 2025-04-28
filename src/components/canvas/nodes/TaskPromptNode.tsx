'use client';

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStoreApi } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const TaskPromptNode = ({ id, data }: NodeProps<{ label: string, taskTitleTemplate?: string }>) => {
  const { setNodes } = useReactFlow();
  const store = useStoreApi();

  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === id) {
          // Update the data for this specific node
          node.data = {
            ...node.data,
            taskTitleTemplate: evt.target.value,
          };
        }
        return node;
      })
    );
  }, [id, store, setNodes]);

  return (
    <Card className="w-64 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">{data.label || 'Task Prompt'}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Label htmlFor={`task-title-${id}`} className="text-xs">Task Title Template</Label>
        <Input 
          id={`task-title-${id}`}
          name="taskTitleTemplate"
          defaultValue={data.taskTitleTemplate || 'New Task: [Form Name]'}
          onChange={onChange} 
          className="nodrag text-xs h-8" // Add nodrag class
        />
        <p className="text-xs text-muted-foreground">Use [Form Name] etc.</p>
      </CardContent>
      {/* Input handle */}
      <Handle type="target" position={Position.Left} id="task-input" className="w-2 h-2" />
      {/* Output handle (optional, for chaining) */}
      <Handle type="source" position={Position.Right} id="task-output" className="w-2 h-2" />
    </Card>
  );
};

export default memo(TaskPromptNode); 