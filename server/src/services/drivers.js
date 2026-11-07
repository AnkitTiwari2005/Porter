// Driver document rules. A driver can only be approved (and stays approved) while every document is on file and unexpired.
export const DOC_COLUMNS = `d.license_no, to_char(d.license_expiry, 'YYYY-MM-DD') AS license_expiry,
  to_char(d.rc_expiry, 'YYYY-MM-DD') AS rc_expiry, to_char(d.insurance_expiry, 'YYYY-MM-DD') AS insurance_expiry`;

export function docIssues(row, todayIso) {
  const issues = [];
  if (!row.license_no) issues.push('Driving licence number is missing');
  const dates = [['license_expiry', 'Driving licence'], ['rc_expiry', 'Vehicle registration (RC)'], ['insurance_expiry', 'Vehicle insurance']];
  for (const [k, label] of dates) {
    if (!row[k]) issues.push(`${label} expiry date is missing`);
    else if (row[k] < todayIso) issues.push(`${label} expired on ${row[k]}`);
  }
  return issues;
}
