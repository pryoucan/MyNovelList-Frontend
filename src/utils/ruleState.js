// "pending" until the field has a value, then "ok" or "fail".
export const ruleState = (value, ok) => (value === "" ? "pending" : ok ? "ok" : "fail");
