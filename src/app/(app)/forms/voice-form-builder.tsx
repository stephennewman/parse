"use client";
import React, { useState, useRef, useEffect } from "react";

// File Purpose: This file provides a builder tool for creating forms that are optimized for voice input and AI parsing.
// Last updated: 2025-05-21

// FormPreview component to render the generated form schema
function FormPreview({ schema }: { schema: any[] }) {
  if (!schema || schema.length === 0) return <div>No fields to preview.</div>;
  return (
    <form className="space-y-4">
      {schema.map((field, idx) => {
        switch (field.field_type) {
          case "checkbox":
            return (
              <div key={field.internal_key || idx}>
                <label>
                  <input type="checkbox" required={field.required} /> {field.label}
                </label>
              </div>
            );
          case "text":
          case "number":
            return (
              <div key={field.internal_key || idx}>
                <label>
                  {field.label}
                  <input
                    type={field.field_type}
                    required={field.required}
                    className="border p-1 ml-2"
                  />
                </label>
              </div>
            );
          case "textarea":
            return (
              <div key={field.internal_key || idx}>
                <label>
                  {field.label}
                  <textarea required={field.required} className="border p-1 ml-2" />
                </label>
              </div>
            );
          case "select":
          case "radio":
            return (
              <div key={field.internal_key || idx}>
                <label>{field.label}</label>
                <select required={field.required} className="border p-1 ml-2">
                  {field.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          case "multicheckbox":
            return (
              <div key={field.internal_key || idx}>
                <label className="block mb-1">{field.label}</label>
                <div className="flex flex-col gap-1 ml-2">
                  {field.options?.map((opt: string) => (
                    <label key={opt} className="inline-flex items-center">
                      <input type="checkbox" value={opt} className="mr-2" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            );
          default:
            return (
              <div key={field.internal_key || idx}>
                <label>
                  {field.label} (Unsupported field type: {field.field_type})
                </label>
              </div>
            );
        }
      })}
    </form>
  );
}

export default function VoiceFormBuilder() {
  const [transcription, setTranscription] = useState("");
  const [schema, setSchema] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);
  const [transcriptionChain, setTranscriptionChain] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start or stop recording
  const handleRecord = async () => {
    if (recording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setRecording(false);
      setRecordingStatus("Processing audio...");
    } else {
      // Start recording
      setError(null);
      setRecordingStatus("Recording...");
      audioChunksRef.current = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          setRecordingStatus("Transcribing...");
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          // Send to /api/transcribe
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.webm");
          formData.append("mimeType", "audio/webm");
          try {
            const res = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            if (data.transcription) {
              // Append new transcription to the chain
              setTranscriptionChain(prev => {
                const updated = [...prev, data.transcription];
                const combined = updated.join(" ");
                setTranscription(combined);
                setRecordingStatus("Generating form schema...");
                return updated;
              });
            } else {
              setError(data.error || "Failed to transcribe audio.");
              setRecordingStatus(null);
            }
          } catch (err: any) {
            setError(err.message || "Unknown error");
            setRecordingStatus(null);
          }
        };
        mediaRecorder.start();
        setRecording(true);
      } catch (err: any) {
        setError("Microphone access denied or not available.");
        setRecordingStatus(null);
      }
    }
  };

  // Generate schema from transcription
  const generateSchema = async (text: string) => {
    setLoading(true);
    setError(null);
    // Do NOT clear schema here; keep last valid schema if generation fails
    try {
      const res = await fetch("/api/generate-form-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription: text }),
      });
      const data = await res.json();
      if (data.schema) {
        setSchema(data.schema);
      } else {
        setError(data.error || "Failed to generate schema.");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
      setRecordingStatus(null);
    }
  };

  // Generate schema whenever transcription changes and is non-empty
  useEffect(() => {
    if (transcription && transcription.trim().length > 0) {
      generateSchema(transcription);
    } else {
      setSchema(null); // Only clear schema if transcription is empty
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcription]);

  // Reset handler
  const handleReset = () => {
    setTranscription("");
    setTranscriptionChain([]);
    setSchema(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 bg-white rounded shadow flex flex-col md:flex-row gap-8">
      {/* Left: Form Preview */}
      <div className="flex-1 min-w-[300px]">
        <h2 className="text-xl font-bold mb-2">Form Preview</h2>
        {schema ? (
          <FormPreview schema={schema} />
        ) : (
          <div className="text-gray-400">No fields to preview yet.</div>
        )}
      </div>
      {/* Right: Voice Record & Transcription Chain */}
      <div className="w-full md:w-2/5 max-w-md">
        <h2 className="text-xl font-bold mb-2">Voice Input</h2>
        <button
          onClick={handleRecord}
          className={`px-4 py-2 rounded ${recording ? "bg-red-600" : "bg-blue-600"} text-white mb-2`}
        >
          {recording ? "Stop Recording" : "Record Voice"}
        </button>
        <button
          onClick={handleReset}
          className="ml-2 px-4 py-2 rounded bg-gray-300 text-gray-800 mb-2"
          disabled={recording}
        >
          Reset
        </button>
        <span className="block text-sm text-gray-500 mb-2">{recordingStatus}</span>
        <div className="mb-2">
          <label className="block font-semibold mb-1">Transcription Chain:</label>
          <ul className="bg-gray-100 rounded p-2 text-sm max-h-40 overflow-y-auto">
            {transcriptionChain.length === 0 ? (
              <li className="text-gray-400">No voice input yet.</li>
            ) : (
              transcriptionChain.map((t, i) => (
                <li key={i} className="mb-1">{t}</li>
              ))
            )}
          </ul>
        </div>
        <label className="block font-semibold mb-1">Full Transcription:</label>
        <textarea
          value={transcription}
          onChange={e => {
            setTranscription(e.target.value);
            setTranscriptionChain(e.target.value ? [e.target.value] : []);
          }}
          placeholder="Paste or dictate your form description here..."
          rows={3}
          className="w-full border p-2 mb-2"
          disabled={recording}
        />
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
} 