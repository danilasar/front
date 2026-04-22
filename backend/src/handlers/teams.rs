use axum::{Router, routing::{get, post, patch, delete}, extract::{State, Path}, Json, http::StatusCode, Extension};
use utoipa::ToSchema;
use uuid::Uuid;
use crate::{AppState, services::auth::tokens::Claims};
use crate::models::teams::{Team};
use crate::models::team_members::{TeamMemberRole, TeamMemberStatus};
use crate::repositories::teams::TeamRepository;
use crate::repositories::users::UserRepository;
use crate::repositories::team_members::TeamMemberRepository;
use crate::repositories::invitations::InvitationRepository;
use serde::{Deserialize, Serialize};

pub struct TeamRouter;

impl TeamRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/", get(list_teams))
            .route("/", post(create_application))
            .route("/me", get(get_my_team))
            .route("/:team_id", get(get_team).patch(update_team).delete(delete_team))
            .route("/:team_id/status", patch(update_status))
            .route("/:team_id/members/:member_id", delete(remove_member))
    }
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamRequest {
    pub name: String,
    pub members: Vec<TeamMemberInput>,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamMemberInput {
    pub full_name: String,
    pub email: Option<String>,
    pub login: Option<String>,
    pub kind: String, // "existing_user" or "new_user"
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamApplicationResponse {
    pub team: Team,
    pub invitation_links: Vec<InvitationLink>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct InvitationLink {
    pub member_id: Uuid,
    pub url: String,
}

async fn list_teams(State(state): State<AppState>, Path(hackathon_id): Path<Uuid>) -> Result<Json<Vec<Team>>, StatusCode> {
    state.team_repo.get_by_hackathon(&hackathon_id).await
        .map(Json)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn create_application(
    State(state): State<AppState>,
    Path(hackathon_id): Path<Uuid>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTeamRequest>
) -> Result<(StatusCode, Json<TeamApplicationResponse>), StatusCode> {
    let mut tx = state.team_repo.db_pool.begin().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // 1. Создаем команду
    let team = state.team_repo.create(&mut *tx, hackathon_id, payload.name).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut invitation_links = Vec::new();

    // 2. Добавляем капитана (текущий пользователь)
    let user = state.user_repo.get_by_id(&claims.sub).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    state.member_repo.add_member(&mut *tx, team.id, Some(user.id), user.full_name, Some(user.email), TeamMemberRole::Captain, TeamMemberStatus::Active).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // 3. Добавляем остальных участников
    for member_input in payload.members {
        let status = if member_input.kind == "existing_user" { TeamMemberStatus::Active } else { TeamMemberStatus::PendingInvitation };
        
        let member = state.member_repo.add_member(
            &mut *tx, 
            team.id, 
            None, // В реальности ищем по login если existing
            member_input.full_name, 
            member_input.email, 
            TeamMemberRole::Member, 
            status.clone()
        ).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        if status == TeamMemberStatus::PendingInvitation {
            let token = state.invite_repo.create(member.id).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            invitation_links.push(InvitationLink {
                member_id: member.id,
                url: format!("/invite/{}", token),
            });
        }
    }

    tx.commit().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((StatusCode::CREATED, Json(TeamApplicationResponse { team, invitation_links })))
}

async fn get_my_team() -> Result<Json<Team>, StatusCode> { todo!() }
async fn get_team() -> Result<Json<Team>, StatusCode> { todo!() }
async fn update_team() -> Result<Json<Team>, StatusCode> { todo!() }
async fn delete_team() -> Result<StatusCode, StatusCode> { todo!() }
async fn update_status() -> Result<Json<Team>, StatusCode> { todo!() }
async fn remove_member() -> Result<StatusCode, StatusCode> { todo!() }
