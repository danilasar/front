use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::ToSchema;
use crate::models::hackathons::{Hackathon, HackathonStatus};

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct HackathonResponse {
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
    pub rules_file: Option<FileAsset>,
    pub landing: HackathonLanding,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct HackathonLanding {
    pub hero_title: Option<String>,
    pub hero_subtitle: Option<String>,
    pub cover_file_id: Option<Uuid>,
    pub content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FileAsset {
    pub id: Uuid,
    pub url: String,
}

impl From<Hackathon> for HackathonResponse {
    fn from(h: Hackathon) -> Self {
        Self {
            id: h.id,
            title: h.title,
            description: h.description,
            status: h.status,
            starts_at: h.starts_at,
            ends_at: h.ends_at,
            registration_opens_at: h.registration_opens_at,
            registration_closes_at: h.registration_closes_at,
            min_team_size: h.min_team_size,
            max_team_size: h.max_team_size,
            rules_file: h.rules_file_id.map(|id| FileAsset {
                id,
                url: format!("/api/v1/files/{}", id),
            }),
            landing: HackathonLanding {
                hero_title: h.hero_title,
                hero_subtitle: h.hero_subtitle,
                cover_file_id: h.cover_file_id,
                content: h.landing_content,
            },
            created_at: h.created_at,
            updated_at: h.updated_at,
        }
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateHackathonRequest {
    pub title: String,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub registration_opens_at: Option<DateTime<Utc>>,
    pub registration_closes_at: Option<DateTime<Utc>>,
    pub min_team_size: i32,
    pub max_team_size: i32,
    pub landing: Option<HackathonLanding>,
}
