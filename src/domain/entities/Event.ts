/**
 * A special, dated event hosted by a church (Easter conference, retreat,
 * Santa Ceia, youth camp, ...). Different from `Service`, which is recurring.
 */
export interface Event {
  id: string;
  churchId: string;
  /** URL slug (unique within the church). */
  slug: string;
  title: string;
  description?: string;
  startDatetime: Date;
  endDatetime?: Date;
  /** Free text — may differ from the church's physical address. */
  eventLocation?: string;
  acceptingVolunteers: boolean;
  createdAt: Date;
  updatedAt: Date;
}
