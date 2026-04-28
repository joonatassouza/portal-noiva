import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { FavoriteRepository } from '@/application/ports/FavoriteRepository';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';

export class ToggleFavorite {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly churches: ChurchRepository,
  ) {}

  async execute(userId: string | null, churchId: string): Promise<{ favorited: boolean }> {
    if (!userId) throw new UnauthorizedError('Login required to favorite a church.');

    const church = await this.churches.findById(churchId);
    if (!church) throw new NotFoundError('Church', churchId);

    const already = await this.favorites.isFavorited(userId, churchId);
    if (already) {
      await this.favorites.remove(userId, churchId);
      return { favorited: false };
    }
    await this.favorites.add(userId, churchId);
    return { favorited: true };
  }
}
