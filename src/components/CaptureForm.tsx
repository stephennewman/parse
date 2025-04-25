"use client";

// Reusable component for the entire capture & submission process

import React, { useState, useEffect, useRef } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'; // Import router type
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Import UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Loader2, BrainCircuit, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from "@/components/ui/slider";
// Note: Tabs were commented out in original page due to build issues
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// --- Types & Enums (Consider moving to shared files) ---
interface FormTemplate {
  id: string;
  name: string;
}
interface FormField {
  id: string;
  label: string;
  internal_key: string;
  field_type: string;
  display_order: number;
  options?: string[] | null;
  rating_min?: number | null;
  rating_max?: number | null;
}

enum RecordingStatus {
  Idle = 'idle',
  RequestingPermission = 'requesting',
  PermissionDenied = 'denied',
  Recording = 'recording',
  Stopped = 'stopped',
  Error = 'error',
}

enum CapturePhase {
    Prompting = 'prompting',
    Recording = 'recording',
    Processing = 'processing',
    Reviewing = 'reviewing',
    Submitting = 'submitting',
    Error = 'error',
}

type ParsedResults = Record<string, string | number | boolean | string[] | null>;

enum ProcessingState {
    Idle = 'idle',
    Transcribing = 'transcribing',
    Parsing = 'parsing',
    Success = 'success',
    ErrorTranscription = 'error_transcription',
    ErrorParsing = 'error_parsing',
}

interface SubmissionPayload {
  template_id: string;
  form_data: ParsedResults;
  user_id?: string | null; // Optional user_id
}

const loadingMessages = [
    "Analyzing audio waves...", "Decoding your dictation...", "Engaging neural networks...", "Warming up the AI...",
    "Structuring the insights...", "Finding the keywords...", "Almost there...", "Just a moment more...",
    "Processing your thoughts...", "Consulting the digital oracle...",
];

// <<< Define preferred MIME types >>>
const PREFERRED_MIME_TYPES = [
    'audio/mp4', // Often supported on iOS/Safari (AAC codec)
    'audio/webm;codecs=opus', // Generally good quality and widely supported
    'audio/ogg;codecs=opus', // Alternative container for Opus
    'audio/webm', // Default fallback
];

// --- Component Props ---
interface CaptureFormProps {
    formId: string;
    isPublic: boolean;
    router: AppRouterInstance; // Pass router instance for navigation
}

