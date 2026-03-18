export type {
  ApiV1RsvpProfileMeGet200Response as RsvpProfile,
  ApiV1RsvpEventEventIdGet200ResponseInner as RsvpItem,
} from '@acm-uiuc/core-client';

export interface EnrichedRsvp {
  eventId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  registeredDate: string;
  startTime?: string;
  endTime?: string;
  featured?: boolean;
}


export const COMMON_INTERESTS = [
  "AI/Machine Learning",
  "Web Development",
  "Mobile Development",
  "Cybersecurity",
  "Game Development",
  "Data Science",
  "Cloud Computing",
  "Robotics",
  "Blockchain",
  "UI/UX Design"
];