'use client';

import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { filesApi } from '@/lib/api/files';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

function decodeToken(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white">{value || '—'}</p>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'work', label: 'Work Details' },
  { key: 'address', label: 'Address' },
  { key: 'social', label: 'Social Links' },
  { key: 'activity', label: 'Activity' },
];

const SKILLS = ['React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'TypeScript', 'REST APIs', 'GraphQL', 'CI/CD'];

export default function ProfilePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const user = accessToken ? decodeToken(accessToken) : null;

  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: user?.firstName ?? user?.email?.split('@')[0] ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    dateOfBirth: user?.dateOfBirth ?? '',
    gender: user?.gender ?? '',
    avatarUrl: '',
    department: user?.department ?? 'Engineering',
    jobTitle: user?.jobTitle ?? 'Super Admin',
    employeeId: user?.employeeId ?? 'EMP-001',
    manager: user?.manager ?? '',
    joinDate: user?.joinDate ?? '2024-01-15',
    workLocation: user?.workLocation ?? 'remote',
    skills: user?.skills ?? ['React', 'Node.js', 'TypeScript'],
    street: user?.street ?? '',
    city: user?.city ?? '',
    state: user?.state ?? '',
    zipCode: user?.zipCode ?? '',
    country: user?.country ?? '',
    linkedin: user?.linkedin ?? '',
    github: user?.github ?? '',
    twitter: user?.twitter ?? '',
    website: user?.website ?? '',
    slack: user?.slack ?? '',
  });

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }) => {
        const p = data.data;
        if (p) {
          const u = p.user ?? {};
          const personal = p.personal ?? {};
          const work = p.work ?? {};
          const address = p.address ?? {};
          const social = p.social ?? {};
          setForm((prev) => ({
            ...prev,
            firstName: u.firstName ?? prev.firstName,
            lastName: u.lastName ?? prev.lastName,
            email: u.email ?? prev.email,
            phone: personal.phone ?? prev.phone,
            bio: personal.bio ?? prev.bio,
            dateOfBirth: personal.dateOfBirth ?? prev.dateOfBirth,
            gender: personal.gender ?? prev.gender,
            avatarUrl: personal.avatarUrl ?? prev.avatarUrl,
            department: work.department ?? prev.department,
            jobTitle: work.jobTitle ?? prev.jobTitle,
            employeeId: work.employeeId ?? prev.employeeId,
            manager: work.manager ?? prev.manager,
            joinDate: work.joinDate ?? prev.joinDate,
            workLocation: work.workLocation ?? prev.workLocation,
            skills: work.skills ?? prev.skills,
            street: address.street ?? prev.street,
            city: address.city ?? prev.city,
            state: address.state ?? prev.state,
            zipCode: address.zipCode ?? prev.zipCode,
            country: address.country ?? prev.country,
            linkedin: social.linkedin ?? prev.linkedin,
            github: social.github ?? prev.github,
            twitter: social.twitter ?? prev.twitter,
            website: social.website ?? prev.website,
            slack: social.slack ?? prev.slack,
          }));
          if (personal.avatarUrl) {
            const match = personal.avatarUrl.match(/\/api\/v1\/files\/([^/]+)\/download/);
            if (match) {
              filesApi.download(match[1])
                .then((blobUrl) => setAvatarPreview(blobUrl))
                .catch(() => setAvatarPreview(null));
            } else {
              setAvatarPreview(personal.avatarUrl);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const update = (field: string, value: string | string[]) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((s: string) => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await filesApi.upload(fd);
      const fileId = data.data?.id;
      if (fileId) {
        update('avatarUrl', filesApi.getDownloadPath(fileId));
        const blobUrl = await filesApi.download(fileId);
        setAvatarPreview(blobUrl);
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { blobUrl } }));
        setMessage({ type: 'success', text: 'Photo uploaded successfully.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload photo.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await authApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        personal: { phone: form.phone, dateOfBirth: form.dateOfBirth, gender: form.gender, bio: form.bio, avatarUrl: form.avatarUrl },
        work: { employeeId: form.employeeId, department: form.department, jobTitle: form.jobTitle, manager: form.manager, workLocation: form.workLocation, joinDate: form.joinDate, skills: form.skills },
        address: { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode, country: form.country },
        social: { linkedin: form.linkedin, github: form.github, twitter: form.twitter, website: form.website, slack: form.slack },
      });
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to update profile.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const completionItems = [
    { label: 'Photo uploaded', done: !!avatarPreview },
    { label: 'Name filled', done: !!form.firstName },
    { label: 'Bio written', done: !!form.bio },
    { label: 'Phone added', done: !!form.phone },
    { label: 'Address added', done: !!form.city },
    { label: 'Social links', done: !!form.linkedin || !!form.github || !!form.slack },
  ];
  const completionPercent = Math.round((completionItems.filter((i) => i.done).length / completionItems.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Manage your personal information" />
      {message && (
        <div className="mb-6">
          <Alert type={message.type}>{message.text}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Avatar card */}
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <div className="relative mx-auto mb-4 h-28 w-28">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className={`h-28 w-28 rounded-full object-cover ring-4 ring-blue-50 dark:ring-blue-900/30 ${avatarUploading ? 'opacity-50' : ''}`} />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-4xl font-bold text-white ring-4 ring-blue-50 dark:ring-blue-900/30">
                  {form.firstName.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 dark:border-gray-900"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{form.firstName} {form.lastName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{form.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{form.jobTitle}</span>
              <span className="inline-block rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</span>
            </div>
          </div>

          {/* Completion card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
            <div className="mb-3 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${completionPercent}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{completionPercent}%</span>
            </div>
            <ul className="space-y-2">
              {completionItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  <span className={item.done ? 'text-gray-600 line-through dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Quick Info</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InfoRow label="Employee ID" value={form.employeeId} icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>} />
              <InfoRow label="Department" value={form.department} icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>} />
              <InfoRow label="Work Location" value={form.workLocation} icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>} />
              <InfoRow label="Joined" value={form.joinDate ? new Date(form.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} icon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} />
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="lg:col-span-2">
          <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'personal' && (
              <Section title="Personal Information" description="Your basic contact and identity details.">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input id="firstName" label="First Name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
                    <Input id="lastName" label="Last Name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
                  </div>
                  <Input id="email" label="Email Address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required autoComplete="email" />
                  <Input id="phone" label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input id="dateOfBirth" label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
                    <div>
                      <label htmlFor="gender" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                      <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={form.bio}
                      onChange={(e) => update('bio', e.target.value)}
                      placeholder="Tell us a little about yourself..."
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-400">{form.bio.length}/300 characters</p>
                  </div>
                </div>
              </Section>
            )}

            {activeTab === 'work' && (
              <>
                <Section title="Work Information" description="Your organizational and employment details.">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input id="employeeId" label="Employee ID" value={form.employeeId} disabled />
                      <Input id="role" label="Job Title" value={form.jobTitle} disabled />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="department" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                        <select id="department" value={form.department} onChange={(e) => update('department', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                          <option>Engineering</option>
                          <option>Sales</option>
                          <option>Marketing</option>
                          <option>Finance</option>
                          <option>HR</option>
                          <option>Support</option>
                          <option>Operations</option>
                          <option>Product</option>
                          <option>Design</option>
                          <option>Legal</option>
                        </select>
                      </div>
                      <Input id="manager" label="Reporting Manager" placeholder="Manager name" value={form.manager} onChange={(e) => update('manager', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input id="joinDate" label="Join Date" type="date" value={form.joinDate} onChange={(e) => update('joinDate', e.target.value)} />
                      <div>
                        <label htmlFor="workLocation" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Work Location</label>
                        <select id="workLocation" value={form.workLocation} onChange={(e) => update('workLocation', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                          <option value="">Select...</option>
                          <option value="remote">Remote</option>
                          <option value="office">Office</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Section>
                <Section title="Skills & Expertise" description="Select the skills relevant to your role.">
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => {
                      const active = form.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            active
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          {active && '✓ '}{skill}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">{form.skills.length} skill{form.skills.length !== 1 && 's'} selected</p>
                </Section>
              </>
            )}

            {activeTab === 'address' && (
              <Section title="Address" description="Your residential or mailing address.">
                <div className="space-y-4">
                  <Input id="street" label="Street Address" placeholder="Street address" value={form.street} onChange={(e) => update('street', e.target.value)} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input id="city" label="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
                    <Input id="state" label="State / Province" value={form.state} onChange={(e) => update('state', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                      <select id="country" value={form.country} onChange={(e) => update('country', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                        <option value="">Select country</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                        <option value="IN">India</option>
                        <option value="AE">UAE</option>
                        <option value="SG">Singapore</option>
                        <option value="JP">Japan</option>
                        <option value="BR">Brazil</option>
                      </select>
                    </div>
                    <Input id="zipCode" label="Zip Code" placeholder="e.g. 10001" value={form.zipCode} onChange={(e) => update('zipCode', e.target.value)} />
                  </div>
                </div>
              </Section>
            )}

            {activeTab === 'social' && (
              <Section title="Social & Web Links" description="Connect your online profiles.">
                <div className="space-y-4">
                  <Input id="linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/username" value={form.linkedin} onChange={(e) => update('linkedin', e.target.value)} />
                  <Input id="github" label="GitHub" placeholder="https://github.com/username" value={form.github} onChange={(e) => update('github', e.target.value)} />
                  <Input id="twitter" label="X (Twitter)" placeholder="https://x.com/username" value={form.twitter} onChange={(e) => update('twitter', e.target.value)} />
                  <Input id="website" label="Personal Website" placeholder="https://yoursite.com" value={form.website} onChange={(e) => update('website', e.target.value)} />
                  <Input id="slack" label="Slack" placeholder="@username" value={form.slack} onChange={(e) => update('slack', e.target.value)} />
                </div>
              </Section>
            )}

            {activeTab === 'activity' && (
              <>
                <Section title="Recent Activity" description="Your latest actions and login history.">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[
                      { action: 'Logged in from Chrome on macOS', time: '2 minutes ago', type: 'login' },
                      { action: 'Updated profile information', time: '1 hour ago', type: 'update' },
                      { action: 'Changed password successfully', time: '3 days ago', type: 'security' },
                      { action: 'Logged in from Safari on iPhone', time: '5 days ago', type: 'login' },
                      { action: 'Enabled two-factor authentication', time: '1 week ago', type: 'security' },
                      { action: 'Joined Finance module', time: '2 weeks ago', type: 'module' },
                    ].map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 py-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          entry.type === 'login' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          entry.type === 'security' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                          entry.type === 'update' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {entry.type === 'login' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>}
                          {entry.type === 'security' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                          {entry.type === 'update' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>}
                          {entry.type === 'module' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 dark:text-white">{entry.action}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{entry.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Active Sessions" description="Devices currently logged into your account.">
                  <div className="space-y-3">
                    {[
                      { device: 'Chrome on macOS', location: 'San Francisco, US', current: true, lastActive: 'Now' },
                      { device: 'Safari on iPhone', location: 'San Francisco, US', current: false, lastActive: '5 days ago' },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.device}
                              {session.current && <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">Current</span>}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{session.location} · {session.lastActive}</p>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">Revoke</button>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {activeTab !== 'activity' && (
              <div className="flex items-center justify-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <Button type="submit" loading={saving}>Save Changes</Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
