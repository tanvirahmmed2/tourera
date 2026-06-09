'use client';
import { BASE_URL } from '@/lib/secret';
import { useState } from 'react';
import axios from 'axios';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });


  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const { data } = await axios.post('/api/public/contact', formData);
      setSuccess(data.message || 'Thank you! We received your message.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden pb-20">
      <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />

      {/* Header */}
      <section className="py-16">
        <div className="container relative z-10">
          <div className="text-center flex flex-col items-center gap-4">
            <div className="badge badge-primary">Support</div>
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-tight leading-[1.15] max-w-[700px] text-text">
              Get in touch with <span className="gradient-text">our team</span>
            </h1>
            <p className="text-base text-text-2 max-w-[560px] leading-relaxed">
              Have questions about features, pricing, custom integrations, or custom enterprise terms? Let us know.
            </p>
          </div>
        </div>
      </section>

      {/* Form & Info Section */}
      <section className="py-8 pb-16">
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start max-w-6xl mx-auto">
            {/* Left side details */}
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="font-bold text-xl mb-4 text-text tracking-tight">Contact Information</h3>
                <p className="text-text-2 leading-relaxed text-sm">
                  We generally respond within 2 hours during standard business operating hours.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex gap-4 items-center bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm shadow-slate-100/50">
                  <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.08)]">📧</span>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-text-3">Email support</div>
                    <a href={`mailto:support@disibin.com`} className="text-sm text-primary hover:underline font-bold mt-0.5 inline-block">support@disibin.com</a>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm shadow-slate-100/50">
                  <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.08)]">🏢</span>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-text-3">Headquarters</div>
                    <div className="text-sm text-text-2 font-bold mt-0.5">Disibin LTD, Dhaka, Bangladesh</div>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-sm shadow-slate-100/50">
                  <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(99,102,241,0.08)]">📞</span>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider text-text-3">Direct Phone</div>
                    <div className="text-sm text-text-2 font-bold mt-0.5">+880 1700-000000</div>
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100" />

              <div>
                <h4 className="font-bold text-sm text-text mb-2 tracking-tight">Are you an active tour operator?</h4>
                <p className="text-xs text-text-3 leading-relaxed">
                  For immediate platform operations assistance, please visit your tenant dashboard settings support panel or email priority support directly.
                </p>
              </div>
            </div>

            {/* Right side form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm shadow-slate-100/50">
              <h3 className="font-bold text-xl mb-6 text-text tracking-tight">Send us a Message</h3>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {success && (
                  <div className="badge badge-success w-full justify-center py-2.5">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="badge badge-danger w-full justify-center py-2.5">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-3" htmlFor="name">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    className="input-custom"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-3" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      className="input-custom"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-3" htmlFor="phone">Phone (Optional)</label>
                    <input
                      id="phone"
                      type="text"
                      className="input-custom"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-3" htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    rows={5}
                    className="input-custom font-sans"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe how we can help your tour agency..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-custom-primary w-full mt-4"
                  disabled={loading}
                >
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
