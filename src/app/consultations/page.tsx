'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  ExternalLink,
  User,
  Building,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function ConsultationsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Booked Consultations</h2>
        <p className="text-muted-foreground">View and manage upcoming discovery calls with qualified leads.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <CalendarIcon className="h-12 w-12 text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">No consultations booked yet</p>
          <p className="text-slate-400 text-sm">When a lead books a call through the system, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  booking.status === 'SCHEDULED' ? 'bg-green-100 text-green-700' : 
                  booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {booking.status}
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 truncate">{booking.lead.companyName}</h3>
              <div className="flex items-center text-slate-500 text-sm mb-4">
                <User className="h-3 w-3 mr-1" />
                <span>{booking.lead.decisionMakerName || 'No contact name'}</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-slate-400" />
                  <span>{format(new Date(booking.startTime), 'PPP p')}</span>
                </div>
                {booking.meetingLink && (
                  <div className="flex items-center text-sm">
                    <Video className="h-4 w-4 mr-2 text-slate-400" />
                    <a 
                      href={booking.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      Join Meeting <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleDelete(booking.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                {booking.status === 'SCHEDULED' && (
                  <button 
                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                    className="px-3 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
