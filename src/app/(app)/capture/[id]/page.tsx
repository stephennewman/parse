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

// Type for parsed results state
type ParsedResults = Record<string, string | number | boolean | null>;

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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null); // To store the final recording
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.Idle);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [parsedResults, setParsedResults] = useState<ParsedResults>({});
  const [processingError, setProcessingError] = useState<string | null>(null); // Combined error message
  const [isSaving, setIsSaving] = useState<boolean>(false); // State for save operation
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]); // State for dynamic message
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

            // Fetch fields (label, internal_key, type, order, OPTIONS)
            const { data: fData, error: fError } = await supabase
                .from('form_fields')
                .select('id, label, internal_key, field_type, display_order, options') // <<< Add options
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
    setAudioBlob(null);
    audioChunksRef.current = [];
    // --> Reset processing state when starting new recording
    setProcessingState(ProcessingState.Idle);
    setTranscription(null);
    setParsedResults({});
    setProcessingError(null);

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
        setAudioBlob(completeBlob); // Keep blob reference if needed later
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
    if (recordingStatus === RecordingStatus.Recording) {
      stopRecording();
    } else if (
        recordingStatus === RecordingStatus.Idle || 
        recordingStatus === RecordingStatus.Stopped || // Allow starting again after stop (before/during processing)
        recordingStatus === RecordingStatus.Error || 
        recordingStatus === RecordingStatus.PermissionDenied ||
        processingState === ProcessingState.Success || // Allow after successful process
        processingState === ProcessingState.ErrorParsing || // Allow after error
        processingState === ProcessingState.ErrorTranscription
    ) {
      // Allow starting new recording if idle, stopped, error, or previous processing finished/failed
      startRecording();
    }
    // Do nothing if RequestingPermission or actively processing (transcribing/parsing/saving)
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
                fields: fields.map(f => ({ label: f.label, internal_key: f.internal_key, field_type: f.field_type })) 
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `Parsing HTTP error! status: ${response.status}`);
        }

        setParsedResults(result.parsedData || {});
        setProcessingState(ProcessingState.Success);
        toast.success("Processing complete! Review and save.");

    } catch (err) {
        console.error("Parsing failed:", err);
        let message = "Failed to parse transcription.";
        if (err instanceof Error) message = err.message;
        setProcessingError(message);
        setProcessingState(ProcessingState.ErrorParsing);
        toast.error(`Processing failed: ${message}`);
    }
  };

  // Handler for updating parsed results state when user edits a field
  const handleFieldChange = (internal_key: string, value: string | number | boolean) => { // <<< Update type to include boolean
    setParsedResults(prev => ({
      ...prev,
      [internal_key]: value,
    }));
  };

  // handleSaveSubmission - now correctly uses form_data and redirects
  const handleSaveSubmission = async () => {
    if (processingState !== ProcessingState.Success || Object.keys(parsedResults).length === 0) {
      toast.error("No parsed data available to save.");
      return;
    }
    setIsSaving(true);

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
    } finally {
      setIsSaving(false); 
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
  if (fetchError) return <div className="text-red-500">Error: {fetchError}</div>;
  if (!template) return <div>Form not found.</div>;

  const isRecording = recordingStatus === RecordingStatus.Recording;
  const isRequestingMic = recordingStatus === RecordingStatus.RequestingPermission;
  // Combine processing flags
  const isProcessing = 
      processingState === ProcessingState.Transcribing || 
      processingState === ProcessingState.Parsing;
  const canRecord = !isRequestingMic && !isProcessing && !isSaving; // Can record if not requesting, processing, or saving
  // Save button appears only on overall success and not currently saving
  const showSaveButton = processingState === ProcessingState.Success && !isSaving;
  // General interaction disable flag
  const interactionDisabled = isProcessing || isSaving;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Capture for: {template.name}</h1>

      {/* Form Fields - Updated to be Interactive */} 
      <div className="space-y-4 p-4 border rounded-md">
        <h2 className="text-lg font-medium">Form Fields</h2>
        {fields.length > 0 ? (
            fields.map(field => {
                return (
                    <div key={field.id}>
                        <label htmlFor={field.internal_key} className="block text-sm font-medium text-gray-700">{field.label}</label>
                        {renderFieldInput(field)}
                    </div>
                )
            })
        ) : (
            <p>No fields defined for this form.</p>
        )}
      </div>

      {/* Recording, Processing Status */}
      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-medium mb-2">Recording & Processing</h2>
        {recordingStatus === RecordingStatus.PermissionDenied && (
            <p className="text-center text-yellow-600">Microphone permission denied. Please enable it in your browser settings to record.</p>
        )}
        {recordingStatus === RecordingStatus.Error && (
            <p className="text-center text-red-600">An error occurred with recording. Please try again.</p>
        )}
          {/* Timer could go here */} 
         {audioBlob && recordingStatus === RecordingStatus.Stopped && !isProcessing && processingState !== ProcessingState.Success && (
             <div className="text-center space-y-3">
                 <p className="font-medium">Recording finished.</p>
                 <audio controls src={URL.createObjectURL(audioBlob)} className="mx-auto w-full max-w-sm" />
             </div>
         )}

        {/* --- Combined Processing UI --- */} 
        {isProcessing && (
             <div className="flex items-center justify-center p-4">
                <BrainCircuit className="h-6 w-6 animate-spin text-indigo-600" /> 
                <span className="ml-3 text-gray-700 font-medium">
                    {currentLoadingMessage}
                </span>
            </div>
        )}

        {/* --- Error Display --- */} 
        {(processingState === ProcessingState.ErrorTranscription || processingState === ProcessingState.ErrorParsing) && (
            <p className="text-center text-red-500"><span className="font-medium">Processing Error:</span> {processingError}</p>
        )}

        {/* --- Success Display - Re-add transcription display --- */} 
         {processingState === ProcessingState.Success && (
            <div className="space-y-3">
                 <p className="text-center text-green-600 font-medium">Processing complete. Review fields above.</p>
                 {/* Optionally show the final transcription */}
                 {transcription && (
                     <div className="mt-2">
                         <label htmlFor="final-transcription" className="block text-sm font-medium text-gray-700 mb-1">Final Transcription:</label>
                         <Textarea
                             id="final-transcription"
                             readOnly
                             value={transcription}
                             rows={3}
                             className="w-full bg-white text-sm"
                         />
                     </div>
                 )}
            </div>
        )}
      </div>

      {/* Bottom Controls: Record & Save */} 
      <div className="flex justify-center items-center space-x-4 p-4 border-t">
        <Button
          onClick={handleRecordClick}
          size="lg"
          disabled={!canRecord || interactionDisabled}
          className={`${ 
            isRecording
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-50 disabled:cursor-not-allowed ${ 
            (processingState === ProcessingState.Success || processingState === ProcessingState.ErrorParsing || processingState === ProcessingState.ErrorTranscription) ? 'bg-gray-500 hover:bg-gray-600' : '' // Muted if finished processing
          }`}
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
            : (processingState === ProcessingState.Success || processingState === ProcessingState.ErrorParsing || processingState === ProcessingState.ErrorTranscription)
            ? "Record Again" // Show after processing done (success/fail)
            : "Start Recording"}
        </Button>

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