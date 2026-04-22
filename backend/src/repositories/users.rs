use macroses::NewTypeDeref;
use serde::Deserialize;
use sqlx::{Executor, Pool, Postgres, postgres::PgQueryResult};
use std::ops::Deref;
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::users::{User, Role}, schemas::users::RegisterUser};

#[derive(NewTypeDeref, Deserialize)]
pub struct Limit(pub u64);
#[derive(NewTypeDeref, Deserialize)]
pub struct Offset(pub u64);

pub trait UserRepository {
    async fn get(&self, offset: &Offset, limit: &Limit) -> sqlx::Result<Vec<User>>;
    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<User>>;
    async fn get_by_email(&self, email: &str) -> sqlx::Result<Option<User>>;
    async fn check_login(&self, email: &str, password_hash: &str) -> sqlx::Result<Option<User>>;
    async fn create_admin<'e, E>(&self, executer: E, user: RegisterUser) -> sqlx::Result<User>
    where
        E: Executor<'e, Database = sqlx::Postgres>;
    async fn create<'e, E>(&self, executer: E, user: RegisterUser) -> sqlx::Result<User>
    where
        E: Executor<'e, Database = sqlx::Postgres>;
    async fn update<'e, E>(&self, executer: E, user: User) -> sqlx::Result<PgQueryResult>
    where
        E: Executor<'e, Database = sqlx::Postgres>;
}

#[derive(Clone)]
pub struct UserRepo<Db>
where
    Db: sqlx::Database,
{
    pub db_pool: Arc<Pool<Db>>,
}

impl<Db: sqlx::Database> UserRepo<Db> {
    pub fn new(db_pool: Arc<Pool<Db>>) -> Self {
        Self { db_pool }
    }
}

impl UserRepository for UserRepo<Postgres> {
    async fn get(&self, offset: &Offset, limit: &Limit) -> sqlx::Result<Vec<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at
            FROM users
            LIMIT $1 OFFSET $2"
        )
        .bind(limit.0 as i64)
        .bind(offset.0 as i64)
        .fetch_all(self.db_pool.as_ref())
        .await
    }

    async fn get_by_id(&self, id: &Uuid) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at FROM users WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn get_by_email(&self, email: &str) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at FROM users WHERE email = $1"
        )
        .bind(email)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn check_login(&self, email: &str, password_hash: &str) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at
            FROM users
            WHERE email = $1 AND password_hash = $2"
        )
        .bind(email)
        .bind(password_hash)
        .fetch_optional(self.db_pool.as_ref())
        .await
    }

    async fn create_admin<'e, E>(&self, executer: E, user: RegisterUser) -> sqlx::Result<User>
    where
        E: Executor<'e, Database = sqlx::Postgres>,
    {
        let mut user_data: User = user.into();
        user_data.role = Role::Admin;
        sqlx::query_as::<_, User>(
            "INSERT INTO users (id, full_name, email, role, password_hash, profile_fields)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at"
        )
        .bind(user_data.id)
        .bind(user_data.full_name)
        .bind(user_data.email)
        .bind(String::from(user_data.role))
        .bind(user_data.password_hash)
        .bind(user_data.profile_fields)
        .fetch_one(executer)
        .await
    }

    async fn create<'e, E>(&self, executer: E, user: RegisterUser) -> sqlx::Result<User>
    where
        E: Executor<'e, Database = sqlx::Postgres>,
    {
        let user_data: User = user.into();
        sqlx::query_as::<_, User>(
            "INSERT INTO users (id, full_name, email, role, password_hash, profile_fields)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, full_name, email, role, password_hash, education, course, phone, telegram, vk, food_allergies, tshirt_size, avatar_file_id, profile_fields, created_at, updated_at"
        )
        .bind(user_data.id)
        .bind(user_data.full_name)
        .bind(user_data.email)
        .bind(String::from(user_data.role))
        .bind(user_data.password_hash)
        .bind(user_data.profile_fields)
        .fetch_one(executer)
        .await
    }

    async fn update<'e, E>(&self, executer: E, user: User) -> sqlx::Result<PgQueryResult>
    where
        E: Executor<'e, Database = sqlx::Postgres>,
    {
        sqlx::query(
            "UPDATE users
            SET full_name = $2, email = $3, role = $4, password_hash = $5, education = $6, course = $7, phone = $8, telegram = $9, vk = $10, food_allergies = $11, tshirt_size = $12, avatar_file_id = $13, profile_fields = $14, updated_at = NOW()
            WHERE id = $1"
        )
        .bind(user.id)
        .bind(user.full_name)
        .bind(user.email)
        .bind(String::from(user.role))
        .bind(user.password_hash)
        .bind(user.education)
        .bind(user.course)
        .bind(user.phone)
        .bind(user.telegram)
        .bind(user.vk)
        .bind(user.food_allergies)
        .bind(user.tshirt_size)
        .bind(user.avatar_file_id)
        .bind(user.profile_fields)
        .execute(executer)
        .await
    }
}
