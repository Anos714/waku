"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check } from "@/components/icons/ui-icons";
import { CONTACT_EMAIL, publicHost } from "@/lib/site";

/**
 * The contact form composes a signed `mailto:` link from the visitor's fields
 * and opens it in their own mail client. That is deliberate: there is no mail
 * server behind this app, and a form that silently vanished into a queue would
 * be worse than one that hands you a ready-to-send draft.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [composed, setComposed] = useState<string | null>(null);

  const canSend = name.trim().length > 0 && message.trim().length > 0 && email.includes("@");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    const subject = `Waku: message from ${name.trim()}`;
    const body = [
      `From: ${name.trim()}`,
      `Reply to: ${email.trim()}`,
      "",
      message.trim(),
      "",
      "-- sent from " + publicHost() + "/contact",
    ].join("\n");

    const link = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setComposed(link);
    window.location.href = link;
  }

  if (composed) {
    return (
      <div className="flex h-full flex-col items-start justify-center rounded-2xl border border-line bg-surface p-8 shadow-card-sm">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink"
          aria-hidden="true"
        >
          <Check className="h-5 w-5" />
        </span>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-ink">
          Your mail client should have opened
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          The message is filled in and addressed to{" "}
          <span className="font-medium text-ink">{CONTACT_EMAIL}</span>. Press
          send there and it lands in the inbox a human reads.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-ink-3">
          Nothing opened? Copy the address and write to us directly.{" "}
          <span className="font-mono">{CONTACT_EMAIL}</span>.
        </p>
        <button
          type="button"
          onClick={() => setComposed(null)}
          className="mt-6 text-sm font-medium text-ink underline decoration-line-2 underline-offset-4 transition-colors hover:decoration-accent-2"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-line bg-surface p-6 shadow-card-sm sm:p-8"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">Your name</Label>
          <Input
            id="contact-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Rahul Sain"
            autoComplete="name"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">Your email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What can Waku do better?"
            rows={5}
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!canSend}
          className="group w-fit"
        >
          Open in mail
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
        <p className="text-xs leading-relaxed text-ink-3">
          Opens your email app with everything filled in. We reply as soon as we
          can.
        </p>
      </div>
    </form>
  );
}
