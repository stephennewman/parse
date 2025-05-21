"use client";

// File Purpose: This file powers the main voice-to-form experience. It lets users record their voice, transcribes it, and uses AI to fill out forms automatically. Both public and private forms use this component.
// Last updated: 2025-05-21

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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// --- Types & Enums (Consider moving to shared files) ---
interface FormTemplate {
  id: string;
  name: string;
  description?: string;
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

// <<< Define preferred MIME types - Updated & Expanded >>>
/* <--- Comment out for experiment
const PREFERRED_MIME_TYPES = [
    'audio/mp4', // Preferred for wider compatibility including Safari (usually AAC)
    'audio/aac', // Explicitly check AAC
    'audio/x-m4a', // Another potential identifier for M4A/AAC
    'audio/webm;codecs=opus', // High quality, good support elsewhere
    'audio/ogg;codecs=opus', // Alternative container for Opus
    'audio/webm', // Generic webm fallback
    // Less common, add if necessary: 'audio/wav', 'audio/mpeg' (mp3)
];
*/ // <--- End comment for experiment
// <<< Removed PREFERRED_MIME_TYPES constant and probing logic for permanent force webm >>>

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
  // Add entry mode state for public forms
  const [entryMode, setEntryMode] = useState<'manual' | 'voice'>(isPublic ? 'manual' : 'voice');
  // Manual form state for public mode
  const [manualResponses, setManualResponses] = useState<Record<string, string | string[] | number>>({});
  const [manualSubmitting, setManualSubmitting] = useState(false);
  // Tab state for review phase
  const [reviewTab, setReviewTab] = useState<'review' | 'transcription'>('transcription');
  const [transcriptionEdit, setTranscriptionEdit] = useState<string>('');
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

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
                .select('id, name, description')
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
            console.log('Fetched fields:', fData);
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

  // Keep transcriptionEdit in sync when entering review phase
  useEffect(() => {
    if (currentPhase === CapturePhase.Reviewing && transcription) {
      setTranscriptionEdit(transcription);
    }
  }, [currentPhase, transcription]);

  // --- Handlers & Logic (Copied from original page) ---

  const startRecording = async () => {
    // <<< Permanent: Force audio/webm >>>
    console.log("Starting recording attempt. Forcing audio/webm.");
    const selectedMimeType = 'audio/webm'; // Hardcode webm
    // <<< Remove direct setting of state here, will be set after checks >>>
    // setRecordingMimeType(selectedMimeType);

    // <<< Remove commented out probing logic >>>
    // <<< End removed section >>>

    // --- Clear previous state ---
    setRecordingStatus(RecordingStatus.Idle); // Reset status before checking permission
    setProcessingState(ProcessingState.Idle);
    setTranscription(null);
    setParsedResults({});
    setProcessingError(null);
    // DO NOT set currentPhase here yet
    audioChunksRef.current = [];

    try {
      // --- Check for MediaDevices API support ---
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Media Devices API not supported in this browser.');
        setRecordingStatus(RecordingStatus.Error);
        setCurrentPhase(CapturePhase.Error);
        setProcessingError('Browser does not support audio recording.');
        return;
      }

      // --- Check Permission Status ---
      let permissionStatus: PermissionState = 'prompt';
      try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionStatus = result.state;
          console.log(`Microphone permission status: ${permissionStatus}`);
      } catch (err) {
          console.warn("Permissions API query failed (might be unsupported or error), proceeding to getUserMedia:", err);
      }

      if (permissionStatus === 'denied') {
          toast.error("Microphone permission denied. Please enable it in your browser settings.");
          setRecordingStatus(RecordingStatus.PermissionDenied);
          setCurrentPhase(CapturePhase.Prompting); // Stay in prompting phase, show message
          return;
      }

      // --- Request Permission / Get Stream (if needed or already granted) ---
      setRecordingStatus(RecordingStatus.RequestingPermission); // Indicate we are asking or about to use mic
      setCurrentPhase(CapturePhase.Recording); // Optimistically set phase - Recorder errors will revert it

