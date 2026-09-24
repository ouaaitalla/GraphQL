// GraphQL documents sent to the Zone01 Ouujda GraphQL engine.
// This module must contain ONLY query strings — no fetching, no DOM, no logic.

export const PROFILE_QUERY = `{
  user {
    id
    login
    auditRatio
    totalUp
    totalDown
    cohort: events(where: {cohorts: {labelName: {_is_null: false}}}) {
      cohorts {
        labelName
      }
    }
  }
  totalXP: transaction_aggregate(
    where: {type: {_eq: "xp"}, event: {object: {name: {_eq: "Module"}}}}
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }
  level: transaction_aggregate(
    where: {type: {_eq: "level"}, event: {object: {name: {_eq: "Module"}}}}
  ) {
    aggregate {
      max {
        amount
      }
    }
  }
  skills: transaction(
    where: {type: {_ilike: "%skill%"}}
    order_by: {amount: desc}
  ) {
    type
    amount
  }
  projects: transaction(
    where: {type: {_eq: "xp"}, eventId: {_eq: 41}, object: {type: {_eq: "project"}}}
    order_by: {createdAt: desc}
  ) {
    amount
    createdAt
    path
    object {
      id
      name
      type
    }
  }
}`