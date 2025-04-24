"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Import UI components as needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Added Input
import { Mic, MicOff, Loader2, BrainCircuit, Save } from 'lucide-react'; // Removed Send
import { toast } from 'sonner'; // For notifications
import { Textarea } from '@/components/ui/textarea'; // Added Textarea for transcription display
import { Checkbox } from '@/components/ui/checkbox'; // <<< Add Checkbox import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // <<< Add Select imports
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // <<< Add RadioGroup imports
import { Label } from '@/components/ui/label'; // <<< Add Label import
import { Slider } from "@/components/ui/slider"; // <<< Add Slider import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // <<< Add Tabs imports
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"; // <<< Add Card imports

// TODO: Define types for template/fields if not shared
interface FormTemplate {
  id: string;
  name: string;
}
interface FormField {
  id: string;
  label: string;
  internal_key: string; // Need the key for mapping results
  field_type: string;
  display_order: number;
  options?: string[] | null; // <<< Add options property
  rating_min?: number | null;
  rating_max?: number | null;
}

// Enum for recording status
enum RecordingStatus {
  Idle = 'idle',
  RequestingPermission = 'requesting',
  PermissionDenied = 'denied',
  Recording = 'recording',
  Stopped = 'stopped',
  Error = 'error',
}

// <<< NEW: Enum for different UI phases >>>
enum CapturePhase {
    Prompting = 'prompting', // Show instructions/fields to talk about
    Recording = 'recording', // Actively recording, show hints
    Processing = 'processing', // Transcription + Parsing happening
    Reviewing = 'reviewing', // Show parsed results in editable form
    Submitting = 'submitting', // Saving to DB
    Error = 'error', // Show fetch/processing/saving error
}

// Type for parsed results state
// <<< MODIFIED to allow string arrays for multicheckbox >>>
type ParsedResults = Record<string, string | number | boolean | string[] | null>;

// Combine processing states for UI simplification
enum ProcessingState {
    Idle = 'idle',
    Transcribing = 'transcribing',
    Parsing = 'parsing',
    Success = 'success', // Overall success (parsed)
    ErrorTranscription = 'error_transcription',
    ErrorParsing = 'error_parsing',
}

// Array of fun loading messages
const loadingMessages = [
    "Analyzing audio waves...",
    "Decoding your dictation...",
    "Engaging neural networks...",
    "Warming up the AI...",
    "Structuring the insights...",
    "Finding the keywords...",
    "Almost there...",
    "Just a moment more...",
    "Processing your thoughts...",
    "Consulting the digital oracle...",
];

// <<< Add Interface for Submission Payload >>>
interface SubmissionPayload {
  template_id: string;
  form_data: ParsedResults;
  user_id?: string | null; // Optional user_id
}

