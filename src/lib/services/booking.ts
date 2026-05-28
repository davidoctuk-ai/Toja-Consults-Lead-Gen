import { google } from 'googleapis';
import { prisma } from '../prisma';
import { AutomationService } from './automation';

export class BookingService {
  private calendar;

  constructor() {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar']
    );

    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async checkAvailability(startTime: Date, endTime: Date) {
    if (!process.env.GOOGLE_CALENDAR_ID) {
      // If no calendar configured, assume available for demo purposes
      console.warn('GOOGLE_CALENDAR_ID not configured. Skipping availability check.');
      return true;
    }

    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
        },
      });

      const busy = response.data.calendars?.[process.env.GOOGLE_CALENDAR_ID]?.busy || [];
      return busy.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      // Fallback for demo
      return true;
    }
  }

  async createBooking(leadId: string, startTime: Date, endTime?: Date) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Default duration 30 mins if not provided by endTime
    if (!endTime) {
      endTime = new Date(startTime.getTime() + 30 * 60000);
    }

    let calendarEventId = null;
    let meetingLink = null;

    if (process.env.GOOGLE_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      try {
        const event = await this.calendar.events.insert({
          calendarId: process.env.GOOGLE_CALENDAR_ID,
          requestBody: {
            summary: `ISO Discovery Call: ${lead.companyName}`,
            description: `Discovery call with ${lead.decisionMakerName || 'contact'} from ${lead.companyName}.`,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: lead.decisionMakerEmail ? [{ email: lead.decisionMakerEmail }] : [],
            conferenceData: {
              createRequest: {
                requestId: `booking-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          },
          conferenceDataVersion: 1,
        });

        calendarEventId = event.data.id;
        meetingLink = event.data.hangoutLink;
      } catch (error) {
        console.error('Error creating Google Calendar event:', error);
      }
    } else {
      console.warn('Google Calendar configuration missing. Event will only be created in local database.');
    }

    const booking = await prisma.booking.create({
      data: {
        leadId,
        startTime,
        endTime,
        calendarEventId,
        meetingLink,
        status: 'SCHEDULED',
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'DISCOVERY_CALL_BOOKED' },
    });

    // Trigger automation processing
    const automationService = new AutomationService();
    await automationService.evaluateLead(leadId);

    return booking;
  }

  async getBookings() {
    return prisma.booking.findMany({
      include: {
        lead: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
  }
}

export const bookingService = new BookingService();
