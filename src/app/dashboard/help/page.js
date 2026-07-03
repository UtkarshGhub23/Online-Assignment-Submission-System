'use client';

import { useState } from 'react';

export default function HelpCenterPage() {
  const [supportForm, setSupportForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: 'How do I submit an assignment?',
      a: 'Navigate to the Assignments tab in your sidebar, select the specific assignment, drag and drop your file or click the upload zone, enter optional remarks, and click Submit. Confirm the action in the popup.'
    },
    {
      q: 'Can I replace my submission before the deadline?',
      a: 'Yes, if you submit before the due date, you can replace your file by uploading a new one on the same assignment details page. This will overwrite your previous submission.'
    },
    {
      q: 'What formats and sizes are supported?',
      a: 'The allowed file formats (PDF, DOCX, ZIP, PPTX, etc.) and the maximum file size (typically 10MB) are designated by the instructor and listed under the assignment requirements.'
    },
    {
      q: 'How will I receive grade notifications?',
      a: 'Once your teacher reviews your assignment and publishes the marks, an in-app notification alert will appear in your topbell dropdown menu.'
    }
  ];

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setSupportForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <div className="animate-slideUp help-layout">
      <div>
        <div className="page-header">
          <div>
            <h1>Help Center & Support</h1>
            <p className="page-header-subtitle">Find answers to frequently asked questions or contact our support desk.</p>
          </div>
        </div>

        {/* FAQs */}
        <div className="glass-card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ paddingBottom: 'var(--spacing-md)', borderBottom: idx !== faqs.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <h4 style={{ marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)' }}>Q: {faq.q}</h4>
                <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About / Terms / Privacy */}
        <div className="help-cards-grid">
          <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>About AssignPro</h3>
            <p className="text-xs text-secondary" style={{ lineHeight: 1.6, marginBottom: 'var(--spacing-sm)' }}>
              AssignPro is a secure, premium Learning Management System portal developed for schools, universities, and training divisions to coordinate assignments dynamically.
            </p>
            <span className="text-xs text-muted">Version 2.4.0</span>
          </div>

          <div className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Legal Policies</h3>
            <p className="text-xs text-secondary" style={{ lineHeight: 1.6, marginBottom: 'var(--spacing-sm)' }}>
              All submitted documents remain academic property. Users must comply with the code of academic integrity and student code of conduct.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <span className="text-xs" style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Terms of Use</span>
              <span className="text-xs" style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Contact Support</h3>
        <p className="text-xs text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Have technical difficulties? Send a direct message to our operations desk.
        </p>

        {submitted ? (
          <div style={{
            padding: 'var(--spacing-md)',
            background: 'rgba(5, 150, 105, 0.08)',
            border: '1px solid rgba(5, 150, 105, 0.15)',
            color: '#059669',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            textAlign: 'center'
          }}>
            Support ticket generated successfully. A representative will contact you via email shortly.
          </div>
        ) : (
          <form onSubmit={handleSupportSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="supportName">Your Name</label>
              <input
                id="supportName"
                type="text"
                className="form-input text-sm"
                value={supportForm.name}
                onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="supportEmail">Your Email</label>
              <input
                id="supportEmail"
                type="email"
                className="form-input text-sm"
                value={supportForm.email}
                onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="supportSubject">Subject</label>
              <input
                id="supportSubject"
                type="text"
                className="form-input text-sm"
                value={supportForm.subject}
                onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="supportMessage">Message</label>
              <textarea
                id="supportMessage"
                className="form-textarea text-sm"
                value={supportForm.message}
                onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                required
                rows={4}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">Submit Ticket</button>
          </form>
        )}
      </div>
    </div>
  );
}
