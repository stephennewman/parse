"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Bluetooth } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrinterIntegrationPage() {
  const [device, setDevice] = useState<any>(null);
  const [server, setServer] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleScan() {
    setError("");
    setStatus("Scanning for Bluetooth printers...");
    try {
      const dev = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"] // Most printers support this, can be changed
      });
      setDevice(dev);
      setStatus(`Device selected: ${dev.name || dev.id}`);
    } catch (err: any) {
      setError(err.message || "Scan cancelled or failed.");
      setStatus("");
    }
  }

  async function handleConnect() {
    if (!device) return;
    setError("");
    setStatus("Connecting to device...");
    try {
      const gattServer = await device.gatt?.connect();
      setServer(gattServer || null);
      setStatus("Connected to device.");
    } catch (err: any) {
      setError(err.message || "Connection failed.");
      setStatus("");
    }
  }

  async function handleTestPrint() {
    setError("");
    setStatus("Sending test print...");
    // This is a placeholder: actual printing requires knowing the printer's service/characteristic
    setTimeout(() => {
      setStatus("Test print sent (simulated). Actual printing requires printer-specific implementation.");
    }, 1000);
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
          <CardTitle>Bluetooth Printer Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Connect and test a Bluetooth printer. This is a basic MVP using the Web Bluetooth API (works in Chrome/Edge).</p>
          <div className="flex gap-2">
            <Button onClick={handleScan}>Scan for Printers</Button>
            <Button onClick={handleConnect} disabled={!device || server}>Connect</Button>
            <Button onClick={handleTestPrint} disabled={!server}>Send Test Print</Button>
          </div>
          {device && (
            <div className="text-sm text-gray-700">Selected: {device.name || device.id}</div>
          )}
          {status && <div className="text-blue-700">{status}</div>}
          {error && <div className="text-red-600">Error: {error}</div>}
        </CardContent>
      </Card>
    </div>
  );
} 