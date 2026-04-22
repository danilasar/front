use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Hackathon {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: HackathonStatus,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub registration_opens_at: Option<DateTime<Utc>>,
    pub registration_closes_at: Option<DateTime<Utc>>,
    pub min_team_size: i32,
    pub max_team_size: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq, ToSchema)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum HackathonStatus {
    Draft,
    Active,
    Archived,
}
