use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

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
}

impl From<User> for UserProfile {
    fn from(value: User) -> Self {
        Self {
            id: value.id,
            full_name: value.name,
            email: value.email,
            role: value.role,
        }
    }
}

#[derive(Serialize, ToSchema)]
pub struct AuthResponse {
    pub user: UserProfile,
    pub tokens: Tokens,
}
