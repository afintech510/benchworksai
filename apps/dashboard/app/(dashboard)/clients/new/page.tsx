"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const STEPS = ["Client Info", "ICP Definition", "Campaign Config", "Notification", "Review & Launch"];

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", industry: "construction", physical_address: "",
    icp: { target_titles: [] as string[], company_size_min: 5, company_size_max: 50, geography: "", positive_signals: "", negative_signals: "" },
    campaign: { name: "", offer: "", vertical: "construction", geography: "", steps: 4 },
    notification: { channel: "email", target: "" },
  });

  const update = (path: string, value: any) => {
    setForm((prev) => {
      const keys = path.split(".");
      const copy = JSON.parse(JSON.stringify(prev));
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleLaunch = async () => {
    setLoading(true);
    try {
      const clientRes = await fetch("/api/proxy/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, industry: form.industry, physical_address: form.physical_address,
          icp: form.icp, notification_channel: form.notification.channel, notification_target: form.notification.target, status: "active",
        }),
      });
      // Note: POST /v1/clients needs to be added to FastAPI — for now proceed with campaign launch
      const campaignRes = await api.launchCampaign({
        client_id: "pending", name: form.campaign.name, vertical: form.campaign.vertical,
        offer: form.campaign.offer, geography: form.campaign.geography, sequence_steps: form.campaign.steps,
      });
      router.push("/");
    } catch (e) {
      alert("Launch failed — check console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Client</h1>

      {/* Step indicator */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 text-xs py-2 rounded ${i === step ? "bg-blue-600 text-white" : i < step ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-500"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        {step === 0 && (<>
          <Input label="Company Name" value={form.name} onChange={(v) => update("name", v)} />
          <Select label="Industry" value={form.industry} options={["construction", "legal", "property_management"]} onChange={(v) => update("industry", v)} />
          <Input label="Physical Address (CAN-SPAM)" value={form.physical_address} onChange={(v) => update("physical_address", v)} />
        </>)}
        {step === 1 && (<>
          <Input label="Target Titles (comma-separated)" value={(form.icp.target_titles as string[]).join(", ")} onChange={(v) => update("icp.target_titles", v.split(",").map((s: string) => s.trim()))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Company Size" value={String(form.icp.company_size_min)} onChange={(v) => update("icp.company_size_min", parseInt(v) || 0)} />
            <Input label="Max Company Size" value={String(form.icp.company_size_max)} onChange={(v) => update("icp.company_size_max", parseInt(v) || 0)} />
          </div>
          <Input label="Geography" value={form.icp.geography} onChange={(v) => update("icp.geography", v)} />
          <TextArea label="Positive Signals" value={form.icp.positive_signals} onChange={(v) => update("icp.positive_signals", v)} />
          <TextArea label="Negative Signals" value={form.icp.negative_signals} onChange={(v) => update("icp.negative_signals", v)} />
        </>)}
        {step === 2 && (<>
          <Input label="Campaign Name" value={form.campaign.name} onChange={(v) => update("campaign.name", v)} />
          <TextArea label="Offer Description" value={form.campaign.offer} onChange={(v) => update("campaign.offer", v)} />
          <Select label="Vertical" value={form.campaign.vertical} options={["construction", "legal", "property_management"]} onChange={(v) => update("campaign.vertical", v)} />
          <Input label="Geography" value={form.campaign.geography} onChange={(v) => update("campaign.geography", v)} />
          <Input label="Sequence Steps" value={String(form.campaign.steps)} onChange={(v) => update("campaign.steps", parseInt(v) || 4)} />
        </>)}
        {step === 3 && (<>
          <Select label="Notification Channel" value={form.notification.channel} options={["email", "slack"]} onChange={(v) => update("notification.channel", v)} />
          <Input label={form.notification.channel === "email" ? "Email Address" : "Slack Webhook URL"} value={form.notification.target} onChange={(v) => update("notification.target", v)} />
        </>)}
        {step === 4 && (
          <div className="space-y-3 text-sm">
            <h3 className="font-semibold">Review</h3>
            <p><span className="text-gray-400">Client:</span> {form.name} ({form.industry})</p>
            <p><span className="text-gray-400">Campaign:</span> {form.campaign.name}</p>
            <p><span className="text-gray-400">Offer:</span> {form.campaign.offer}</p>
            <p><span className="text-gray-400">Geography:</span> {form.campaign.geography}</p>
            <p><span className="text-gray-400">Notifications:</span> {form.notification.channel} → {form.notification.target}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          className="px-4 py-2 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50">Back</button>
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} className="px-4 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-500">Next</button>
        ) : (
          <button onClick={handleLaunch} disabled={loading}
            className="px-6 py-2 text-sm bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50">
            {loading ? "Launching..." : "Launch Campaign"}
          </button>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500">
        {options.map((o) => <option key={o} value={o} className="capitalize">{o.replace("_", " ")}</option>)}
      </select>
    </div>
  );
}
