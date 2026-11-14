/** Integration tests write fixtures and require an explicitly supplied test database. */
if (process.env.RUN_OPERATIONS_INTEGRATION === "1") {
  const value = process.env.DATABASE_URL;
  if (!value)
    throw new Error(
      "Integration tests require an explicit DATABASE_URL for a disposable test database",
    );
  const url = new URL(value);
  if (
    !/(^|[_-])test([_-]|$)/i.test(url.pathname.slice(1)) &&
    !/^test([_-]|$)/i.test(url.searchParams.get("schema") ?? "")
  )
    throw new Error(
      "Integration DATABASE_URL must name a test database or a test schema",
    );
}
