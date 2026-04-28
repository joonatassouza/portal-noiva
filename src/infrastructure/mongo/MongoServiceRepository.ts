import { Collection } from 'mongodb';
import { Service } from '@/domain/entities/Service';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { getDb } from '@/infrastructure/mongo/client';
import {
  ServiceDoc,
  fromServiceDoc,
  toServiceDoc,
} from '@/infrastructure/mongo/mappers';

export class MongoServiceRepository implements ServiceRepository {
  private async col(): Promise<Collection<ServiceDoc>> {
    const db = await getDb();
    return db.collection<ServiceDoc>('services');
  }

  async listByChurch(churchId: string): Promise<Service[]> {
    const docs = await (await this.col()).find({ churchId }).toArray();
    return docs.map(fromServiceDoc);
  }

  async listAll(limit = 5000): Promise<Service[]> {
    const docs = await (await this.col()).find({}).limit(limit).toArray();
    return docs.map(fromServiceDoc);
  }

  async save(service: Service): Promise<void> {
    const doc = toServiceDoc(service);
    await (await this.col()).updateOne(
      { _id: service.id },
      { $set: doc },
      { upsert: true },
    );
  }

  async deleteById(id: string): Promise<void> {
    await (await this.col()).deleteOne({ _id: id });
  }
}
