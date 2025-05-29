import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Job, JobService, JobPhoto, JobNote, TimeEntry } from '../../lib/supabase';
import {
  CheckCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import MainLayout from '../../components/layout/MainLayout';
import JobStatusBadge from '../../components/jobs/JobStatusBadge';
import JobPhotoUpload from '../../components/jobs/JobPhotoUpload';
import TimeTracker from '../../components/jobs/TimeTracker';
import toast from 'react-hot-toast';

type JobWithDetails = Job & {
  job_services: JobService[];
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    loadJobDetails();
  }, [id]);

  async function loadJobDetails() {
    try {
      if (!id) return;

      // Load job with details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          job_services(*),
          customers(id, name, email, phone, address)
        `)
        .eq('id', id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Load photos
      const { data: photoData } = await supabase
        .from('job_photos')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      setPhotos(photoData || []);

      // Load notes
      const { data: noteData } = await supabase
        .from('job_notes')
        .select('*')
        .eq('job_id', id)
        .order('created_at', { ascending: false });

      setNotes(noteData || []);

      // Load time entries
      const { data: timeData } = await supabase
        .from('time_entries')
        .select('*')
        .eq('job_id', id)
        .order('start_time', { ascending: false });

      setTimeEntries(timeData || []);
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusUpdate = async (newStatus: Job['status']) => {
    if (!job) return;

    try {
      const updates: Partial<Job> = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updates.start_time = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updates.end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', job.id);

      if (error) throw error;

      // If job is completed, create invoice
      if (newStatus === 'completed') {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert([
            {
              job_id: job.id,
              customer_id: job.customer_id,
              user_id: job.user_id,
              status: 'draft',
              total_amount: job.total_amount,
              due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            },
          ]);

        if (invoiceError) throw invoiceError;
      }

      toast.success('Job status updated');
      loadJobDetails();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleAddNote = async () => {
    if (!job || !newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('job_notes')
        .insert([
          {
            job_id: job.id,
            user_id: user.id,
            content: newNote.trim(),
          },
        ]);

      if (error) throw error;

      setNewNote('');
      loadJobDetails();
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTotalTime = () => {
    return timeEntries.reduce((total, entry) => {
      if (!entry.end_time) return total;
      const start = new Date(entry.start_time).getTime();
      const end = new Date(entry.end_time).getTime();
      return total + (end - start);
    }, 0);
  };

  const formatTotalTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Job not found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
              <div className="mt-2 flex items-center space-x-4">
                <JobStatusBadge status={job.status} />
                <span className="text-sm text-gray-500">
                  Created on {formatDateTime(job.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {job.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Job
                </button>
              )}
              {job.status === 'in_progress' && (
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('completed')}
                  className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Complete Job
                </button>
              )}
              {job.status === 'completed' && job.payment_status === 'unpaid' && (
                <Link
                  to={`/app/invoices/create/${job.id}`}
                  className="inline-flex items-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Generate Invoice
                </Link>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="mt-1">{job.customers.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="mt-1">{job.customers.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="mt-1">{job.customers.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="mt-1">{job.customers.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Services */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Services</h2>
              <div className="mt-4 space-y-4">
                {job.job_services.map((service) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{service.service_name}</p>
                      {service.notes && (
                        <p className="text-sm text-gray-500">{service.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${service.price.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Qty: {service.quantity}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>${job.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Tracking */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Time Tracking</h2>
                <div className="text-sm text-gray-500">
                  Total: {formatTotalTime(calculateTotalTime())}
                </div>
              </div>
              {job.status === 'in_progress' && (
                <div className="mb-4">
                  <TimeTracker
                    jobId={job.id}
                    onTimeEntryCreated={(entry) => {
                      setTimeEntries([entry, ...timeEntries]);
                    }}
                  />
                </div>
              )}
              <div className="space-y-4">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {formatDateTime(entry.start_time)}
                      </p>
                      {entry.description && (
                        <p className="text-gray-500">{entry.description}</p>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {entry.end_time
                        ? formatTotalTime(
                            new Date(entry.end_time).getTime() -
                            new Date(entry.start_time).getTime()
                          )
                        : 'In Progress'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Photos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Photos</h2>
              {job.status !== 'completed' && (
                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Add New Photo
                    </h3>
                    <JobPhotoUpload
                      jobId={job.id}
                      photoType={photos.length === 0 ? 'before' : 'progress'}
                      onPhotoUploaded={(photo) => {
                        setPhotos([photo, ...photos]);
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'Job photo'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="inline-flex items-center rounded-full bg-gray-900/75 px-2 py-1 text-xs font-medium text-white">
                        {photo.photo_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Notes</h2>
              <div className="mb-4">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Note
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="text-sm">
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDateTime(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 