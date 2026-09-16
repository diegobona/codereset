# Anonymous analytics operations

CodeReset writes only three ordered string dimensions to the Cloudflare
Analytics Engine dataset `codereset_events`:

- `blob1`: allowlisted event name
- `blob2`: coarse page kind, or an empty string
- `blob3`: coarse device class, or an empty string

Pasted status text, quota values, reset timestamps, account data, full URLs,
user agents, IP-derived values, and stable visitor identifiers are rejected by
the endpoint.

## Production smoke test

After a deployment finishes, run:

```powershell
npm run analytics:smoke -- https://codereset.dev
```

The command checks that the production binding is present, verifies a payload
containing a reset timestamp is rejected, and writes one `analytics_probe`
event. Product reports should exclude `analytics_probe`.

## Query the dataset

Set `CLOUDFLARE_ACCOUNT_ID` and a scoped `CLOUDFLARE_API_TOKEN` with Account
Analytics Read permission in the current shell. Do not commit either value.

```powershell
$query = @'
SELECT
  blob1 AS event,
  blob2 AS page,
  blob3 AS device,
  SUM(_sample_interval) AS events
FROM codereset_events
WHERE timestamp >= NOW() - INTERVAL '7' DAY
  AND blob1 != 'analytics_probe'
GROUP BY event, page, device
ORDER BY events DESC
'@

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" `
  -Headers @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN" } `
  -ContentType "text/plain" `
  -Body $query
```

The primary product checks are:

- `/status` funnel: `parser_attempt` to `parser_success`
- manual funnel: `manual_setup_start` to `manual_setup_complete`
- reminder use: `ics_download`, split by `page`
- timezone tool use: `reset_time_convert` on `reset-time`
