// Live checklist under a field. Each rule: { label, state: "pending" | "ok" | "fail" }.
export default function RuleList({ id, rules }) {
  return (
    <ul className="password-rules" id={id}>
      {rules.map((rule) => (
        <li key={rule.label} className={`password-rule password-rule--${rule.state}`}>
          <span className="password-rule__icon" aria-hidden="true">
            {rule.state === "fail" ? "✕" : "✓"}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
