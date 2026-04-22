use enum_iterator::{Sequence, all};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{schemas::users::RegisterUser, services::auth::hashing::hash};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub role: Role,
    #[serde(skip_serializing)]
    pub password_hash: String,
}

impl From<RegisterUser> for User {
    fn from(value: RegisterUser) -> Self {
        Self {
            id: Uuid::new_v4(),
            name: value.full_name,
            email: value.email,
            role: Role::Participant,
            password_hash: hash(&value.password),
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

    pub fn admin_only() -> Vec<Self> {
        vec![Role::Admin]
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
