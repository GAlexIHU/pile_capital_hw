export interface GettableRepository<TEntity, TID = string> {
  get(id: TID): Promise<TEntity | null>;
}

export interface InsertableRepository<TEntity> {
  insert(entities: TEntity[]): Promise<void>;
}
