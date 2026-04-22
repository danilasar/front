use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::models::{users::{User, Role}, tokens::Tokens};

#[derive(Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RegisterUser {
    pub full_name: String,
    pub email: String,
    pub password: String,
}

#[derive(Deserialize, ToSchema)]
pub struct LoginUser {
    pub email: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub role: Role,
    pub education: Option<String>,
    pub course: Option<String>,
    pub phone: Option<String>,
    pub telegram: Option<String>,
    pub vk: Option<String>,
    pub food_allergies: Option<String>,
    pub tshirt_size: Option<String>,
    pub avatar_file_id: Option<Uuid>,
    pub profile_fields: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserProfile {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            role: u.role,
            education: u.education,
            course: u.course,
            phone: u.phone,
            telegram: u.telegram,
            vk: u.vk,
            food_allergies: u.food_allergies,
            tshirt_size: u.tshirt_size,
            avatar_file_id: u.avatar_file_id,
            profile_fields: u.profile_fields,
            created_at: u.created_at,
            updated_at: u.updated_at,
        }
    }
}

#[derive(Serialize, ToSchema)]
pub struct AuthResponse {
    pub user: UserProfile,
    pub tokens: Tokens,
}
