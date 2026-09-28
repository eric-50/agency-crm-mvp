import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../context/AuthContext'

const leadsRef = collection(db, 'leads')

function formatDate(timestamp) {
  if (!timestamp) return '—'
  const d = timestamp.toDate()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${mm}/${dd}/${yy}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [leads, setLeads] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchLeads() {
    const snapshot = await getDocs(leadsRef)
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    docs.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    setLeads(docs)
  }

  useEffect(() => {
    fetchLeads().catch(() => setError('Could not load leads.'))
  }, [])

  async function handleAddLead(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addDoc(leadsRef, {
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      })
      setName('')
      setEmail('')
      await fetchLeads()
    } catch {
      setError('Could not save lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
              A
            </div>
            <span className="font-semibold tracking-tight">Agency CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            {leads.length.toLocaleString()} {leads.length === 1 ? 'lead' : 'leads'} in your pipeline
          </p>
        </div>

        <form
          onSubmit={handleAddLead}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Add a new lead</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Adding…' : 'Add lead'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {leads.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-slate-700">No leads yet</p>
              <p className="mt-1 text-sm text-slate-500">Add your first lead using the form above.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {lead.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{lead.email}</td>
                    <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">
                      {formatDate(lead.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