      console.log("Calling getUserMedia...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("getUserMedia successful, stream obtained.");
      audioStreamRef.current = stream;

      // --- Set MimeType state and Recording Status *after* getting stream ---
      setRecordingMimeType(selectedMimeType);
      setRecordingStatus(RecordingStatus.Recording);
      toast.success("Microphone access granted. Recording started.");

      // --- Initialize MediaRecorder with selected (forced) type ---
      console.log(`Initializing MediaRecorder with mimeType: ${selectedMimeType}...`);
      const options = { mimeType: selectedMimeType }; // selectedMimeType is now always 'audio/webm'
      const recorder = new MediaRecorder(stream, options);
      console.log("MediaRecorder initialized.");
      mediaRecorderRef.current = recorder;

      // --- Add Logging to Event Handlers ---
      recorder.ondataavailable = (event) => {
        console.log(`recorder.ondataavailable fired. Data size: ${event.data.size}`);
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        console.log("recorder.onstop fired.");
        // <<< Create Blob with the correct (forced) type >>>
        const completeBlob = new Blob(audioChunksRef.current, { type: recordingMimeType }); // recordingMimeType state is now always 'audio/webm'
        console.log(`Blob created. Type: ${completeBlob.type}, Size: ${completeBlob.size}`);

        setRecordingStatus(RecordingStatus.Stopped); // Update status *before* processing

        if (audioStreamRef.current) {
            console.log("Stopping audio stream tracks.");
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        } else {
            console.warn("audioStreamRef was null during recorder.onstop");
        }

        if (completeBlob.size === 0) {
            console.error("Blob size is 0. Cannot process recording.");
            toast.error("Recording failed: No audio data captured.");
            setRecordingStatus(RecordingStatus.Error);
            setCurrentPhase(CapturePhase.Error);
            setProcessingError("No audio data was captured during recording.");
            return;
        }

        toast.info("Recording stopped. Processing..."); // Move toast after checks
        handleProcessRecording(completeBlob);
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder recorder.onerror event:", event);
        toast.error("An error occurred during recording.");
        setRecordingStatus(RecordingStatus.Error);
        setProcessingState(ProcessingState.Idle);
        // Ensure stream is stopped on error too
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        setCurrentPhase(CapturePhase.Error);
      }

      // --- Start the recorder ---
      console.log("Calling recorder.start()...");
      recorder.start();
      console.log("recorder.start() called.");

    } catch (err) {
      console.error("Error in startRecording try block:", err);
      let message = "Could not start recording.";
      if (err instanceof Error) message = err.message;
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
        setTranscription(currentTranscription);
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

  const handleManualChange = (field: FormField, value: string | number | string[]) => {
    setManualResponses((prev) => ({ ...prev, [field.internal_key]: value }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const payload: SubmissionPayload = {
        template_id: formId,
        form_data: manualResponses,
      };
      const { error } = await supabase.from('form_submissions').insert([payload]);
      if (error) throw error;
      toast.success('Form submitted successfully! Redirecting...');
      router.push('/form/submitted');
    } catch (err) {
      toast.error('Failed to submit form.');
    } finally {
      setManualSubmitting(false);
    }
  };

  // --- Select All Yes/No for manual mode ---
  const selectAllYes = () => {
    const updated: Record<string, string> = {};
    fields.forEach(field => {
      if (field.field_type === 'checkbox') {
        updated[field.internal_key] = 'yes';
      }
    });
    setManualResponses(prev => ({ ...prev, ...updated }));
  };
  const selectAllNo = () => {
    const updated: Record<string, string> = {};
    fields.forEach(field => {
      if (field.field_type === 'checkbox') {
        updated[field.internal_key] = 'no';
      }
    });
    setManualResponses(prev => ({ ...prev, ...updated }));
  };

  // --- Only show select all if all fields are checkbox ---
  const allCheckboxFields = fields.length > 0 && fields.every(field => field.field_type === 'checkbox');

  // --- Show select all if there are 2+ checkbox fields ---
  const checkboxFields = fields.filter(field => field.field_type === 'checkbox');

  // --- Add this helper for manual mode field rendering ---
  const handleManualMultiCheckboxChange = (internal_key: string, option: string, isChecked: boolean) => {
    setManualResponses((prev) => {
      const currentSelection = Array.isArray(prev[internal_key]) ? (prev[internal_key] as string[]) : [];
      let newSelection = isChecked
        ? [...currentSelection, option]
        : currentSelection.filter((item) => item !== option);
      // Prevent duplicates
      if (isChecked && currentSelection.includes(option)) newSelection = currentSelection;
      return { ...prev, [internal_key]: newSelection };
    });
  };

  const renderManualFieldInput = (field: FormField) => {
    const value = manualResponses[field.internal_key] ?? '';
    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            id={field.internal_key}
            value={String(value)}
            onChange={(e) => handleManualChange(field, e.target.value)}
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            id={field.internal_key}
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              handleManualChange(field, val === '' ? '' : Number(val));
            }}
          />
        );
      case 'date': {
        let dateValue: string = '';
        if (typeof value === 'string') dateValue = value;
        // ignore number/array for date
        return (
          <Input
            type="date"
            id={field.internal_key}
            value={dateValue}
            onChange={(e) => handleManualChange(field, e.target.value)}
          />
        );
      }
      case 'checkbox':
        return (
          <RadioGroup
            value={typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''}
            onValueChange={(val) => handleManualChange(field, val)}
            className="flex gap-8"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yes" id={`${field.id}-yes`} />
              <label htmlFor={`${field.id}-yes`} className="mr-4 text-base">Yes</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id={`${field.id}-no`} />
              <label htmlFor={`${field.id}-no`} className="text-base">No</label>
            </div>
          </RadioGroup>
        );
      case 'select': {
        let selectValue: string = '';
        if (typeof value === 'string') selectValue = value;
        else if (typeof value === 'number') selectValue = String(value);
        // ignore array case for select
        return (
          <Select
            value={selectValue}
            onValueChange={(selectedValue) => handleManualChange(field, selectedValue)}
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
      }
      case 'radio':
        return (
          <RadioGroup
            id={field.internal_key}
            value={String(value)}
            onValueChange={(selectedValue: string) => handleManualChange(field, selectedValue)}
            className="pt-2"
          >
            {(field.options || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.internal_key}-${option}`} />
                <Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
            {(field.options || []).length === 0 && (
              <p className="text-sm text-red-500 italic">No options defined.</p>
            )}
          </RadioGroup>
        );
      case 'multicheckbox': {
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="pt-2 space-y-2">
            {(field.options || []).map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.internal_key}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) =>
                    handleManualMultiCheckboxChange(field.internal_key, option, checked as boolean)
                  }
                />
                <Label htmlFor={`${field.internal_key}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
            {(field.options || []).length === 0 && (
              <p className="text-sm text-red-500 italic">No options defined.</p>
            )}
          </div>
        );
      }
      case 'rating': {
        const minValue = field.rating_min ?? 1;
        const maxValue = field.rating_max ?? 5;
        let currentRating = minValue;
        const parsedValue = value;
        if (typeof parsedValue === 'number' && parsedValue >= minValue && parsedValue <= maxValue)
          currentRating = parsedValue;
        else if (typeof parsedValue === 'number') currentRating = minValue;
        if (minValue >= maxValue)
          return <p className="text-sm text-red-500 italic">Invalid rating scale configured.</p>;
        const displayRating = currentRating;
        return (
          <div className="flex items-center space-x-4 pt-2">
            <Slider
              id={field.internal_key}
              min={minValue}
              max={maxValue}
              step={1}
              value={[typeof value === 'number' ? value : minValue]}
              onValueChange={(newValue: number[]) =>
                handleManualChange(field, newValue[0])
              }
            />
            <span className="font-medium min-w-[30px] text-right">{typeof value === 'number' ? value : minValue}</span>
          </div>
        );
      }
      default: {
        // Handles 'text' and fallback
        let textValue: string = '';
        if (typeof value === 'string') textValue = value;
        else if (typeof value === 'number') textValue = String(value);
        // ignore array for text
        return (
          <Input
            type="text"
            id={field.internal_key}
            value={textValue}
            onChange={(e) => handleManualChange(field, e.target.value)}
          />
        );
      }
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
                  <Slider id={field.internal_key} min={minValue} max={maxValue} step={1} value={[typeof value === 'number' ? value : minValue]} onValueChange={(newValue: number[]) => handleFieldChange(field.internal_key, newValue[0])} disabled={isDisabled} />
                  <span className="font-medium min-w-[30px] text-right">{typeof value === 'number' ? value : minValue}</span>
              </div>
          );
       default: // Handles 'text'
        return <Input type="text" id={field.internal_key} value={String(value)} onChange={(e) => handleFieldChange(field.internal_key, e.target.value)} disabled={isDisabled} />;
    }
  };

  // Regenerate handler
  const handleRegenerate = async () => {
    if (!transcriptionEdit.trim()) return;
    setRegenerating(true);
    setRegenerateError(null);
    try {
      setProcessingState(ProcessingState.Parsing);
      // Call parse API with edited transcription
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: transcriptionEdit,
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
      if (!response.ok) throw new Error(result.error || `Parsing HTTP error! status: ${response.status}`);
      setParsedResults(result.parsedData || {});
      setTranscription(transcriptionEdit); // update main transcription
      setReviewTab('review');
      setProcessingState(ProcessingState.Success);
      toast.success('Parsing complete! Review updated fields.');
    } catch (err) {
      let message = 'Failed to parse transcription.';
      if (err instanceof Error) message = err.message;
      setRegenerateError(message);
      setProcessingState(ProcessingState.ErrorParsing);
      toast.error(message);
    } finally {
      setRegenerating(false);
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{template.name}</h1>
        {/* Entry Mode Toggle for Public Forms - now top right */}
        {isPublic && (entryMode === 'manual' || currentPhase === CapturePhase.Prompting) && (
          <div className="flex gap-2 items-center">
            <Button
              variant={entryMode === 'manual' ? 'default' : 'outline'}
              onClick={() => setEntryMode('manual')}
            >
              Regular Input
            </Button>
            <Button
              variant={entryMode === 'voice' ? 'default' : 'outline'}
              onClick={() => setEntryMode('voice')}
            >
              Voice Input
            </Button>
          </div>
        )}
      </div>

      {/* --- Manual Entry Form for Public Users --- */}
      {isPublic && entryMode === 'manual' ? (
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent>
            {checkboxFields.length >= 2 && (
              <div className="flex gap-4 mb-4 justify-end">
                <Button type="button" variant="outline" onClick={selectAllYes}>Select All Yes</Button>
                <Button type="button" variant="outline" onClick={selectAllNo}>Select All No</Button>
              </div>
            )}
            <form className="space-y-6" onSubmit={handleManualSubmit}>
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="p-4 bg-gray-50 rounded-lg border mb-4 flex items-center justify-between gap-4"
                >
                  <label className="block font-medium text-lg flex-1 pr-4">{field.label}</label>
                  <div className="flex-shrink-0 min-w-[180px]">
                    {renderManualFieldInput(field)}
                  </div>
                </div>
              ))}
              <div className="flex justify-center pt-4">
                <Button type="submit" size="lg" disabled={manualSubmitting}>
                  {manualSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        // === Phase-Based Rendering ===
        <>
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
              <div className="space-y-4 p-4 border rounded-md bg-green-50" style={{ minHeight: 500 }}>
                  <Tabs value={reviewTab} onValueChange={v => setReviewTab(v as 'review' | 'transcription')}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="review">Review & Edit</TabsTrigger>
                      <TabsTrigger value="transcription">Transcription</TabsTrigger>
                    </TabsList>
                    <div style={{ minHeight: 400 }}>
                      <TabsContent value="review">
                        <div className="pt-2">
                          <h2 className="text-lg font-medium mb-2">Review & Edit</h2>
                          <p className="mb-4">Please review the extracted information and make any necessary corrections before saving.</p>
                          <div className="space-y-4 border-t pt-4">
                            {fields.length > 0 ? (
                              fields.map(field => {
                                const value = parsedResults[field.internal_key];
                                const isEmpty =
                                  value === undefined || value === null ||
                                  (typeof value === 'string' && value.trim() === '') ||
                                  (Array.isArray(value) && value.length === 0);
                                return (
                                  <div
                                    key={field.id}
                                    className={`p-3 rounded-md border mb-2 ${isEmpty ? 'border-red-500 bg-red-50' : 'border-gray-200'} flex flex-col gap-1`}
                                  >
                                    <Label htmlFor={field.internal_key} className="block text-sm font-medium text-gray-700 mb-1">
                                      {field.label}
                                    </Label>
                                    {renderFieldInput(field)}
                                    {isEmpty && (
                                      <span className="text-xs text-red-600 mt-1">Not populated</span>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p>No fields defined.</p>
                            )}
                          </div>
                          {processingError && <p className="text-center text-red-500"><span className="font-medium">Processing Error:</span> {processingError}</p>}
                        </div>
                      </TabsContent>
                      <TabsContent value="transcription">
                        <div className="pt-2 text-left">
                          <h2 className="text-lg font-medium mb-2">Transcription</h2>
                          <p className="mb-4">Edit the transcription below and click Regenerate to update the parsed fields.</p>
                          <Textarea
                            id="editable-transcription"
                            value={transcriptionEdit}
                            onChange={e => setTranscriptionEdit(e.target.value)}
                            rows={5}
                            className="w-full bg-white text-sm mb-4"
                            disabled={regenerating}
                          />
                          <Button onClick={handleRegenerate} disabled={regenerating || !transcriptionEdit.trim()}>
                            {regenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Regenerate
                          </Button>
                          {regenerateError && <p className="text-red-500 mt-2">{regenerateError}</p>}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
              </div>
          )}

          {/* Bottom Controls: Show in all phases except Submitting and Error. In Reviewing, only show if reviewTab is 'review' */}
          {(currentPhase !== CapturePhase.Submitting && currentPhase !== CapturePhase.Error) &&
            ((currentPhase !== CapturePhase.Reviewing || reviewTab === 'review') && (
              <div className="flex justify-center items-center space-x-4 p-4 border-t mt-4">
                {(canStartRecording || canStopRecording) && (
                  <Button
                    onClick={handleRecordClick}
                    size="lg"
                    disabled={interactionDisabled || (currentPhase === CapturePhase.Prompting && recordingStatus === RecordingStatus.PermissionDenied)}
                    className={`cursor-pointer ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRequestingMic ? <Mic className="mr-2 h-5 w-5 animate-pulse" /> : isRecording ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                    {isRequestingMic
                      ? "Requesting Mic..."
                      : isRecording
                        ? "Stop Recording"
                        : currentPhase === CapturePhase.Reviewing
                          ? "Record Again"
                          : "Start Recording"}
                  </Button>
                )}
                {showSaveButton && (
                  <Button onClick={handleSaveSubmission} size="lg" disabled={isSaving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait">
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {isSaving ? 'Saving...' : (isPublic ? 'Submit Form' : 'Save Submission')}
                  </Button>
                )}
              </div>
            ))}
        </>
      )}
    </div>
  );
} 