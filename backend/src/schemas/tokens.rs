use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, Serialize, ToSchema)]
pub struct RefreshTokenRequest {
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
}
