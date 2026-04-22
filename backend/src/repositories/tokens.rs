use std::sync::Arc;
use sqlx::{Executor, Pool, Postgres};
use uuid::Uuid;

use crate::services::auth::hashing::hash;

pub trait TokenRepository {
    async fn get(&self, user_id: &Uuid) -> sqlx::Result<Option<String>>;
    async fn create<'e, E>(&self, executer: E, refresh_token_info: (&Uuid, String)) -> sqlx::Result<()>
    where
        E: Executor<'e, Database = sqlx::Postgres>;
}

#[derive(Clone)]
pub struct TokenRepo<Db>
where
    Db: sqlx::Database,
{
    pub db_pool: Arc<Pool<Db>>,
}

impl<Db: sqlx::Database> TokenRepo<Db> {
    pub fn new(db_pool: Arc<Pool<Db>>) -> Self {
        Self { db_pool }
    }
}

impl TokenRepository for TokenRepo<Postgres> {
    async fn get(&self, user_id: &Uuid) -> sqlx::Result<Option<String>> {
        sqlx::query_scalar::<_, String>(
            "SELECT token FROM refresh_tokens WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn create<'e, E>(&self, executer: E, refresh_token_info: (&Uuid, String)) -> sqlx::Result<()>
    where
        E: Executor<'e, Database = sqlx::Postgres>,
    {
        sqlx::query(
            "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)
            ON CONFLICT (user_id) DO UPDATE SET token = $2"
        )
        .bind(refresh_token_info.0)
        .bind(hash(&refresh_token_info.1))
        .execute(executer)
        .await?;
        Ok(())
    }
}
