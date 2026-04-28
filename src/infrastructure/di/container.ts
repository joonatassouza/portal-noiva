/**
 * Dependency Injection container.
 * SINGLE PLACE where the database driver is chosen.
 */

import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ChurchProposalRepository } from '@/application/ports/ChurchProposalRepository';
import { ClaimRepository } from '@/application/ports/ClaimRepository';
import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { MediaStorage } from '@/application/ports/MediaStorage';
import { ProfileRepository } from '@/application/ports/ProfileRepository';
import { EventRepository } from '@/application/ports/EventRepository';
import { FavoriteRepository } from '@/application/ports/FavoriteRepository';
import { Geocoder } from '@/application/ports/Geocoder';
import { InvitationRepository } from '@/application/ports/InvitationRepository';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { Clock } from '@/application/ports/Clock';

import { MongoChurchRepository } from '@/infrastructure/mongo/MongoChurchRepository';
import { MongoChurchProposalRepository } from '@/infrastructure/mongo/MongoChurchProposalRepository';
import { MongoClaimRepository } from '@/infrastructure/mongo/MongoClaimRepository';
import { MongoMediaCommentRepository } from '@/infrastructure/mongo/MongoMediaCommentRepository';
import { MongoMediaPostRepository } from '@/infrastructure/mongo/MongoMediaPostRepository';
import { MongoProfileRepository } from '@/infrastructure/mongo/MongoProfileRepository';
import { S3MediaStorage } from '@/infrastructure/s3/S3MediaStorage';
import { MongoEventRepository } from '@/infrastructure/mongo/MongoEventRepository';
import { MongoFavoriteRepository } from '@/infrastructure/mongo/MongoFavoriteRepository';
import { MongoInvitationRepository } from '@/infrastructure/mongo/MongoInvitationRepository';
import { MongoNotificationRepository } from '@/infrastructure/mongo/MongoNotificationRepository';
import { MongoRoleRepository } from '@/infrastructure/mongo/MongoRoleRepository';
import { MongoServiceRepository } from '@/infrastructure/mongo/MongoServiceRepository';
import { MongoVolunteerRepository } from '@/infrastructure/mongo/MongoVolunteerRepository';
import { NominatimGeocoder } from '@/infrastructure/nominatim/NominatimGeocoder';
import { SystemClock } from '@/infrastructure/system/SystemClock';
import { resolveMasterAdminUserIds } from '@/infrastructure/auth/masterAdminUsers';

import { ListChurches } from '@/application/use-cases/ListChurches';
import { ListChurchesPage } from '@/application/use-cases/ListChurchesPage';
import { ListMapPins } from '@/application/use-cases/ListMapPins';
import { GetChurchBySlug } from '@/application/use-cases/GetChurchBySlug';
import { ListNearbyServicesToday } from '@/application/use-cases/ListNearbyServicesToday';
import { ListUpcomingServices } from '@/application/use-cases/ListUpcomingServices';
import { ListUpcomingEvents } from '@/application/use-cases/ListUpcomingEvents';
import { ToggleFavorite } from '@/application/use-cases/ToggleFavorite';
import { ListUpcomingForFavorites } from '@/application/use-cases/ListUpcomingForFavorites';

import { UpsertChurch } from '@/application/use-cases/UpsertChurch';
import { UpsertService } from '@/application/use-cases/UpsertService';
import { DeleteService } from '@/application/use-cases/DeleteService';
import { ToggleServiceException } from '@/application/use-cases/ToggleServiceException';
import { UpsertEvent } from '@/application/use-cases/UpsertEvent';
import { DeleteEvent } from '@/application/use-cases/DeleteEvent';
import { SubmitClaim } from '@/application/use-cases/SubmitClaim';
import { ReviewClaim } from '@/application/use-cases/ReviewClaim';
import { CreateInvitation } from '@/application/use-cases/CreateInvitation';
import { AcceptInvitation } from '@/application/use-cases/AcceptInvitation';

import { ApplyAsVolunteer } from '@/application/use-cases/ApplyAsVolunteer';
import { UpdateVolunteerStatus } from '@/application/use-cases/UpdateVolunteerStatus';
import {
  ListNotifications,
  MarkNotificationsRead,
} from '@/application/use-cases/ListNotifications';
import { NotifyChurchAdmins } from '@/application/use-cases/NotifyChurchAdmins';
import { NotifyMasterAdmin } from '@/application/use-cases/NotifyMasterAdmin';
import { SubmitChurchProposal } from '@/application/use-cases/SubmitChurchProposal';
import { ReviewChurchProposal } from '@/application/use-cases/ReviewChurchProposal';
import { CreateMediaPost } from '@/application/use-cases/CreateMediaPost';
import { DeleteMediaPost } from '@/application/use-cases/DeleteMediaPost';
import { PresignMediaUpload } from '@/application/use-cases/PresignMediaUpload';
import { AddMediaComment } from '@/application/use-cases/AddMediaComment';
import { DeleteMediaComment } from '@/application/use-cases/DeleteMediaComment';
import { ListGlobalMediaFeed } from '@/application/use-cases/ListGlobalMediaFeed';
import { ReportMediaPost } from '@/application/use-cases/ReportMediaPost';
import { UpdateMyProfile } from '@/application/use-cases/UpdateMyProfile';
import { UpdateMyVolunteerApplication } from '@/application/use-cases/UpdateMyVolunteerApplication';
import { CancelMyVolunteerApplication } from '@/application/use-cases/CancelMyVolunteerApplication';

