"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Bluetooth } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

export default function PrinterIntegrationPage() {
  const [device, setDevice] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [characteristic, setCharacteristic] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);

  function appendLog(msg: string) {
    setLog(l => [...l, msg]);
    console.log(msg);
  }

  async function handleScan() {
    setError("");
    setStatus("Scanning for M100 Bluetooth printers...");
    appendLog("Starting scan for devices with namePrefix 'M100'...");
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: "M100" }],
        optionalServices: [SERVICE_UUID]
      });
      setDevice(dev);
      setStatus(`Device selected: ${dev.name || dev.id}`);
      appendLog(`Device selected: ${dev.name || dev.id}`);
    } catch (err: any) {
      setError(err.message || "Scan cancelled or failed.");
      setStatus("");
      appendLog(`Scan error: ${err.message || "Scan cancelled or failed."}`);
    }
  }

  async function handleConnect() {
    if (!device) return;
    setError("");
    setStatus("Connecting to device...");
    appendLog("Attempting to connect to device...");
    try {
      const gattServer = await device.gatt?.connect();
      setServer(gattServer || null);
      setStatus("Connected to device. Discovering services...");
      appendLog("Connected to device. Discovering primary service...");
      const service = await gattServer.getPrimaryService(SERVICE_UUID);
      if (!service) {
        throw new Error("Service not found on device.");
      }
      appendLog("Primary service found. Discovering characteristic...");
      const char = await service.getCharacteristic(CHARACTERISTIC_UUID);
      if (!char) {
        throw new Error("Characteristic not found on device.");
      }
      setCharacteristic(char);
      setStatus("Ready to print!");
      appendLog("Characteristic found. Ready to print!");
    } catch (err: any) {
      setError("Connect error: " + (err.message || "Connection failed."));
      setStatus("");
      appendLog(`Connect error: ${err.message || "Connection failed."}`);
    }
  }

  async function handleTestPrint() {
    setError("");
    setStatus("Sending test print...");
    appendLog("Attempting to send test print...");
    if (!characteristic) {
      setError("Not connected to printer.");
      setStatus("");
      appendLog("Print error: Not connected to printer.");
      return;
    }
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode("Hello, M100!\n");
      await characteristic.writeValue(data);
      setStatus("Test print sent!");
      appendLog("Test print sent successfully.");
    } catch (err: any) {
      setError("Print error: " + (err.message || "Print failed."));
      setStatus("");
      appendLog(`Print error: ${err.message || "Print failed."}`);
    }
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: 'Labels', href: '/labels' },
        { label: 'Printer Integration' }
      ]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Bluetooth className="text-blue-600" /> Printer Integration
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Bluetooth Printer Setup (M100)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Connect and test your M100 Bluetooth label printer. This uses the Web Bluetooth API (works in Chrome/Edge).
          </p>
          <div className="flex gap-2">
            <Button onClick={handleScan}>Scan for Printers</Button>
            <Button onClick={handleConnect} disabled={!device || server}>Connect</Button>
            <Button onClick={handleTestPrint} disabled={!characteristic}>Send Test Print</Button>
          </div>
          {device && (
            <div className="text-sm text-gray-700">Selected: {device.name || device.id}</div>
          )}
          {status && <div className="text-blue-700">{status}</div>}
          {error && <div className="text-red-600">Error: {error}</div>}
          <div className="mt-4">
            <div className="font-semibold">Debug Log:</div>
            <ul className="text-xs bg-gray-100 rounded p-2 max-h-40 overflow-auto">
              {log.map((msg, idx) => <li key={idx}>{msg}</li>)}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 