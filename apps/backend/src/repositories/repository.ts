import { DatabaseConnection } from "slonik";

export interface Transactable {
  transaction<T>(
    callback: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T>;
}

export interface TransactableRepository {
  transacting<T>(
    this: T,
    connection: DatabaseConnection,
  ): Omit<T, "transacting">;
}

export interface GettableRepository<TEntity, TID = string> {
  get(id: TID): Promise<TEntity | null>;
}

export interface InsertableRepository<TEntity> {
  insert(entities: TEntity[]): Promise<void>;
}
