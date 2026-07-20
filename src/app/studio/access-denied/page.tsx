export default function AccessDenied() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--qp-bg)] px-4 text-white">
      <section className="max-w-lg rounded-[2rem] border border-red-400/20 bg-red-400/10 p-8 text-center">
        <h1 className="font-sora text-3xl font-black">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          This signed-in account cannot open Studio. Access is limited to accounts with the
          <b className="text-white"> super_admin </b>
          or
          <b className="text-white"> creator </b>
          role (or the configured admin/root email allowlist).
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/sign-in?next=/studio"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-6 font-black text-black"
          >
            Switch account
          </a>
          <form action="/api/auth/logout" method="post">
            <button className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 px-6 font-black text-white">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