export default function CapturePage() {
  const params = useParams();
  const router = useRouter(); // For potential redirect
  const id = params.id as string;

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null); // Renamed from error
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>(RecordingStatus.Idle);
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.Idle);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedResults>({});
  const [processingError, setProcessingError] = useState<string | null>(null); // Combined error message
  const [isSaving, setIsSaving] = useState<boolean>(false); // State for save operation
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]); // State for dynamic message
  const [currentPhase, setCurrentPhase] = useState<CapturePhase>(CapturePhase.Prompting); // <<< Add Phase State
  // TODO: Add state for transcription, parsed results
  const supabase = createClientComponentClient();

  // Refs to manage media recorder and stream
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Fetch form structure
    const fetchFormStructure = async () => {
        if (!id) return;
        setLoading(true);
        setFetchError(null);
        try {
            // Fetch template basics (name)
            const { data: tData, error: tError } = await supabase
                .from('form_templates')
                .select('id, name')
                .eq('id', id)
                .single();
            if (tError) throw tError;
            if (!tData) throw new Error("Form template not found");
            setTemplate(tData);

            // Fetch fields (label, internal_key, type, order, OPTIONS, RATING)
            const { data: fData, error: fError } = await supabase
                .from('form_fields')
                .select('id, label, internal_key, field_type, display_order, options, rating_min, rating_max')
                .eq('template_id', id)
                .order('display_order', { ascending: true });
            if (fError) throw fError;
            setFields(fData || []);

        } catch (err) {
            let message = "Failed to load form details.";
            if (err instanceof Error) {
                message = err.message;
            }
            setFetchError(message); // Update renamed state
            console.error("Error fetching form structure:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchFormStructure();

    // Cleanup function to stop recording and release mic if component unmounts
    return () => {
        stopRecording(false); // Pass false to avoid setting state on unmount
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase]); // Keep original dependencies, stopRecording has no deps

  // Effect to cycle through loading messages during processing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const isProcessing = processingState === ProcessingState.Transcribing || processingState === ProcessingState.Parsing;

    if (isProcessing) {
        // Set initial message immediately
        setCurrentLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        
        intervalId = setInterval(() => {
            setCurrentLoadingMessage(prevMessage => {
                let newMessage;
                // Ensure we don't pick the same message twice in a row
                do {
                    newMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
                } while (newMessage === prevMessage);
                return newMessage;
            });
        }, 2000); // Change message every 2 seconds
    }

    // Cleanup function
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [processingState]); // Rerun when processingState changes

  const startRecording = async () => {
    setRecordingStatus(RecordingStatus.RequestingPermission);
    audioChunksRef.current = [];
    // --> Reset processing state when starting new recording
    setProcessingState(ProcessingState.Idle);
    setTranscription(null);
    setParsedResults({});
    setProcessingError(null);
    setCurrentPhase(CapturePhase.Recording); // <<< Set Phase: Recording

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setRecordingStatus(RecordingStatus.Recording);
      toast.success("Microphone access granted. Recording started.");

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // MODIFIED: onstop now triggers the full processing pipeline
      recorder.onstop = () => {
        const completeBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingStatus(RecordingStatus.Stopped);
        toast.info("Recording stopped. Processing...");
        
        // Stop tracks
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        
        // --> Immediately start processing
        handleProcessRecording(completeBlob); 
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast.error("An error occurred during recording.");
        setRecordingStatus(RecordingStatus.Error);
        setProcessingState(ProcessingState.Idle); // Reset processing
        stopRecording(); // Attempt cleanup
        setCurrentPhase(CapturePhase.Error); // <<< Set Phase: Error on recording failure
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
      // Ensure stream is stopped if partially started
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      // Ensure processing state is reset on mic error
      setProcessingState(ProcessingState.Idle);
      setCurrentPhase(CapturePhase.Error); // <<< Set Phase: Error on mic failure
    }
  };

  const stopRecording = (updateState = true) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // This triggers the modified onstop handler
      // Status updates (RecordingStatus.Stopped, ProcessingState starting) happen in onstop
    } else {
        // If we are stopping but not actually recording (e.g., cleanup on permission denial/error)
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        // Reset status if it wasn't already in a final state
        if (updateState && recordingStatus !== RecordingStatus.Idle && recordingStatus !== RecordingStatus.PermissionDenied && recordingStatus !== RecordingStatus.Error && recordingStatus !== RecordingStatus.Stopped) {
           setRecordingStatus(RecordingStatus.Idle);
        }
        // Ensure processing state is idle if stopping unexpectedly
        if (processingState !== ProcessingState.Success && processingState !== ProcessingState.ErrorParsing && processingState !== ProcessingState.ErrorTranscription) {
           setProcessingState(ProcessingState.Idle);
        }
    }
     mediaRecorderRef.current = null; // Clear the ref
  };

  const handleRecordClick = () => {
    if (currentPhase === CapturePhase.Recording) { // Use phase state
      stopRecording();
      // Phase will transition to Processing in the recorder's onstop
    } else if (
       currentPhase === CapturePhase.Prompting ||
       currentPhase === CapturePhase.Reviewing ||
       currentPhase === CapturePhase.Error // Allow retry from error state
    ) {
      // Allow starting new recording from Prompting, Reviewing, or Error phases
      startRecording();
    }
    // Do nothing if Processing, Submitting, or requesting mic
  };

  // RENAMED & MODIFIED: Handles the whole pipeline (transcription -> parsing)
  const handleProcessRecording = async (blobToProcess: Blob) => {
    if (!blobToProcess) {
        toast.error("Internal error: No audio blob found for processing.");
        setProcessingState(ProcessingState.Idle);
        return;
    }

    setProcessingState(ProcessingState.Transcribing);
    setProcessingError(null);
    setTranscription(null);
    setParsedResults({});
    setCurrentPhase(CapturePhase.Processing); // <<< Set Phase: Processing

    // --- Transcription Step --- 
    let currentTranscription: string | null = null;
    const formData = new FormData();
    formData.append('audio', blobToProcess, 'recording.webm');

    try {
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Transcription HTTP error! status: ${response.status}`);
        }
        currentTranscription = result.transcription;
        setTranscription(currentTranscription); // Update state
        // Don't toast success yet, move to parsing

    } catch (err) {
        console.error("Transcription failed:", err);
        let message = "Failed to get transcription.";
        if (err instanceof Error) message = err.message;
        setProcessingError(message);
        setProcessingState(ProcessingState.ErrorTranscription);
        toast.error(`Processing failed: ${message}`);
        setCurrentPhase(CapturePhase.Error); // <<< Set Phase: Error on transcription failure
        return; // Stop pipeline on transcription error
    }

    // --- Parsing Step --- 
    if (!currentTranscription || fields.length === 0) {
        toast.error("Cannot parse without transcription and form fields.");
        setProcessingError("Missing data for parsing step.");
        setProcessingState(ProcessingState.ErrorParsing); // Or a generic error?
        return;
    }
    
    setProcessingState(ProcessingState.Parsing);
    // No need to clear parsedResults here, cleared at start

    try {
         const response = await fetch('/api/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                transcription: currentTranscription, 
                fields: fields.map(f => ({ 
                    label: f.label, 
                    internal_key: f.internal_key, 
                    field_type: f.field_type, 
                    options: (f.field_type === 'select' || f.field_type === 'radio' || f.field_type === 'multicheckbox') ? f.options : undefined,
                    rating_min: f.field_type === 'rating' ? f.rating_min : undefined,
                    rating_max: f.field_type === 'rating' ? f.rating_max : undefined,
                })),
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Parsing HTTP error! status: ${response.status}`);
        }

        setParsedResults(result.parsedData || {});
        setProcessingState(ProcessingState.Success);
        toast.success("Processing complete! Review and save.");
        setCurrentPhase(CapturePhase.Reviewing); // <<< Set Phase: Reviewing on success

    } catch (err) {
        console.error("Parsing failed:", err);
        let message = "Failed to parse transcription.";
        if (err instanceof Error) message = err.message;
        setProcessingError(message);
        setProcessingState(ProcessingState.ErrorParsing);
        toast.error(`Processing failed: ${message}`);
        setCurrentPhase(CapturePhase.Error); // <<< Set Phase: Error on parsing failure
    }
  };

  // Handler for updating parsed results state when user edits a field
  const handleFieldChange = (internal_key: string, value: string | number | boolean | string[]) => {
    // Special handling for slider which returns [number]
    const finalValue = Array.isArray(value) && value.length === 1 && typeof value[0] === 'number' 
                       ? value[0] 
                       : value;
    setParsedResults(prev => ({
      ...prev,
      [internal_key]: finalValue,
    }));
  };

  // Specific handler for multicheckbox changes
  const handleMultiCheckboxChange = (internal_key: string, option: string, isChecked: boolean) => {
    setParsedResults(prev => {
        const currentSelection = (prev[internal_key] || []) as string[]; // Ensure it's an array
        let newSelection: string[];

        if (isChecked) {
            // Add option if not already present
            newSelection = currentSelection.includes(option) ? currentSelection : [...currentSelection, option];
        } else {
            // Remove option
            newSelection = currentSelection.filter(item => item !== option);
        }
        
        return {
            ...prev,
            [internal_key]: newSelection,
        };
    });
  };

  // handleSaveSubmission - now correctly uses form_data and redirects
  const handleSaveSubmission = async () => {
    if (currentPhase !== CapturePhase.Reviewing || Object.keys(parsedResults).length === 0) {
      toast.error("Not in reviewing state or no parsed data available to save.");
      return;
    }
    setIsSaving(true);
    setCurrentPhase(CapturePhase.Submitting); // <<< Set Phase: Submitting

    try {
      // 1. Get User ID (Optional)
      let userId: string | null = null;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      }

      // 2. Prepare payload (using the new interface)
      const submissionPayload: SubmissionPayload = {
          template_id: id,
          form_data: parsedResults,
      };
      if (userId) {
          submissionPayload.user_id = userId;
      }

      // <<< ADD LOGGING >>>
      console.log("Payload for submission:", JSON.stringify(submissionPayload, null, 2));

      // 3. Insert into form_submissions
      const { data: submissionData, error: insertError } = await supabase
        .from('form_submissions')
        .insert([submissionPayload]) // <<< Use the prepared payload
        .select('id') 
        .single(); 

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        // Provide a more user-friendly generic error potentially
        throw new Error(`Failed to save submission.`); // Simplified error message
      }

      if (!submissionData || !submissionData.id) {
        console.error("Insert succeeded but no ID returned:", submissionData);
        throw new Error("Could not retrieve submission ID after saving.");
      }

      const newSubmissionId = submissionData.id;

      // 4. Handle Success & Redirect
      toast.success("Submission saved successfully! Redirecting...");
      router.push(`/submissions/${newSubmissionId}`); 

    } catch (err) {
      console.error("Save submission failed:", err);
      let message = "Could not save submission.";
      if (err instanceof Error) {
        // Avoid exposing raw DB errors directly if possible
        message = err.message.startsWith('Failed to save submission') ? err.message : "Could not save submission.";
      }
      toast.error(message);
      setCurrentPhase(CapturePhase.Error); // <<< Set Phase: Error on save failure
    } finally {
      setIsSaving(false); 
    }
  };

  // --- Helper to render hints during recording ---
  const renderFieldHints = (field: FormField) => {
      switch (field.field_type) {
          case 'select':
          case 'radio':
          case 'multicheckbox': // <<< Add case for multicheckbox
              return `Options: ${(field.options || []).join(', ')}`;
          case 'date':
              return `Format: YYYY-MM-DD`;
          case 'checkbox':
              return `Answer: Yes / No`;
          case 'rating': // <<< Fix: Return the text hint, not the Slider component >>>
              if (field.rating_min != null && field.rating_max != null) {
                  return `Rate from ${field.rating_min} to ${field.rating_max}`;
              }
              return 'Provide a rating'; // Fallback hint
          default:
              return null; // No specific hint needed for text, textarea, number
      }
  };

  // --- Helper to render the correct input based on field type ---
  const renderFieldInput = (field: FormField) => {
    const value = parsedResults[field.internal_key] ?? '';

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            id={field.internal_key}
            value={typeof value === 'string' ? value : String(value)} // Ensure value is string
            onChange={(e) => handleFieldChange(field.internal_key, e.target.value)}
            rows={3}
            disabled={processingState !== ProcessingState.Success}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            id={field.internal_key}
            value={typeof value === 'boolean' ? '' : value}
            onChange={(e) => handleFieldChange(field.internal_key, e.target.valueAsNumber ?? null)}
            disabled={processingState !== ProcessingState.Success}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            id={field.internal_key}
            value={typeof value === 'string' ? value : ''} // Ensure value is string for date input
            onChange={(e) => handleFieldChange(field.internal_key, e.target.value)}
            disabled={processingState !== ProcessingState.Success}
          />
        );
       case 'checkbox':
         return (
           <div className="flex items-center h-10"> {/* Wrapper to align */} 
             <Checkbox
               id={field.internal_key}
               // Ensure 'checked' prop receives a boolean
               checked={!!value} // Coerce value to boolean (handles null/undefined/empty string)
               onCheckedChange={(checked) => handleFieldChange(field.internal_key, checked as boolean)}
               disabled={processingState !== ProcessingState.Success}
             />
           </div>
         );
       case 'select': // <<< Add Select case
         return (
           <Select
             value={typeof value === 'string' ? value : ''} // Select expects string value
             onValueChange={(selectedValue) => handleFieldChange(field.internal_key, selectedValue)}
             disabled={processingState !== ProcessingState.Success}
           >
             <SelectTrigger id={field.internal_key}>
               <SelectValue placeholder={`Select ${field.label}...`} />
             </SelectTrigger>
             <SelectContent>
               {(field.options || []).map((option) => (
                 <SelectItem key={option} value={option}>
                   {option}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         );
       case 'radio': // <<< Add Radio case
         return (
           <RadioGroup
             id={field.internal_key}
             value={typeof value === 'string' ? value : ''} // Radio group expects string value
             onValueChange={(selectedValue: string) => handleFieldChange(field.internal_key, selectedValue)}
             disabled={processingState !== ProcessingState.Success}
             className="pt-2" // Add some top padding
           >
             {(field.options || []).map((option) => (
               <div key={option} className="flex items-center space-x-2">
                 <RadioGroupItem value={option} id={`${field.internal_key}-${option}`} />
                 <Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">
                   {option}
                 </Label>
               </div>
             ))}
             {/* Optionally handle case where there are no options */}
             {(field.options || []).length === 0 && (
                 <p className="text-sm text-red-500 italic">No options defined for this field.</p>
             )}
           </RadioGroup>
         );
       case 'multicheckbox': // <<< Add Multicheckbox case
         const selectedValues = (value || []) as string[]; // Ensure value is treated as an array
         return (
           <div className="pt-2 space-y-2"> {/* Wrapper with padding */}
             {(field.options || []).map((option) => (
               <div key={option} className="flex items-center space-x-2">
                 <Checkbox
                   id={`${field.internal_key}-${option}`}
                   checked={selectedValues.includes(option)}
                   onCheckedChange={(checked) => handleMultiCheckboxChange(field.internal_key, option, checked as boolean)}
                   disabled={currentPhase !== CapturePhase.Reviewing} // <<< Use Phase check for disabled
                 />
                 <Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">
                   {option}
                 </Label>
               </div>
             ))}
             {(field.options || []).length === 0 && (
                 <p className="text-sm text-red-500 italic">No options defined for this field.</p>
             )}
           </div>
         );
       case 'rating':
         const minValue = field.rating_min ?? 1; // Default min 1
         const maxValue = field.rating_max ?? 5; // Default max 5
         // Get the current value from parsedResults, defaulting to minValue
         let currentRating = minValue;
         const parsedValue = parsedResults[field.internal_key];
         if (typeof parsedValue === 'number' && parsedValue >= minValue && parsedValue <= maxValue) {
             currentRating = parsedValue;
         } else if (typeof parsedValue === 'number') {
             // If number is outside range, clamp or default? Defaulting to min for now.
             currentRating = minValue;
         }

         // Check for invalid configuration
          if (minValue >= maxValue) {
            return <p className="text-sm text-red-500 italic">Invalid rating scale configured (Min &gt;= Max).</p>;
          }

          const displayRating = currentRating;

          return (
              <div className="flex items-center space-x-4 pt-2">
                  <Slider
                      id={field.internal_key}
                      min={minValue}
                      max={maxValue}
                      step={1}
                      value={[displayRating]} // Slider value needs to be an array
                      onValueChange={(newValue: number[]) => {
                          const singleValue = newValue[0];
                          handleFieldChange(field.internal_key, singleValue);
                      }}
                      disabled={currentPhase !== CapturePhase.Reviewing}
                  />
                  <span className="font-medium min-w-[30px] text-right">{displayRating}</span>
              </div>
          );
       case 'text': // Fallback for 'text' and any other unknown types
      default:
        return (
          <Input
            type="text"
            id={field.internal_key}
            value={typeof value === 'string' ? value : String(value)} // Ensure value is string
            onChange={(e) => handleFieldChange(field.internal_key, e.target.value)}
            disabled={processingState !== ProcessingState.Success}
          />
        );
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (fetchError) {
      setCurrentPhase(CapturePhase.Error); // Set phase on fetch error
      // Render error immediately, don't wait for phase state update in render cycle
      return (
          <div className="text-red-500">
              <h1 className="text-2xl font-semibold mb-4">Error</h1>
              <p>Failed to load form details: {fetchError}</p>
              {/* Maybe add a retry button later */}
          </div>
      );
  }
  if (!template) return <div>Form not found.</div>; // Should be caught by fetchError usually

  const isRecording = recordingStatus === RecordingStatus.Recording;
  const isRequestingMic = recordingStatus === RecordingStatus.RequestingPermission;
  // Save button appears only on review phase and not currently saving
  const showSaveButton = currentPhase === CapturePhase.Reviewing && !isSaving;
  // General interaction disable flag
  const interactionDisabled = currentPhase === CapturePhase.Processing || currentPhase === CapturePhase.Submitting || isRequestingMic;
  // Can start recording if prompting, reviewing, or error state (and mic allowed)
  const canStartRecording = (currentPhase === CapturePhase.Prompting || currentPhase === CapturePhase.Reviewing || currentPhase === CapturePhase.Error) && !interactionDisabled && recordingStatus !== RecordingStatus.PermissionDenied;
  // Can stop recording only when actively recording
  const canStopRecording = currentPhase === CapturePhase.Recording;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Capture for: {template.name}</h1>

      {/* === Phase-Based Rendering === */} 

      {/* --- Prompting Phase --- */} 
      {currentPhase === CapturePhase.Prompting && (
          <div className="space-y-4 p-4 border rounded-md bg-blue-50">
              <h2 className="text-lg font-medium">Instructions</h2>
              <p>Click &quot;Start Recording&quot; and clearly state the information for the following fields:</p>
              <ul className="list-disc pl-5 space-y-1">
                  {fields.length > 0 ? (
                      fields.map(field => (
                          <li key={field.id}>
                              {field.label}
                              {renderFieldHints(field) && <span className="text-sm text-gray-600 ml-2">({renderFieldHints(field)})</span>}
                          </li>
                      ))
                  ) : (
                      <li>No fields defined for this form.</li>
                  )}
              </ul>
              {recordingStatus === RecordingStatus.PermissionDenied && (
                  <p className="text-yellow-600 font-medium">Microphone permission denied. Please enable it in your browser settings.</p>
              )}
          </div>
      )}

      {/* --- Recording Phase --- */} 
      {currentPhase === CapturePhase.Recording && (
          <div className="space-y-4 p-4 border rounded-md bg-red-50">
              <h2 className="text-lg font-medium text-red-700 flex items-center">
                  <Mic className="h-5 w-5 mr-2 animate-pulse" /> Recording...
              </h2>
              <p>Please provide information for:</p>
              <ul className="list-disc pl-5 space-y-1">
                  {fields.map(field => (
                      <li key={field.id}>
                          {field.label}
                          {renderFieldHints(field) && <span className="text-sm text-gray-600 ml-2">({renderFieldHints(field)})</span>}
                      </li>
                  ))}
              </ul>
              {/* Timer could go here */} 
          </div>
      )}

      {/* --- Processing Phase --- */} 
      {currentPhase === CapturePhase.Processing && (
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <h2 className="text-lg font-medium mb-2">Processing Recording</h2>
              <div className="flex items-center justify-center p-4">
                  <BrainCircuit className="h-6 w-6 animate-spin text-indigo-600" />
                  <span className="ml-3 text-gray-700 font-medium">
                      {currentLoadingMessage}
                  </span>
              </div>
          </div>
      )}

      {/* --- Reviewing Phase --- */} 
      {currentPhase === CapturePhase.Reviewing && (
          <div className="space-y-4 p-4 border rounded-md bg-green-50">
              <Tabs defaultValue="fields" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="fields">Review Fields</TabsTrigger>
                      <TabsTrigger value="transcription" disabled={!transcription}>Transcription</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fields">
                      <Card>
                          <CardHeader>
                              <CardTitle>Review & Edit Fields</CardTitle>
                              <CardDescription>Please review the extracted information and make any necessary corrections before saving.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              {fields.length > 0 ? (
                                  fields.map(field => (
                                      <div key={field.id}>
                                          <Label htmlFor={field.internal_key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</Label>
                                          {renderFieldInput(field)}
                                      </div>
                                  ))
                              ) : (
                                  <p>No fields defined for this form.</p>
                              )}
                          </CardContent>
                      </Card>
                  </TabsContent>
                  <TabsContent value="transcription">
                      <Card>
                          <CardHeader>
                              <CardTitle>Final Transcription</CardTitle>
                              <CardDescription>This is the text generated from your recording.</CardDescription>
                          </CardHeader>
                          <CardContent>
                              {transcription ? (
                                  <Textarea
                                      id="final-transcription"
                                      readOnly
                                      value={transcription}
                                      rows={10} // Increased rows for better view
                                      className="w-full bg-white text-sm font-mono" // Use mono font
                                  />
                              ) : (
                                  <p className="text-sm text-gray-500">Transcription not available.</p>
                              )}
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
              {processingError && (
                    <p className="text-center text-red-500"><span className="font-medium">Processing Error:</span> {processingError}</p>
              )}
          </div>
      )}

       {/* --- Submitting Phase (Covered by Save button state) --- */} 
       {/* No specific UI needed other than the button changing */} 

       {/* --- Error Phase (General Processing/Saving Errors) --- */} 
       {currentPhase === CapturePhase.Error && processingError && (
           <div className="space-y-4 p-4 border rounded-md bg-red-50">
               <h2 className="text-lg font-medium text-red-700">Error</h2>
               <p>{processingError}</p>
               {/* Display Transcription if available during error */} 
               {transcription && (
                   <div className="mt-2">
                       <Label htmlFor="error-transcription" className="block text-sm font-medium text-gray-700 mb-1">Transcription (if available):</Label>
                       <Textarea id="error-transcription" readOnly value={transcription} rows={3} className="w-full bg-white text-sm" />
                   </div>
               )}
           </div>
       )}

      {/* Bottom Controls: Dynamically change based on Phase */} 
      <div className="flex justify-center items-center space-x-4 p-4 border-t">
          {/* Record/Stop Button */} 
          {(canStartRecording || canStopRecording) && (
            <Button
              onClick={handleRecordClick}
              size="lg"
              disabled={interactionDisabled || (currentPhase === CapturePhase.Prompting && recordingStatus === RecordingStatus.PermissionDenied)} // Disable if mic denied
              className={`${ 
                isRecording
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRequestingMic ? (
                <Mic className="mr-2 h-5 w-5 animate-pulse" />
              ) : isRecording ? (
                <MicOff className="mr-2 h-5 w-5" />
              ) : (
                <Mic className="mr-2 h-5 w-5" />
              )}
              {isRequestingMic
                ? "Requesting Mic..."
                : isRecording
                ? "Stop Recording"
                : (currentPhase === CapturePhase.Reviewing || currentPhase === CapturePhase.Error)
                ? "Record Again" // Show Record Again in Review/Error states
                : "Start Recording" // Default for Prompting
              }
            </Button>
          )}

        {/* Save Submission Button */} 
        {showSaveButton && (
             <Button
                onClick={handleSaveSubmission}
                size="lg"
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
             >
                {isSaving ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Save className="mr-2 h-5 w-5" />
                )}
                {isSaving ? 'Saving...' : 'Save Submission'}
            </Button>
        )}
      </div>

      {/* Placeholder for final structured results display? Or handled by fields above. */}

    </div>
  );
} 