use sqlx::{Executor, Postgres};
use uuid::Uuid;
use crate::models::hackathons::{Hackathon, HackathonStatus};
use crate::schemas::hackathons::CreateHackathonRequest;

pub trait HackathonRepository {
    async fn get_all(&self) -> sqlx::Result<Vec<Hackathon>>;
    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<Hackathon>>;
    async fn get_active(&self) -> sqlx::Result<Option<Hackathon>>;
    async fn create<'e, E>(&self, executer: E, req: CreateHackathonRequest) -> sqlx::Result<Hackathon>
    where
        E: Executor<'e, Database = Postgres>;
    async fn activate(&self, id: &Uuid) -> sqlx::Result<()>;
}

pub struct HackathonRepo {
    pub db_pool: std::sync::Arc<sqlx::Pool<Postgres>>,
}

impl HackathonRepo {
    pub fn new(db_pool: std::sync::Arc<sqlx::Pool<Postgres>>) -> Self {
        Self { db_pool }
    }
}

impl HackathonRepository for HackathonRepo {
    async fn get_all(&self) -> sqlx::Result<Vec<Hackathon>> {
        sqlx::query_as::<_, Hackathon>(
            r#"SELECT id, title, description, status as "status: HackathonStatus", starts_at, ends_at, registration_opens_at, registration_closes_at, min_team_size, max_team_size, created_at, updated_at FROM hackathons ORDER BY created_at DESC"#
        )
        .fetch_all(self.db_pool.as_ref())
        .await
    }

    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<Hackathon>> {
        sqlx::query_as::<_, Hackathon>(
            r#"SELECT id, title, description, status as "status: HackathonStatus", starts_at, ends_at, registration_opens_at, registration_closes_at, min_team_size, max_team_size, created_at, updated_at FROM hackathons WHERE id = $1"#
        )
        .bind(id)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn get_active(&self) -> sqlx::Result<Option<Hackathon>> {
        sqlx::query_as::<_, Hackathon>(
            r#"SELECT id, title, description, status as "status: HackathonStatus", starts_at, ends_at, registration_opens_at, registration_closes_at, min_team_size, max_team_size, created_at, updated_at FROM hackathons WHERE status = 'active' LIMIT 1"#
        )
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn create<'e, E>(&self, executer: E, req: CreateHackathonRequest) -> sqlx::Result<Hackathon>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let id = Uuid::new_v4();
        sqlx::query_as::<_, Hackathon>(
            r#"INSERT INTO hackathons (id, title, description, status, starts_at, ends_at, registration_opens_at, registration_closes_at, min_team_size, max_team_size)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, title, description, status as "status: HackathonStatus", starts_at, ends_at, registration_opens_at, registration_closes_at, min_team_size, max_team_size, created_at, updated_at"#
        )
        .bind(id)
        .bind(req.title)
        .bind(req.description)
        .bind(String::from("draft"))
        .bind(req.starts_at)
        .bind(req.ends_at)
        .bind(req.registration_opens_at)
        .bind(req.registration_closes_at)
        .bind(req.min_team_size)
        .bind(req.max_team_size)
        .fetch_one(executer)
        .await
    }

    async fn activate(&self, id: &Uuid) -> sqlx::Result<()> {
        let mut tx = self.db_pool.begin().await?;
        
        sqlx::query("UPDATE hackathons SET status = 'archived' WHERE status = 'active'")
            .execute(&mut *tx)
            .await?;
            
        sqlx::query("UPDATE hackathons SET status = 'active' WHERE id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;
            
        tx.commit().await
    }
}