type Driver = 'mongo' | 'supabase';
const driver = (process.env.DB_DRIVER ?? 'mongo') as Driver;

function build<T>(mongo: () => T): T {
  switch (driver) {
    case 'mongo': return mongo();
    case 'supabase': throw new Error('Supabase adapter not implemented yet.');
    default: throw new Error(`Unknown DB_DRIVER: ${driver}`);
  }
}

const churches: ChurchRepository = build(() => new MongoChurchRepository());
const services: ServiceRepository = build(() => new MongoServiceRepository());
const events: EventRepository = build(() => new MongoEventRepository());
const favorites: FavoriteRepository = build(() => new MongoFavoriteRepository());
const roles: RoleRepository = build(() => new MongoRoleRepository());
const claims: ClaimRepository = build(() => new MongoClaimRepository());
const proposals: ChurchProposalRepository = build(() => new MongoChurchProposalRepository());
const mediaPosts: MediaPostRepository = build(() => new MongoMediaPostRepository());
const mediaComments: MediaCommentRepository = build(() => new MongoMediaCommentRepository());
const profiles: ProfileRepository = build(() => new MongoProfileRepository());
const mediaStorage: MediaStorage = new S3MediaStorage();
const invitations: InvitationRepository = build(() => new MongoInvitationRepository());
const volunteers: VolunteerRepository = build(() => new MongoVolunteerRepository());
const notifications: NotificationRepository = build(() => new MongoNotificationRepository());
const geocoder: Geocoder = new NominatimGeocoder();
const clock: Clock = new SystemClock();

// Composed services that other use cases reuse.
const notifyChurchAdmins = new NotifyChurchAdmins(notifications, roles);
const notifyMasterAdmin = new NotifyMasterAdmin(notifications, resolveMasterAdminUserIds);

export const container = {
  driver,
  // Repositories
  churches, services, events, favorites, roles, claims, invitations,
  volunteers, notifications, proposals, mediaPosts, mediaComments, profiles,
  mediaStorage, geocoder, clock,
  // Read use cases
  listChurches: () => new ListChurches(churches),
  listChurchesPage: () => new ListChurchesPage(churches),
  listMapPins: () => new ListMapPins(churches),
  getChurchBySlug: () => new GetChurchBySlug(churches, services, events, clock),
  listNearbyServicesToday: () => new ListNearbyServicesToday(churches, services, clock),
  listUpcomingServices: () => new ListUpcomingServices(churches, services, clock),
  listUpcomingEvents: () => new ListUpcomingEvents(churches, events, clock),
  listUpcomingForFavorites: () =>
    new ListUpcomingForFavorites(favorites, churches, services, clock),
  listNotifications: () => new ListNotifications(notifications),
  // Write use cases
  toggleFavorite: () => new ToggleFavorite(favorites, churches),
  upsertChurch: () => new UpsertChurch(churches, geocoder),
  upsertService: () => new UpsertService(services, roles),
  deleteService: () => new DeleteService(services, roles),
  toggleServiceException: () => new ToggleServiceException(services, roles),
  upsertEvent: () => new UpsertEvent(events, roles),
  deleteEvent: () => new DeleteEvent(events, roles),
  submitClaim: () => new SubmitClaim(claims, churches, notifyMasterAdmin),
  reviewClaim: () => new ReviewClaim(claims, churches, roles, notifications),
  createInvitation: () => new CreateInvitation(invitations, roles),
  acceptInvitation: () => new AcceptInvitation(invitations, roles, notifications, churches),
  applyAsVolunteer: () =>
    new ApplyAsVolunteer(volunteers, events, churches, profiles, notifyChurchAdmins),
  updateVolunteerStatus: () =>
    new UpdateVolunteerStatus(volunteers, roles, notifications, churches),
  updateMyVolunteerApplication: () => new UpdateMyVolunteerApplication(volunteers),
  cancelMyVolunteerApplication: () => new CancelMyVolunteerApplication(volunteers),
  updateMyProfile: () => new UpdateMyProfile(profiles),
  markNotificationsRead: () => new MarkNotificationsRead(notifications),
  submitChurchProposal: () => new SubmitChurchProposal(proposals, notifyMasterAdmin),
  reviewChurchProposal: () =>
    new ReviewChurchProposal(proposals, churches, roles, notifications, geocoder),
  createMediaPost: () => new CreateMediaPost(mediaPosts, events, churches, roles),
  deleteMediaPost: () =>
    new DeleteMediaPost(mediaPosts, mediaComments, roles, mediaStorage),
  presignMediaUpload: () => new PresignMediaUpload(mediaStorage, roles, churches),
  addMediaComment: () =>
    new AddMediaComment(mediaComments, mediaPosts, notifications, churches),
  deleteMediaComment: () => new DeleteMediaComment(mediaComments, mediaPosts, roles),
  listGlobalMediaFeed: () =>
    new ListGlobalMediaFeed(mediaPosts, churches, events, mediaComments),
  reportMediaPost: () => new ReportMediaPost(mediaPosts, churches, notifyMasterAdmin),
};

export type Container = typeof container;
