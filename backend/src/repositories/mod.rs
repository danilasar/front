pub mod users;
pub mod tokens;
pub mod hackathons;
pub mod teams;
pub mod team_members;
pub mod invitations;

/// Является ли ошибка вставкой уже существующей строки?
pub fn is_unique_violation(err: &sqlx::Error) -> bool {
    match err {
        sqlx::Error::Database(db_err) => {
            db_err.code().as_deref() == Some("23505")
        }
        _ => false,
    }
}
