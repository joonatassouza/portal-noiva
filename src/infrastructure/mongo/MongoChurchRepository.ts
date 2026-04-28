import { Collection, Filter } from 'mongodb';
import { Church } from '@/domain/entities/Church';
import { Coordinates, haversineKm } from '@/domain/value-objects/Coordinates';
import {
  ChurchListOptions,
  ChurchRepository,
  NearbyChurch,
} from '@/application/ports/ChurchRepository';
import { getDb } from '@/infrastructure/mongo/client';
import {
  ChurchDoc,
  fromChurchDoc,
  toChurchDoc,
} from '@/infrastructure/mongo/mappers';

export class MongoChurchRepository implements ChurchRepository {
  private async col(): Promise<Collection<ChurchDoc>> {
    const db = await getDb();
    return db.collection<ChurchDoc>('churches');
  }

  async findBySlug(slug: string): Promise<Church | null> {
    const doc = await (await this.col()).findOne({ slug });
    return doc ? fromChurchDoc(doc) : null;
  }

  async findById(id: string): Promise<Church | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? fromChurchDoc(doc) : null;
  }

  async list(opts: ChurchListOptions = {}): Promise<Church[]> {
    const filter = this.buildFilter(opts);
    const cursor = (await this.col())
      .find(filter)
      .sort({ name: 1 })
      .skip(opts.offset ?? 0)
      .limit(opts.limit ?? 50);
    const docs = await cursor.toArray();
    return docs.map(fromChurchDoc);
  }

  async count(opts: Pick<ChurchListOptions, 'country' | 'search'> = {}): Promise<number> {
    return (await this.col()).countDocuments(this.buildFilter(opts));
  }

  async findNearby(
    coords: Coordinates,
    radiusKm: number,
    limit = 50,
  ): Promise<NearbyChurch[]> {
    const docs = await (await this.col())
      .find({
        geo: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
      .limit(limit)
      .toArray();

    return docs.map((d) => {
      const church = fromChurchDoc(d);
      const distanceKm = church.coords ? haversineKm(coords, church.coords) : Infinity;
      return { ...church, distanceKm };
    });
  }

  async listCountries(): Promise<string[]> {
    const values = await (await this.col()).distinct('country');
    return (values as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }

  async save(church: Church): Promise<void> {
    const doc = toChurchDoc(church);
    await (await this.col()).updateOne(
      { _id: church.id },
      { $set: doc },
      { upsert: true },
    );
  }

  private buildFilter(opts: ChurchListOptions): Filter<ChurchDoc> {
    const f: Filter<ChurchDoc> = {};
    if (opts.country) f.country = opts.country;
    if (opts.search && opts.search.trim().length > 0) {
      f.$text = { $search: opts.search };
    }
    return f;
  }
}
