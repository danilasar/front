use enum_iterator::{Sequence, all};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::{schemas::users::RegisterUser, services::auth::hashing::hash};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub full_name: String,
    pub email: String,
    pub role: Role,
    pub password_hash: String,
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

impl From<RegisterUser> for User {
    fn from(value: RegisterUser) -> Self {
        Self {
            id: Uuid::new_v4(),
            full_name: value.full_name,
            email: value.email,
            role: Role::Participant,
            password_hash: hash(&value.password),
            education: None,
            course: None,
            phone: None,
            telegram: None,
            vk: None,
            food_allergies: None,
            tshirt_size: None,
            avatar_file_id: None,
            profile_fields: serde_json::json!({}),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Sequence, PartialEq, ToSchema)]
#[sqlx(type_name = "text", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum Role {
    Participant,
    Organizer,
    Admin,
}

impl Role {
    pub fn all() -> Vec<Self> {
        all::<Role>().collect()
    }
}

impl From<String> for Role {
    fn from(value: String) -> Self {
        match value.to_lowercase().as_str() {
            "participant" => Role::Participant,
            "organizer" => Role::Organizer,
            "admin" => Role::Admin,
            _ => panic!("Role must be admin, organizer or participant"),
        }
    }
}

impl From<Role> for String {
    fn from(value: Role) -> Self {
        match value {
            Role::Participant => String::from("participant"),
            Role::Organizer => String::from("organizer"),
            Role::Admin => String::from("admin"),
        }
    }
}
