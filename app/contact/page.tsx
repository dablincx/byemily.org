import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "contact",
  description: "send a message, replies go to contact@byemily.org via Reply-To.",
  // Don't inherit the layout's generic link-preview text.
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

export default function ContactPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-12 w-full">
      <header className="mb-10 w-full">
        <h1 className="text-3xl">contact</h1>
        <p className="text-[color:var(--color-muted)] mt-2 leading-relaxed w-full">
          have a question or want to get in touch? fill out the form below and i&apos;ll get back to you as soon as possible!
        </p>
      </header>

      <ContactForm />
    </section>
  );
}