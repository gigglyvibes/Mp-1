import React, { useState } from "react";
import * as contactApi from "../api/contact.api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";

const ContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await contactApi.submitContactMessage(form);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send your message right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-app py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Get in touch</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">We read every message.</h1>
          <p className="mt-4 max-w-md text-muted">
            Questions about verification, a job that seems off, or feedback on the product —
            send it our way.
          </p>

          <div className="mt-8 space-y-3 font-mono text-sm text-muted">
            <p>support@nearpin.app</p>
            <p>+91 00000 00000</p>
            <p>HSR Layout, Bengaluru, India</p>
          </div>
        </div>

        <form className="card space-y-5 p-7" onSubmit={onSubmit}>
          {error && (
            <p className="rounded-lg bg-signal/10 px-4 py-3 text-sm text-signal-dark">{error}</p>
          )}
          {sent ? (
            <p className="rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal-light">
              Thanks — we’ll get back to you within a day.
            </p>
          ) : (
            <>
              <Input label="Name" value={form.name} onChange={handleChange("name")} required />
              <Input label="Email" type="email" value={form.email} onChange={handleChange("email")} required />
              <div>
                <label className="label-field">Message</label>
                <textarea
                  rows={5}
                  className="input-field"
                  value={form.message}
                  onChange={handleChange("message")}
                  minLength={10}
                  required
                />
              </div>
              <Button type="submit" variant="signal" className="w-full" disabled={loading}>
                {loading ? <Spinner size={16} /> : "Send message"}
              </Button>
            </>
          )}
        </form>
      </div>
    </section>
  );
};

export default ContactPage;
