use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use crate::models::team_members::{TeamMemberRole, TeamMemberStatus};
use crate::models::teams::{Team, TeamStatus};
use crate::repositories::invitations::InvitationRepository;
use crate::repositories::team_members::TeamMemberRepository;
use crate::repositories::teams::TeamRepository;
use crate::repositories::users::UserRepository;
use crate::{config::AppState, services::auth::tokens::Claims};

pub struct TeamRouter;

impl TeamRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_teams).post(create_application))
            .route("/me", get(get_my_team))
            .route("/{team_id}", get(get_team).patch(update_team).delete(delete_team))
            .route("/{team_id}/status", patch(update_status))
            .route("/{team_id}/members/{member_id}", delete(remove_member))
            .route("/{team_id}/members/{member_id}/disqualify", patch(disqualify_member).post(disqualify_member))
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamRequest {
    pub name: String,
    pub fields: Option<serde_json::Value>,
    pub members: Vec<TeamMemberInput>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamMemberInput {
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub login: Option<String>,
    pub kind: String,
    pub captain: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Page<T> {
    pub page: u32,
    pub page_size: u32,
    pub total: usize,
    pub items: Vec<T>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserPublicResponse {
    pub id: Uuid,
    pub full_name: String,
    pub role: crate::models::users::Role,
    pub avatar: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamMemberResponse {
    pub id: Uuid,
    pub user: Option<UserPublicResponse>,
    pub source: String,
    pub login: Option<String>,
    pub full_name: String,
    pub email: Option<String>,
    pub captain: bool,
    pub status: TeamMemberStatus,
    pub profile_fields: serde_json::Value,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamResponse {
    pub id: Uuid,
    pub hackathon_id: Uuid,
    pub name: String,
    pub status: TeamStatus,
    pub members: Vec<TeamMemberResponse>,
    pub fields: serde_json::Value,
    pub submitted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub moderation_reason: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamApplicationResponse {
    pub team: TeamResponse,
    pub invitation_links: Vec<InvitationLink>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct InvitationLink {
    pub member_id: Uuid,
    pub url: String,
}

#[derive(Debug, Deserialize)]
struct TeamQuery {
    status: Option<TeamStatus>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdateStatusRequest {
    status: TeamStatus,
    reason: Option<String>,
}

async fn to_team_response(state: &AppState, team: Team) -> Result<TeamResponse, StatusCode> {
    let members = state
        .member_repo
        .get_by_team(&team.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(TeamResponse {
        id: team.id,
        hackathon_id: team.hackathon_id,
        name: team.name,
        status: team.status,
        members: members
            .into_iter()
            .map(|member| TeamMemberResponse {
                id: member.id,
                user: None,
                source: if member.user_id.is_some() {
                    "existing_user".to_string()
                } else {
                    "invited_new_user".to_string()
                },
                login: None,
                full_name: member.full_name,
                email: member.email,
                captain: member.role == TeamMemberRole::Captain,
                status: member.status,
                profile_fields: serde_json::json!({}),
            })
            .collect(),
        fields: team.fields,
        submitted_at: team.submitted_at,
        moderation_reason: team.moderation_reason,
        created_at: team.created_at,
        updated_at: team.updated_at,
    })
}

async fn list_teams(
    State(state): State<AppState>,
    Path(hackathon_id): Path<Uuid>,
    Query(query): Query<TeamQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    let teams = state
        .team_repo
        .get_by_hackathon(&hackathon_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut items = Vec::new();
    for team in teams {
        if query.status.as_ref().is_some_and(|status| status != &team.status) {
            continue;
        }
        items.push(to_team_response(&state, team).await?);
    }

    Ok(Json(Page {
        page: 1,
        page_size: items.len() as u32,
        total: items.len(),
        items,
    }))
}

async fn create_application(
    State(state): State<AppState>,
    Path(hackathon_id): Path<Uuid>,
    claims: Option<Extension<Claims>>,
    Json(payload): Json<CreateTeamRequest>,
) -> Result<(StatusCode, Json<TeamApplicationResponse>), StatusCode> {
    let mut tx = state
        .team_repo
        .db_pool
        .begin()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let team = state
        .team_repo
        .create(&mut *tx, hackathon_id, payload.name)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(fields) = payload.fields {
        sqlx::query("UPDATE teams SET fields = $2 WHERE id = $1")
            .bind(team.id)
            .bind(fields)
            .execute(&mut *tx)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    }

    let mut pending_invitation_member_ids = Vec::new();

    if let Some(Extension(claims)) = claims {
        if let Some(user) = state
            .user_repo
            .get_by_id(&claims.sub)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        {
            state
                .member_repo
                .add_member(
                    &mut *tx,
                    team.id,
                    Some(user.id),
                    user.full_name,
                    Some(user.email),
                    TeamMemberRole::Captain,
                    TeamMemberStatus::Active,
                )
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
    }

    for member_input in payload.members {
        let status = if member_input.kind == "existing_user" {
            TeamMemberStatus::Active
        } else {
            TeamMemberStatus::PendingInvitation
        };
        let role = if member_input.captain.unwrap_or(false) {
            TeamMemberRole::Captain
        } else {
            TeamMemberRole::Member
        };
        let full_name = member_input
            .full_name
            .or(member_input.login)
            .unwrap_or_else(|| "Участник".to_string());

        let member = state
            .member_repo
            .add_member(&mut *tx, team.id, None, full_name, member_input.email, role, status.clone())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        if status == TeamMemberStatus::PendingInvitation {
            pending_invitation_member_ids.push(member.id);
        }
    }

    tx.commit()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut invitation_links = Vec::new();
    for member_id in pending_invitation_member_ids {
        let token = state
            .invite_repo
            .create(member_id)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        invitation_links.push(InvitationLink {
            member_id,
            url: format!("/invite/{}", token),
        });
    }

    let team = state
        .team_repo
        .get_by_id(&team.id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok((
        StatusCode::CREATED,
        Json(TeamApplicationResponse {
            team: to_team_response(&state, team).await?,
            invitation_links,
        }),
    ))
}

async fn get_my_team() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_FOUND)
}

async fn get_team(
    State(state): State<AppState>,
    Path((_hackathon_id, team_id)): Path<(Uuid, Uuid)>,
) -> Result<impl IntoResponse, StatusCode> {
    let team = state
        .team_repo
        .get_by_id(&team_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(to_team_response(&state, team).await?))
}

async fn update_team() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn delete_team(
    State(state): State<AppState>,
    Path((_hackathon_id, team_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("DELETE FROM teams WHERE id = $1")
        .bind(team_id)
        .execute(state.team_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn update_status(
    State(state): State<AppState>,
    Path((_hackathon_id, team_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<impl IntoResponse, StatusCode> {
    state
        .team_repo
        .update_status(&team_id, payload.status, payload.reason)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let team = state
        .team_repo
        .get_by_id(&team_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(to_team_response(&state, team).await?))
}

async fn remove_member(
    State(state): State<AppState>,
    Path((_hackathon_id, _team_id, member_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    sqlx::query("DELETE FROM team_members WHERE id = $1")
        .bind(member_id)
        .execute(state.member_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(StatusCode::NO_CONTENT)
}

async fn disqualify_member(
    State(state): State<AppState>,
    Path((_hackathon_id, team_id, member_id)): Path<(Uuid, Uuid, Uuid)>,
) -> Result<impl IntoResponse, StatusCode> {
    sqlx::query("UPDATE team_members SET status = 'disqualified' WHERE id = $1")
        .bind(member_id)
        .execute(state.member_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let team = state
        .team_repo
        .get_by_id(&team_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(to_team_response(&state, team).await?))
}
