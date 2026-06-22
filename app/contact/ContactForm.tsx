"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subjects = [
  "General enquiry",
  "Order & delivery",
  "Product advice",
  "Returns & refunds",
  "Wholesale / partnership",
];

/**
 * Interactive contact form. On submit it validates, shows a success toast and
 * resets — wired so a real backend can be slotted in later.
 */
export function ContactForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please tell us your name.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please add a little more detail to your message.");
      return;
    }
    setError(null);
    setSubmitting(true);

    // Simulate a request to a future Laravel endpoint.
    await new Promise((r) => setTimeout(r, 600));

    setSubmitting(false);
    toast.success(
      "Message sent!",
      "Thank you for reaching out — our wellness team will reply within 24 hours."
    );
    setName("");
    setEmail("");
    setSubject(subjects[0]);
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="name" className="label">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className="field"
          placeholder="e.g. Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="label">
          Subject
        </label>
        <select
          id="subject"
          className="field"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={submitting}
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="label">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className="field resize-y"
          placeholder="How can our Ayurvedic experts help you today?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5"
        >
          {error}
        </p>
      )}

      <Button type="submit" block size="lg" disabled={submitting}>
        {submitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
