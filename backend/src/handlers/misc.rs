use axum::{
    extract::{Path, Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json,
    Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::AppState, repositories::teams::TeamRepository, services::auth::hashing::hash};

pub struct MiscRouter;

impl MiscRouter {
    pub fn set_router() -> Router<AppState> {
        Router::new()
            .route("/test/seed", post(seed_test_data))
            .route("/hackathons/{id}/feedback", get(list_feedback).post(submit_feedback))
            .route("/files", post(upload_file))
            .route("/files/{id}", get(get_file))
            .route("/hackathons/{id}/exports/teams", get(export_teams))
    }
}


#[derive(Deserialize)]
struct ExportQuery {
    format: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SeedUser {
    id: Uuid,
    email: String,
    role: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SeedTeamMember {
    id: Uuid,
    email: String,
    captain: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SeedResponse {
    password: &'static str,
    hackathon_id: Uuid,
    team_id: Uuid,
    users: Vec<SeedUser>,
    team_members: Vec<SeedTeamMember>,
}

async fn upsert_seed_user(
    state: &AppState,
    email: &str,
    full_name: &str,
    role: &str,
) -> Result<SeedUser, StatusCode> {
    let id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (id, full_name, email, role, password_hash, profile_fields)
         VALUES ($1, $2, $3, $4, $5, '{}'::jsonb)
         ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash,
             updated_at = NOW()
         RETURNING id",
    )
    .bind(Uuid::new_v4())
    .bind(full_name)
    .bind(email)
    .bind(role)
    .bind(hash("password"))
    .fetch_one(state.user_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(SeedUser {
        id,
        email: email.to_string(),
        role: role.to_string(),
    })
}

async fn seed_test_data(State(state): State<AppState>) -> Result<impl IntoResponse, StatusCode> {
    let admin = upsert_seed_user(&state, "admin@test.ru", "Admin Test", "admin").await?;
    let organizer = upsert_seed_user(&state, "organizer@test.ru", "Organizer Test", "organizer").await?;
    let teamlead = upsert_seed_user(&state, "teamlead@test.ru", "Team Lead Test", "participant").await?;
    let participant = upsert_seed_user(&state, "parcipicant@test.ru", "Participant Test", "participant").await?;
    let just_user = upsert_seed_user(&state, "just-user@test.ru", "Just User Test", "participant").await?;

    let hackathon_id = match sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM hackathons WHERE title = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind("Seed Test Hackathon")
    .fetch_optional(state.hackathon_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        Some(id) => id,
        None => {
            sqlx::query_scalar::<_, Uuid>(
                "INSERT INTO hackathons (
                    id, title, description, status, starts_at, ends_at,
                    registration_opens_at, registration_closes_at,
                    min_team_size, max_team_size, hero_title, hero_subtitle, landing_content
                 )
                 VALUES (
                    $1, 'Seed Test Hackathon', 'Seeded by /api/v1/test/seed',
                    'active', '2026-05-01T10:00:00Z', '2026-05-03T18:00:00Z',
                    NOW(), '2026-05-01T09:00:00Z',
                    1, 5, 'Seed Test Hackathon', 'Test data', 'Seeded test hackathon'
                 )
                 RETURNING id",
            )
            .bind(Uuid::new_v4())
            .fetch_one(state.hackathon_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        }
    };

    sqlx::query(
        "INSERT INTO hackathon_organizers (hackathon_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING",
    )
    .bind(hackathon_id)
    .bind(organizer.id)
    .execute(state.hackathon_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let team_id = match sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM teams WHERE hackathon_id = $1 AND name = $2 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(hackathon_id)
    .bind("Seed Test Team")
    .fetch_optional(state.team_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    {
        Some(id) => id,
        None => {
            sqlx::query_scalar::<_, Uuid>(
                "INSERT INTO teams (id, hackathon_id, name, status, fields, submitted_at)
                 VALUES ($1, $2, 'Seed Test Team', 'submitted', '{}'::jsonb, NOW())
                 RETURNING id",
            )
            .bind(Uuid::new_v4())
            .bind(hackathon_id)
            .fetch_one(state.team_repo.db_pool.as_ref())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        }
    };

    sqlx::query("DELETE FROM team_members WHERE team_id = $1")
        .bind(team_id)
        .execute(state.member_repo.db_pool.as_ref())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let teamlead_member_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO team_members (id, team_id, user_id, full_name, email, role, status)
         VALUES ($1, $2, $3, 'Team Lead Test', 'teamlead@test.ru', 'captain', 'active')
         RETURNING id",
    )
    .bind(Uuid::new_v4())
    .bind(team_id)
    .bind(teamlead.id)
    .fetch_one(state.member_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let participant_member_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO team_members (id, team_id, user_id, full_name, email, role, status)
         VALUES ($1, $2, $3, 'Participant Test', 'parcipicant@test.ru', 'member', 'active')
         RETURNING id",
    )
    .bind(Uuid::new_v4())
    .bind(team_id)
    .bind(participant.id)
    .fetch_one(state.member_repo.db_pool.as_ref())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok((
        StatusCode::CREATED,
        Json(SeedResponse {
            password: "password",
            hackathon_id,
            team_id,
            users: vec![admin, organizer, teamlead, participant, just_user],
            team_members: vec![
                SeedTeamMember {
                    id: teamlead_member_id,
                    email: "teamlead@test.ru".to_string(),
                    captain: true,
                },
                SeedTeamMember {
                    id: participant_member_id,
                    email: "parcipicant@test.ru".to_string(),
                    captain: false,
                },
            ],
        }),
    ))
}

async fn list_feedback() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn submit_feedback() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn upload_file() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_IMPLEMENTED)
}

async fn get_file() -> Result<StatusCode, StatusCode> {
    Err(StatusCode::NOT_FOUND)
}

async fn export_teams(
    Path(id): Path<Uuid>,
    Query(query): Query<ExportQuery>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, StatusCode> {
    let teams = state
        .team_repo
        .get_by_hackathon(&id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut body = String::from("id,name,status,submitted_at,moderation_reason\n");
    for team in teams {
        body.push_str(&format!(
            "{},{},{},{},{}\n",
            team.id,
            team.name.replace(',', " "),
            String::from(team.status),
            team.submitted_at
                .map(|date| date.to_rfc3339())
                .unwrap_or_default(),
            team.moderation_reason.unwrap_or_default().replace(',', " "),
        ));
    }

    let extension = query.format.as_deref().unwrap_or("csv");
    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("text/csv; charset=utf-8"),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"teams.{extension}\""))
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
    );

    Ok((headers, body))
}
