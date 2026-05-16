"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";

const TOPICS = ["General question", "Bug report", "Feature request", "Sales / billing"] as const;

export function ContactForm() {
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("General question");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  function open(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[AssetArt] ${topic}`);
    const lines = [name ? `From: ${name}` : null, "", message].filter(Boolean).join("\n");
    const body = encodeURIComponent(lines);
    window.location.href = `mailto:support@assetart.com?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={open} className="bg-surface space-y-4 rounded-xl border p-5">
      <div className="grid gap-1.5">
        <Label htmlFor="topic">Topic</Label>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-brand-orange-500 border-brand-orange-600 text-white"
                    : "bg-surface text-text-muted border-border hover:border-border-strong"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="contact-name">Your name (optional)</Label>
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="contact-message" required>
          Message
        </Label>
        <Textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Tell us what's happening, what you expected, and what you saw."
        />
        <p className="text-text-subtle text-[11px]">
          We never store this text — it goes straight to your email client.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="md" disabled={!message.trim()}>
          <Send /> Open in email
        </Button>
      </div>
    </form>
  );
}