// --- The Reusable Component ---
export default function CaptureForm({ formId, isPublic, router }: CaptureFormProps) {
  // Instantiate Supabase client here
  const supabase = createClientComponentClient();

  // --- State Variables ---
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.Idle);
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.Idle);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedResults>({});
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const [currentPhase, setCurrentPhase] = useState<CapturePhase>(CapturePhase.Prompting);
  // <<< Add state for MIME type >>>
  const [recordingMimeType, setRecordingMimeType] = useState<string>('audio/webm');

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- Effects ---
  useEffect(() => {
    const fetchFormStructure = async () => {
        if (!formId) return;
        setLoading(true);
        setFetchError(null);
        try {
            const { data: tData, error: tError } = await supabase
                .from('form_templates')
                .select('id, name')
                .eq('id', formId)
                .single();
            if (tError) throw tError;
            if (!tData) throw new Error("Form template not found");
            setTemplate(tData);

            const { data: fData, error: fError } = await supabase
                .from('form_fields')
                .select('id, label, internal_key, field_type, display_order, options, rating_min, rating_max')
                .eq('template_id', formId)
                .order('display_order', { ascending: true });
            if (fError) throw fError;
            setFields(fData || []);

        } catch (err) {
            let message = "Failed to load form details.";
            if (err instanceof Error) message = err.message;
            setFetchError(message);
            setCurrentPhase(CapturePhase.Error); // Set error phase on fetch failure
            console.error("Error fetching form structure:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchFormStructure();

    return () => {
        stopRecording(false);
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, supabase]); // Keep original dependencies, disable warning for stopRecording

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const isProcessing = processingState === ProcessingState.Transcribing || processingState === ProcessingState.Parsing;
    if (isProcessing) {
        setCurrentLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        intervalId = setInterval(() => {
            setCurrentLoadingMessage(prevMessage => {
                let newMessage;
                do {
                    newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
                } while (newMessage === prevMessage);
                return newMessage;
            });
        }, 2000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [processingState]);

  // --- Handlers & Logic (Copied from original page) ---

  const startRecording = async () => {
    // <<< Add MimeType Probing Logic >>>
    let selectedMimeType: string | null = null;
    for (const mimeType of PREFERRED_MIME_TYPES) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
            console.log(`Using supported mimeType: ${mimeType}`);
            selectedMimeType = mimeType;
            break; // Use the first supported preferred type
        }
    }
    if (!selectedMimeType) {
        selectedMimeType = 'audio/webm'; // Fallback if none preferred are supported
        console.log(`No preferred mimeType supported, falling back to: ${selectedMimeType}`);
    }
    setRecordingMimeType(selectedMimeType); // Set state
    // <<< End Probing Logic >>>

    setRecordingStatus(RecordingStatus.RequestingPermission);
    audioChunksRef.current = [];
    setProcessingState(ProcessingState.Idle);
    setTranscription(null);
    setParsedResults({});
    setProcessingError(null);
    setCurrentPhase(CapturePhase.Recording);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setRecordingStatus(RecordingStatus.Recording);
      toast.success("Microphone access granted. Recording started.");

      // <<< Initialize MediaRecorder with selected type >>>
      const options = { mimeType: selectedMimeType }; 
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        // <<< Create Blob with correct type >>>
        const completeBlob = new Blob(audioChunksRef.current, { type: recordingMimeType });
        setRecordingStatus(RecordingStatus.Stopped);
        toast.info("Recording stopped. Processing...");
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        handleProcessRecording(completeBlob);
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("An error occurred during recording.");
        setRecordingStatus(RecordingStatus.Error);
        setProcessingState(ProcessingState.Idle);
        stopRecording();
        setCurrentPhase(CapturePhase.Error);
      }

      recorder.start();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      let message = "Could not start recording.";
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message = "Microphone permission denied. Please enable it in your browser settings.";
              setRecordingStatus(RecordingStatus.PermissionDenied);
          } else {
              message = `Error: ${err.message}`;
              setRecordingStatus(RecordingStatus.Error);
          }
      } else {
          setRecordingStatus(RecordingStatus.Error);
      }
      toast.error(message);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      setProcessingState(ProcessingState.Idle);
      setCurrentPhase(CapturePhase.Error);
    }
  };

  const stopRecording = (updateState = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (updateState && recordingStatus !== RecordingStatus.Idle && recordingStatus !== RecordingStatus.PermissionDenied && recordingStatus !== RecordingStatus.Error && recordingStatus !== RecordingStatus.Stopped) {
           setRecordingStatus(RecordingStatus.Idle);
        }
        if (processingState !== ProcessingState.Success && processingState !== ProcessingState.ErrorParsing && processingState !== ProcessingState.ErrorTranscription) {
           setProcessingState(ProcessingState.Idle);
        }
    }
     mediaRecorderRef.current = null;
  };

  const handleRecordClick = () => {
    if (currentPhase === CapturePhase.Recording) {
      stopRecording();
    } else if (currentPhase === CapturePhase.Prompting || currentPhase === CapturePhase.Reviewing || currentPhase === CapturePhase.Error) {
      startRecording();
    }
  };

  const handleProcessRecording = async (blobToProcess: Blob) => {
    if (!blobToProcess) {
        toast.error("Internal error: No audio blob found for processing.");
        setProcessingState(ProcessingState.Idle);
        setCurrentPhase(CapturePhase.Error); // Indicate error
        return;
    }

    setProcessingState(ProcessingState.Transcribing);
    setProcessingError(null);
    setTranscription(null);
    setParsedResults({});
    setCurrentPhase(CapturePhase.Processing);

    let currentTranscription: string | null = null;
    const formData = new FormData();
    formData.append('audio', blobToProcess); // Filename hint not strictly needed usually
    // <<< Send MIME type to backend >>>
    formData.append('mimeType', recordingMimeType); 

    try { // Transcription
        const response = await fetch('/api/transcribe', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Transcription HTTP error! status: ${response.status}`);
        currentTranscription = result.transcription;
        setTranscription(currentTranscription);
    } catch (err) {
        console.error("Transcription failed:", err);
        let message = "Failed to get transcription.";
        if (err instanceof Error) message = err.message;
        setProcessingError(message);
        setProcessingState(ProcessingState.ErrorTranscription);
        toast.error(`Processing failed: ${message}`);
        setCurrentPhase(CapturePhase.Error);
        return;
    }

    if (!currentTranscription || fields.length === 0) { // Parsing pre-check
        toast.error("Cannot parse without transcription and form fields.");
        setProcessingError("Missing data for parsing step.");
        setProcessingState(ProcessingState.ErrorParsing);
        setCurrentPhase(CapturePhase.Error);
        return;
    }
    
    setProcessingState(ProcessingState.Parsing);

    try { // Parsing
         const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                transcription: currentTranscription, 
                fields: fields.map(f => ({ 
                    label: f.label, internal_key: f.internal_key, field_type: f.field_type, 
                    options: (f.field_type === 'select' || f.field_type === 'radio' || f.field_type === 'multicheckbox') ? f.options : undefined,
                    rating_min: f.field_type === 'rating' ? f.rating_min : undefined,
                    rating_max: f.field_type === 'rating' ? f.rating_max : undefined,
                })),
            }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `Parsing HTTP error! status: ${response.status}`);
        setParsedResults(result.parsedData || {});
        setProcessingState(ProcessingState.Success);
        toast.success("Processing complete! Review and save.");
        setCurrentPhase(CapturePhase.Reviewing);
    } catch (err) {
        console.error("Parsing failed:", err);
        let message = "Failed to parse transcription.";
        if (err instanceof Error) message = err.message;
        setProcessingError(message);
        setProcessingState(ProcessingState.ErrorParsing);
        toast.error(`Processing failed: ${message}`);
        setCurrentPhase(CapturePhase.Error);
    }
  };

  const handleFieldChange = (internal_key: string, value: string | number | boolean | string[]) => {
    const finalValue = Array.isArray(value) && value.length === 1 && typeof value[0] === 'number' ? value[0] : value;
    setParsedResults(prev => ({ ...prev, [internal_key]: finalValue }));
  };

  const handleMultiCheckboxChange = (internal_key: string, option: string, isChecked: boolean) => {
    setParsedResults(prev => {
        const currentSelection = (prev[internal_key] || []) as string[];
        let newSelection = isChecked ? [...currentSelection, option] : currentSelection.filter(item => item !== option);
        if (isChecked && currentSelection.includes(option)) newSelection = currentSelection; // Prevent duplicates if already checked
        return { ...prev, [internal_key]: newSelection };
    });
  };

  const handleSaveSubmission = async () => {
    if (currentPhase !== CapturePhase.Reviewing || Object.keys(parsedResults).length === 0) {
      toast.error("Not in reviewing state or no parsed data available to save.");
      return;
    }
    setIsSaving(true);
    setCurrentPhase(CapturePhase.Submitting);

    try {
      let userId: string | null = null;
      // <<< Only get user ID if NOT a public form >>>
      if (!isPublic) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
              userId = session.user.id;
          } else {
              // Optional: Handle case where authenticated user session is lost mid-flow
              console.warn("User session not found for authenticated save.");
              // Decide if you want to allow anonymous save or throw error
              // For now, we proceed without user_id
          }
      }

      const submissionPayload: SubmissionPayload = {
          template_id: formId,
          form_data: parsedResults,
          // <<< Conditionally add user_id >>>
          ...(userId && { user_id: userId }) 
      };

      console.log("Payload for submission:", JSON.stringify(submissionPayload, null, 2));

      const { data: submissionData, error: insertError } = await supabase
        .from('form_submissions')
        .insert([submissionPayload])
        .select('id') 
        .single(); 

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Failed to save submission.`);
      }
      if (!submissionData || !submissionData.id) {
        console.error("Insert succeeded but no ID returned:", submissionData);
        throw new Error("Could not retrieve submission ID after saving.");
      }

      const newSubmissionId = submissionData.id;

      // --- Redirect Logic ---
      if (isPublic) {
          // Redirect public users to a generic success page
          toast.success("Form submitted successfully! Redirecting...");
          router.push('/form/submitted'); // <<< REDIRECT to thank you page

      } else {
          // Redirect authenticated users to their submission details page
          toast.success("Submission saved successfully! Redirecting...");
          router.push(`/submissions/${newSubmissionId}`); // Use passed router instance
      }

    } catch (err) {
      console.error("Save submission failed:", err);
      let message = "Could not save submission.";
      if (err instanceof Error) message = err.message;
      toast.error(message);
      setCurrentPhase(CapturePhase.Error); // Revert to error state on save failure
    } finally {
      setIsSaving(false); 
    }
  };

  // --- Render Helpers (Copied from original page) ---
  const renderFieldHints = (field: FormField) => {
      switch (field.field_type) {
          case 'select': case 'radio': case 'multicheckbox':
              return `Options: ${(field.options || []).join(', ')}`;
          case 'date': return `Format: YYYY-MM-DD`;
          case 'checkbox': return `Answer: Yes / No`;
          case 'rating':
              if (field.rating_min != null && field.rating_max != null) return `Rate from ${field.rating_min} to ${field.rating_max}`;
              return 'Provide a rating';
          default: return null;
      }
  };

  const renderFieldInput = (field: FormField) => {
    const value = parsedResults[field.internal_key] ?? '';
    const isDisabled = currentPhase !== CapturePhase.Reviewing; // Disable inputs unless reviewing

    switch (field.field_type) {
      case 'textarea':
        return <Textarea id={field.internal_key} value={String(value)} onChange={(e) => handleFieldChange(field.internal_key, e.target.value)} rows={3} disabled={isDisabled} />;
      case 'number':
        const numberValue = (typeof value === 'string' || typeof value === 'number') ? value : ''; 
        return <Input type="number" id={field.internal_key} value={numberValue} onChange={(e) => handleFieldChange(field.internal_key, e.target.valueAsNumber ?? null)} disabled={isDisabled} />;
      case 'date':
        return <Input type="date" id={field.internal_key} value={String(value)} onChange={(e) => handleFieldChange(field.internal_key, e.target.value)} disabled={isDisabled} />;
       case 'checkbox':
         return <div className="flex items-center h-10"><Checkbox id={field.internal_key} checked={!!value} onCheckedChange={(checked) => handleFieldChange(field.internal_key, checked as boolean)} disabled={isDisabled} /></div>;
       case 'select':
         return (
           <Select value={String(value)} onValueChange={(selectedValue) => handleFieldChange(field.internal_key, selectedValue)} disabled={isDisabled}>
             <SelectTrigger id={field.internal_key}><SelectValue placeholder={`Select ${field.label}...`} /></SelectTrigger>
             <SelectContent>{(field.options || []).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
           </Select>
         );
       case 'radio':
         return (
           <RadioGroup id={field.internal_key} value={String(value)} onValueChange={(selectedValue: string) => handleFieldChange(field.internal_key, selectedValue)} disabled={isDisabled} className="pt-2">
             {(field.options || []).map((option) => (
               <div key={option} className="flex items-center space-x-2"><RadioGroupItem value={option} id={`${field.internal_key}-${option}`} /><Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">{option}</Label></div>
             ))}
             {(field.options || []).length === 0 && <p className="text-sm text-red-500 italic">No options defined.</p>}
           </RadioGroup>
         );
       case 'multicheckbox':
         const selectedValues = (value || []) as string[];
         return (
           <div className="pt-2 space-y-2">
             {(field.options || []).map((option) => (
               <div key={option} className="flex items-center space-x-2"><Checkbox id={`${field.internal_key}-${option}`} checked={selectedValues.includes(option)} onCheckedChange={(checked) => handleMultiCheckboxChange(field.internal_key, option, checked as boolean)} disabled={isDisabled} /><Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">{option}</Label></div>
             ))}
             {(field.options || []).length === 0 && <p className="text-sm text-red-500 italic">No options defined.</p>}
           </div>
         );
       case 'rating':
         const minValue = field.rating_min ?? 1;
         const maxValue = field.rating_max ?? 5;
         let currentRating = minValue;
         const parsedValue = parsedResults[field.internal_key];
         if (typeof parsedValue === 'number' && parsedValue >= minValue && parsedValue <= maxValue) currentRating = parsedValue;
         else if (typeof parsedValue === 'number') currentRating = minValue; // Default clamp
         if (minValue >= maxValue) return <p className="text-sm text-red-500 italic">Invalid rating scale configured.</p>;
         const displayRating = currentRating;
          return (
              <div className="flex items-center space-x-4 pt-2">
                  <Slider id={field.internal_key} min={minValue} max={maxValue} step={1} value={[displayRating]} onValueChange={(newValue: number[]) => handleFieldChange(field.internal_key, newValue[0])} disabled={isDisabled} />
                  <span className="font-medium min-w-[30px] text-right">{displayRating}</span>
              </div>
          );
       default: // Handles 'text'
        return <Input type="text" id={field.internal_key} value={String(value)} onChange={(e) => handleFieldChange(field.internal_key, e.target.value)} disabled={isDisabled} />;
    }
  };

  // --- Main Render Logic (Copied from original page) ---
  if (loading) return <div>Loading form...</div>; // Keep simple loading here
  if (fetchError && currentPhase === CapturePhase.Error) {
      // Show fetch error within the component's context
      return (
          <div className="text-red-500">
              <h1 className="text-xl font-semibold mb-4">Error</h1>
              <p>Could not load form: {fetchError}</p>
          </div>
      );
  }
  if (!template) return <div>Form not found.</div>; // Should be caught by fetchError

  const isRecording = recordingStatus === RecordingStatus.Recording;
  const isRequestingMic = recordingStatus === RecordingStatus.RequestingPermission;
  const showSaveButton = currentPhase === CapturePhase.Reviewing && !isSaving;
  const interactionDisabled = currentPhase === CapturePhase.Processing || currentPhase === CapturePhase.Submitting || isRequestingMic;
  const canStartRecording = (currentPhase === CapturePhase.Prompting || currentPhase === CapturePhase.Reviewing || currentPhase === CapturePhase.Error) && !interactionDisabled && recordingStatus !== RecordingStatus.PermissionDenied;
  const canStopRecording = currentPhase === CapturePhase.Recording;

  return (
    <div className="space-y-6">
      {/* Template name could be styled differently for public vs private */}
      <h1 className="text-xl font-semibold">Form: {template.name}</h1>

      {/* === Phase-Based Rendering === */}
      {currentPhase === CapturePhase.Prompting && (
          <div className="space-y-4 p-4 border rounded-md bg-blue-50">
              <h2 className="text-lg font-medium">Instructions</h2>
              <p>Click &quot;Start Recording&quot; and clearly state the information for the following fields:</p>
              <ul className="list-disc pl-5 space-y-1">{fields.length > 0 ? fields.map(field => (<li key={field.id}>{field.label}{renderFieldHints(field) && <span className="text-sm text-gray-600 ml-2">({renderFieldHints(field)})</span>}</li>)) : <li>No fields defined.</li>}</ul>
              {recordingStatus === RecordingStatus.PermissionDenied && <p className="text-yellow-600 font-medium">Microphone permission denied. Please enable it in your browser settings.</p>}
          </div>
      )}
      {currentPhase === CapturePhase.Recording && (
          <div className="space-y-4 p-4 border rounded-md bg-red-50">
              <h2 className="text-lg font-medium text-red-700 flex items-center"><Mic className="h-5 w-5 mr-2 animate-pulse" /> Recording...</h2>
              <p>Please provide information for:</p>
              <ul className="list-disc pl-5 space-y-1">{fields.map(field => (<li key={field.id}>{field.label}{renderFieldHints(field) && <span className="text-sm text-gray-600 ml-2">({renderFieldHints(field)})</span>}</li>))}</ul>
          </div>
      )}
      {currentPhase === CapturePhase.Processing && (
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <h2 className="text-lg font-medium mb-2">Processing Recording</h2>
              <div className="flex items-center justify-center p-4"><BrainCircuit className="h-6 w-6 animate-spin text-indigo-600" /><span className="ml-3 text-gray-700 font-medium">{currentLoadingMessage}</span></div>
          </div>
      )}
      {currentPhase === CapturePhase.Reviewing && (
          <div className="space-y-4 p-4 border rounded-md bg-green-50">
              <h2 className="text-lg font-medium">Review & Edit</h2>
              <p>Please review the extracted information and make any necessary corrections before saving.</p>
               {transcription && (
                   <div className="mt-2">
                       <Label htmlFor="final-transcription" className="block text-sm font-medium text-gray-700 mb-1">Final Transcription:</Label>
                       <Textarea id="final-transcription" readOnly value={transcription} rows={3} className="w-full bg-white text-sm" />
                   </div>
               )}
               <div className="space-y-4 pt-4 border-t mt-4">
                   {fields.length > 0 ? ( fields.map(field => (<div key={field.id}><Label htmlFor={field.internal_key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</Label>{renderFieldInput(field)}</div>)) ) : ( <p>No fields defined.</p> )}
               </div>
               {processingError && <p className="text-center text-red-500"><span className="font-medium">Processing Error:</span> {processingError}</p>}
          </div>
      )}
       {currentPhase === CapturePhase.Error && processingError && (
           <div className="space-y-4 p-4 border rounded-md bg-red-50">
               <h2 className="text-lg font-medium text-red-700">Error</h2>
               <p>{processingError}</p>
               {transcription && (<div className="mt-2"><Label htmlFor="error-transcription" className="block text-sm font-medium text-gray-700 mb-1">Transcription (if available):</Label><Textarea id="error-transcription" readOnly value={transcription} rows={3} className="w-full bg-white text-sm" /></div>)}
           </div>
       )}

      {/* Bottom Controls */}
      <div className="flex justify-center items-center space-x-4 p-4 border-t mt-4">
          {(canStartRecording || canStopRecording) && (
            <Button 
              onClick={handleRecordClick} 
              size="lg" 
              disabled={interactionDisabled || (currentPhase === CapturePhase.Prompting && recordingStatus === RecordingStatus.PermissionDenied)} 
              className={`cursor-pointer ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRequestingMic ? <Mic className="mr-2 h-5 w-5 animate-pulse" /> : isRecording ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isRequestingMic ? "Requesting Mic..." : isRecording ? "Stop Recording" : (currentPhase === CapturePhase.Reviewing || currentPhase === CapturePhase.Error) ? "Record Again" : "Start Recording" }
            </Button>
          )}
        {showSaveButton && (
             <Button onClick={handleSaveSubmission} size="lg" disabled={isSaving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSaving ? 'Saving...' : (isPublic ? 'Submit Form' : 'Save Submission')}
            </Button>
        )}
      </div>
    </div>
  );
} 