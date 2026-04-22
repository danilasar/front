use sqlx::Pool;
use sqlx::Postgres;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::sync::Arc;

use crate::repositories::tokens::TokenRepo;
use crate::repositories::users::UserRepo;
use crate::repositories::hackathons::HackathonRepo;
use crate::repositories::teams::TeamRepo;
use crate::repositories::team_members::TeamMemberRepo;
use crate::repositories::invitations::InvitationRepo;
use crate::services::auth::tokens::TokenService;

pub struct Config {
    pub database_url: String,
    pub secret_key: String,
    pub secret_refresh_key: String,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").expect(".env not loaded"),
            secret_key: env::var("JWT_SECRET").expect(".env not loaded"),
            secret_refresh_key: env::var("JWT_SECRET_REFRESH").expect(".env not loaded"),
        }
    }
}

pub async fn get_db_pool(database_url: &str) -> sqlx::PgPool {
    PgPoolOptions::new().connect(database_url).await.unwrap()
}

#[derive(Clone)]
pub struct AppState {
    pub user_repo: Arc<UserRepo<Postgres>>,
    pub hackathon_repo: Arc<HackathonRepo>,
    pub team_repo: Arc<TeamRepo>,
    pub member_repo: Arc<TeamMemberRepo>,
    pub invite_repo: Arc<InvitationRepo>,
    pub token_serv: Arc<TokenService<Postgres>>,
}

impl AppState {
    pub fn new(
        db_pool: Arc<Pool<Postgres>>,
        secret_key: String,
        secret_refresh_key: String,
    ) -> Self {
        let secret_key = Arc::new(secret_key);
        let secret_refresh_key = Arc::new(secret_refresh_key);

        let user_repo = Arc::new(UserRepo::new(db_pool.clone()));
        let token_repo = Arc::new(TokenRepo::new(db_pool.clone()));
        let hackathon_repo = Arc::new(HackathonRepo::new(db_pool.clone()));
        let team_repo = Arc::new(TeamRepo::new(db_pool.clone()));
        let member_repo = Arc::new(TeamMemberRepo::new(db_pool.clone()));
        let invite_repo = Arc::new(InvitationRepo::new(db_pool.clone()));

        let token_serv = Arc::new(TokenService::new(
            secret_key.clone(),
            secret_refresh_key.clone(),
            15,
            token_repo.clone(),
            user_repo.clone(),
            1440,
        ));

        Self {
            token_serv,
            user_repo,
            hackathon_repo,
            team_repo,
            member_repo,
            invite_repo,
        }
    }
}
