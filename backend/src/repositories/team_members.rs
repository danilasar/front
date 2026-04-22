use sqlx::{Executor, Postgres};
use uuid::Uuid;
use crate::models::team_members::{TeamMember, TeamMemberRole, TeamMemberStatus};

pub trait TeamMemberRepository {
    async fn get_by_team(&self, team_id: &Uuid) -> sqlx::Result<Vec<TeamMember>>;
    async fn add_member<'e, E>(&self, executer: E, team_id: Uuid, user_id: Option<Uuid>, full_name: String, email: Option<String>, role: TeamMemberRole, status: TeamMemberStatus) -> sqlx::Result<TeamMember>
    where
        E: Executor<'e, Database = Postgres>;
}

pub struct TeamMemberRepo {
    pub db_pool: std::sync::Arc<sqlx::Pool<Postgres>>,
}

impl TeamMemberRepo {
    pub fn new(db_pool: std::sync::Arc<sqlx::Pool<Postgres>>) -> Self {
        Self { db_pool }
    }
}

impl TeamMemberRepository for TeamMemberRepo {
    async fn get_by_team(&self, team_id: &Uuid) -> sqlx::Result<Vec<TeamMember>> {
        sqlx::query_as::<_, TeamMember>(
            r#"SELECT id, team_id, user_id, full_name, email, role as "role: TeamMemberRole", status as "status: TeamMemberStatus" FROM team_members WHERE team_id = $1"#
        )
        .bind(team_id)
        .fetch_all(self.db_pool.as_ref())
        .await
    }

    async fn add_member<'e, E>(&self, executer: E, team_id: Uuid, user_id: Option<Uuid>, full_name: String, email: Option<String>, role: TeamMemberRole, status: TeamMemberStatus) -> sqlx::Result<TeamMember>
    where
        E: Executor<'e, Database = Postgres>,
    {
        let id = Uuid::new_v4();
        sqlx::query_as::<_, TeamMember>(
            r#"INSERT INTO team_members (id, team_id, user_id, full_name, email, role, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, team_id, user_id, full_name, email, role as "role: TeamMemberRole", status as "status: TeamMemberStatus""#
        )
        .bind(id)
        .bind(team_id)
        .bind(user_id)
        .bind(full_name)
        .bind(email)
        .bind(String::from(match role {
            TeamMemberRole::Member => "member",
            TeamMemberRole::Captain => "captain",
        }))
        .bind(String::from(match status {
            TeamMemberStatus::Active => "active",
            TeamMemberStatus::PendingInvitation => "pending_invitation",
            TeamMemberStatus::Disqualified => "disqualified",
        }))
        .fetch_one(executer)
        .await
    }
}
