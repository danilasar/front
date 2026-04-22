use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow, ToSchema)]
pub struct Team {
    pub id: Uuid,
    pub hackathon_id: Uuid,
    pub name: String,
    pub status: TeamStatus,
    pub fields: serde_json::Value,
    pub submitted_at: Option<DateTime<Utc>>,
    pub moderation_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type, ToSchema, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TeamStatus {
    Draft,
    Submitted,
    Admitted,
    Rejected,
    Disqualified,
    Withdrawn,
}

impl From<TeamStatus> for String {
    fn from(s: TeamStatus) -> Self {
        match s {
            TeamStatus::Draft => "draft".to_string(),
            TeamStatus::Submitted => "submitted".to_string(),
            TeamStatus::Admitted => "admitted".to_string(),
            TeamStatus::Rejected => "rejected".to_string(),
            TeamStatus::Disqualified => "disqualified".to_string(),
            TeamStatus::Withdrawn => "withdrawn".to_string(),
        }
    }
}
