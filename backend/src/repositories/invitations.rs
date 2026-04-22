use sqlx::Postgres;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};

pub trait InvitationRepository {
    async fn create(&self, team_member_id: Uuid) -> sqlx::Result<String>;
    async fn get_by_token(&self, token: &str) -> sqlx::Result<Option<Uuid>>;
}

pub struct InvitationRepo {
    pub db_pool: std::sync::Arc<sqlx::Pool<Postgres>>,
}

impl InvitationRepo {
    pub fn new(db_pool: std::sync::Arc<sqlx::Pool<Postgres>>) -> Self {
        Self { db_pool }
    }
}

impl InvitationRepository for InvitationRepo {
    async fn create(&self, team_member_id: Uuid) -> sqlx::Result<String> {
        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::days(7);
        
        sqlx::query(
            "INSERT INTO invitations (id, token, team_member_id, expires_at) VALUES ($1, $2, $3, $4)"
        )
        .bind(Uuid::new_v4())
        .bind(&token)
        .bind(team_member_id)
        .bind(expires_at)
        .execute(self.db_pool.as_ref())
        .await?;
        
        Ok(token)
    }

    async fn get_by_token(&self, token: &str) -> sqlx::Result<Option<Uuid>> {
        sqlx::query_scalar::<_, Uuid>(
            "SELECT team_member_id FROM invitations WHERE token = $1 AND expires_at > NOW()"
        )
        .bind(token)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }
}
