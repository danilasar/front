use serde::{Deserialize, Serialize};
use uuid::Uuid;
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow, ToSchema)]
pub struct TeamMember {
    pub id: Uuid,
    pub team_id: Uuid,
    pub user_id: Option<Uuid>,
    pub full_name: String,
    pub email: Option<String>,
    pub role: TeamMemberRole,
    pub status: TeamMemberStatus,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type, ToSchema, PartialEq)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum TeamMemberRole {
    Member,
    Captain,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type, ToSchema, PartialEq)]
#[sqlx(type_name = "text", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum TeamMemberStatus {
    Active,
    PendingInvitation,
    Disqualified,
}
