export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  locationLink?: string;
  host: string;
  start: string;
  end?: string;
  featured: boolean;
  rsvpEnabled: boolean;
  repeats?: string;
  imageUrl?: string;
}