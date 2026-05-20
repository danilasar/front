use sqlx::{Executor, Postgres};
use uuid::Uuid;
use crate::models::teams::{Team, TeamStatus};

pub trait TeamRepository {
    async fn get_by_hackathon(&self, hackathon_id: &Uuid) -> sqlx::Result<Vec<Team>>;
    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<Team>>;
    async fn create<'e, E>(&self, executer: E, hackathon_id: Uuid, name: String) -> sqlx::Result<Team>
    where
        E: Executor<'e, Database = Postgres>;
    async fn update_status(&self, id: &Uuid, status: TeamStatus, reason: Option<String>) -> sqlx::Result<()>;
}

pub struct TeamRepo {
    pub db_pool: std::sync::Arc<sqlx::Pool<Postgres>>,
}

impl TeamRepo {
    pub fn new(db_pool: std::sync::Arc<sqlx::Pool<Postgres>>) -> Self {
        Self { db_pool }
    }
}

impl TeamRepository for TeamRepo {
    async fn get_by_hackathon(&self, hackathon_id: &Uuid) -> sqlx::Result<Vec<Team>> {
        sqlx::query_as::<_, Team>(
            r#"SELECT id, hackathon_id, name, status, fields, submitted_at, moderation_reason, created_at, updated_at FROM teams WHERE hackathon_id = $1 ORDER BY created_at DESC"#
        )
        .bind(hackathon_id)
        .fetch_all(self.db_pool.as_ref())
        .await
    }

    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<Team>> {
        sqlx::query_as::<_, Team>(
            r#"SELECT id, hackathon_id, name, status, fields, submitted_at, moderation_reason, created_at, updated_at FROM teams WHERE id = $1"#
        )
        .bind(id)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn create<'e, E>(&self, executer: E, hackathon_id: Uuid, name: String) -> sqlx::Result<Team>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let id = Uuid::new_v4();
        sqlx::query_as::<_, Team>(
            r#"INSERT INTO teams (id, hackathon_id, name, status, submitted_at)
            VALUES ($1, $2, $3, 'submitted', NOW())
            RETURNING id, hackathon_id, name, status, fields, submitted_at, moderation_reason, created_at, updated_at"#
        )
        .bind(id)
        .bind(hackathon_id)
        .bind(name)
        .fetch_one(executer)
        .await
    }

    async fn update_status(&self, id: &Uuid, status: TeamStatus, reason: Option<String>) -> sqlx::Result<()> {
        sqlx::query(
            "UPDATE teams SET status = $2, moderation_reason = $3, updated_at = NOW() WHERE id = $1"
        )
        .bind(id)
        .bind(String::from(status))
        .bind(reason)
        .execute(self.db_pool.as_ref())
        .await?;
        Ok(())
    }
}
