'use client';

import React, { memo, useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps, useReactFlow, useStoreApi } from 'reactflow';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import useCanvasStore from '@/store/canvasStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define type for node data including condition fields
interface ConditionNodeData {
  label?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
}

// Static list of operators
const operators = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
];

// Define type for fetched form fields
interface FormField {
  internal_key: string;
  name: string; // This is the user-facing label
}

const ConditionNode = ({ id, data }: NodeProps<ConditionNodeData>) => {
  const { setNodes } = useReactFlow();
  const store = useStoreApi();
  const supabase = createClientComponentClient();
  
  // Get active template ID from store
  const activeFormTemplateId = useCanvasStore((state) => state.activeFormTemplateId);

  // State for dynamic fields
  const [fields, setFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [errorFields, setErrorFields] = useState<string | null>(null);

  // Fetch fields when active form changes
  useEffect(() => {
    if (!activeFormTemplateId) {
      setFields([]); // Clear fields if no form is active
      setErrorFields(null);
      return;
    }

    const fetchFields = async () => {
      setIsLoadingFields(true);
      setErrorFields(null);
      console.log(`[ConditionNode] Attempting to fetch fields for template ID: ${activeFormTemplateId}`); 
      let fieldData = null;
      let error = null;

      try {
        // Assign response to temporary variables first
        const response = await supabase
          .from('form_fields')
          .select('internal_key, name')
          .eq('template_id', activeFormTemplateId)
          .order('display_order', { ascending: true });

        fieldData = response.data;
        error = response.error;

        // Explicitly log the error object received from Supabase HERE
        console.log('[ConditionNode] Supabase response error object:', error);
        console.log('[ConditionNode] Supabase response data:', fieldData);

        // Now check the error object
        if (error) {
           console.error("Supabase error object detected. Stringified:", JSON.stringify(error));
           // Throw a NEW error containing stringified original, if possible
           throw new Error(`Supabase fetch fields error: ${JSON.stringify(error)}`); 
        }

        // If no error, proceed
        setFields(fieldData || []);

      } catch (err: any) {
        // Catch errors from the await OR the explicit throw new Error() above
        console.error("Caught error during field fetch process:", err);
        console.error("[FieldsCatch] Error constructor:", err?.constructor?.name);
        console.error("[FieldsCatch] Error message:", err?.message);
        // Log all properties just in case
        if (err && typeof err === 'object') {
            console.error("[FieldsCatch] All error properties:");
            for (const key in err) {
                if (Object.prototype.hasOwnProperty.call(err, key)) {
                    console.error(`  ${key}:`, err[key]);
                }
            }
        }
        
        const displayMessage = err?.message || 'Failed to load fields';
        setErrorFields(displayMessage);
        setFields([]); // Clear fields on error
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchFields();
  }, [activeFormTemplateId, supabase]);

  // Generic handler to update node data
  const updateNodeData = useCallback((field: keyof ConditionNodeData, value: string) => {
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === id) {
          node.data = { ...node.data, [field]: value };
        }
        return node;
      })
    );
  }, [id, store, setNodes]);

  return (
    <Card className="w-72 shadow-md border-yellow-400">
      <CardHeader className="bg-yellow-100 p-3 rounded-t-lg">
        <CardTitle className="text-sm text-yellow-800">Condition</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 flex flex-col gap-2">
        {/* Field Selection - Now Dynamic */}
        <div className="flex items-center gap-2">
          <Label htmlFor={`field-${id}`} className="text-xs w-1/5">Field:</Label>
          <Select 
            value={data.conditionField}
            onValueChange={(value) => {
                // Reset value when field changes?
                updateNodeData('conditionField', value); 
                // updateNodeData('conditionValue', ''); // Optional: clear value too
            }}
            disabled={isLoadingFields || !!errorFields || !activeFormTemplateId}
          >
            <SelectTrigger id={`field-${id}`} className="nodrag text-xs h-7 flex-grow">
              <SelectValue placeholder={isLoadingFields ? "Loading..." : errorFields ? "Error" : "Select field..."} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingFields && <SelectItem value="loading" disabled>Loading fields...</SelectItem>}
              {errorFields && <SelectItem value="error" disabled>Error loading fields</SelectItem>}
              {!isLoadingFields && !errorFields && fields.length === 0 && <SelectItem value="no-fields" disabled>No fields found</SelectItem>}
              {!isLoadingFields && !errorFields && fields.map(field => (
                <SelectItem key={field.internal_key} value={field.internal_key}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Operator Selection (Dropdown - Static Items) */}
        <div className="flex items-center gap-2">
          <Label htmlFor={`operator-${id}`} className="text-xs w-1/5">Op:</Label>
          <Select 
             value={data.conditionOperator}
             onValueChange={(value) => updateNodeData('conditionOperator', value)}
          >
            <SelectTrigger id={`operator-${id}`} className="nodrag text-xs h-7 flex-grow">
              <SelectValue placeholder="Select operator..." />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Value Input (Remains Text Input for now) */}
        <div className="flex items-center gap-2">
          <Label htmlFor={`value-${id}`} className="text-xs w-1/5">Value:</Label>
          <Input 
            id={`value-${id}`} 
            placeholder="Enter value..." 
            className="nodrag text-xs h-7 flex-grow" 
            value={data.conditionValue || ''}
            onChange={(e) => updateNodeData('conditionValue', e.target.value)}
           />
        </div>
      </CardContent>
      
      {/* Input Handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="condition-input" 
        className="w-2 h-2 !bg-gray-500" 
      />
      
      {/* Output Handles (True/False branches) */}
      {/* True Branch Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="condition-output-true"
        style={{ top: '35%' }} // Position handle slightly higher
        className="w-2 h-2 !bg-green-500"
      />
       <div className="absolute right-[-25px] top-[calc(35%-8px)] text-xs text-green-600 font-medium">True</div>

      {/* False Branch Handle */}
       <Handle
        type="source"
        position={Position.Right}
        id="condition-output-false"
        style={{ top: '65%' }} // Position handle slightly lower
        className="w-2 h-2 !bg-red-500"
      />
      <div className="absolute right-[-30px] top-[calc(65%-8px)] text-xs text-red-600 font-medium">False</div>

    </Card>
  );
};

export default memo(ConditionNode); 